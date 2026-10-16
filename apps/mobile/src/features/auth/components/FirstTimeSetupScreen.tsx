import { useAuth, useTranslation } from '@jrs/client-core';
import type { IAuthUser } from '@jrs/shared';
import {
  CheckCircle,
  Eye,
  EyeSlash,
  Lock,
  ShieldCheck,
} from 'phosphor-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../../../theme/colors';
import { AuthErrorBanner, AuthScreenContainer } from './AuthScreenContainer';
import { isPasswordValid, PasswordRequirements } from './PasswordRequirements';

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
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
        {/* New Password */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            {t('auth:setup.newPasswordLabel') || 'New Permanent Password'}{' '}
            <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.inputContainer}>
            <View style={styles.inputIconContainer}>
              <Lock size={20} weight="bold" color={colors.textMuted} />
            </View>
            <TextInput
              style={styles.input}
              placeholder={
                t('auth:setup.newPasswordPlaceholder') ||
                'Enter new secure password'
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
                <Eye size={20} weight="bold" color={colors.textSecondary} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Requirements Live Checklist */}
        <PasswordRequirements password={newPassword} />

        {/* Confirm Password */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            {t('auth:setup.confirmPasswordLabel') || 'Confirm Password'}{' '}
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
                t('auth:setup.confirmPasswordPlaceholder') ||
                'Re-enter your new password'
              }
              placeholderTextColor={colors.textMuted}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
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
                <Eye size={20} weight="bold" color={colors.textSecondary} />
              )}
            </TouchableOpacity>
          </View>
        </View>

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

const styles = StyleSheet.create({
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
