import { useHttp, useTranslation } from '@jrs/client-core';
import type { IForgotPasswordResponse } from '@jrs/shared';
import {
  ArrowLeft,
  ArrowRight,
  At,
  EnvelopeSimple,
  Key,
  Phone,
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

interface ForgotPasswordScreenProps {
  initialIdentifier?: string;
  onBackToSignIn: () => void;
  onCodeSent: (
    identifier: string,
    channel: 'auto' | 'whatsapp' | 'email',
  ) => void;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({
  initialIdentifier = '',
  onBackToSignIn,
  onCodeSent,
}) => {
  const http = useHttp();
  const { t } = useTranslation();

  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const trimmed = identifier.trim();
  const isPhoneInput =
    trimmed.length > 0 &&
    (/^\+?[0-9\s-]+$/.test(trimmed) || /^[0-9]/.test(trimmed));
  const isEmailInput = trimmed.includes('@');

  const handleSendCode = async () => {
    if (!trimmed) {
      setErrorMessage('Please enter your email or phone number.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await http.post<IForgotPasswordResponse>(
        '/auth/forgot-password',
        {
          identifier: trimmed,
        },
      );

      const effectiveChannel =
        (res.channel as 'auto' | 'whatsapp' | 'email') ||
        (isPhoneInput ? 'whatsapp' : 'email');
      onCodeSent(trimmed, effectiveChannel);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Unable to send verification code. Please try again.';
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
                {t('auth:forgotPassword.backToSignIn') || 'Back to Sign In'}
              </Text>
            </TouchableOpacity>

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconCircle}>
                <Key size={32} weight="fill" color={colors.primary} />
              </View>
              <Text style={styles.title}>
                {t('auth:forgotPassword.title') || 'Reset Password'}
              </Text>
              <Text style={styles.subtitle}>
                {t('auth:forgotPassword.subtitle') ||
                  "Enter your registered email address or WhatsApp phone number. We'll send you a 6-digit verification code."}
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

            {/* Form */}
            <View style={styles.form}>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>
                  {t('auth:forgotPassword.identifierLabel') ||
                    'Account Identifier'}{' '}
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
                      t('auth:forgotPassword.identifierPlaceholder') ||
                      'e.g. 670 000 000 or name@domain.org'
                    }
                    placeholderTextColor={colors.textMuted}
                    value={identifier}
                    onChangeText={setIdentifier}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType={isPhoneInput ? 'phone-pad' : 'email-address'}
                    returnKeyType="done"
                    onSubmitEditing={handleSendCode}
                    editable={!isLoading}
                  />
                </View>
              </View>

              {/* Submit CTA */}
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!trimmed || isLoading) && styles.submitButtonDisabled,
                ]}
                onPress={handleSendCode}
                disabled={!trimmed || isLoading}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <View style={styles.submitButtonContent}>
                    <Text style={styles.submitButtonText}>
                      {t('auth:forgotPassword.sendCode') ||
                        'Send Verification Code'}
                    </Text>
                    <ArrowRight size={18} weight="bold" color="#FFFFFF" />
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
    marginBottom: 24,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  header: {
    marginBottom: 24,
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
    marginBottom: 20,
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
    gap: 18,
  },
  fieldGroup: {
    marginBottom: 4,
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
  inputIconContainer: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    height: '100%',
  },
  submitButton: {
    height: 54,
    backgroundColor: colors.primary,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
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
