export interface IRegionConfig {
  iso: string;
  shapeName: string;
  displayNameEn: string;
  displayNameFr: string;
  townCode?: string;
  townName?: string;
  townCodes?: string[];
  coordinates: [number, number]; // [lng, lat]
}

export interface ITownMapConfig {
  code: string;
  name: string;
  regionIso: string;
  coordinates: [number, number]; // [lng, lat]
  labelOffset?: [number, number]; // [dx, dy]
}

export const CAMEROON_TOWNS_CONFIG: Record<string, ITownMapConfig> = {
  DLA: {
    code: 'DLA',
    name: 'Douala',
    regionIso: 'CM-LT',
    coordinates: [9.7043, 4.0511],
    labelOffset: [0, -14],
  },
  EDA: {
    code: 'EDA',
    name: 'Edéa',
    regionIso: 'CM-LT',
    coordinates: [10.1333, 3.8],
    labelOffset: [0, 18],
  },
  EDE: {
    code: 'EDA',
    name: 'Edéa',
    regionIso: 'CM-LT',
    coordinates: [10.1333, 3.8],
    labelOffset: [0, 18],
  },
  YDE: {
    code: 'YDE',
    name: 'Yaoundé',
    regionIso: 'CM-CE',
    coordinates: [11.5021, 3.848],
    labelOffset: [0, -14],
  },
  BAF: {
    code: 'BAF',
    name: 'Bafoussam',
    regionIso: 'CM-OU',
    coordinates: [10.4179, 5.4778],
    labelOffset: [0, -14],
  },
};

export const CAMEROON_REGIONS: Record<string, IRegionConfig> = {
  'CM-LT': {
    iso: 'CM-LT',
    shapeName: 'Littoral',
    displayNameEn: 'Littoral Region',
    displayNameFr: 'Région du Littoral',
    townCode: 'DLA',
    townName: 'Douala',
    townCodes: ['DLA', 'EDA'],
    coordinates: [9.7043, 4.0511],
  },
  'CM-CE': {
    iso: 'CM-CE',
    shapeName: 'Centre',
    displayNameEn: 'Centre Region',
    displayNameFr: 'Région du Centre',
    townCode: 'YDE',
    townName: 'Yaoundé',
    coordinates: [11.5021, 3.848],
  },
  'CM-OU': {
    iso: 'CM-OU',
    shapeName: 'West',
    displayNameEn: 'West Region',
    displayNameFr: 'Région de l’Ouest',
    townCode: 'BAF',
    townName: 'Bafoussam',
    coordinates: [10.4179, 5.4778],
  },
  'CM-NW': {
    iso: 'CM-NW',
    shapeName: 'North-West',
    displayNameEn: 'North-West Region',
    displayNameFr: 'Région du Nord-Ouest',
    coordinates: [10.1591, 5.9631],
  },
  'CM-SW': {
    iso: 'CM-SW',
    shapeName: 'South-West',
    displayNameEn: 'South-West Region',
    displayNameFr: 'Région du Sud-Ouest',
    coordinates: [9.2333, 4.155],
  },
  'CM-AD': {
    iso: 'CM-AD',
    shapeName: 'Adamaoua',
    displayNameEn: 'Adamaoua Region',
    displayNameFr: "Région de l'Adamaoua",
    coordinates: [13.5833, 7.3167],
  },
  'CM-NO': {
    iso: 'CM-NO',
    shapeName: 'North',
    displayNameEn: 'North Region',
    displayNameFr: 'Région du Nord',
    coordinates: [13.4, 9.3],
  },
  'CM-EN': {
    iso: 'CM-EN',
    shapeName: 'Far North',
    displayNameEn: 'Far North Region',
    displayNameFr: 'Région de l’Extrême-Nord',
    coordinates: [14.3167, 10.5833],
  },
  'CM-ES': {
    iso: 'CM-ES',
    shapeName: 'East',
    displayNameEn: 'East Region',
    displayNameFr: 'Région de l’Est',
    coordinates: [13.6833, 4.5833],
  },
  'CM-SU': {
    iso: 'CM-SU',
    shapeName: 'South',
    displayNameEn: 'South Region',
    displayNameFr: 'Région du Sud',
    coordinates: [11.15, 2.9],
  },
};
