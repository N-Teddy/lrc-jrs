import { useHttp, useTranslation } from '@jrs/client-core';
import type { IResetPasswordResponse } from '@jrs/shared';
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

interface ResetPasswordScreenProps {
  resetToken: string;
  identifier: string;
  onBackToSignIn: () => void;
  onPasswordResetComplete: () => void;
}

export const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({
  resetToken,
  identifier,
  onBackToSignIn,
  onPasswordResetComplete,
}) => {
  const http = useHttp();
  const { t } = useTranslation();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const passwordsMatch =
    confirmPassword.length > 0 && newPassword === confirmPassword;

  const handleResetPassword = async () => {
    if (!isPasswordValid(newPassword)) {
      setErrorMessage('Please ensure your password meets all requirements.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage(
        t('auth:resetPassword.passwordsDoNotMatch') ||
          'Passwords do not match.',
      );
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      await http.post<IResetPasswordResponse>('/auth/reset-password', {
        resetToken,
        newPassword,
      });

      onPasswordResetComplete();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        t('auth:resetPassword.tokenExpiredDesc') ||
        'Unable to reset password. The reset session may have expired.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthScreenContainer
      onBack={onBackToSignIn}
      backLabel={t('auth:resetPassword.backToSignIn') || 'Back to Sign In'}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <ShieldCheck size={32} weight="fill" color={colors.primary} />
        </View>
        <Text style={styles.title}>
          {t('auth:resetPassword.title') || 'Set New Password'}
        </Text>
        <Text style={styles.subtitle}>
          {t('auth:resetPassword.subtitle', { identifier }) ||
            `Choose a strong new password for ${identifier}.`}
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
          onSubmitEditing={handleResetPassword}
          newPasswordLabel={
            t('auth:resetPassword.newPasswordLabel') || 'New Password'
          }
          newPasswordPlaceholder={
            t('auth:resetPassword.newPasswordPlaceholder') ||
            'Enter new secure password'
          }
          confirmPasswordLabel={
            t('auth:resetPassword.confirmPasswordLabel') || 'Confirm Password'
          }
          confirmPasswordPlaceholder={
            t('auth:resetPassword.confirmPasswordPlaceholder') ||
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
          onPress={handleResetPassword}
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
                {t('auth:resetPassword.submitButton') || 'Reset Password'}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </AuthScreenContainer>
  );
};

const styles = passwordFormStyles;
