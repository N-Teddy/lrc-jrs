import { useCreateMemberMutation, useTownContext } from '@jrs/client-core';
import type { Gender, UserRole } from '@jrs/shared';
import {
  ArrowLeft,
  CalendarBlank,
  Check,
  CheckCircle,
  EnvelopeSimple,
  Info,
  Phone,
  User,
  WarningCircle,
} from 'phosphor-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { colors } from '../../../theme/colors';

interface AddMemberScreenProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const AddMemberScreen: React.FC<AddMemberScreenProps> = ({
  onBack,
  onSuccess,
}) => {
  const { activeTown } = useTownContext();
  const createMemberMutation = useCreateMemberMutation();

  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<Gender>('MALE');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [role, setRole] = useState<UserRole>('MEMBER' as UserRole);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!fullName.trim()) {
      setErrorMessage('Full name is required.');
      return;
    }
    if (!phoneNumber.trim()) {
      setErrorMessage('Phone number is required.');
      return;
    }
    if (!dateOfBirth.trim()) {
      setErrorMessage('Date of birth is required (YYYY-MM-DD).');
      return;
    }
    if (!activeTown?.id) {
      setErrorMessage('No active fellowship hub selected.');
      return;
    }

    setErrorMessage(null);

    try {
      await createMemberMutation.mutateAsync({
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        email: email.trim() || undefined,
        gender,
        dateOfBirth: dateOfBirth.trim(),
        role,
        homeTownId: activeTown.id, // Fellowship hub is default context!
        hasAppAccess: true,
      });

      onSuccess();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to register member. Please check the information provided.';
      setErrorMessage(msg);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Navigation Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowLeft size={22} weight="bold" color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Register New Member</Text>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hub Context Tag */}
          {activeTown && (
            <View style={styles.hubBanner}>
              <Info size={16} weight="bold" color={colors.primary} />
              <Text style={styles.hubBannerText}>
                Registering for{' '}
                <Text style={styles.hubBold}>{activeTown.name} Hub</Text>
              </Text>
            </View>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <View style={styles.errorBox}>
              <WarningCircle
                size={18}
                weight="fill"
                color={colors.error}
                style={styles.errorIcon}
              />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          <View style={styles.form}>
            {/* Full Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Full Name <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputContainer}>
                <User size={18} weight="bold" color={colors.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Emmanuel Ndongo"
                  placeholderTextColor={colors.textMuted}
                  value={fullName}
                  onChangeText={setFullName}
                  returnKeyType="next"
                />
              </View>
            </View>

            {/* WhatsApp Phone Number */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Phone Number <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputContainer}>
                <Phone size={18} weight="bold" color={colors.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 670 000 000"
                  placeholderTextColor={colors.textMuted}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  returnKeyType="next"
                />
              </View>
            </View>

            {/* Email Address */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email Address (Optional)</Text>
              <View style={styles.inputContainer}>
                <EnvelopeSimple
                  size={18}
                  weight="bold"
                  color={colors.textMuted}
                />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. emmanuel@example.org"
                  placeholderTextColor={colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>
            </View>

            {/* Gender Selector: Male and Female */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Gender <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.genderRow}>
                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    gender === 'MALE' && styles.genderButtonActive,
                  ]}
                  onPress={() => setGender('MALE')}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.genderButtonText,
                      gender === 'MALE' && styles.genderButtonTextActive,
                    ]}
                  >
                    Male
                  </Text>
                  {gender === 'MALE' && (
                    <Check size={16} weight="bold" color="#FFFFFF" />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    gender === 'FEMALE' && styles.genderButtonActive,
                  ]}
                  onPress={() => setGender('FEMALE')}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.genderButtonText,
                      gender === 'FEMALE' && styles.genderButtonTextActive,
                    ]}
                  >
                    Female
                  </Text>
                  {gender === 'FEMALE' && (
                    <Check size={16} weight="bold" color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Date of Birth */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Date of Birth (YYYY-MM-DD){' '}
                <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputContainer}>
                <CalendarBlank
                  size={18}
                  weight="bold"
                  color={colors.textMuted}
                />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 2002-08-15"
                  placeholderTextColor={colors.textMuted}
                  value={dateOfBirth}
                  onChangeText={setDateOfBirth}
                  keyboardType="numbers-and-punctuation"
                  returnKeyType="done"
                />
              </View>
            </View>

            {/* Role in Fellowship */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Role in Fellowship</Text>
              <View style={styles.roleRow}>
                {[
                  { label: 'Member', value: 'MEMBER' },
                  { label: 'PC (Leader)', value: 'PC' },
                  { label: 'AP (Director)', value: 'AP' },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.value}
                    style={[
                      styles.roleButton,
                      role === item.value && styles.roleButtonActive,
                    ]}
                    onPress={() => setRole(item.value as UserRole)}
                  >
                    <Text
                      style={[
                        styles.roleButtonText,
                        role === item.value && styles.roleButtonTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                createMemberMutation.isPending && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={createMemberMutation.isPending}
              activeOpacity={0.85}
            >
              {createMemberMutation.isPending ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View style={styles.submitButtonContent}>
                  <CheckCircle size={20} weight="bold" color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>Register Member</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
    backgroundColor: colors.card,
  },
  backButton: {
    padding: 4,
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  hubBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryBorder,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 18,
  },
  hubBannerText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  hubBold: {
    fontWeight: '800',
    color: colors.primary,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorLight,
    borderColor: 'rgba(186, 26, 26, 0.25)',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
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
    height: 52,
    backgroundColor: colors.inputBg,
    borderColor: colors.inputBorder,
    borderWidth: 1.2,
    borderRadius: 14,
    paddingHorizontal: 14,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    height: '100%',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 10,
  },
  genderButton: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    backgroundColor: colors.inputBg,
    borderColor: colors.inputBorder,
    borderWidth: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  genderButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  genderButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  genderButtonTextActive: {
    color: '#FFFFFF',
  },
  roleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  roleButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.inputBg,
    borderColor: colors.inputBorder,
    borderWidth: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleButtonActive: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  roleButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  roleButtonTextActive: {
    color: '#FFFFFF',
  },
  submitButton: {
    height: 54,
    backgroundColor: colors.primary,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
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
