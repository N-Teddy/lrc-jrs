import { useTranslation } from '@jrs/client-core';
import {
  ArrowRight,
  CaretLeft,
  Check,
  CheckCircle,
  Circle,
  Eye,
  EyeSlash,
  Key,
  Lock,
  LockKey,
  ShieldCheck,
  Users,
  WarningCircle,
} from 'phosphor-react-native';
import React, { useMemo, useState } from 'react';
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

export interface SetPermanentPasswordFormProps {
  title?: string;
  subtitle?: string;
  submitButtonText?: string;
  onBack: () => void;
  onSubmit: (password: string) => Promise<void>;
  isLoading: boolean;
  errorMessage?: string | null;
}

export const SetPermanentPasswordForm: React.FC<
  SetPermanentPasswordFormProps
> = ({
  title,
  subtitle,
  submitButtonText,
  onBack,
  onSubmit,
  isLoading,
  errorMessage,
}) => {
  const { i18n } = useTranslation();
  const isFrench = i18n.language?.startsWith('fr');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // 4 Security Checklist Criteria
  const checklist = useMemo(() => {
    return [
      {
        id: 'length',
        label: isFrench ? 'Au moins 8 caractères' : 'At least 8 characters',
        valid: newPassword.length >= 8,
      },
      {
        id: 'upper',
        label: isFrench
          ? 'Au moins une lettre majuscule (A-Z)'
          : 'At least one uppercase letter (A-Z)',
        valid: /[A-Z]/.test(newPassword),
      },
      {
        id: 'number',
        label: isFrench
          ? 'Au moins un chiffre (0-9)'
          : 'At least one number (0-9)',
        valid: /[0-9]/.test(newPassword),
      },
      {
        id: 'special',
        label: isFrench
          ? 'Au moins un symbole spécial (!@#$%^&*)'
          : 'At least one special symbol (!@#$%^&*)',
        valid: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword),
      },
    ];
  }, [newPassword, isFrench]);

  const metCount = checklist.filter((item) => item.valid).length;
  const isAllMet = metCount === checklist.length;
  const passwordsMatch =
    confirmPassword.length > 0 && newPassword === confirmPassword;
  const isFormValid = isAllMet && passwordsMatch;

  // Strength label
  const strengthLabel = useMemo(() => {
    if (metCount === 0) return '';
    if (metCount <= 2) return isFrench ? 'Faible' : 'Weak';
    if (metCount === 3) return isFrench ? 'Moyen' : 'Good Strength';
    return isFrench ? 'Fort' : 'Strong';
  }, [metCount, isFrench]);

  const handleFormSubmit = async () => {
    Keyboard.dismiss();
    if (!isAllMet) {
      setLocalError(
        isFrench
          ? 'Veuillez respecter l’ensemble des critères de sécurité.'
          : 'Please ensure your password meets all security criteria.',
      );
      return;
    }
    if (!passwordsMatch) {
      setLocalError(
        isFrench
          ? 'Les mots de passe ne correspondent pas.'
          : 'Passwords do not match.',
      );
      return;
    }

    setLocalError(null);
    await onSubmit(newPassword);
  };

  const activeError = localError || errorMessage;

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
              onPress={onBack}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              activeOpacity={0.7}
            >
              <CaretLeft size={24} weight="bold" color={colors.onSurface} />
            </TouchableOpacity>
            <Text style={styles.topBarTitle}>
              {isFrench ? 'Sécurité du compte' : 'Account Security'}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header Section */}
            <View style={styles.headerSection}>
              <View style={styles.emblemContainer}>
                <Key size={26} weight="fill" color={colors.primary} />
              </View>
              <Text style={styles.protectionTag}>
                {isFrench ? 'PROTECTION DU COMPTE' : 'ACCOUNT PROTECTION'}
              </Text>
              <Text style={styles.headline}>
                {title ||
                  (isFrench
                    ? 'Créer un mot de passe permanent'
                    : 'Create Permanent Password')}
              </Text>
              <Text style={styles.subtitle}>
                {subtitle ||
                  (isFrench
                    ? 'Assurez-vous que votre mot de passe respecte les critères ci-dessous.'
                    : 'Ensure your new password meets the security requirements below to protect your account.')}
              </Text>
            </View>

            {/* Error Banner */}
            {activeError ? (
              <View style={styles.errorBox}>
                <WarningCircle
                  size={20}
                  weight="fill"
                  color={colors.error}
                  style={styles.errorIcon}
                />
                <Text style={styles.errorText}>{activeError}</Text>
              </View>
            ) : null}

            {/* Form Fields */}
            <View style={styles.fieldsContainer}>
              {/* Field 1: New Password */}
              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.fieldLabel}>
                    {isFrench ? 'Nouveau mot de passe' : 'New Password'}
                  </Text>
                  {strengthLabel ? (
                    <Text
                      style={[
                        styles.strengthLabel,
                        metCount >= 3
                          ? styles.strengthGood
                          : styles.strengthWeak,
                      ]}
                    >
                      {strengthLabel}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.inputContainer}>
                  <Lock
                    size={20}
                    weight="bold"
                    color={colors.outline}
                    style={styles.inputPrefixIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder={
                      isFrench
                        ? 'Entrez le nouveau mot de passe'
                        : 'Enter new password'
                    }
                    placeholderTextColor={colors.outline}
                    value={newPassword}
                    onChangeText={(val) => {
                      setNewPassword(val);
                      if (localError) setLocalError(null);
                    }}
                    secureTextEntry={!showNewPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowNewPassword((prev) => !prev)}
                  >
                    {showNewPassword ? (
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

              {/* Field 2: Confirm New Password */}
              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.fieldLabel}>
                    {isFrench
                      ? 'Confirmer le mot de passe'
                      : 'Confirm New Password'}
                  </Text>
                  {passwordsMatch ? (
                    <View style={styles.matchIndicator}>
                      <CheckCircle
                        size={15}
                        weight="fill"
                        color={colors.secondary}
                      />
                      <Text style={styles.matchText}>
                        {isFrench
                          ? 'Correspondance validée'
                          : 'Passwords match'}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <View style={styles.inputContainer}>
                  <LockKey
                    size={20}
                    weight="bold"
                    color={colors.outline}
                    style={styles.inputPrefixIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder={
                      isFrench
                        ? 'Retapez le mot de passe'
                        : 'Re-enter new password'
                    }
                    placeholderTextColor={colors.outline}
                    value={confirmPassword}
                    onChangeText={(val) => {
                      setConfirmPassword(val);
                      if (localError) setLocalError(null);
                    }}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowConfirmPassword((prev) => !prev)}
                  >
                    {showConfirmPassword ? (
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
            </View>

            {/* Dynamic Security Checklist Card */}
            <View style={styles.securityChecklistCard}>
              <View style={styles.checklistHeader}>
                <View style={styles.checklistHeaderLeft}>
                  <ShieldCheck size={18} weight="bold" color={colors.primary} />
                  <Text style={styles.checklistTitle}>
                    {isFrench ? 'Contrôle de Sécurité' : 'Security Checklist'}
                  </Text>
                </View>
                <View style={styles.checklistCounterBadge}>
                  <Text style={styles.checklistCounterText}>
                    {isFrench
                      ? `${metCount} sur ${checklist.length} validés`
                      : `${metCount} of ${checklist.length} met`}
                  </Text>
                </View>
              </View>

              {/* Progress Meter Bar */}
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressBar,
                    { width: `${(metCount / checklist.length) * 100}%` },
                  ]}
                />
              </View>

              {/* Criteria Rows */}
              <View style={styles.criteriaStack}>
                {checklist.map((item) => (
                  <View key={item.id} style={styles.criteriaRow}>
                    <View style={styles.criteriaLeft}>
                      <View
                        style={[
                          styles.criteriaIconCircle,
                          item.valid && styles.criteriaIconCircleValid,
                        ]}
                      >
                        {item.valid ? (
                          <Check
                            size={12}
                            weight="bold"
                            color={colors.onSecondaryContainer}
                          />
                        ) : (
                          <Circle
                            size={10}
                            weight="bold"
                            color={colors.outlineVariant}
                          />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.criteriaLabel,
                          item.valid && styles.criteriaLabelValid,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.criteriaStatusText,
                        item.valid && styles.criteriaStatusTextValid,
                      ]}
                    >
                      {item.valid
                        ? isFrench
                          ? 'Validé'
                          : 'Satisfied'
                        : isFrench
                          ? 'En attente'
                          : 'Pending'}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Sanctuary Context Card */}
            <View style={styles.sanctuaryCard}>
              <View style={styles.sanctuaryIconTile}>
                <Users size={18} weight="bold" color={colors.primary} />
              </View>
              <View style={styles.sanctuaryTextStack}>
                <Text style={styles.sanctuaryTitle}>
                  {isFrench ? 'Avis de compte membre' : 'Member Account Notice'}
                </Text>
                <Text style={styles.sanctuaryDesc}>
                  {isFrench
                    ? 'La mise à jour de votre mot de passe synchronise vos accès sur l’ensemble des ressources et groupes LRC.'
                    : 'Updating your password on this device syncs your session securely across all LRC Youth platform resources and groups.'}
                </Text>
              </View>
            </View>

            {/* Action Area */}
            <View style={styles.actionZone}>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!isFormValid || isLoading) && styles.submitButtonDisabled,
                ]}
                onPress={handleFormSubmit}
                disabled={!isFormValid || isLoading}
                activeOpacity={0.88}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.onPrimary} size="small" />
                ) : (
                  <>
                    <Text style={styles.submitButtonText}>
                      {submitButtonText ||
                        (isFrench
                          ? 'Enregistrer et Se Connecter'
                          : 'Save Password & Sign In')}
                    </Text>
                    <ArrowRight
                      size={20}
                      weight="bold"
                      color={colors.onPrimary}
                    />
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.securityNoteRow}>
                <ShieldCheck size={16} weight="fill" color={colors.secondary} />
                <Text style={styles.securityNoteText}>
                  {isFrench
                    ? 'Chiffré de bout en bout avec échange de jetons sécurisé'
                    : 'Encrypted end-to-end with secure token exchange'}
                </Text>
              </View>
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
    marginBottom: 20,
  },
  emblemContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  protectionTag: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.secondary,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  headline: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.onSurface,
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.onSurfaceVariant,
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
  fieldsContainer: {
    gap: 16,
    marginBottom: 20,
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
  strengthLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  strengthGood: {
    color: colors.secondary,
  },
  strengthWeak: {
    color: colors.tertiary,
  },
  matchIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  matchText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.secondary,
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
  inputPrefixIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.onSurface,
    paddingVertical: 0,
  },
  eyeButton: {
    padding: 6,
  },
  securityChecklistCard: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  checklistHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checklistHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checklistTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.onSurface,
  },
  checklistCounterBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainerHigh,
  },
  checklistCounterText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.onSurfaceVariant,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surfaceContainer,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.secondary,
    borderRadius: 3,
  },
  criteriaStack: {
    gap: 8,
  },
  criteriaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  criteriaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  criteriaIconCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  criteriaIconCircleValid: {
    backgroundColor: colors.secondaryContainer,
  },
  criteriaLabel: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
    flex: 1,
  },
  criteriaLabelValid: {
    color: colors.onSurface,
    fontWeight: '600',
  },
  criteriaStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.outline,
  },
  criteriaStatusTextValid: {
    color: colors.secondary,
    fontWeight: '700',
  },
  sanctuaryCard: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainer,
    borderRadius: 14,
    padding: 12,
    gap: 10,
    marginBottom: 24,
  },
  sanctuaryIconTile: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sanctuaryTextStack: {
    flex: 1,
  },
  sanctuaryTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.onSurface,
  },
  sanctuaryDesc: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
    lineHeight: 15,
    marginTop: 2,
  },
  actionZone: {
    gap: 12,
  },
  submitButton: {
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
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.onPrimary,
  },
  securityNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 4,
  },
  securityNoteText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
  },
});
