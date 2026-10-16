import { useAuth, useHttp, useTownContext } from '@jrs/client-core';
import type { IAuthUser, ITown } from '@jrs/shared';
import { useEffect, useMemo, useState } from 'react';

type AuthScreenState =
  | 'login'
  | 'setup'
  | 'forgot-password'
  | 'verify-otp'
  | 'reset-password';

export function useDesktopAppFlow() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const http = useHttp();
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

  // Listen for session termination events from HTTP client (expired/revoked refresh token)
  useEffect(() => {
    const unsubscribe = http.onUnauthorizedEvent(() => {
      setIsSessionTerminated(true);
      setCurrentScreen('login');
    });
    return unsubscribe;
  }, [http]);

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

  const shouldShowRegionSelector = Boolean(
    isAuthenticated &&
      user &&
      hasMultiTownAccess &&
      (!hasExplicitlySelectedTown || isSwitchingRegion),
  );

  const handleTownSelected = (_town: ITown) => {
    setHasExplicitlySelectedTown(true);
    setIsSwitchingRegion(false);
  };

  const handleSwitchRegion = () => {
    setIsSwitchingRegion(true);
  };

  const handleRequiresPasswordChange = (data: {
    setupToken: string;
    user: IAuthUser;
  }) => {
    setSetupData(data);
    setCurrentScreen('setup');
  };

  const handleCancelSetup = () => {
    setSetupData(null);
    setCurrentScreen('login');
  };

  const handleSetupComplete = () => {
    setSetupData(null);
    setCurrentScreen('login');
  };

  const handleForgotPasswordClick = (id: string) => {
    setRecoveryIdentifier(id);
    setCurrentScreen('forgot-password');
  };

  const handleBackToSignIn = () => {
    setCurrentScreen('login');
  };

  const handleCodeSent = (
    identifier: string,
    channel: 'auto' | 'whatsapp' | 'email',
  ) => {
    setRecoveryIdentifier(identifier);
    setRecoveryChannel(channel);
    setCurrentScreen('verify-otp');
  };

  const handleBackToChangeContact = () => {
    setCurrentScreen('forgot-password');
  };

  const handleCodeVerified = (token: string) => {
    setResetToken(token);
    setCurrentScreen('reset-password');
  };

  const handlePasswordResetComplete = () => {
    setResetToken('');
    setRecoveryIdentifier('');
    setCurrentScreen('login');
  };

  const handleAcknowledgeSessionTerminated = () => {
    setIsSessionTerminated(false);
    setCurrentScreen('login');
  };

  return {
    user,
    isAuthenticated,
    isLoading: isLoading || (isAuthenticated && isLoadingTowns),
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
  };
}
