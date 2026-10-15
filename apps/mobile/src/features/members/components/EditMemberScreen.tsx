import {
  useDeleteMemberMutation,
  useMemberDetailQuery,
  useUpdateMemberMutation,
} from '@jrs/client-core';
import type { Gender, UserRole } from '@jrs/shared';
import {
  ArrowLeft,
  CalendarBlank,
  Check,
  CheckCircle,
  EnvelopeSimple,
  Phone,
  Trash,
  User,
  WarningCircle,
} from 'phosphor-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { MobileUserAvatar } from './MobileUserAvatar';

interface EditMemberScreenProps {
  memberId: string;
  onBack: () => void;
  onSuccess: () => void;
  onDeleted?: () => void;
}

export const EditMemberScreen: React.FC<EditMemberScreenProps> = ({
  memberId,
  onBack,
  onSuccess,
  onDeleted,
}) => {
  const { data: member, isLoading: isLoadingDetail } =
    useMemberDetailQuery(memberId);
  const updateMemberMutation = useUpdateMemberMutation();
  const deleteMemberMutation = useDeleteMemberMutation();

  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<Gender>('MALE');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [role, setRole] = useState<UserRole>('MEMBER' as UserRole);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize form when member data is fetched
  useEffect(() => {
    if (member) {
      setFullName(member.fullName || '');
      setPhoneNumber(member.phoneNumber || '');
      setEmail(member.email || '');
      setGender((member.gender as Gender) || 'MALE');
      setDateOfBirth(member.dateOfBirth?.split('T')[0] || '');
      setRole(member.role || ('MEMBER' as UserRole));
    }
  }, [member]);

  const handleSave = async () => {
    if (!fullName.trim()) {
      setErrorMessage('Full name is required.');
      return;
    }
    if (!phoneNumber.trim()) {
      setErrorMessage('Phone number is required.');
      return;
    }

    setErrorMessage(null);

    try {
      await updateMemberMutation.mutateAsync({
        id: memberId,
        dto: {
          fullName: fullName.trim(),
          phoneNumber: phoneNumber.trim(),
          email: email.trim() || undefined,
          gender,
          dateOfBirth: dateOfBirth.trim() || undefined,
          role,
        },
      });

      onSuccess();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to update member profile.';
      setErrorMessage(msg);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Deactivate Member',
      `Are you sure you want to remove ${fullName || 'this member'} from the active fellowship registry?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMemberMutation.mutateAsync(memberId);
              onDeleted?.();
            } catch (err: any) {
              const msg =
                err?.response?.data?.message ||
                err?.message ||
                'Failed to delete member.';
              setErrorMessage(msg);
            }
          },
        },
      ],
    );
  };

  if (isLoadingDetail) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading member details...</Text>
      </View>
    );
  }

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
          <Text style={styles.topBarTitle}>Edit Member</Text>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar Preview */}
          <View style={styles.avatarRow}>
            <MobileUserAvatar
              avatarUrl={member?.avatarUrl}
              name={fullName || member?.fullName}
              size="lg"
            />
            <View>
              <Text style={styles.avatarName}>{fullName || 'Member'}</Text>
              <Text style={styles.avatarSub}>
                {member?.homeTown?.name || 'Fellowship Hub'}
              </Text>
            </View>
          </View>

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
                  placeholder="Full name"
                  placeholderTextColor={colors.textMuted}
                  value={fullName}
                  onChangeText={setFullName}
                  returnKeyType="next"
                />
              </View>
            </View>

            {/* Phone Number */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Phone Number <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputContainer}>
                <Phone size={18} weight="bold" color={colors.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="Phone number"
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
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputContainer}>
                <EnvelopeSimple
                  size={18}
                  weight="bold"
                  color={colors.textMuted}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Email address"
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
              <Text style={styles.label}>Gender</Text>
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
              <Text style={styles.label}>Date of Birth (YYYY-MM-DD)</Text>
              <View style={styles.inputContainer}>
                <CalendarBlank
                  size={18}
                  weight="bold"
                  color={colors.textMuted}
                />
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
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
                  { label: 'PC', value: 'PC' },
                  { label: 'AP', value: 'AP' },
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

            {/* Save Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                updateMemberMutation.isPending && styles.submitButtonDisabled,
              ]}
              onPress={handleSave}
              disabled={updateMemberMutation.isPending}
              activeOpacity={0.85}
            >
              {updateMemberMutation.isPending ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View style={styles.submitButtonContent}>
                  <CheckCircle size={20} weight="bold" color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>Save Changes</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Danger Zone: Delete Member */}
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
              disabled={deleteMemberMutation.isPending}
              activeOpacity={0.8}
            >
              {deleteMemberMutation.isPending ? (
                <ActivityIndicator color={colors.error} size="small" />
              ) : (
                <View style={styles.deleteButtonContent}>
                  <Trash size={18} weight="bold" color={colors.error} />
                  <Text style={styles.deleteButtonText}>Deactivate Member</Text>
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
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
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
  },
  avatarName: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  avatarSub: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
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
    marginTop: 10,
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
  deleteButton: {
    height: 50,
    backgroundColor: colors.errorLight,
    borderColor: 'rgba(186, 26, 26, 0.25)',
    borderWidth: 1.2,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  deleteButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteButtonText: {
    color: colors.errorDark,
    fontSize: 14,
    fontWeight: '700',
  },
});
