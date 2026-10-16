import type { IAuthUser, ITown } from '@jrs/shared';
import { useEffect, useState } from 'react';

export type AuthFlowScreenState =
  | 'login'
  | 'setup'
  | 'forgot-password'
  | 'verify-otp'
  | 'reset-password';

export function useAuthFlowState(isAuthenticated: boolean) {
  const [currentScreen, setCurrentScreen] =
    useState<AuthFlowScreenState>('login');
  const [hasExplicitlySelectedTown, setHasExplicitlySelectedTown] =
    useState(false);
  const [isSwitchingRegion, setIsSwitchingRegion] = useState(false);
  const [setupData, setSetupData] = useState<{
    setupToken: string;
    user: IAuthUser;
  } | null>(null);
  const [recoveryIdentifier, setRecoveryIdentifier] = useState('');
  const [recoveryChannel, setRecoveryChannel] = useState<
    'auto' | 'whatsapp' | 'email'
  >('auto');
  const [resetToken, setResetToken] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      setHasExplicitlySelectedTown(false);
      setIsSwitchingRegion(false);
    }
  }, [isAuthenticated]);

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

  const handleForgotPassword = () => {
    setCurrentScreen('forgot-password');
  };

  const handleCodeSent = (
    identifier: string,
    channel: 'auto' | 'whatsapp' | 'email',
  ) => {
    setRecoveryIdentifier(identifier);
    setRecoveryChannel(channel);
    setCurrentScreen('verify-otp');
  };

  const handleOtpVerified = (verifiedResetToken: string) => {
    setResetToken(verifiedResetToken);
    setCurrentScreen('reset-password');
  };

  const handleRecoverySuccess = () => {
    setResetToken('');
    setRecoveryIdentifier('');
    setCurrentScreen('login');
  };

  const handleBackToLogin = () => {
    setCurrentScreen('login');
  };

  return {
    currentScreen,
    setCurrentScreen,
    hasExplicitlySelectedTown,
    setHasExplicitlySelectedTown,
    isSwitchingRegion,
    setIsSwitchingRegion,
    setupData,
    setSetupData,
    recoveryIdentifier,
    setRecoveryIdentifier,
    recoveryChannel,
    setRecoveryChannel,
    resetToken,
    setResetToken,
    handleTownSelected,
    handleSwitchRegion,
    handleRequiresPasswordChange,
    handleForgotPassword,
    handleCodeSent,
    handleOtpVerified,
    handleRecoverySuccess,
    handleBackToLogin,
  };
}
