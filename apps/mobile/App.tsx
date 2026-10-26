import { CoreProviders } from '@jrs/client-core';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { getApiBaseUrl } from './src/config/api.config';
import {
  FirstTimeSetupScreen,
  ForgotPasswordScreen,
  LoginScreen,
  ResetPasswordScreen,
  useMobileAuthFlow,
  VerifyOtpScreen,
} from './src/features/auth';
import { MainAppTabBar } from './src/features/main';
import { usePushNotifications } from './src/features/notifications';
import { MobileToastContainer } from './src/features/toast';
import { TownSelectorScreen } from './src/features/towns';
import { mobileSecureStoreAdapter } from './src/storage/secure-store.adapter';
import { colors } from './src/theme/colors';

const API_BASE_URL = getApiBaseUrl();

function AppContent() {
  const {
    user,
    isAuthenticated,
    isLoading,
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
  } = useMobileAuthFlow();

  // Register push notifications
  usePushNotifications();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading LRC JRS Mobile...</Text>
      </View>
    );
  }

  const renderScreen = () => {
    // 1. Authenticated Flow
    if (isAuthenticated && user) {
      if (shouldShowRegionSelector) {
        return (
          <TownSelectorScreen user={user} onTownSelected={handleTownSelected} />
        );
      }

      return (
        <MainAppTabBar
          onSwitchTown={handleSwitchRegion}
          hasMultiTownAccess={hasMultiTownAccess}
        />
      );
    }

    // 2. First-Time Setup Flow
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

    // 3. Forgot Password Flow
    if (currentScreen === 'forgot-password') {
      return (
        <ForgotPasswordScreen
          initialIdentifier={recoveryIdentifier}
          onBackToSignIn={handleBackToSignIn}
          onCodeSent={handleCodeSent}
        />
      );
    }

    // 4. 6-Digit OTP Verification Flow
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

    // 5. Reset Password Flow
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

    // 6. Default Sign-In Screen
    return (
      <LoginScreen
        onRequiresPasswordChange={handleRequiresPasswordChange}
        onForgotPasswordClick={handleForgotPasswordClick}
      />
    );
  };

  return (
    <>
      {renderScreen()}
      <MobileToastContainer />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <CoreProviders
        storageAdapter={mobileSecureStoreAdapter}
        baseUrl={API_BASE_URL}
      >
        <AppContent />
        <StatusBar style="dark" />
      </CoreProviders>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
