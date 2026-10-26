import { useTranslation } from '@jrs/client-core';
import type { IAuthUser, ITown } from '@jrs/shared';
import { ArrowRight, Globe, MapPin, SignOut } from 'phosphor-react-native';
import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../../theme/colors';
import { useTownSelector } from '../hooks/use-town-selector';
import { CameroonSvgMap } from './CameroonSvgMap';

interface TownSelectorScreenProps {
  user: IAuthUser;
  onTownSelected: (town: ITown) => void;
}

export const TownSelectorScreen: React.FC<TownSelectorScreenProps> = ({
  user,
  onTownSelected,
}) => {
  const { i18n } = useTranslation();
  const isFrench = i18n.language?.startsWith('fr');

  const {
    signOut,
    availableTowns,
    selectedTown,
    isEntering,
    handleSelectTown,
    handleConfirmAndEnter,
  } = useTownSelector({ user, onTownSelected });

  const toggleLanguage = () => {
    const nextLang = isFrench ? 'en' : 'fr';
    i18n.changeLanguage(nextLang);
  };

  const handleTownPress = (town: ITown) => {
    if (selectedTown?.id === town.id) {
      // Direct click on selected town enters immediately
      handleConfirmAndEnter(town);
    } else {
      handleSelectTown(town);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8F5" />

      {/* Minimal Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user.fullName
                ?.split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase() || 'U'}
            </Text>
          </View>
          <View>
            <Text style={styles.userName} numberOfLines={1}>
              {user.fullName}
            </Text>
            <Text style={styles.roleText}>{user.role}</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={toggleLanguage}
            activeOpacity={0.7}
          >
            <Globe size={16} color={colors.textSecondary} weight="bold" />
            <Text style={styles.headerBtnText}>{isFrench ? 'FR' : 'EN'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.headerBtn, styles.signOutBtn]}
            onPress={() => signOut()}
            activeOpacity={0.7}
          >
            <SignOut size={16} color={colors.error} weight="bold" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Screen Title */}
      <View style={styles.titleSection}>
        <Text style={styles.screenTitle}>
          {isFrench ? 'Choisir votre ville' : 'Select your town'}
        </Text>
        <Text style={styles.screenSubtitle}>
          {isFrench
            ? 'Touchez une ville sur la carte pour entrer'
            : 'Tap a regional hub on the map to enter'}
        </Text>
      </View>

      {/* Quick Town Pills */}
      <View style={styles.pillsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsScroll}
        >
          {availableTowns.map((town) => {
            const isSelected = selectedTown?.id === town.id;
            return (
              <TouchableOpacity
                key={town.id}
                style={[styles.pill, isSelected && styles.pillActive]}
                onPress={() => handleTownPress(town)}
                activeOpacity={0.8}
              >
                <MapPin
                  size={14}
                  weight={isSelected ? 'fill' : 'bold'}
                  color={isSelected ? '#FFFFFF' : colors.primary}
                />
                <Text
                  style={[styles.pillText, isSelected && styles.pillTextActive]}
                >
                  {town.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Map View */}
      <View style={styles.mapContainer}>
        <CameroonSvgMap
          availableTowns={availableTowns}
          selectedTown={selectedTown}
          onSelectTown={handleTownPress}
        />
      </View>

      {/* Minimal Bottom Action Dock */}
      <View style={styles.bottomDock}>
        <TouchableOpacity
          style={[
            styles.enterButton,
            !selectedTown && styles.enterButtonDisabled,
          ]}
          onPress={() => handleConfirmAndEnter()}
          disabled={!selectedTown || isEntering}
          activeOpacity={0.85}
        >
          {isEntering ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Text style={styles.enterButtonText}>
                {selectedTown
                  ? `${isFrench ? 'Entrer à' : 'Enter'} ${selectedTown.name}`
                  : isFrench
                    ? 'Sélectionnez une ville'
                    : 'Select a town'}
              </Text>
              <ArrowRight size={18} color="#FFFFFF" weight="bold" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  userName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    maxWidth: 160,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  headerBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.text,
  },
  signOutBtn: {
    borderColor: 'rgba(186, 26, 26, 0.2)',
    backgroundColor: '#FFF5F4',
  },
  titleSection: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 6,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -0.4,
  },
  screenSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  pillsWrapper: {
    paddingVertical: 8,
  },
  pillsScroll: {
    paddingHorizontal: 18,
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  pillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryPressed,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  mapContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  bottomDock: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 8,
  },
  enterButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  enterButtonDisabled: {
    opacity: 0.5,
  },
  enterButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
