import { useAuth, useTownContext } from '@jrs/client-core';
import type { IAuthUser, ITown } from '@jrs/shared';
import { useEffect, useMemo, useState } from 'react';

export type MobileAuthScreenState =
  | 'login'
  | 'setup'
  | 'forgot-password'
  | 'verify-otp'
  | 'reset-password';

export function useMobileAuthFlow() {
  const { user, isAuthenticated, isLoading, signOut } = useAuth();
  const { availableTowns, isLoadingTowns } = useTownContext();

  const [currentScreen, setCurrentScreen] =
    useState<MobileAuthScreenState>('login');

  // Multi-Town Hub Selection State
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

  // Reset town selection state on logout so next login always prompts map
  useEffect(() => {
    if (!isAuthenticated) {
      setHasExplicitlySelectedTown(false);
      setIsSwitchingRegion(false);
    }
  }, [isAuthenticated]);

  // Determine if user has access to multiple towns
  const hasMultiTownAccess = useMemo(() => {
    if (!user) return false;
    // AP and PC have multi-region access across Cameroon
    if (user.role === 'AP' || user.role === 'PC') {
      return availableTowns.length > 1;
    }
    if (user.role === 'MEMBER') {
      const allowed = user.account?.allowedReadTownIds || [];
      return allowed.length > 1;
    }
    return false;
  }, [user, availableTowns]);

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

  const handleForgotPasswordClick = (identifier?: string) => {
    setRecoveryIdentifier(identifier || '');
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

  return {
    user,
    isAuthenticated,
    isLoading: isLoading || (isAuthenticated && isLoadingTowns),
    signOut,
    currentScreen,
    setupData,
    recoveryIdentifier,
    recoveryChannel,
    resetToken,
    hasMultiTownAccess,
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
  };
}
