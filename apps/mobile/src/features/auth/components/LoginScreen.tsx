import { useAuth, useTranslation } from '@jrs/client-core';
import type { IAuthUser } from '@jrs/shared';
import {
  ArrowRight,
  At,
  Check,
  EnvelopeSimple,
  Eye,
  EyeSlash,
  Info,
  Lock,
  Phone,
  WarningCircle,
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
import { AuthScreenContainer } from './AuthScreenContainer';

interface LoginScreenProps {
  onRequiresPasswordChange: (data: {
    setupToken: string;
    user: IAuthUser;
  }) => void;
  onForgotPasswordClick?: (identifier: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onRequiresPasswordChange,
  onForgotPasswordClick,
}) => {
  const { signIn } = useAuth();
  const { t } = useTranslation();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isTempExpired, setIsTempExpired] = useState(false);

  // Dynamic input type detection
  const trimmed = identifier.trim();
  const isPhoneInput =
    trimmed.length > 0 &&
    (/^\+?[0-9\s-]+$/.test(trimmed) || /^[0-9]/.test(trimmed));
  const isEmailInput = trimmed.includes('@');

  const handleLogin = async () => {
    if (!identifier.trim()) {
      setErrorMessage('Please enter your email or phone number.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setErrorMessage(null);
    setIsTempExpired(false);
    setIsLoading(true);

    try {
      const res = await signIn(identifier.trim(), password);

      if (res.requiresPasswordChange && res.setupToken && res.user) {
        onRequiresPasswordChange({
          setupToken: res.setupToken,
          user: res.user,
        });
      }
    } catch (err: any) {
      const msg: string =
        err?.response?.data?.message ||
        err?.message ||
        'Unable to sign in. Please verify your credentials.';

      if (
        typeof msg === 'string' &&
        msg.toLowerCase().includes('temporary password has expired')
      ) {
        setIsTempExpired(true);
      }
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthScreenContainer scrollContentStyle={styles.scrollContent}>
      {/* Header Title */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {t('auth:login.title') || 'Welcome Back'}
        </Text>
        <Text style={styles.subtitle}>
          {t('auth:login.subtitle') ||
            'Sign in to your youth fellowship portal'}
        </Text>
      </View>

      {/* First-time Member Guidance Banner */}
      <View style={styles.noticeBox}>
        <Info
          size={20}
          weight="bold"
          color={colors.primary}
          style={styles.noticeIcon}
        />
        <View style={styles.noticeTextContainer}>
          <Text style={styles.noticeTitle}>
            {t('auth:login.firstTimeNoticeTitle') || 'First-time signing in?'}
          </Text>
          <Text style={styles.noticeText}>
            {t('auth:login.firstTimeNoticeDesc') ||
              'Enter the temporary password sent to your WhatsApp or Email to set up your permanent account.'}
          </Text>
        </View>
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
          <View style={styles.errorTextContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
            {isTempExpired && (
              <TouchableOpacity
                onPress={() => onForgotPasswordClick?.(identifier)}
                style={styles.resetNowButton}
              >
                <Text style={styles.resetNowText}>
                  {t('auth:login.resetNow') || 'Reset Password Now →'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Form Fields */}
      <View style={styles.form}>
        {/* Identifier Field */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            {t('auth:login.identifierLabel') || 'Phone Number or Email'}{' '}
            <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.inputContainer}>
            <View style={styles.inputIconContainer}>
              {isPhoneInput ? (
                <Phone size={20} weight="bold" color={colors.primary} />
              ) : isEmailInput ? (
                <EnvelopeSimple
                  size={20}
                  weight="bold"
                  color={colors.primary}
                />
              ) : (
                <At size={20} weight="bold" color={colors.textMuted} />
              )}
            </View>
            <TextInput
              style={styles.input}
              placeholder={
                t('auth:login.identifierPlaceholder') ||
                'e.g. 670 000 000 or name@domain.org'
              }
              placeholderTextColor={colors.textMuted}
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType={isPhoneInput ? 'phone-pad' : 'email-address'}
              returnKeyType="next"
              editable={!isLoading}
            />
          </View>
        </View>

        {/* Password Field */}
        <View style={styles.fieldGroup}>
          <View style={styles.passwordHeaderRow}>
            <Text style={styles.label}>
              {t('auth:login.passwordLabel') || 'Password'}{' '}
              <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              onPress={() => onForgotPasswordClick?.(identifier)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.forgotPasswordText}>
                {t('auth:login.forgotPassword') || 'Forgot Password?'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.inputContainer}>
            <View style={styles.inputIconContainer}>
              <Lock size={20} weight="bold" color={colors.textMuted} />
            </View>
            <TextInput
              style={styles.input}
              placeholder={
                t('auth:login.passwordPlaceholder') || 'Enter your password'
              }
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              editable={!isLoading}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {showPassword ? (
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

        {/* Keep Signed In Checkbox */}
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setKeepSignedIn(!keepSignedIn)}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.checkbox,
              keepSignedIn ? styles.checkboxChecked : styles.checkboxUnchecked,
            ]}
          >
            {keepSignedIn && <Check size={14} weight="bold" color="#fff" />}
          </View>
          <Text style={styles.checkboxLabel}>
            {t('auth:login.keepSignedIn') || 'Keep me signed in'}
          </Text>
        </TouchableOpacity>

        {/* Submit CTA */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            isLoading && styles.submitButtonDisabled,
          ]}
          onPress={handleLogin}
          disabled={isLoading}
          activeOpacity={0.85}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <View style={styles.submitButtonContent}>
              <Text style={styles.submitButtonText}>
                {t('auth:login.signInButton') || 'Sign In'}
              </Text>
              <ArrowRight size={18} weight="bold" color="#FFFFFF" />
            </View>
          )}
        </TouchableOpacity>
      </View>
    </AuthScreenContainer>
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
    paddingTop: 24,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 24,
  },
  brandBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryBorder,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 14,
  },
  brandBadgeText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 28,
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
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryBorder,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  noticeIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  noticeTextContainer: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  noticeText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.errorLight,
    borderColor: 'rgba(186, 26, 26, 0.25)',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  errorIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  errorTextContainer: {
    flex: 1,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.errorDark,
    lineHeight: 18,
  },
  resetNowButton: {
    marginTop: 6,
  },
  resetNowText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.errorDark,
    textDecorationLine: 'underline',
  },
  form: {
    gap: 18,
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
  passwordHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  forgotPasswordText: {
    fontSize: 13,
    fontWeight: '600',
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
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1.5,
  },
  checkboxChecked: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  checkboxUnchecked: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
  },
  checkboxLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  submitButton: {
    height: 54,
    backgroundColor: colors.primary,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.65,
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
