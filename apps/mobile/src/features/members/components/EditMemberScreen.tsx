import {
  useDeleteMemberMutation,
  useMemberDetailQuery,
  useUpdateMemberMutation,
} from '@jrs/client-core';
import type { Gender, UserRole } from '@jrs/shared';
import {
  ArrowLeft,
  CheckCircle,
  Trash,
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

  const [formData, setFormData] = useState<MemberFormData>({
    fullName: '',
    phoneNumber: '',
    email: '',
    gender: 'MALE' as Gender,
    dateOfBirth: '',
    role: 'MEMBER' as UserRole,
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize form when member data is fetched
  useEffect(() => {
    if (member) {
      setFormData({
        fullName: member.fullName || '',
        phoneNumber: member.phoneNumber || '',
        email: member.email || '',
        gender: (member.gender as Gender) || 'MALE',
        dateOfBirth: member.dateOfBirth?.split('T')[0] || '',
        role: member.role || ('MEMBER' as UserRole),
      });
    }
  }, [member]);

  const handleFieldChange = <K extends keyof MemberFormData>(
    field: K,
    value: MemberFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.fullName.trim()) {
      setErrorMessage('Full name is required.');
      return;
    }
    if (!formData.phoneNumber.trim()) {
      setErrorMessage('Phone number is required.');
      return;
    }

    setErrorMessage(null);

    try {
      await updateMemberMutation.mutateAsync({
        id: memberId,
        dto: {
          fullName: formData.fullName.trim(),
          phoneNumber: formData.phoneNumber.trim(),
          email: formData.email.trim() || undefined,
          gender: formData.gender,
          dateOfBirth: formData.dateOfBirth.trim() || undefined,
          role: formData.role,
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
      `Are you sure you want to remove ${formData.fullName || 'this member'} from the active registry?`,
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
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Trash size={20} weight="bold" color={colors.error} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar Profile Header */}
          <View style={styles.avatarHeader}>
            <MobileUserAvatar
              name={formData.fullName || 'Member Name'}
              avatarUrl={member?.avatarUrl}
              size="xl"
            />
            <Text style={styles.avatarName}>
              {formData.fullName || 'Member Name'}
            </Text>
            <Text style={styles.avatarMeta}>
              {member?.role || 'MEMBER'} • {member?.homeTown?.name || 'Hub'}
            </Text>
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
            <MemberFormFields
              data={formData}
              onChange={handleFieldChange}
              isCreate={false}
            />

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
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  ...memberFormStyles,
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 4,
  },
  avatarHeader: {
    alignItems: 'center',
    marginVertical: 16,
  },
  avatarName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginTop: 10,
  },
  avatarMeta: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
    fontWeight: '600',
  },
});
