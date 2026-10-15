import type { Gender, UserRole } from '@jrs/shared';
import { Check, X } from 'phosphor-react-native';
import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { colors } from '../../../theme/colors';

export interface MemberFilters {
  role?: UserRole | 'ALL';
  gender?: Gender | 'ALL';
  hasAppAccess?: boolean | 'ALL';
}

interface MemberFilterSheetProps {
  visible: boolean;
  filters: MemberFilters;
  onClose: () => void;
  onApply: (newFilters: MemberFilters) => void;
  onReset: () => void;
}

export const MemberFilterSheet: React.FC<MemberFilterSheetProps> = ({
  visible,
  filters,
  onClose,
  onApply,
  onReset,
}) => {
  const [selectedRole, setSelectedRole] = React.useState<UserRole | 'ALL'>(
    filters.role || 'ALL',
  );
  const [selectedGender, setSelectedGender] = React.useState<Gender | 'ALL'>(
    filters.gender || 'ALL',
  );
  const [selectedAccess, setSelectedAccess] = React.useState<boolean | 'ALL'>(
    filters.hasAppAccess ?? 'ALL',
  );

  React.useEffect(() => {
    if (visible) {
      setSelectedRole(filters.role || 'ALL');
      setSelectedGender(filters.gender || 'ALL');
      setSelectedAccess(filters.hasAppAccess ?? 'ALL');
    }
  }, [visible, filters]);

  const handleApply = () => {
    onApply({
      role: selectedRole === 'ALL' ? undefined : selectedRole,
      gender: selectedGender === 'ALL' ? undefined : selectedGender,
      hasAppAccess: selectedAccess === 'ALL' ? undefined : selectedAccess,
    });
    onClose();
  };

  const handleReset = () => {
    setSelectedRole('ALL');
    setSelectedGender('ALL');
    setSelectedAccess('ALL');
    onReset();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>Filter Members</Text>
                <TouchableOpacity
                  onPress={onClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={20} weight="bold" color={colors.text} />
                </TouchableOpacity>
              </View>

              {/* Filter 1: Gender */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Gender</Text>
                <View style={styles.chipRow}>
                  {[
                    { label: 'All', value: 'ALL' },
                    { label: 'Male', value: 'MALE' },
                    { label: 'Female', value: 'FEMALE' },
                  ].map((item) => (
                    <TouchableOpacity
                      key={item.value}
                      style={[
                        styles.chip,
                        selectedGender === item.value && styles.chipActive,
                      ]}
                      onPress={() => setSelectedGender(item.value as any)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          selectedGender === item.value &&
                            styles.chipTextActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Filter 2: Role */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Role in Fellowship</Text>
                <View style={styles.chipRow}>
                  {[
                    { label: 'All Roles', value: 'ALL' },
                    { label: 'Member', value: 'MEMBER' },
                    { label: 'PC (Coordinator)', value: 'PC' },
                    { label: 'AP (Director)', value: 'AP' },
                  ].map((item) => (
                    <TouchableOpacity
                      key={item.value}
                      style={[
                        styles.chip,
                        selectedRole === item.value && styles.chipActive,
                      ]}
                      onPress={() => setSelectedRole(item.value as any)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          selectedRole === item.value && styles.chipTextActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Filter 3: App Access */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>
                  Mobile/Desktop App Access
                </Text>
                <View style={styles.chipRow}>
                  {[
                    { label: 'All', value: 'ALL' },
                    { label: 'Has Login', value: true },
                    { label: 'No Login', value: false },
                  ].map((item, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.chip,
                        selectedAccess === item.value && styles.chipActive,
                      ]}
                      onPress={() => setSelectedAccess(item.value as any)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          selectedAccess === item.value &&
                            styles.chipTextActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Actions Footer */}
              <View style={styles.footer}>
                <TouchableOpacity
                  style={styles.resetButton}
                  onPress={handleReset}
                >
                  <Text style={styles.resetButtonText}>Reset All</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.applyButton}
                  onPress={handleApply}
                >
                  <Check size={16} weight="bold" color="#FFFFFF" />
                  <Text style={styles.applyButtonText}>Apply Filters</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(30, 27, 25, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 36,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  section: {
    marginBottom: 18,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.inputBg,
    borderColor: colors.inputBorder,
    borderWidth: 1.2,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  resetButton: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    backgroundColor: colors.inputBg,
    borderColor: colors.inputBorder,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  applyButton: {
    flex: 2,
    height: 50,
    borderRadius: 14,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
