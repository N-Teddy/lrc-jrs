import { useTranslation } from '@jrs/client-core';
import { CheckCircle, Circle } from 'phosphor-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../theme/colors';

interface PasswordRequirementsProps {
  password: string;
}

export const PasswordRequirements: React.FC<PasswordRequirementsProps> = ({
  password,
}) => {
  const { t } = useTranslation();

  const requirements = [
    {
      label: t('auth:rules.length') || 'At least 8 characters',
      valid: password.length >= 8,
    },
    {
      label: t('auth:rules.casing') || 'Contains uppercase & lowercase letters',
      valid: /[A-Z]/.test(password) && /[a-z]/.test(password),
    },
    {
      label:
        t('auth:rules.numberOrSpecial') ||
        'Contains at least one number and special character',
      valid: /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password),
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {t('auth:rules.passwordRequirements') || 'Password Requirements'}:
      </Text>
      {requirements.map((req, index) => (
        <View key={index} style={styles.item}>
          {req.valid ? (
            <CheckCircle
              size={16}
              weight="fill"
              color={colors.success}
              style={styles.icon}
            />
          ) : (
            <Circle
              size={16}
              weight="bold"
              color={colors.textMuted}
              style={styles.icon}
            />
          )}
          <Text
            style={[
              styles.label,
              req.valid ? styles.labelValid : styles.labelPending,
            ]}
          >
            {req.label}
          </Text>
        </View>
      ))}
    </View>
  );
};

export function isPasswordValid(password: string): boolean {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryBorder,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginTop: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
  },
  icon: {
    marginRight: 8,
  },
  label: {
    fontSize: 12,
  },
  labelValid: {
    color: colors.success,
    fontWeight: '600',
  },
  labelPending: {
    color: colors.textSecondary,
  },
});
