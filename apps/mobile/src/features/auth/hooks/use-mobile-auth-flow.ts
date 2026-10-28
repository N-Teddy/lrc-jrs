import {
  type AuthFlowScreenState,
  useAuth,
  useAuthFlowState,
  useTownContext,
} from '@jrs/client-core';
import { useMemo } from 'react';

export type { AuthFlowScreenState as MobileAuthScreenState };

export function useMobileAuthFlow() {
  const { user, isAuthenticated, isLoading, signOut } = useAuth();
  const { availableTowns, activeTownId, isLoadingTowns } = useTownContext();

  const flow = useAuthFlowState(isAuthenticated);

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

  // Only show the region selector if user explicitly clicked "Switch Region",
  // or if they have multi-town access but no active town has been selected/restored yet.
  const shouldShowRegionSelector = Boolean(
    isAuthenticated &&
      user &&
      hasMultiTownAccess &&
      (flow.isSwitchingRegion ||
        (!activeTownId && !flow.hasExplicitlySelectedTown)),
  );

  const handleCancelSetup = () => {
    flow.setSetupData(null);
    flow.setCurrentScreen('login');
  };

  const handleSetupComplete = () => {
    flow.setSetupData(null);
    flow.setCurrentScreen('login');
  };

  const handleForgotPasswordClick = (identifier?: string) => {
    flow.setRecoveryIdentifier(identifier || '');
    flow.setCurrentScreen('forgot-password');
  };

  const handleBackToChangeContact = () => {
    flow.setCurrentScreen('forgot-password');
  };

  return {
    user,
    isAuthenticated,
    isLoading: isLoading || (isAuthenticated && isLoadingTowns),
    signOut,
    currentScreen: flow.currentScreen,
    setupData: flow.setupData,
    recoveryIdentifier: flow.recoveryIdentifier,
    recoveryChannel: flow.recoveryChannel,
    resetToken: flow.resetToken,
    hasMultiTownAccess,
    shouldShowRegionSelector,
    handleTownSelected: flow.handleTownSelected,
    handleSwitchRegion: flow.handleSwitchRegion,
    handleRequiresPasswordChange: flow.handleRequiresPasswordChange,
    handleCancelSetup,
    handleSetupComplete,
    handleForgotPasswordClick,
    handleBackToSignIn: flow.handleBackToLogin,
    handleCodeSent: flow.handleCodeSent,
    handleBackToChangeContact,
    handleCodeVerified: flow.handleOtpVerified,
    handlePasswordResetComplete: flow.handleRecoverySuccess,
  };
}
