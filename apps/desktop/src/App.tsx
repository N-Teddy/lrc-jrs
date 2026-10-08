import { CoreProviders, useAuth, useTownContext } from '@jrs/client-core';
import type { IAuthUser, ITown } from '@jrs/shared';
import { useEffect, useMemo, useState } from 'react';
import {
  FirstTimeSetupScreen,
  ForgotPasswordScreen,
  LoginScreen,
  ResetPasswordScreen,
  SessionTerminatedModal,
  VerifyOtpScreen,
} from './features/auth';
import { DashboardLayout } from './features/dashboard';
import { RegionSelectorScreen } from './features/towns';
import { tauriStoreAdapter } from './storage/tauri-store.adapter';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

type AuthScreenState =
  | 'login'
  | 'setup'
  | 'forgot-password'
  | 'verify-otp'
  | 'reset-password';

function AppContent() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { isLoadingTowns } = useTownContext();

  // Navigation State Machine for Auth
  const [currentScreen, setCurrentScreen] = useState<AuthScreenState>('login');

  // Multi-Region Hub Selection State
  const [hasExplicitlySelectedTown, setHasExplicitlySelectedTown] =
    useState(false);
  const [isSwitchingRegion, setIsSwitchingRegion] = useState(false);

  // First-Time Setup State
  const [setupData, setSetupData] = useState<{
    setupToken: string;
    user: IAuthUser;
  } | null>(null);

  // Recovery Flow State
  const [recoveryIdentifier, setRecoveryIdentifier] = useState('');
  const [recoveryChannel, setRecoveryChannel] = useState<
    'auto' | 'whatsapp' | 'email'
  >('auto');
  const [resetToken, setResetToken] = useState('');

  // Security Cutoff Modal State
  const [isSessionTerminated, setIsSessionTerminated] = useState(false);

  // Reset town selection state on logout so next login always prompts map
  useEffect(() => {
    if (!isAuthenticated) {
      setHasExplicitlySelectedTown(false);
      setIsSwitchingRegion(false);
    }
  }, [isAuthenticated]);

  // Determine if user has view or edit access to multiple towns
  const hasMultiTownAccess = useMemo(() => {
    if (!user) return false;
    // AP and PC always have multi-region access across Cameroon
    if (user.role === 'AP' || user.role === 'PC') return true;
    if (user.role === 'MEMBER') {
      const allowed = user.account?.allowedReadTownIds || [];
      return allowed.length > 1;
    }
    return false;
  }, [user]);

  if (isLoading || (isAuthenticated && isLoadingTowns)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fff8f5]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#b85028] border-t-transparent" />
          <p className="text-xs font-medium text-[#57423b]">
            Loading LRC JRS Portal...
          </p>
        </div>
      </div>
    );
  }

  // 1. Authenticated Flow
  if (isAuthenticated && user) {
    // If user has multi-town access and hasn't picked a hub for this session, OR explicitly clicked "Switch Hub":
    if (
      hasMultiTownAccess &&
      (!hasExplicitlySelectedTown || isSwitchingRegion)
    ) {
      return (
        <RegionSelectorScreen
          user={user}
          onTownSelected={(_town: ITown) => {
            setHasExplicitlySelectedTown(true);
            setIsSwitchingRegion(false);
          }}
        />
      );
    }

    // Otherwise, show Authenticated Dashboard for the active town
    return (
      <DashboardLayout
        user={user}
        hasMultiTownAccess={hasMultiTownAccess}
        onSwitchRegion={() => setIsSwitchingRegion(true)}
      />
    );
  }

  // 2. Setup Screen (Temporary Password login requires mandatory password change)
  if (currentScreen === 'setup' && setupData) {
    return (
      <FirstTimeSetupScreen
        setupToken={setupData.setupToken}
        user={setupData.user}
        onCancel={() => {
          setSetupData(null);
          setCurrentScreen('login');
        }}
        onSetupComplete={() => {
          setSetupData(null);
          setCurrentScreen('login');
        }}
      />
    );
  }

  // 3. Screen 3: Forgot Password (Request 6-digit Code)
  if (currentScreen === 'forgot-password') {
    return (
      <ForgotPasswordScreen
        initialIdentifier={recoveryIdentifier}
        onBackToSignIn={() => setCurrentScreen('login')}
        onCodeSent={(identifier, channel) => {
          setRecoveryIdentifier(identifier);
          setRecoveryChannel(channel);
          setCurrentScreen('verify-otp');
        }}
      />
    );
  }

  // 4. Screen 4: 6-Digit OTP Verification Screen
  if (currentScreen === 'verify-otp') {
    return (
      <VerifyOtpScreen
        identifier={recoveryIdentifier}
        channel={recoveryChannel}
        onBackToChangeContact={() => setCurrentScreen('forgot-password')}
        onCodeVerified={(token) => {
          setResetToken(token);
          setCurrentScreen('reset-password');
        }}
      />
    );
  }

  // 5. Screen 5: Set New Password Screen
  if (currentScreen === 'reset-password') {
    return (
      <ResetPasswordScreen
        resetToken={resetToken}
        identifier={recoveryIdentifier}
        onBackToSignIn={() => setCurrentScreen('login')}
        onPasswordResetComplete={() => {
          setResetToken('');
          setRecoveryIdentifier('');
          setCurrentScreen('login');
        }}
      />
    );
  }

  // 6. Default: Screen 1: Universal Sign-In Screen
  return (
    <>
      <LoginScreen
        onRequiresPasswordChange={(data) => {
          setSetupData(data);
          setCurrentScreen('setup');
        }}
        onForgotPasswordClick={(id) => {
          setRecoveryIdentifier(id);
          setCurrentScreen('forgot-password');
        }}
      />

      {/* Global Session Cutoff Modal */}
      <SessionTerminatedModal
        isOpen={isSessionTerminated}
        onAcknowledge={() => {
          setIsSessionTerminated(false);
          setCurrentScreen('login');
        }}
      />
    </>
  );
}

export default function App() {
  return (
    <CoreProviders storageAdapter={tauriStoreAdapter} baseUrl={API_BASE_URL}>
      <AppContent />
    </CoreProviders>
  );
}
