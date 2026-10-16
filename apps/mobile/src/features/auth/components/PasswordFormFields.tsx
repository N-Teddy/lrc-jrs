import { Eye, EyeSlash, Lock } from 'phosphor-react-native';
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../../../theme/colors';
import { PasswordRequirements } from './PasswordRequirements';

export interface PasswordFormFieldsProps {
  newPassword: string;
  setNewPassword: (val: string) => void;
  confirmPassword: string;
  setConfirmPassword: (val: string) => void;
  isLoading?: boolean;
  onSubmitEditing?: () => void;
  newPasswordLabel?: string;
  newPasswordPlaceholder?: string;
  confirmPasswordLabel?: string;
  confirmPasswordPlaceholder?: string;
}

export const PasswordFormFields: React.FC<PasswordFormFieldsProps> = ({
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  isLoading = false,
  onSubmitEditing,
  newPasswordLabel = 'New Password',
  newPasswordPlaceholder = 'Enter new secure password',
  confirmPasswordLabel = 'Confirm Password',
  confirmPasswordPlaceholder = 'Re-enter your new password',
}) => {
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordsMatch =
    confirmPassword.length > 0 && newPassword === confirmPassword;

  return (
    <>
      {/* New Password */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>
          {newPasswordLabel} <Text style={styles.required}>*</Text>
        </Text>
        <View style={styles.inputContainer}>
          <View style={styles.inputIconContainer}>
            <Lock size={20} weight="bold" color={colors.textMuted} />
          </View>
          <TextInput
            style={styles.input}
            placeholder={newPasswordPlaceholder}
            placeholderTextColor={colors.textMuted}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!showNewPassword}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            editable={!isLoading}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowNewPassword(!showNewPassword)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {showNewPassword ? (
              <EyeSlash size={20} weight="bold" color={colors.textSecondary} />
            ) : (
              <Eye size={20} weight="bold" color={colors.textSecondary} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Requirements Live Checklist */}
      <PasswordRequirements password={newPassword} />

      {/* Confirm Password */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>
          {confirmPasswordLabel} <Text style={styles.required}>*</Text>
        </Text>
        <View
          style={[
            styles.inputContainer,
            passwordsMatch && styles.inputSuccessBorder,
          ]}
        >
          <View style={styles.inputIconContainer}>
            <Lock size={20} weight="bold" color={colors.textMuted} />
          </View>
          <TextInput
            style={styles.input}
            placeholder={confirmPasswordPlaceholder}
            placeholderTextColor={colors.textMuted}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={onSubmitEditing}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {showConfirmPassword ? (
              <EyeSlash size={20} weight="bold" color={colors.textSecondary} />
            ) : (
              <Eye size={20} weight="bold" color={colors.textSecondary} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
};

export const passwordFormStyles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(217, 119, 6, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  form: {
    marginTop: 4,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  required: {
    color: colors.error,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
    paddingHorizontal: 14,
    height: 52,
  },
  inputSuccessBorder: {
    borderColor: colors.success,
  },
  inputIconContainer: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    height: '100%',
  },
  eyeButton: {
    padding: 6,
    marginLeft: 6,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
    marginTop: 8,
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

const styles = passwordFormStyles;
