import { CoreProviders, useTranslation } from '@jrs/client-core';
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
import { useDesktopAppFlow } from './hooks/use-desktop-app-flow';
import { tauriStoreAdapter } from './storage/tauri-store.adapter';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

function AppContent() {
  const { t } = useTranslation();
  const {
    user,
    isAuthenticated,
    isLoading,
    hasMultiTownAccess,
    currentScreen,
    setupData,
    recoveryIdentifier,
    recoveryChannel,
    resetToken,
    isSessionTerminated,
    shouldShowRegionSelector,
    handleTownSelected,
    handleSwitchRegion,
    handleRequiresPasswordChange,
    handleCancelSetup,
    handleSetupComplete,
    handleForgotPasswordClick,
    handleBackToSignIn,
    handleCodeSent,
    handleBackToChangeContact,
    handleCodeVerified,
    handlePasswordResetComplete,
    handleAcknowledgeSessionTerminated,
  } = useDesktopAppFlow();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fff8f5]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#b85028] border-t-transparent" />
          <p className="text-xs font-medium text-[#57423b]">
            {t('common:loadingPortal')}
          </p>
        </div>
      </div>
    );
  }

  const renderScreenContent = () => {
    // 1. Authenticated Flow
    if (isAuthenticated && user) {
      if (shouldShowRegionSelector) {
        return (
          <RegionSelectorScreen
            user={user}
            onTownSelected={handleTownSelected}
          />
        );
      }

      return (
        <DashboardLayout
          user={user}
          hasMultiTownAccess={hasMultiTownAccess}
          onSwitchRegion={handleSwitchRegion}
        />
      );
    }

    // 2. Setup Screen (Temporary Password login requires mandatory password change)
    if (currentScreen === 'setup' && setupData) {
      return (
        <FirstTimeSetupScreen
          setupToken={setupData.setupToken}
          user={setupData.user}
          onCancel={handleCancelSetup}
          onSetupComplete={handleSetupComplete}
        />
      );
    }

    // 3. Forgot Password Screen
    if (currentScreen === 'forgot-password') {
      return (
        <ForgotPasswordScreen
          initialIdentifier={recoveryIdentifier}
          onBackToSignIn={handleBackToSignIn}
          onCodeSent={handleCodeSent}
        />
      );
    }

    // 4. 6-Digit OTP Verification Screen
    if (currentScreen === 'verify-otp') {
      return (
        <VerifyOtpScreen
          identifier={recoveryIdentifier}
          channel={recoveryChannel}
          onBackToChangeContact={handleBackToChangeContact}
          onCodeVerified={handleCodeVerified}
        />
      );
    }

    // 5. Set New Password Screen
    if (currentScreen === 'reset-password') {
      return (
        <ResetPasswordScreen
          resetToken={resetToken}
          identifier={recoveryIdentifier}
          onBackToSignIn={handleBackToSignIn}
          onPasswordResetComplete={handlePasswordResetComplete}
        />
      );
    }

    // 6. Default: Universal Sign-In Screen
    return (
      <LoginScreen
        onRequiresPasswordChange={handleRequiresPasswordChange}
        onForgotPasswordClick={handleForgotPasswordClick}
      />
    );
  };

  return (
    <>
      {renderScreenContent()}

      <SessionTerminatedModal
        isOpen={isSessionTerminated}
        onAcknowledge={handleAcknowledgeSessionTerminated}
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
