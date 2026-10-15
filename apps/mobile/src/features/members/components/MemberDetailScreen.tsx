import { useMemberDetailQuery } from '@jrs/client-core';
import {
  ArrowLeft,
  CalendarBlank,
  EnvelopeSimple,
  Key,
  MapPin,
  PencilSimple,
  Phone,
  User,
  WhatsappLogo,
} from 'phosphor-react-native';
import React from 'react';
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../../../theme/colors';
import { MobileUserAvatar } from './MobileUserAvatar';

interface MemberDetailScreenProps {
  memberId: string;
  onBack: () => void;
  onEdit: () => void;
}

export const MemberDetailScreen: React.FC<MemberDetailScreenProps> = ({
  memberId,
  onBack,
  onEdit,
}) => {
  const { data: member, isLoading } = useMemberDetailQuery(memberId);

  if (isLoading || !member) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  const rawPhone = member.phoneNumber || '';
  const cleanDigits = rawPhone.replace(/[^0-9]/g, '');

  const handleCall = () => {
    if (rawPhone) {
      Linking.openURL(`tel:${rawPhone}`);
    }
  };

  const handleWhatsApp = () => {
    if (cleanDigits) {
      Linking.openURL(`https://wa.me/${cleanDigits}`);
    }
  };

  const handleEmail = () => {
    if (member.email) {
      Linking.openURL(`mailto:${member.email}`);
    }
  };

  // Calculate age from date of birth
  let age: number | null = null;
  if (member.dateOfBirth) {
    const dob = new Date(member.dateOfBirth);
    if (!Number.isNaN(dob.getTime())) {
      const diffMs = Date.now() - dob.getTime();
      const ageDt = new Date(diffMs);
      age = Math.abs(ageDt.getUTCFullYear() - 1970);
    }
  }

  const isRoleLeader = member.role === 'AP' || member.role === 'PC';

  return (
    <View style={styles.container}>
      {/* Top Navigation Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={onBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={22} weight="bold" color={colors.text} />
        </TouchableOpacity>

        <Text style={styles.topBarTitle}>Member Profile</Text>

        <TouchableOpacity
          style={styles.navButton}
          onPress={onEdit}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <PencilSimple size={20} weight="bold" color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Profile Card with Real Avatar */}
        <View style={styles.heroCard}>
          <MobileUserAvatar
            avatarUrl={member.avatarUrl}
            name={member.fullName}
            size="2xl"
            style={styles.heroAvatar}
          />

          <Text style={styles.heroName}>{member.fullName}</Text>

          <View style={styles.heroBadgesRow}>
            <View
              style={[
                styles.roleBadge,
                isRoleLeader ? styles.roleBadgeLeader : styles.roleBadgeMember,
              ]}
            >
              <Text
                style={[
                  styles.roleBadgeText,
                  isRoleLeader
                    ? styles.roleBadgeTextLeader
                    : styles.roleBadgeTextMember,
                ]}
              >
                {member.role || 'MEMBER'}
              </Text>
            </View>

            {member.homeTown && (
              <View style={styles.townBadge}>
                <MapPin size={12} weight="fill" color={colors.primary} />
                <Text style={styles.townBadgeText}>{member.homeTown.name}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Quick Action Touch Row */}
        <View style={styles.actionRow}>
          {/* WhatsApp ONLY shown if verified WhatsApp number! */}
          {member.isWhatsappVerified && Boolean(cleanDigits) && (
            <TouchableOpacity
              style={styles.actionButtonWhatsApp}
              onPress={handleWhatsApp}
              activeOpacity={0.8}
            >
              <WhatsappLogo size={20} weight="fill" color="#FFFFFF" />
              <Text style={styles.actionButtonTextWhatsApp}>WhatsApp</Text>
            </TouchableOpacity>
          )}

          {/* Call Button */}
          {Boolean(rawPhone) && (
            <TouchableOpacity
              style={styles.actionButtonCall}
              onPress={handleCall}
              activeOpacity={0.8}
            >
              <Phone size={18} weight="bold" color={colors.primary} />
              <Text style={styles.actionButtonTextCall}>Call</Text>
            </TouchableOpacity>
          )}

          {/* Email Button */}
          {Boolean(member.email) && (
            <TouchableOpacity
              style={styles.actionButtonEmail}
              onPress={handleEmail}
              activeOpacity={0.8}
            >
              <EnvelopeSimple
                size={18}
                weight="bold"
                color={colors.textSecondary}
              />
              <Text style={styles.actionButtonTextEmail}>Email</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Personal Details Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeaderTitle}>Personal Information</Text>

          {/* Phone */}
          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <Phone size={18} weight="bold" color={colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Phone Number</Text>
              <Text style={styles.infoValue}>{member.phoneNumber || '—'}</Text>
            </View>
            {member.isWhatsappVerified && (
              <View style={styles.verifiedChip}>
                <WhatsappLogo size={12} weight="fill" color="#25D366" />
                <Text style={styles.verifiedChipText}>WhatsApp</Text>
              </View>
            )}
          </View>

          {/* Email */}
          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <EnvelopeSimple size={18} weight="bold" color={colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email Address</Text>
              <Text style={styles.infoValue}>{member.email || 'None'}</Text>
            </View>
          </View>

          {/* Gender */}
          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <User size={18} weight="bold" color={colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Gender</Text>
              <Text style={styles.infoValue}>
                {member.gender === 'MALE'
                  ? 'Male'
                  : member.gender === 'FEMALE'
                    ? 'Female'
                    : 'Not specified'}
              </Text>
            </View>
          </View>

          {/* Date of Birth & Age */}
          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <CalendarBlank size={18} weight="bold" color={colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Date of Birth</Text>
              <Text style={styles.infoValue}>
                {member.dateOfBirth?.split('T')[0] || '—'}
                {age !== null ? ` (${age} years)` : ''}
              </Text>
            </View>
          </View>

          {/* Fellowship Hub */}
          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <MapPin size={18} weight="bold" color={colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Fellowship Town</Text>
              <Text style={styles.infoValue}>
                {member.homeTown?.name || 'Assigned Hub'}
              </Text>
            </View>
          </View>
        </View>

        {/* Account Access Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeaderTitle}>Account & Permissions</Text>

          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <Key size={18} weight="bold" color={colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>App Access Status</Text>
              <Text style={styles.infoValue}>
                {member.account?.hasAppAccess
                  ? 'Active Login'
                  : 'No Login Access'}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                member.account?.hasAppAccess
                  ? styles.statusBadgeActive
                  : styles.statusBadgeInactive,
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  member.account?.hasAppAccess
                    ? styles.statusBadgeTextActive
                    : styles.statusBadgeTextInactive,
                ]}
              >
                {member.account?.hasAppAccess ? 'Enabled' : 'Disabled'}
              </Text>
            </View>
          </View>
        </View>

        {/* Edit Button at bottom */}
        <TouchableOpacity
          style={styles.editButton}
          onPress={onEdit}
          activeOpacity={0.85}
        >
          <PencilSimple size={18} weight="bold" color="#FFFFFF" />
          <Text style={styles.editButtonText}>Edit Member Information</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
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
  navButton: {
    padding: 6,
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
  heroCard: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1.2,
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  heroAvatar: {
    marginBottom: 14,
  },
  heroName: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.4,
    marginBottom: 8,
    textAlign: 'center',
  },
  heroBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  roleBadgeMember: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryBorder,
  },
  roleBadgeLeader: {
    backgroundColor: '#EDE7F6',
    borderColor: '#D1C4E9',
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  roleBadgeTextMember: {
    color: colors.primary,
  },
  roleBadgeTextLeader: {
    color: '#512DA8',
  },
  townBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryBorder,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
  },
  townBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  actionButtonWhatsApp: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#25D366',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionButtonTextWhatsApp: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  actionButtonCall: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryBorder,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionButtonTextCall: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  actionButtonEmail: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionButtonTextEmail: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1.2,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.2,
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  infoIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  verifiedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    borderColor: '#C8E6C9',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  verifiedChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2E7D32',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusBadgeActive: {
    backgroundColor: colors.successLight,
  },
  statusBadgeInactive: {
    backgroundColor: '#F3F4F6',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusBadgeTextActive: {
    color: colors.success,
  },
  statusBadgeTextInactive: {
    color: colors.textMuted,
  },
  editButton: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
