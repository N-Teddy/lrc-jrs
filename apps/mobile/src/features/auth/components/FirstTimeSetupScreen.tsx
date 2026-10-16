import { useAuth, useTranslation } from '@jrs/client-core';
import type { IAuthUser } from '@jrs/shared';
import { CheckCircle, ShieldCheck } from 'phosphor-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../../../theme/colors';
import { AuthErrorBanner, AuthScreenContainer } from './AuthScreenContainer';
import { PasswordFormFields, passwordFormStyles } from './PasswordFormFields';
import { isPasswordValid } from './PasswordRequirements';

interface FirstTimeSetupScreenProps {
  setupToken: string;
  user: IAuthUser;
  onCancel: () => void;
  onSetupComplete: () => void;
}

export const FirstTimeSetupScreen: React.FC<FirstTimeSetupScreenProps> = ({
  setupToken,
  user,
  onCancel,
  onSetupComplete,
}) => {
  const { completeSetup } = useAuth();
  const { t } = useTranslation();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const passwordsMatch =
    confirmPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = async () => {
    if (!isPasswordValid(newPassword)) {
      setErrorMessage('Please ensure your password meets all requirements.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage(
        t('auth:setup.passwordsDoNotMatch') || 'Passwords do not match.',
      );
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      await completeSetup(newPassword, setupToken);
      onSetupComplete();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Unable to set permanent password. Please try again.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthScreenContainer
      onBack={onCancel}
      backLabel={t('auth:setup.backToSignIn') || 'Cancel & Sign Out'}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <ShieldCheck size={32} weight="fill" color={colors.primary} />
        </View>
        <Text style={styles.title}>
          {t('auth:setup.title') || `Welcome, ${user.fullName}!`}
        </Text>
        <Text style={styles.subtitle}>
          {t('auth:setup.welcome', { name: user.fullName }) ||
            'Create your permanent password to complete your account setup.'}
        </Text>
      </View>

      {/* Error Notification */}
      <AuthErrorBanner message={errorMessage} />

      {/* Form Fields */}
      <View style={styles.form}>
        <PasswordFormFields
          newPassword={newPassword}
          setNewPassword={setNewPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          isLoading={isLoading}
          onSubmitEditing={handleSubmit}
          newPasswordLabel={
            t('auth:setup.newPasswordLabel') || 'New Permanent Password'
          }
          newPasswordPlaceholder={
            t('auth:setup.newPasswordPlaceholder') ||
            'Enter new secure password'
          }
          confirmPasswordLabel={
            t('auth:setup.confirmPasswordLabel') || 'Confirm Password'
          }
          confirmPasswordPlaceholder={
            t('auth:setup.confirmPasswordPlaceholder') ||
            'Re-enter your new password'
          }
        />

        {/* Submit CTA */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!isPasswordValid(newPassword) || !passwordsMatch || isLoading) &&
              styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={
            !isPasswordValid(newPassword) || !passwordsMatch || isLoading
          }
          activeOpacity={0.85}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <View style={styles.submitButtonContent}>
              <CheckCircle size={20} weight="bold" color="#FFFFFF" />
              <Text style={styles.submitButtonText}>
                {t('auth:setup.submitButton') || 'Save & Activate Account'}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </AuthScreenContainer>
  );
};

const styles = passwordFormStyles;
