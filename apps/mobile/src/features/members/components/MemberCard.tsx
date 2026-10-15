import type { IUser } from '@jrs/shared';
import { CaretRight, Phone, WhatsappLogo } from 'phosphor-react-native';
import React from 'react';
import {
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../../../theme/colors';
import { MobileUserAvatar } from './MobileUserAvatar';

interface MemberCardProps {
  member: IUser;
  onPress: () => void;
}

export const MemberCard: React.FC<MemberCardProps> = ({ member, onPress }) => {
  // Clean phone number for tel: link and whatsapp link
  const rawPhone = member.phoneNumber || '';
  const cleanDigits = rawPhone.replace(/[^0-9]/g, '');

  const handleCall = () => {
    if (rawPhone) {
      Linking.openURL(`tel:${rawPhone}`);
    }
  };

  const handleWhatsApp = () => {
    if (cleanDigits) {
      // Direct WhatsApp API deep link
      Linking.openURL(`https://wa.me/${cleanDigits}`);
    }
  };

  const isRoleLeader = member.role === 'AP' || member.role === 'PC';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {/* Top Profile Summary */}
      <View style={styles.cardHeader}>
        <MobileUserAvatar
          avatarUrl={member.avatarUrl}
          name={member.fullName}
          size="md"
        />

        <View style={styles.headerInfo}>
          <Text style={styles.name} numberOfLines={1}>
            {member.fullName}
          </Text>

          <View style={styles.badgesRow}>
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
                <Text style={styles.townBadgeText}>
                  {member.homeTown.code || member.homeTown.name}
                </Text>
              </View>
            )}

            {member.gender && (
              <View style={styles.genderBadge}>
                <Text style={styles.genderBadgeText}>
                  {member.gender === 'MALE' ? 'Male' : 'Female'}
                </Text>
              </View>
            )}
          </View>
        </View>

        <CaretRight size={18} weight="bold" color={colors.textMuted} />
      </View>

      {/* Phone Number row */}
      {Boolean(rawPhone) && (
        <View style={styles.phoneRow}>
          <Phone size={14} weight="bold" color={colors.textMuted} />
          <Text style={styles.phoneText}>{rawPhone}</Text>
        </View>
      )}

      {/* Action Buttons Row */}
      <View style={styles.actionRow}>
        {/* WhatsApp Button ONLY rendered if number is verified WhatsApp! */}
        {member.isWhatsappVerified && Boolean(cleanDigits) && (
          <TouchableOpacity
            style={styles.whatsappButton}
            onPress={handleWhatsApp}
            activeOpacity={0.8}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <WhatsappLogo size={16} weight="fill" color="#FFFFFF" />
            <Text style={styles.whatsappButtonText}>WhatsApp</Text>
          </TouchableOpacity>
        )}

        {/* Direct Call Button */}
        {Boolean(rawPhone) && (
          <TouchableOpacity
            style={styles.callButton}
            onPress={handleCall}
            activeOpacity={0.8}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Phone size={14} weight="bold" color={colors.primary} />
            <Text style={styles.callButtonText}>Call</Text>
          </TouchableOpacity>
        )}

        {/* View Details Link */}
        <View style={styles.detailsButton}>
          <Text style={styles.detailsButtonText}>Details</Text>
          <CaretRight size={12} weight="bold" color={colors.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1.2,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
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
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  roleBadgeTextMember: {
    color: colors.primary,
  },
  roleBadgeTextLeader: {
    color: '#512DA8',
  },
  townBadge: {
    backgroundColor: '#F5ECE6',
    borderColor: '#E8DCD4',
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  townBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  genderBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  genderBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  phoneText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    gap: 8,
  },
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#25D366',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  whatsappButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryBorder,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  callButtonText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  detailsButton: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  detailsButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
});
