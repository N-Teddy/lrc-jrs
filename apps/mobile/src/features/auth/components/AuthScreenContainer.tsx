import { ArrowLeft, WarningCircle } from 'phosphor-react-native';
import React from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  type StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  type ViewStyle,
} from 'react-native';
import { colors } from '../../../theme/colors';

export interface AuthErrorBannerProps {
  message?: string | null;
}

export const AuthErrorBanner: React.FC<AuthErrorBannerProps> = ({
  message,
}) => {
  if (!message) return null;
  return (
    <View style={styles.errorBox}>
      <WarningCircle
        size={20}
        weight="fill"
        color={colors.error}
        style={styles.errorIcon}
      />
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
};

export interface AuthScreenContainerProps {
  onBack?: () => void;
  backLabel?: string;
  scrollContentStyle?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

export const AuthScreenContainer: React.FC<AuthScreenContainerProps> = ({
  onBack,
  backLabel,
  scrollContentStyle,
  children,
}) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={[styles.scrollContent, scrollContentStyle]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {onBack && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={onBack}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <ArrowLeft size={22} weight="bold" color={colors.text} />
                {backLabel ? (
                  <Text style={styles.backButtonText}>{backLabel}</Text>
                ) : null}
              </TouchableOpacity>
            )}
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorLight,
    borderColor: 'rgba(186, 26, 26, 0.25)',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  errorIcon: {
    marginRight: 10,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.errorDark,
    lineHeight: 18,
  },
});
