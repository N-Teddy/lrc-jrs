import { useHttp, useTranslation } from '@jrs/client-core';
import type { IResetPasswordResponse } from '@jrs/shared';
import {
  ArrowLeft,
  CheckCircle,
  Eye,
  EyeSlash,
  Lock,
  ShieldCheck,
  WarningCircle,
} from 'phosphor-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../../theme/colors';
import { isPasswordValid, PasswordRequirements } from './PasswordRequirements';

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
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Top Back Navigation */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBackToSignIn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ArrowLeft size={22} weight="bold" color={colors.text} />
              <Text style={styles.backButtonText}>
                {t('auth:resetPassword.backToSignIn') || 'Back to Sign In'}
              </Text>
            </TouchableOpacity>

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
            {errorMessage && (
              <View style={styles.errorBox}>
                <WarningCircle
                  size={20}
                  weight="fill"
                  color={colors.error}
                  style={styles.errorIcon}
                />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {/* Form Fields */}
            <View style={styles.form}>
              {/* New Password */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>
                  {t('auth:resetPassword.newPasswordLabel') || 'New Password'}{' '}
                  <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.inputContainer}>
                  <View style={styles.inputIconContainer}>
                    <Lock size={20} weight="bold" color={colors.textMuted} />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder={
                      t('auth:resetPassword.newPasswordPlaceholder') ||
                      'Enter new password'
                    }
                    placeholderTextColor={colors.textMuted}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showNewPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    editable={!isLoading}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowNewPassword(!showNewPassword)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    {showNewPassword ? (
                      <EyeSlash
                        size={20}
                        weight="bold"
                        color={colors.textSecondary}
                      />
                    ) : (
                      <Eye
                        size={20}
                        weight="bold"
                        color={colors.textSecondary}
                      />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Requirements Checklist */}
              <PasswordRequirements password={newPassword} />

              {/* Confirm Password */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>
                  {t('auth:resetPassword.confirmPasswordLabel') ||
                    'Confirm Password'}{' '}
                  <Text style={styles.required}>*</Text>
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    passwordsMatch && styles.inputSuccessBorder,
                  ]}
                >
                  <View style={styles.inputIconContainer}>
                    <Lock size={20} weight="bold" color={colors.textMuted} />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder={
                      t('auth:resetPassword.confirmPasswordPlaceholder') ||
                      'Re-enter your new password'
                    }
                    placeholderTextColor={colors.textMuted}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleResetPassword}
                    editable={!isLoading}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    {showConfirmPassword ? (
                      <EyeSlash
                        size={20}
                        weight="bold"
                        color={colors.textSecondary}
                      />
                    ) : (
                      <Eye
                        size={20}
                        weight="bold"
                        color={colors.textSecondary}
                      />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Submit CTA */}
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!isPasswordValid(newPassword) ||
                    !passwordsMatch ||
                    isLoading) &&
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
                      {t('auth:resetPassword.saveAndReturn') ||
                        'Reset Password'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  header: {
    marginBottom: 20,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 6,
    lineHeight: 20,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorLight,
    borderColor: 'rgba(186, 26, 26, 0.25)',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
  },
  errorIcon: {
    marginRight: 10,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.errorDark,
    lineHeight: 18,
  },
  form: {
    gap: 16,
  },
  fieldGroup: {
    marginBottom: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  required: {
    color: colors.primary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    backgroundColor: colors.inputBg,
    borderColor: colors.inputBorder,
    borderWidth: 1.2,
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  inputSuccessBorder: {
    borderColor: colors.success,
  },
  inputIconContainer: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    height: '100%',
  },
  eyeButton: {
    padding: 6,
  },
  submitButton: {
    height: 54,
    backgroundColor: colors.primary,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
