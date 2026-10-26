import { useHttp, useTranslation } from '@jrs/client-core';
import type {
  IForgotPasswordResponse,
  IVerifyResetCodeResponse,
} from '@jrs/shared';
import {
  ArrowRight,
  CaretLeft,
  Clock,
  EnvelopeSimple,
  ShieldCheck,
  WarningCircle,
  WhatsappLogo,
} from 'phosphor-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { colors } from '../../../theme/colors';

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
  const { i18n } = useTranslation();
  const isFrench = i18n.language?.startsWith('fr');

  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [secondsRemaining, setSecondsRemaining] = useState(60); // 60s cooldown for resend
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendNotice, setResendNotice] = useState<string | null>(null);

  const inputRefs = useRef<Array<TextInput | null>>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (secondsRemaining <= 0) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsRemaining]);

  const formattedTimer = `00:${secondsRemaining.toString().padStart(2, '0')}`;
  const isFormComplete = digits.every((d) => d.length === 1);

  // Masked identifier for display
  const maskedId = identifier.includes('@')
    ? identifier.replace(/(.{2})(.*)(@.*)/, '$1***$3')
    : identifier.replace(/(\+?\d{3})\d+(\d{2})/, '$1 •• •• $2');

  const handleCellChange = (text: string, index: number) => {
    const cleaned = text.replace(/[^0-9]/g, '');

    // Multi-digit paste (e.g. from SMS/WhatsApp autofill)
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
    if (errorMessage) setErrorMessage(null);

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
    Keyboard.dismiss();
    const code = digits.join('');
    if (code.length !== 6) {
      setErrorMessage(
        isFrench
          ? 'Veuillez renseigner le code complet à 6 chiffres.'
          : 'Please enter the complete 6-digit code.',
      );
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
      } else {
        setErrorMessage(
          res.message ||
            (isFrench
              ? 'Code de vérification invalide ou expiré.'
              : 'Invalid or expired verification code.'),
        );
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        (isFrench
          ? 'Code de vérification invalide.'
          : 'Invalid or expired verification code.');
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (secondsRemaining > 0 || isResending) return;

    setIsResending(true);
    setErrorMessage(null);

    try {
      await http.post<IForgotPasswordResponse>('/auth/forgot-password', {
        identifier,
      });

      setSecondsRemaining(60);
      setResendNotice(
        isFrench
          ? 'Un nouveau code de vérification a été envoyé !'
          : 'A new verification code has been dispatched!',
      );
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        (isFrench
          ? 'Impossible de renvoyer le code. Veuillez réessayer plus tard.'
          : 'Unable to resend code. Please try again.');
      setErrorMessage(msg);
    } finally {
      setIsResending(false);
    }
  };

  const handleNeedHelp = () => {
    Alert.alert(
      isFrench ? 'Assistance Support' : 'Support Assistance',
      isFrench
        ? 'Si vous ne recevez pas le code, contactez l’animateur principal de votre centre pour réinitialiser vos accès manuellement.'
        : 'If you cannot receive your verification code, please contact your Regional Lead or PC to reset your credentials manually.',
      [{ text: 'OK' }],
    );
  };

  const isEmail = channel === 'email' || identifier.includes('@');

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Top Bar with Back Button */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.backIconButton}
              onPress={onBackToChangeContact}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              activeOpacity={0.7}
            >
              <CaretLeft size={24} weight="bold" color={colors.onSurface} />
            </TouchableOpacity>
            <Text style={styles.topBarTitle}>
              {isFrench ? 'Vérification' : 'Verification'}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header Emblem & Title */}
            <View style={styles.headerSection}>
              <View style={styles.emblemContainer}>
                <ShieldCheck size={32} weight="fill" color={colors.primary} />
              </View>
              <Text style={styles.headline}>
                {isFrench
                  ? 'Entrez le code de vérification'
                  : 'Enter Verification Code'}
              </Text>
              <Text style={styles.subtitle}>
                {isFrench
                  ? 'Nous avons envoyé un code à 6 chiffres à :'
                  : 'We have sent a 6-digit code via your selected channel to:'}
              </Text>

              {/* Masked Recipient Pill */}
              <View style={styles.recipientPill}>
                <View style={styles.recipientIconCircle}>
                  {isEmail ? (
                    <EnvelopeSimple
                      size={14}
                      weight="bold"
                      color={colors.onSecondaryContainer}
                    />
                  ) : (
                    <WhatsappLogo
                      size={14}
                      weight="fill"
                      color={colors.onSecondaryContainer}
                    />
                  )}
                </View>
                <Text style={styles.recipientText}>{maskedId}</Text>
                <Text style={styles.recipientDot}>•</Text>
                <TouchableOpacity
                  onPress={onBackToChangeContact}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.changeContactLink}>
                    {isFrench ? 'Modifier' : 'Change'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Error or Resend Notice */}
            {errorMessage ? (
              <View style={styles.errorBox}>
                <WarningCircle
                  size={20}
                  weight="fill"
                  color={colors.error}
                  style={styles.errorIcon}
                />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {resendNotice ? (
              <View style={styles.successBox}>
                <Text style={styles.successText}>{resendNotice}</Text>
              </View>
            ) : null}

            {/* 6-Digit OTP Cells */}
            <View style={styles.otpCellsContainer}>
              {digits.map((digit, index) => {
                const isFocused =
                  !digit && digits.slice(0, index).every((d) => d);
                return (
                  <View
                    key={index}
                    style={[
                      styles.otpCell,
                      digit ? styles.otpCellFilled : null,
                      isFocused ? styles.otpCellFocused : null,
                    ]}
                  >
                    <TextInput
                      ref={(ref) => {
                        inputRefs.current[index] = ref;
                      }}
                      style={styles.otpInput}
                      value={digit}
                      onChangeText={(text) => handleCellChange(text, index)}
                      onKeyPress={(e) => handleKeyPress(e, index)}
                      keyboardType="number-pad"
                      maxLength={6}
                      selectTextOnFocus
                      autoFocus={index === 0}
                      textContentType="oneTimeCode"
                      editable={!isLoading}
                    />
                  </View>
                );
              })}
            </View>

            {/* Resend Status & Counter Section */}
            <View style={styles.resendSection}>
              {secondsRemaining > 0 ? (
                <View style={styles.timerPill}>
                  <Clock size={16} weight="bold" color={colors.secondary} />
                  <Text style={styles.timerText}>
                    {isFrench ? 'Renvoyer dans ' : 'Resend code in '}
                    <Text style={styles.timerCountdown}>{formattedTimer}</Text>
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.resendActiveButton}
                  onPress={handleResend}
                  disabled={isResending}
                  activeOpacity={0.8}
                >
                  {isResending ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Text style={styles.resendActiveText}>
                      {isFrench
                        ? 'Code non reçu ? Renvoyer le code'
                        : "Didn't receive a code? Resend Code"}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {/* Primary Action Button */}
            <View style={styles.actionZone}>
              <TouchableOpacity
                style={[
                  styles.verifyButton,
                  (!isFormComplete || isLoading) && styles.verifyButtonDisabled,
                ]}
                onPress={handleVerify}
                disabled={!isFormComplete || isLoading}
                activeOpacity={0.88}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.onPrimary} size="small" />
                ) : (
                  <>
                    <Text style={styles.verifyButtonText}>
                      {isFrench ? 'Vérifier et continuer' : 'Verify & Proceed'}
                    </Text>
                    <ArrowRight
                      size={20}
                      weight="bold"
                      color={colors.onPrimary}
                    />
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.helpButton}
                onPress={handleNeedHelp}
                activeOpacity={0.7}
              >
                <Text style={styles.helpText}>
                  {isFrench
                    ? 'Besoin d’aide ? '
                    : 'Need help recovering account? '}
                  <Text style={styles.helpTextHighlight}>
                    {isFrench ? 'Contacter l’animateur' : 'Contact Coordinator'}
                  </Text>
                </Text>
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
    backgroundColor: colors.surface,
  },
  keyboardContainer: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 52,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.03)',
  },
  backIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.onSurface,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
    alignItems: 'center',
  },
  headerSection: {
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: 28,
    width: '100%',
  },
  emblemContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  headline: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.onSurface,
    textAlign: 'center',
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    maxWidth: 290,
  },
  recipientPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 14,
    gap: 8,
  },
  recipientIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipientText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.onSurface,
    letterSpacing: 0.3,
  },
  recipientDot: {
    color: colors.outlineVariant,
  },
  changeContactLink: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorContainer,
    borderColor: 'rgba(186, 26, 26, 0.25)',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    width: '100%',
  },
  errorIcon: {
    marginRight: 10,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.onErrorContainer,
    lineHeight: 18,
  },
  successBox: {
    backgroundColor: colors.secondaryContainer,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    width: '100%',
    alignItems: 'center',
  },
  successText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.onSecondaryContainer,
  },
  otpCellsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 340,
    marginBottom: 24,
  },
  otpCell: {
    width: 48,
    height: 56,
    borderRadius: 14,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  otpCellFilled: {
    borderColor: colors.primaryContainer,
    backgroundColor: colors.surfaceContainerLowest,
  },
  otpCellFocused: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  otpInput: {
    width: '100%',
    height: '100%',
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '800',
    color: colors.onSurface,
  },
  resendSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    gap: 6,
  },
  timerText: {
    fontSize: 13,
    color: colors.onSurfaceVariant,
  },
  timerCountdown: {
    fontWeight: '700',
    color: colors.onSurface,
  },
  resendActiveButton: {
    paddingVertical: 6,
  },
  resendActiveText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  actionZone: {
    width: '100%',
    gap: 16,
  },
  verifyButton: {
    height: 54,
    borderRadius: 16,
    backgroundColor: colors.primaryContainer,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  verifyButtonDisabled: {
    opacity: 0.5,
  },
  verifyButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.onPrimary,
  },
  helpButton: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  helpText: {
    fontSize: 13,
    color: colors.onSurfaceVariant,
  },
  helpTextHighlight: {
    fontWeight: '700',
    color: colors.primary,
  },
});
