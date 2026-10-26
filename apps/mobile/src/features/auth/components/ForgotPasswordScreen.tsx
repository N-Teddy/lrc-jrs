import { useHttp, useTranslation } from '@jrs/client-core';
import type { IForgotPasswordResponse } from '@jrs/shared';
import {
  ArrowLeft,
  ArrowRight,
  CaretLeft,
  CheckCircle,
  Clock,
  EnvelopeSimple,
  Key,
  Phone,
  ShieldCheck,
  WarningCircle,
  WhatsappLogo,
  XCircle,
} from 'phosphor-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
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
  const { i18n } = useTranslation();
  const isFrench = i18n.language?.startsWith('fr');

  const [channel, setChannel] = useState<'whatsapp' | 'email'>('whatsapp');
  const [identifier, setIdentifier] = useState(
    initialIdentifier || (channel === 'whatsapp' ? '+237 ' : ''),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSelectChannel = (selected: 'whatsapp' | 'email') => {
    setChannel(selected);
    setErrorMessage(null);
    if (selected === 'whatsapp') {
      if (!identifier || identifier.includes('@')) {
        setIdentifier('+237 ');
      }
    } else {
      if (identifier === '+237 ' || identifier.startsWith('+237')) {
        setIdentifier('');
      }
    }
  };

  const handleSendCode = async () => {
    Keyboard.dismiss();
    const trimmed = identifier.trim();
    if (!trimmed || trimmed === '+237' || trimmed === '+237 ') {
      setErrorMessage(
        isFrench
          ? 'Veuillez renseigner votre contact enregistré.'
          : 'Please enter your registered contact.',
      );
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
        (res.channel as 'auto' | 'whatsapp' | 'email') || channel;
      onCodeSent(trimmed, effectiveChannel);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        (isFrench
          ? 'Impossible d’envoyer le code de vérification. Veuillez réessayer.'
          : 'Unable to send verification code. Please try again.');
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

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
              onPress={onBackToSignIn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              activeOpacity={0.7}
            >
              <CaretLeft size={24} weight="bold" color={colors.onSurface} />
            </TouchableOpacity>
            <Text style={styles.topBarTitle}>
              {isFrench ? 'Récupération de compte' : 'Account Recovery'}
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
                <Key size={30} weight="fill" color={colors.primary} />
                <View style={styles.verifiedMiniBadge}>
                  <ShieldCheck
                    size={14}
                    weight="fill"
                    color={colors.onSecondary}
                  />
                </View>
              </View>
              <Text style={styles.headline}>
                {isFrench
                  ? 'Réinitialiser votre mot de passe'
                  : 'Reset Your Password'}
              </Text>
              <Text style={styles.subtitle}>
                {isFrench
                  ? 'Choisissez votre canal de réception et entrez votre contact pour recevoir un code à 6 chiffres.'
                  : 'Select your preferred delivery channel and enter your registered contact to receive a 6-digit verification code.'}
              </Text>
            </View>

            {/* Error Notification */}
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

            {/* Delivery Channel Selector */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionLabel}>
                {isFrench ? 'Canal de Réception' : 'Delivery Channel'}
              </Text>
              <View style={styles.channelGrid}>
                {/* WhatsApp Channel Card */}
                <TouchableOpacity
                  style={[
                    styles.channelCard,
                    channel === 'whatsapp' && styles.channelCardActive,
                  ]}
                  onPress={() => handleSelectChannel('whatsapp')}
                  activeOpacity={0.8}
                >
                  <View style={styles.channelCardTopRow}>
                    <View style={styles.channelIconBox}>
                      <WhatsappLogo
                        size={24}
                        weight="fill"
                        color={colors.primary}
                      />
                    </View>
                    {channel === 'whatsapp' ? (
                      <CheckCircle
                        size={22}
                        weight="fill"
                        color={colors.primary}
                      />
                    ) : (
                      <View style={styles.emptyRadioCircle} />
                    )}
                  </View>
                  <Text style={styles.channelTitle}>WhatsApp</Text>
                  <Text style={styles.channelSubtitle}>
                    {isFrench ? 'Envoi instantané' : 'Fastest delivery'}
                  </Text>
                  <View style={styles.recommendedBadge}>
                    <Text style={styles.recommendedBadgeText}>
                      {isFrench ? 'Recommandé' : 'Recommended'}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Email Channel Card */}
                <TouchableOpacity
                  style={[
                    styles.channelCard,
                    channel === 'email' && styles.channelCardActive,
                  ]}
                  onPress={() => handleSelectChannel('email')}
                  activeOpacity={0.8}
                >
                  <View style={styles.channelCardTopRow}>
                    <View style={styles.channelIconBox}>
                      <EnvelopeSimple
                        size={24}
                        weight="bold"
                        color={colors.onSurfaceVariant}
                      />
                    </View>
                    {channel === 'email' ? (
                      <CheckCircle
                        size={22}
                        weight="fill"
                        color={colors.primary}
                      />
                    ) : (
                      <View style={styles.emptyRadioCircle} />
                    )}
                  </View>
                  <Text style={styles.channelTitle}>Email</Text>
                  <Text style={styles.channelSubtitle}>
                    {isFrench ? 'Boîte de réception' : 'Inbox delivery'}
                  </Text>
                  <View style={[styles.recommendedBadge, { opacity: 0 }]}>
                    <Text style={styles.recommendedBadgeText}>Placeholder</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Input Field Section */}
            <View style={styles.sectionBlock}>
              <View style={styles.inputLabelRow}>
                <Text style={styles.fieldLabel}>
                  {channel === 'whatsapp'
                    ? isFrench
                      ? 'Numéro WhatsApp enregistré'
                      : 'Registered WhatsApp Phone'
                    : isFrench
                      ? 'Adresse e-mail enregistrée'
                      : 'Registered Email Address'}
                </Text>
                {channel === 'whatsapp' && (
                  <View style={styles.countryTag}>
                    <Text style={styles.countryTagText}>Cameroon (CM)</Text>
                  </View>
                )}
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.inputPrefix}>
                  {channel === 'whatsapp' ? (
                    <Phone
                      size={20}
                      weight="bold"
                      color={colors.onSurfaceVariant}
                    />
                  ) : (
                    <EnvelopeSimple
                      size={20}
                      weight="bold"
                      color={colors.onSurfaceVariant}
                    />
                  )}
                </View>
                <TextInput
                  style={styles.input}
                  value={identifier}
                  onChangeText={(val) => {
                    setIdentifier(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder={
                    channel === 'whatsapp'
                      ? '+237 674 440 001'
                      : 'nom@domaine.org'
                  }
                  placeholderTextColor={colors.outline}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType={
                    channel === 'whatsapp' ? 'phone-pad' : 'email-address'
                  }
                  returnKeyType="done"
                  onSubmitEditing={handleSendCode}
                  editable={!isLoading}
                />
                {identifier.length > 0 && (
                  <TouchableOpacity
                    style={styles.clearButton}
                    onPress={() =>
                      setIdentifier(channel === 'whatsapp' ? '+237 ' : '')
                    }
                  >
                    <XCircle size={18} weight="fill" color={colors.outline} />
                  </TouchableOpacity>
                )}
              </View>

              <Text style={styles.fieldHint}>
                {channel === 'whatsapp'
                  ? 'Format: +237 6XX XXX XXX ou numéro international.'
                  : 'Entrez l’adresse e-mail associée à votre compte.'}
              </Text>
            </View>

            {/* 15-Minute Expiration Notice Card */}
            <View style={styles.expirationNoticeCard}>
              <View style={styles.expirationIconCircle}>
                <Clock size={18} weight="bold" color={colors.primary} />
              </View>
              <View style={styles.expirationTextStack}>
                <Text style={styles.expirationTitle}>
                  {isFrench ? 'Validité de 15 minutes' : '15-Minute Expiration'}
                </Text>
                <Text style={styles.expirationDesc}>
                  {isFrench
                    ? 'Le code de vérification expire 15 minutes après génération pour protéger votre compte LRC.'
                    : 'The verification code expires 15 minutes after generation to ensure your LRC account remains secure.'}
                </Text>
              </View>
            </View>

            {/* Bottom Actions */}
            <View style={styles.bottomActionZone}>
              <TouchableOpacity
                style={[
                  styles.sendCodeButton,
                  isLoading && styles.sendCodeButtonDisabled,
                ]}
                onPress={handleSendCode}
                disabled={isLoading}
                activeOpacity={0.88}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.onPrimary} size="small" />
                ) : (
                  <>
                    <Text style={styles.sendCodeButtonText}>
                      {isFrench ? 'Envoyer le code' : 'Send Verification Code'}
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
                style={styles.returnButton}
                onPress={onBackToSignIn}
                activeOpacity={0.7}
              >
                <ArrowLeft
                  size={18}
                  weight="bold"
                  color={colors.onSurfaceVariant}
                />
                <Text style={styles.returnButtonText}>
                  {isFrench ? 'Retour à la connexion' : 'Return to Sign In'}
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
  },
  headerSection: {
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: 24,
  },
  emblemContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  verifiedMiniBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
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
    maxWidth: 320,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorContainer,
    borderColor: 'rgba(186, 26, 26, 0.25)',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
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
  sectionBlock: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  channelGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  channelCard: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  channelCardActive: {
    backgroundColor: colors.primaryFixed,
    borderColor: colors.primary,
  },
  channelCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  channelIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyRadioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.outlineVariant,
  },
  channelTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.onSurface,
    marginBottom: 2,
  },
  channelSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 8,
  },
  recommendedBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    backgroundColor: colors.primary,
  },
  recommendedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.onPrimary,
  },
  inputLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.onSurface,
  },
  countryTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: colors.secondaryFixed,
  },
  countryTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.onSecondaryFixed,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  inputPrefix: {
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.onSurface,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
  },
  fieldHint: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
    marginTop: 4,
    paddingHorizontal: 2,
  },
  expirationNoticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 14,
    padding: 12,
    gap: 10,
    marginBottom: 24,
  },
  expirationIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  expirationTextStack: {
    flex: 1,
  },
  expirationTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.onSurface,
  },
  expirationDesc: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
    lineHeight: 16,
    marginTop: 2,
  },
  bottomActionZone: {
    gap: 12,
  },
  sendCodeButton: {
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
  sendCodeButtonDisabled: {
    opacity: 0.7,
  },
  sendCodeButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.onPrimary,
  },
  returnButton: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  returnButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
  },
});
