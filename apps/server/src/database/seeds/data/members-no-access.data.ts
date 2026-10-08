import { UserRole } from '@jrs/shared';
import { AccountStatus } from '../../schemas';
import type { SeedUserData } from './users.data';

const FIRST_NAMES = [
  'Jean',
  'Paul',
  'Marie',
  'Claire',
  'David',
  'Esther',
  'Samuel',
  'Florence',
  'Cedric',
  'Daniel',
  'Grace',
  'Emmanuel',
  'Danielle',
  'Patrick',
  'Josiane',
  'Michel',
  'Christelle',
  'Alain',
  'Nadine',
  'Eric',
  'Sandrine',
  'Christian',
  'Valerie',
  'Boris',
  'Stephanie',
  'Yves',
  'Carine',
  'Roger',
  'Brenda',
  'Landry',
  'Vanessa',
  'Rodrigue',
  'Tatiana',
  'Brice',
  'Ornella',
  'Serge',
  'Estelle',
  'Frank',
  'Mireille',
  'Arnaud',
  'Chantal',
  'Gilles',
  'Aline',
  'Herve',
  'Laure',
  'Thierry',
  'Muriel',
  'Lionel',
  'Sonia',
  'Gael',
];

const LAST_NAMES = [
  'Kamga',
  'Fotso',
  'Tagne',
  'Mbarga',
  'Essomba',
  'Onana',
  'Nguema',
  'Abena',
  'Tchinda',
  'Kenmogne',
  'Nguefack',
  'Mballa',
  'Ndongo',
  'Bella',
  'Ngo',
  'Moukoko',
  'Song',
  'Wansi',
  'Djomo',
  'Kaptue',
  'Fomekong',
  'Simo',
  'Kouam',
  'Biya',
  'Ewane',
  'Nkono',
  'Massing',
  'Mbia',
  'Kana',
  'Fezeu',
  'Goupeyou',
  'Njoya',
  'Njitap',
  'Chedjou',
  'Nlend',
  'Mbah',
  'Fondop',
  'Tsafack',
  'Kengne',
  'Pokam',
  'Dongmo',
  'Zambo',
  'Atangana',
  'Belinga',
  'Manga',
  'Etoa',
  'Ntamack',
  'Ngom',
  'Bassong',
  'Talla',
];

/**
 * Generates 100 realistic standard JR members who do NOT have application access.
 * Ages between 18 and 30, distributed across Douala, Yaoundé, and Bafoussam.
 */
export function generateMembersWithoutAppAccess(): SeedUserData[] {
  const members: SeedUserData[] = [];
  const townCodes = ['DLA', 'YDE', 'BAF'];

  for (let i = 1; i <= 100; i++) {
    const firstName = FIRST_NAMES[(i - 1) % FIRST_NAMES.length];
    const lastName = LAST_NAMES[Math.floor((i - 1) / 2) % LAST_NAMES.length];
    const fullName = `${firstName} ${lastName}`;

    // Distribute across Douala (~34), Yaoundé (~33), Bafoussam (~33)
    const townCode = townCodes[(i - 1) % townCodes.length];

    // Age between 18 and 30 (Birth year between 1996 and 2007)
    const birthYear = 1996 + ((i * 3) % 11); // 1996 to 2006
    const birthMonth = String(((i * 7) % 12) + 1).padStart(2, '0');
    const birthDay = String(((i * 11) % 28) + 1).padStart(2, '0');
    const dateOfBirth = `${birthYear}-${birthMonth}-${birthDay}`;

    // Unique phone number (+237680000001 to +237680000100)
    const phoneSuffix = String(i).padStart(6, '0');
    const phoneNumber = `+23768${phoneSuffix}`;

    const emailSlug = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${i}`;
    const email = `${emailSlug}@members.lrcjrs.org`;

    members.push({
      fullName,
      phoneNumber,
      email,
      dateOfBirth,
      isJr: true,
      role: UserRole.MEMBER,
      isActivePC: false,
      homeTownCode: townCode,
      account: {
        status: AccountStatus.PENDING_ACTIVATION,
        hasAppAccess: false,
        isAccessRevoked: false,
        allowedReadTownCodes: [],
      },
    });
  }

  return members;
}

export const SEED_MEMBERS_NO_APP_ACCESS: SeedUserData[] =
  generateMembersWithoutAppAccess();
