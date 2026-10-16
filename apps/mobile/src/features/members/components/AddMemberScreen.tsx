import { useCreateMemberMutation, useTownContext } from '@jrs/client-core';
import type { Gender, UserRole } from '@jrs/shared';
import {
  ArrowLeft,
  CheckCircle,
  Info,
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
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { colors } from '../../../theme/colors';
import {
  type MemberFormData,
  MemberFormFields,
  memberFormStyles,
} from './MemberFormFields';

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

  const [formData, setFormData] = useState<MemberFormData>({
    fullName: '',
    phoneNumber: '',
    email: '',
    gender: 'MALE' as Gender,
    dateOfBirth: '',
    role: 'MEMBER' as UserRole,
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFieldChange = <K extends keyof MemberFormData>(
    field: K,
    value: MemberFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.fullName.trim()) {
      setErrorMessage('Full name is required.');
      return;
    }
    if (!formData.phoneNumber.trim()) {
      setErrorMessage('Phone number is required.');
      return;
    }
    if (!formData.dateOfBirth.trim()) {
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
        fullName: formData.fullName.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        email: formData.email.trim() || undefined,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth.trim(),
        role: formData.role,
        homeTownId: activeTown.id,
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
            <MemberFormFields
              data={formData}
              onChange={handleFieldChange}
              isCreate={true}
            />

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
  ...memberFormStyles,
  hubBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(217, 119, 6, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.2)',
  },
  hubBannerText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  hubBold: {
    fontWeight: '700',
    color: colors.primary,
  },
});
