import { useHttp, useTranslation } from '@jrs/client-core';
import type {
  IForgotPasswordResponse,
  IVerifyResetCodeResponse,
} from '@jrs/shared';
import {
  ArrowRight,
  CheckCircle,
  EnvelopeSimple,
  PencilSimple,
  ShieldCheck,
  Timer,
  WhatsappLogo,
} from 'phosphor-react-native';
import React, { useEffect, useRef, useState } from 'react';
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

interface VerifyOtpScreenProps {
  identifier: string;
  channel?: 'auto' | 'whatsapp' | 'email';
  onBackToChangeContact: () => void;
  onCodeVerified: (resetToken: string) => void;
}

export const VerifyOtpScreen: React.FC<VerifyOtpScreenProps> = ({
  identifier,
  channel = 'auto',
  onBackToChangeContact,
  onCodeVerified,
}) => {
  const http = useHttp();
  const { t } = useTranslation();

  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [secondsRemaining, setSecondsRemaining] = useState(600); // 10 minutes
  const [attemptsRemaining, setAttemptsRemaining] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendNotice, setResendNotice] = useState<string | null>(null);

  const inputRefs = useRef<Array<TextInput | null>>([]);

  // Countdown timer
  useEffect(() => {
    if (secondsRemaining <= 0) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsRemaining]);

  const formattedTimer = `${Math.floor(secondsRemaining / 60)
    .toString()
    .padStart(2, '0')}:${(secondsRemaining % 60).toString().padStart(2, '0')}`;

  const isFormComplete = digits.every((d) => d.length === 1);

  // Masked identifier for display
  const maskedId = identifier.includes('@')
    ? identifier.replace(/(.{2})(.*)(@.*)/, '$1***$3')
    : identifier.replace(/(\+?\d{3})\d+(\d{2})/, '$1 *** *** $2');

  const handleCellChange = (text: string, index: number) => {
    // Handle paste of 6-digit code
    const cleaned = text.replace(/[^0-9]/g, '');
    if (cleaned.length > 1) {
      const nextDigits = [...digits];
      for (let i = 0; i < 6; i++) {
        nextDigits[i] = cleaned[i] || '';
      }
      setDigits(nextDigits);
      const focusIndex = Math.min(cleaned.length, 5);
      inputRefs.current[focusIndex]?.focus();
      return;
    }

    const nextDigits = [...digits];
    nextDigits[index] = cleaned;
    setDigits(nextDigits);

    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = digits.join('');
    if (code.length !== 6) {
      setErrorMessage('Please enter the complete 6-digit code.');
      return;
    }

    setErrorMessage(null);
    setResendNotice(null);
    setIsLoading(true);

    try {
      const res = await http.post<IVerifyResetCodeResponse>(
        '/auth/verify-reset-code',
        {
          identifier,
          code,
        },
      );

      if (res.valid && res.resetToken) {
        onCodeVerified(res.resetToken);
      }
    } catch (err: any) {
      setAttemptsRemaining((prev) => Math.max(0, prev - 1));
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Invalid or expired verification code.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (secondsRemaining > 0 || isResending) return;

    setIsResending(true);
    setErrorMessage(null);
    setResendNotice(null);

    try {
      await http.post<IForgotPasswordResponse>('/auth/forgot-password', {
        identifier,
        channel,
      });
      setSecondsRemaining(600);
      setAttemptsRemaining(5);
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      setResendNotice('A new verification code has been dispatched.');
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Unable to resend code. Please try again.';
      setErrorMessage(msg);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthScreenContainer
      onBack={onBackToChangeContact}
      backLabel={t('auth:verifyOtp.changeContact') || 'Change Identifier'}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <ShieldCheck size={32} weight="fill" color={colors.primary} />
        </View>
        <Text style={styles.title}>
          {t('auth:verifyOtp.title') || 'Enter 6-Digit Code'}
        </Text>
        <Text style={styles.subtitle}>
          {t('auth:verifyOtp.subtitle') ||
            'We sent a secure verification code to:'}
        </Text>

        {/* Destination badge */}
        <TouchableOpacity
          style={styles.destinationBadge}
          onPress={onBackToChangeContact}
        >
          {channel === 'whatsapp' ? (
            <WhatsappLogo size={18} weight="bold" color="#25D366" />
          ) : (
            <EnvelopeSimple size={18} weight="bold" color={colors.primary} />
          )}
          <Text style={styles.destinationText}>{maskedId}</Text>
          <PencilSimple size={14} weight="bold" color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Notifications */}
      <AuthErrorBanner message={errorMessage} />

      {resendNotice && (
        <View style={styles.successBox}>
          <CheckCircle
            size={20}
            weight="fill"
            color={colors.success}
            style={styles.errorIcon}
          />
          <Text style={styles.successText}>{resendNotice}</Text>
        </View>
      )}

      {/* 6-Digit Input Row */}
      <View style={styles.otpRow}>
        {digits.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => {
              inputRefs.current[index] = ref;
            }}
            style={[
              styles.otpBox,
              digit ? styles.otpBoxFilled : null,
              errorMessage ? styles.otpBoxError : null,
            ]}
            value={digit}
            onChangeText={(text) => handleCellChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            keyboardType="number-pad"
            maxLength={index === 0 ? 6 : 1}
            selectTextOnFocus
            textAlign="center"
            editable={!isLoading}
          />
        ))}
      </View>

      {/* Countdown & Attempts Info */}
      <View style={styles.statusRow}>
        <View style={styles.timerContainer}>
          <Timer size={16} weight="bold" color={colors.textSecondary} />
          <Text style={styles.timerText}>
            {t('auth:verifyOtp.codeExpiresIn') || 'Expires in'} {formattedTimer}
          </Text>
        </View>
        <Text style={styles.attemptsText}>
          {t('auth:verifyOtp.attemptsRemaining', {
            count: attemptsRemaining,
          }) || `${attemptsRemaining} attempts left`}
        </Text>
      </View>

      {/* Submit Action */}
      <TouchableOpacity
        style={[
          styles.submitButton,
          (!isFormComplete || isLoading) && styles.submitButtonDisabled,
        ]}
        onPress={handleVerify}
        disabled={!isFormComplete || isLoading}
        activeOpacity={0.85}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <View style={styles.submitButtonContent}>
            <Text style={styles.submitButtonText}>
              {t('auth:verifyOtp.verifyAndProceed') || 'Verify & Continue'}
            </Text>
            <ArrowRight size={18} weight="bold" color="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>

      {/* Resend Code Link */}
      <View style={styles.resendContainer}>
        <Text style={styles.resendLabel}>
          {t('auth:verifyOtp.didNotReceive') || "Didn't receive the code? "}
        </Text>
        <TouchableOpacity
          onPress={handleResend}
          disabled={secondsRemaining > 0 || isResending}
        >
          {isResending ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text
              style={[
                styles.resendAction,
                secondsRemaining > 0 && styles.resendActionDisabled,
              ]}
            >
              {t('auth:verifyOtp.resendCode') || 'Resend Code'}
            </Text>
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
    alignItems: 'center',
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
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
  destinationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.inputBg,
    borderColor: colors.inputBorder,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 12,
  },
  destinationText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
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
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successLight,
    borderColor: 'rgba(67, 102, 77, 0.25)',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
  },
  successText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.success,
    lineHeight: 18,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 14,
  },
  otpBox: {
    width: 48,
    height: 56,
    backgroundColor: colors.inputBg,
    borderColor: colors.inputBorder,
    borderWidth: 1.5,
    borderRadius: 12,
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  otpBoxFilled: {
    borderColor: colors.primary,
    backgroundColor: '#FFFFFF',
  },
  otpBoxError: {
    borderColor: colors.error,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timerText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  attemptsText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  submitButton: {
    height: 54,
    backgroundColor: colors.primary,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
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
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  resendLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  resendAction: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  resendActionDisabled: {
    color: colors.textMuted,
  },
});
