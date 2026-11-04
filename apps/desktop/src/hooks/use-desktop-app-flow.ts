import {
  type AuthFlowScreenState,
  useAuth,
  useAuthFlowState,
  useHttp,
  useTownContext,
} from '@jrs/client-core';
import { useEffect, useMemo, useState } from 'react';

export type { AuthFlowScreenState as AuthScreenState };

export function useDesktopAppFlow() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const http = useHttp();
  const { isLoadingTowns } = useTownContext();

  const flow = useAuthFlowState(isAuthenticated);

  // Security Cutoff Modal State
  const [isSessionTerminated, setIsSessionTerminated] = useState(false);
  const [deepLinkCode, setDeepLinkCode] = useState<string | null>(null);

  // Deep linking listener (e.g. lrc-jrs://reset-password?code=123456 or lrc-jrs://login)
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    const processDeepLink = (rawUrl: string) => {
      try {
        const normalized = rawUrl
          .replace(/^lrc-jrs:\/\//i, 'http://desktop.local/')
          .replace(/^lrc:\/\//i, 'http://desktop.local/');
        const parsed = new URL(normalized);
        const action = (
          parsed.pathname.replace(/^\//, '') ||
          parsed.hostname ||
          ''
        ).toLowerCase();
        const code = parsed.searchParams.get('code');
        const identifier =
          parsed.searchParams.get('identifier') ||
          parsed.searchParams.get('email');

        if (action === 'reset-password' || action === 'verify-otp') {
          if (code) {
            setDeepLinkCode(code);
          }
          if (identifier) {
            flow.setRecoveryIdentifier(identifier);
          }
          flow.setCurrentScreen('verify-otp');
        } else if (action === 'login' || action === 'setup') {
          flow.setCurrentScreen('login');
        }
      } catch (err) {
        console.warn('Failed to parse deep link URL:', rawUrl, err);
      }
    };

    // Cold start & Runtime URL listeners via Tauri plugin
    import('@tauri-apps/plugin-deep-link')
      .then(({ getCurrent, onOpenUrl }) => {
        getCurrent()
          .then((urls) => {
            if (urls && urls.length > 0) {
              processDeepLink(urls[0]);
            }
          })
          .catch(() => {});

        onOpenUrl((urls) => {
          if (urls && urls.length > 0) {
            processDeepLink(urls[0]);
          }
        })
          .then((fn) => {
            unlisten = fn;
          })
          .catch(() => {});
      })
      .catch(() => {});

    return () => {
      if (unlisten) unlisten();
    };
  }, [flow.setCurrentScreen, flow.setRecoveryIdentifier]);

  // Listen for session termination events from HTTP client (expired/revoked refresh token)
  useEffect(() => {
    const unsubscribe = http.onUnauthorizedEvent(() => {
      setIsSessionTerminated(true);
      flow.setCurrentScreen('login');
    });
    return unsubscribe;
  }, [http, flow.setCurrentScreen]);

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

  // Show the map/region selector whenever user explicitly clicked "Switch Region",
  // or on login before they have selected a town in their current session.
  const shouldShowRegionSelector = Boolean(
    isAuthenticated &&
      user &&
      hasMultiTownAccess &&
      (flow.isSwitchingRegion || !flow.hasExplicitlySelectedTown),
  );

  const handleForgotPasswordClick = (id: string) => {
    flow.setRecoveryIdentifier(id);
    flow.setCurrentScreen('forgot-password');
  };

  const handleCancelSetup = () => {
    flow.setSetupData(null);
    flow.setCurrentScreen('login');
  };

  const handleSetupComplete = () => {
    flow.setSetupData(null);
    flow.setCurrentScreen('login');
  };

  const handleBackToChangeContact = () => {
    flow.setCurrentScreen('forgot-password');
  };

  const handleAcknowledgeSessionTerminated = () => {
    setIsSessionTerminated(false);
    flow.setCurrentScreen('login');
  };

  return {
    user,
    isAuthenticated,
    isLoading: isLoading || (isAuthenticated && isLoadingTowns),
    hasMultiTownAccess,
    currentScreen: flow.currentScreen,
    setupData: flow.setupData,
    recoveryIdentifier: flow.recoveryIdentifier,
    recoveryChannel: flow.recoveryChannel,
    resetToken: flow.resetToken,
    deepLinkCode,
    isSessionTerminated,
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
    handleAcknowledgeSessionTerminated,
  };
}
