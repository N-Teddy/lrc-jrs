import type { Gender, UserRole } from '@jrs/shared';
import {
  CalendarBlank,
  Check,
  EnvelopeSimple,
  Phone,
  User,
} from 'phosphor-react-native';
import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../../../theme/colors';

export interface MemberFormData {
  fullName: string;
  phoneNumber: string;
  email: string;
  gender: Gender;
  dateOfBirth: string;
  role: UserRole;
}

export interface MemberFormFieldsProps {
  data: MemberFormData;
  onChange: <K extends keyof MemberFormData>(
    field: K,
    value: MemberFormData[K],
  ) => void;
  isCreate?: boolean;
}

const ROLES: { label: string; value: UserRole }[] = [
  { label: 'Member', value: 'MEMBER' as UserRole },
  { label: 'PC', value: 'PC' as UserRole },
  { label: 'AP', value: 'AP' as UserRole },
];

export const MemberFormFields: React.FC<MemberFormFieldsProps> = ({
  data,
  onChange,
  isCreate = false,
}) => {
  return (
    <>
      {/* Full Name */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>
          Full Name {isCreate && <Text style={styles.required}>*</Text>}
        </Text>
        <View style={styles.inputContainer}>
          <User size={18} weight="bold" color={colors.textMuted} />
          <TextInput
            style={styles.input}
            placeholder={isCreate ? 'e.g. Emmanuel Ndongo' : 'Full name'}
            placeholderTextColor={colors.textMuted}
            value={data.fullName}
            onChangeText={(val) => onChange('fullName', val)}
            returnKeyType="next"
          />
        </View>
      </View>

      {/* WhatsApp Phone Number */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>
          Phone Number {isCreate && <Text style={styles.required}>*</Text>}
        </Text>
        <View style={styles.inputContainer}>
          <Phone size={18} weight="bold" color={colors.textMuted} />
          <TextInput
            style={styles.input}
            placeholder={isCreate ? 'e.g. 670 000 000' : 'Phone number'}
            placeholderTextColor={colors.textMuted}
            value={data.phoneNumber}
            onChangeText={(val) => onChange('phoneNumber', val)}
            keyboardType="phone-pad"
            returnKeyType="next"
          />
        </View>
      </View>

      {/* Email Address */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>
          {isCreate ? 'Email Address (Optional)' : 'Email Address'}
        </Text>
        <View style={styles.inputContainer}>
          <EnvelopeSimple size={18} weight="bold" color={colors.textMuted} />
          <TextInput
            style={styles.input}
            placeholder={
              isCreate ? 'e.g. emmanuel@example.org' : 'Email address'
            }
            placeholderTextColor={colors.textMuted}
            value={data.email}
            onChangeText={(val) => onChange('email', val)}
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
          Gender {isCreate && <Text style={styles.required}>*</Text>}
        </Text>
        <View style={styles.genderRow}>
          <TouchableOpacity
            style={[
              styles.genderButton,
              data.gender === 'MALE' && styles.genderButtonActive,
            ]}
            onPress={() => onChange('gender', 'MALE')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.genderButtonText,
                data.gender === 'MALE' && styles.genderButtonTextActive,
              ]}
            >
              Male
            </Text>
            {data.gender === 'MALE' && (
              <Check size={16} weight="bold" color="#FFFFFF" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.genderButton,
              data.gender === 'FEMALE' && styles.genderButtonActive,
            ]}
            onPress={() => onChange('gender', 'FEMALE')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.genderButtonText,
                data.gender === 'FEMALE' && styles.genderButtonTextActive,
              ]}
            >
              Female
            </Text>
            {data.gender === 'FEMALE' && (
              <Check size={16} weight="bold" color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Date of Birth */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>
          Date of Birth (YYYY-MM-DD){' '}
          {isCreate && <Text style={styles.required}>*</Text>}
        </Text>
        <View style={styles.inputContainer}>
          <CalendarBlank size={18} weight="bold" color={colors.textMuted} />
          <TextInput
            style={styles.input}
            placeholder={isCreate ? 'e.g. 2002-08-15' : 'YYYY-MM-DD'}
            placeholderTextColor={colors.textMuted}
            value={data.dateOfBirth}
            onChangeText={(val) => onChange('dateOfBirth', val)}
            keyboardType="numbers-and-punctuation"
            returnKeyType="done"
          />
        </View>
      </View>

      {/* Member Role */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Role</Text>
        <View style={styles.roleRow}>
          {ROLES.map((item) => (
            <TouchableOpacity
              key={item.value}
              style={[
                styles.roleButton,
                data.role === item.value && styles.roleButtonActive,
              ]}
              onPress={() => onChange('role', item.value)}
            >
              <Text
                style={[
                  styles.roleButtonText,
                  data.role === item.value && styles.roleButtonTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </>
  );
};

export const memberFormStyles = StyleSheet.create({
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
  form: {
    marginTop: 4,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  required: {
    color: colors.error,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: 12,
    height: 48,
    gap: 10,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    height: '100%',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.card,
    gap: 6,
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
    gap: 10,
  },
  roleButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.card,
  },
  roleButtonActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(217, 119, 6, 0.08)',
  },
  roleButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  roleButtonTextActive: {
    color: colors.primary,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorLight,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  errorIcon: {
    marginRight: 8,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
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
    fontSize: 15,
    fontWeight: '700',
  },
});

const styles = memberFormStyles;
