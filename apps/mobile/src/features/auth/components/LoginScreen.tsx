import { useAuth, useTranslation } from '@jrs/client-core';
import type { IAuthUser } from '@jrs/shared';
import {
  ArrowRight,
  At,
  EnvelopeSimple,
  Eye,
  EyeSlash,
  Fingerprint,
  Lock,
  Phone,
  Sparkle,
  Users,
  WarningCircle,
} from 'phosphor-react-native';
import React, { useState } from 'react';
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
  const { i18n } = useTranslation();
  const isFrench = i18n.language?.startsWith('fr');

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const toggleLanguage = (lang: 'en' | 'fr') => {
    i18n.changeLanguage(lang);
  };

  const trimmed = identifier.trim();
  const isPhoneInput =
    trimmed.length > 0 &&
    (/^\+?[0-9\s-]+$/.test(trimmed) || /^[0-9]/.test(trimmed));
  const isEmailInput = trimmed.includes('@');

  const handleLogin = async () => {
    Keyboard.dismiss();
    if (!identifier.trim()) {
      setErrorMessage(
        isFrench
          ? 'Veuillez saisir votre adresse e-mail ou numéro de téléphone.'
          : 'Please enter your email or phone number.',
      );
      return;
    }
    if (!password) {
      setErrorMessage(
        isFrench
          ? 'Veuillez entrer votre mot de passe.'
          : 'Please enter your password.',
      );
      return;
    }

    setErrorMessage(null);
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
        (isFrench
          ? 'Identifiant ou mot de passe incorrect.'
          : 'Unable to sign in. Please verify your credentials.');

      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricPress = () => {
    Alert.alert(
      isFrench ? 'Authentification Biométrique' : 'Biometric Sign In',
      isFrench
        ? 'Connectez-vous d’abord avec votre mot de passe pour enregistrer l’accès biométrique sur cet appareil.'
        : 'Sign in once with your password to activate Biometric access on this device.',
      [{ text: 'OK' }],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Top Bar: Language Switcher Pill */}
            <View style={styles.topUtilityBar}>
              <View style={styles.langPillContainer}>
                <TouchableOpacity
                  style={[
                    styles.langPillButton,
                    !isFrench && styles.langPillButtonActive,
                  ]}
                  onPress={() => toggleLanguage('en')}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.langPillText,
                      !isFrench && styles.langPillTextActive,
                    ]}
                  >
                    EN
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.langPillButton,
                    isFrench && styles.langPillButtonActive,
                  ]}
                  onPress={() => toggleLanguage('fr')}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.langPillText,
                      isFrench && styles.langPillTextActive,
                    ]}
                  >
                    FR
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Emblem & Branding Section */}
            <View style={styles.brandingSection}>
              <View style={styles.emblemContainer}>
                <Sparkle size={32} weight="fill" color={colors.primary} />
              </View>
              <Text style={styles.headline}>
                {isFrench ? 'Bon retour' : 'Welcome Back'}
              </Text>
              <Text style={styles.subtitle}>
                {isFrench
                  ? 'Entrez vos identifiants enregistrés pour accéder à votre espace régional.'
                  : 'Enter your registered credentials to access your regional workspace.'}
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

            {/* Form Fields */}
            <View style={styles.formContainer}>
              {/* Field 1: Universal Identifier */}
              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.fieldLabel}>
                    {isFrench ? 'E-mail ou Téléphone' : 'Email or Phone Number'}
                  </Text>
                  <Text style={styles.countryBadge}>CM / Global</Text>
                </View>
                <View style={styles.inputContainer}>
                  <View style={styles.inputIconPrefix}>
                    {isPhoneInput ? (
                      <Phone size={20} weight="bold" color={colors.primary} />
                    ) : isEmailInput ? (
                      <EnvelopeSimple
                        size={20}
                        weight="bold"
                        color={colors.primary}
                      />
                    ) : (
                      <At
                        size={20}
                        weight="bold"
                        color={colors.onSurfaceVariant}
                      />
                    )}
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder={
                      isFrench
                        ? '+237 6XX XX XX XX ou membre@domaine.com'
                        : '+237 6XX XX XX XX or member@domain.com'
                    }
                    placeholderTextColor={colors.outline}
                    value={identifier}
                    onChangeText={(val) => {
                      setIdentifier(val);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType={isPhoneInput ? 'phone-pad' : 'email-address'}
                    returnKeyType="next"
                    editable={!isLoading}
                  />
                </View>
              </View>

              {/* Field 2: Password with Reveal Toggle */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  {isFrench ? 'Mot de passe' : 'Password'}
                </Text>
                <View style={styles.inputContainer}>
                  <View style={styles.inputIconPrefix}>
                    <Lock
                      size={20}
                      weight="bold"
                      color={colors.onSurfaceVariant}
                    />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••••••"
                    placeholderTextColor={colors.outline}
                    value={password}
                    onChangeText={(val) => {
                      setPassword(val);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="go"
                    onSubmitEditing={handleLogin}
                    editable={!isLoading}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword((prev) => !prev)}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    {showPassword ? (
                      <EyeSlash
                        size={20}
                        weight="bold"
                        color={colors.onSurfaceVariant}
                      />
                    ) : (
                      <Eye
                        size={20}
                        weight="bold"
                        color={colors.onSurfaceVariant}
                      />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Forgot Password Target */}
              <View style={styles.forgotPasswordRow}>
                <TouchableOpacity
                  onPress={() => onForgotPasswordClick?.(identifier.trim())}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.forgotPasswordText}>
                    {isFrench ? 'Mot de passe oublié ?' : 'Forgot Password?'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Primary Action CTA */}
              <TouchableOpacity
                style={[
                  styles.signInButton,
                  isLoading && styles.signInButtonDisabled,
                ]}
                onPress={handleLogin}
                disabled={isLoading}
                activeOpacity={0.88}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.onPrimary} size="small" />
                ) : (
                  <>
                    <Text style={styles.signInButtonText}>
                      {isFrench ? 'Se connecter' : 'Sign In'}
                    </Text>
                    <ArrowRight
                      size={20}
                      weight="bold"
                      color={colors.onPrimary}
                    />
                  </>
                )}
              </TouchableOpacity>

              {/* Biometric Fast-Path Divider */}
              <View style={styles.biometricDividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>
                  {isFrench ? 'ou continuer avec' : 'or continue with'}
                </Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Biometric Action Button */}
              <View style={styles.biometricActionContainer}>
                <TouchableOpacity
                  style={styles.biometricButton}
                  onPress={handleBiometricPress}
                  activeOpacity={0.75}
                  accessibilityLabel="Sign in using Biometrics"
                >
                  <Fingerprint size={26} weight="bold" color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Grounded First-Time Notice Card */}
            <View style={styles.firstTimeNoticeCard}>
              <View style={styles.noticeIconCircle}>
                <Users
                  size={18}
                  weight="bold"
                  color={colors.onSecondaryContainer}
                />
              </View>
              <View style={styles.noticeTextStack}>
                <Text style={styles.noticeTitle}>
                  {isFrench
                    ? 'Première inscription ?'
                    : 'First time using the platform?'}
                </Text>
                <Text style={styles.noticeDesc}>
                  {isFrench
                    ? 'Contactez votre animateur pour obtenir vos identifiants temporaires.'
                    : 'Connect with your regional coordinator for access.'}
                </Text>
              </View>
            </View>

            {/* Platform Version Footer */}
            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>
                LRC Youth Records System • Version 1.0
              </Text>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
    justifyContent: 'center',
  },
  topUtilityBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 8,
  },
  langPillContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainer,
    borderRadius: 20,
    padding: 3,
  },
  langPillButton: {
    minHeight: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  langPillButtonActive: {
    backgroundColor: colors.surfaceContainerLowest,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  langPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.onSurfaceVariant,
  },
  langPillTextActive: {
    color: colors.primary,
  },
  brandingSection: {
    alignItems: 'center',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
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
    fontSize: 28,
    fontWeight: '800',
    color: colors.onSurface,
    letterSpacing: -0.5,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    maxWidth: 300,
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
  formContainer: {
    width: '100%',
    gap: 16,
  },
  fieldGroup: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.onSurface,
  },
  countryBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
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
  inputIconPrefix: {
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
  eyeButton: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  forgotPasswordRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 2,
  },
  forgotPasswordText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  signInButton: {
    height: 54,
    borderRadius: 16,
    backgroundColor: colors.primaryContainer,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  signInButtonDisabled: {
    opacity: 0.7,
  },
  signInButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.onPrimary,
    letterSpacing: 0.2,
  },
  biometricDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.surfaceVariant,
  },
  dividerText: {
    paddingHorizontal: 12,
    fontSize: 12,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  biometricActionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  biometricButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  firstTimeNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondaryContainer,
    borderRadius: 14,
    padding: 12,
    marginTop: 24,
    gap: 12,
  },
  noticeIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noticeTextStack: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.onSecondaryContainer,
  },
  noticeDesc: {
    fontSize: 12,
    color: colors.onSecondaryFixedVariant,
    marginTop: 1,
  },
  footerContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.outline,
  },
});
