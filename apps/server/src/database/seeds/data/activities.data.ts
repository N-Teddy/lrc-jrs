import { ActivityStatus, ActivityType } from '@jrs/shared';

export interface SeedActivityData {
  title: string;
  activityType: ActivityType;
  startDate: Date;
  endDate: Date;
  townCode: string;
  hostTownCode: string;
  locationVenue: string;
  notes?: string;
  status: ActivityStatus;
}

const VENUES: Record<string, string[]> = {
  DLA: [
    'Foyer Paroissial Bonabéri, Douala',
    'Salle Polyvalente Akwa, Douala',
    'Complexe Sportif Bepanda, Douala',
    'Centre Chrétien Deido, Douala',
  ],
  YDE: [
    'Foyer des Jeunes Mvolyé, Yaoundé',
    'Centre Jean XXIII Mvan, Yaoundé',
    'Salle Polyvalente Biyem-Assi, Yaoundé',
    'Complexe Omnisports Ngoa-Ekélé, Yaoundé',
  ],
  BAF: [
    'Centre Pastoral Saint Joseph, Bafoussam',
    'Foyer Polyvalent Djeleng, Bafoussam',
    'Salle Paroissiale Banengo, Bafoussam',
    'Stade Municipal de Bafoussam',
  ],
  EDA: [
    'Paroisse Notre-Dame d’Edéa',
    'Foyer Polyvalent Sanaga, Edéa',
    'Centre des Jeunes d’Edéa',
    'Salle Paroissiale Saint-Jean, Edéa',
  ],
};

const ACTIVITY_TEMPLATES: {
  type: ActivityType;
  titleGenerator: (monthName: string, townName: string, year: number) => string;
  durationHours: number;
}[] = [
  {
    type: ActivityType.MONTHLY_MEETING,
    titleGenerator: (month, town) =>
      `Réunion Mensuelle des JR (${month} - ${town})`,
    durationHours: 3,
  },
  {
    type: ActivityType.RECREATIONAL,
    titleGenerator: (month, town) =>
      `Journée Sportive & Fraternité (${month} - ${town})`,
    durationHours: 5,
  },
  {
    type: ActivityType.SERVICE,
    titleGenerator: (month, town) =>
      `Action d'Évangélisation & Service Communautaire (${month} - ${town})`,
    durationHours: 4,
  },
  {
    type: ActivityType.CAUSERIE,
    titleGenerator: (month, town) =>
      `Causerie Éducative & Partage Biblique (${month} - ${town})`,
    durationHours: 2.5,
  },
  {
    type: ActivityType.CONFERENCE,
    titleGenerator: (_month, town, year) =>
      `Conférence Annuelle de la Jeunesse ${year} (${town})`,
    durationHours: 8,
  },
  {
    type: ActivityType.JPO,
    titleGenerator: (month, town) =>
      `Journée Portes Ouvertes JR (${month} - ${town})`,
    durationHours: 6,
  },
  {
    type: ActivityType.AG,
    titleGenerator: (_month, town, year) =>
      `Assemblée Générale (AG) ${year} (${town})`,
    durationHours: 5,
  },
];

const MONTH_NAMES = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

const TOWN_NAMES: Record<string, string> = {
  DLA: 'Douala',
  EDA: 'Edéa',
  YDE: 'Yaoundé',
  BAF: 'Bafoussam',
};

/**
 * Generates ~50 activities for a given year spread across all 12 months and 4 towns.
 */
function generateYearActivities(
  year: number,
  targetCount = 50,
): SeedActivityData[] {
  const activities: SeedActivityData[] = [];
  const townCodes = ['DLA', 'EDA', 'YDE', 'BAF'];

  // Spread roughly 4 to 5 activities per month
  let activityIndex = 0;

  for (let month = 0; month < 12; month++) {
    // 4 to 5 activities per month to total exactly targetCount
    const countThisMonth =
      month < targetCount % 12
        ? Math.floor(targetCount / 12) + 1
        : Math.floor(targetCount / 12);

    for (let j = 0; j < countThisMonth; j++) {
      activityIndex++;

      const townCode = townCodes[(activityIndex - 1) % townCodes.length];
      const townName = TOWN_NAMES[townCode];
      const monthName = MONTH_NAMES[month];

      const template =
        ACTIVITY_TEMPLATES[(activityIndex - 1) % ACTIVITY_TEMPLATES.length];
      const title = template.titleGenerator(monthName, townName, year);

      // Distribute days across the month: 5th, 12th, 19th, 26th...
      const day = Math.min(28, 4 + j * 6 + ((activityIndex * 2) % 3));
      const startHour = 14; // 14:00
      const startDate = new Date(Date.UTC(year, month, day, startHour, 0, 0));
      const endHour = startHour + Math.floor(template.durationHours);
      const endMinutes = (template.durationHours % 1) * 60;
      const endDate = new Date(
        Date.UTC(year, month, day, endHour, endMinutes, 0),
      );

      // Determine activity status based on date relative to current time (Oct 2026)
      let status: ActivityStatus;
      if (year < 2026) {
        status = ActivityStatus.COMPLETED;
      } else if (year === 2026) {
        if (month < 9) {
          // Jan - Sep 2026
          status = ActivityStatus.COMPLETED;
        } else if (month === 9) {
          // Oct 2026 (current month)
          status =
            j === 0 ? ActivityStatus.IN_PROGRESS : ActivityStatus.SCHEDULED;
        } else {
          // Nov - Dec 2026
          status = ActivityStatus.SCHEDULED;
        }
      } else {
        status = ActivityStatus.SCHEDULED;
      }

      // Pick a realistic venue for the town
      const venuesList = VENUES[townCode];
      const locationVenue = venuesList[(activityIndex - 1) % venuesList.length];

      activities.push({
        title,
        activityType: template.type,
        startDate,
        endDate,
        townCode,
        hostTownCode: townCode,
        locationVenue,
        notes: `Activité ${template.type} organisée par l'équipe JR de ${townName} pour ${monthName} ${year}.`,
        status,
      });
    }
  }

  return activities;
}

function generateAllActivities(): SeedActivityData[] {
  const activities2024 = generateYearActivities(2024, 50);
  const activities2025 = generateYearActivities(2025, 50);
  const activities2026 = generateYearActivities(2026, 50);

  return [...activities2024, ...activities2025, ...activities2026];
}

export const SEED_ACTIVITIES: SeedActivityData[] = generateAllActivities();
