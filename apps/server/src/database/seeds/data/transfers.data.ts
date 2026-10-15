export interface SeedTransferStep {
  fromTownCode: string;
  toTownCode: string;
  transferredAt: string;
  transferredBy: string;
  reason: string;
}

export interface SeedMemberTransferPlan {
  identifier: {
    phoneNumber?: string;
    email?: string;
  };
  memberName?: string;
  initialTownCode?: string;
  transfers: SeedTransferStep[];
}

/**
 * Key member users with application access receiving town transfers.
 * Strictly non-AP and non-PC members (role === UserRole.MEMBER, isActivePC === false).
 */
export const SEED_NAMED_MEMBER_TRANSFERS: SeedMemberTransferPlan[] = [
  // 1. Member Douala (Samuel Eto) - Multi-hop transfer: Douala -> Yaoundé -> Bafoussam
  {
    identifier: {
      phoneNumber: '+237674440001',
      email: 'member.dla1@lrcjrs.org',
    },
    memberName: 'Member Douala (Samuel Eto)',
    initialTownCode: 'DLA',
    transfers: [
      {
        fromTownCode: 'DLA',
        toTownCode: 'YDE',
        transferredAt: '2025-08-12T10:30:00.000Z',
        transferredBy: 'Animateur Principal LRC',
        reason:
          'Relocated to Yaoundé for higher academic studies at Université de Yaoundé I (Ngoa-Ekélé)',
      },
      {
        fromTownCode: 'YDE',
        toTownCode: 'BAF',
        transferredAt: '2026-01-20T14:15:00.000Z',
        transferredBy: 'PC Yaoundé 1 (Emmanuel Nguema)',
        reason:
          'Family relocation to Western region; coordinated fellowship handover to Bafoussam hub',
      },
    ],
  },

  // 2. Member Yaoundé (Florence Atangana) - Yaoundé -> Douala
  {
    identifier: {
      phoneNumber: '+237675550001',
      email: 'member.yde1@lrcjrs.org',
    },
    memberName: 'Member Yaoundé (Florence Atangana)',
    initialTownCode: 'YDE',
    transfers: [
      {
        fromTownCode: 'YDE',
        toTownCode: 'DLA',
        transferredAt: '2025-10-18T09:00:00.000Z',
        transferredBy: 'PC Yaoundé 2 (Grace Ndongo)',
        reason:
          'Professional banking internship appointment at Akwa commercial center, Douala',
      },
    ],
  },

  // 3. Member Bafoussam (Cedric Tagne) - Bafoussam -> Edéa
  {
    identifier: {
      phoneNumber: '+237676660001',
      email: 'member.baf1@lrcjrs.org',
    },
    memberName: 'Member Bafoussam (Cedric Tagne)',
    initialTownCode: 'BAF',
    transfers: [
      {
        fromTownCode: 'BAF',
        toTownCode: 'EDA',
        transferredAt: '2025-11-25T11:45:00.000Z',
        transferredBy: 'Animateur Principal LRC',
        reason:
          'Pastoral deployment and community fellowship support in the Edéa mission territory',
      },
    ],
  },
];

/**
 * Standard JR members without application access receiving town transfers.
 * Selected from SEED_MEMBERS_NO_APP_ACCESS (+237680000001 - +237680000100).
 * Strictly non-AP and non-PC members.
 */
export const SEED_UNNAMED_MEMBER_TRANSFERS: SeedMemberTransferPlan[] = [
  // Member 4: BAF -> DLA
  {
    identifier: { phoneNumber: '+23768000004' },
    initialTownCode: 'BAF',
    transfers: [
      {
        fromTownCode: 'BAF',
        toTownCode: 'DLA',
        transferredAt: '2025-09-05T08:30:00.000Z',
        transferredBy: 'PC Bafoussam 1 (David Kamga)',
        reason:
          'Relocation for vocational technical training in Douala Littoral zone',
      },
    ],
  },

  // Member 7: EDA -> YDE
  {
    identifier: { phoneNumber: '+23768000007' },
    initialTownCode: 'EDA',
    transfers: [
      {
        fromTownCode: 'EDA',
        toTownCode: 'YDE',
        transferredAt: '2025-09-22T14:45:00.000Z',
        transferredBy: 'PC Edéa 1 (Patrice Manga)',
        reason:
          'Admitted to École Normale Supérieure (ENS) Yaoundé for teacher education program',
      },
    ],
  },

  // Member 15: EDA -> BAF
  {
    identifier: { phoneNumber: '+23768000015' },
    initialTownCode: 'EDA',
    transfers: [
      {
        fromTownCode: 'EDA',
        toTownCode: 'BAF',
        transferredAt: '2025-10-12T10:20:00.000Z',
        transferredBy: 'Animateur Principal LRC',
        reason:
          'Pastoral family reunification in the Western highlands of Bafoussam',
      },
    ],
  },

  // Member 23: EDA -> DLA
  {
    identifier: { phoneNumber: '+23768000023' },
    initialTownCode: 'EDA',
    transfers: [
      {
        fromTownCode: 'EDA',
        toTownCode: 'DLA',
        transferredAt: '2025-11-04T16:00:00.000Z',
        transferredBy: 'PC Edéa 2 (Chantal Ebongue)',
        reason:
          'Employment relocation to Douala Bonabéri industrial manufacturing sector',
      },
    ],
  },

  // Member 31: EDA -> YDE
  {
    identifier: { phoneNumber: '+23768000031' },
    initialTownCode: 'EDA',
    transfers: [
      {
        fromTownCode: 'EDA',
        toTownCode: 'YDE',
        transferredAt: '2025-11-28T09:15:00.000Z',
        transferredBy: 'Animateur Principal LRC',
        reason:
          'Undergraduate university matriculation at Université de Yaoundé II (Soa)',
      },
    ],
  },

  // Member 44: DLA -> BAF
  {
    identifier: { phoneNumber: '+23768000044' },
    initialTownCode: 'DLA',
    transfers: [
      {
        fromTownCode: 'DLA',
        toTownCode: 'BAF',
        transferredAt: '2025-12-14T11:30:00.000Z',
        transferredBy: 'PC Douala 1 (Jean Dupont)',
        reason:
          'Agricultural entrepreneurship and agribusiness fellowship deployment in Western Region',
      },
    ],
  },

  // Member 52: DLA -> EDA
  {
    identifier: { phoneNumber: '+23768000052' },
    initialTownCode: 'DLA',
    transfers: [
      {
        fromTownCode: 'DLA',
        toTownCode: 'EDA',
        transferredAt: '2026-01-09T13:45:00.000Z',
        transferredBy: 'PC Douala 2 (Marie Claire)',
        reason:
          'Engineering contract with ENEO hydroelectric facility in the Sanaga-Maritime district',
      },
    ],
  },

  // Member 60: DLA -> YDE -> BAF (Multi-hop)
  {
    identifier: { phoneNumber: '+23768000060' },
    initialTownCode: 'DLA',
    transfers: [
      {
        fromTownCode: 'DLA',
        toTownCode: 'YDE',
        transferredAt: '2025-08-20T10:00:00.000Z',
        transferredBy: 'Animateur Principal LRC',
        reason:
          'Medical residency clinical rotation at Yaoundé Central Hospital',
      },
      {
        fromTownCode: 'YDE',
        toTownCode: 'BAF',
        transferredAt: '2026-02-04T15:20:00.000Z',
        transferredBy: 'PC Yaoundé 1 (Emmanuel Nguema)',
        reason:
          'Rotational healthcare outreach placement in Bafoussam regional medical center',
      },
    ],
  },

  // Member 75: EDA -> DLA
  {
    identifier: { phoneNumber: '+23768000075' },
    initialTownCode: 'EDA',
    transfers: [
      {
        fromTownCode: 'EDA',
        toTownCode: 'DLA',
        transferredAt: '2026-01-22T08:50:00.000Z',
        transferredBy: 'PC Edéa 1 (Patrice Manga)',
        reason:
          'Maritime commerce and shipping logistics employment at Port Autonome de Douala',
      },
    ],
  },

  // Member 88: DLA -> YDE
  {
    identifier: { phoneNumber: '+23768000088' },
    initialTownCode: 'DLA',
    transfers: [
      {
        fromTownCode: 'DLA',
        toTownCode: 'YDE',
        transferredAt: '2026-02-18T12:10:00.000Z',
        transferredBy: 'Animateur Principal LRC',
        reason:
          'Government civil service administrative appointment in the capital territory',
      },
    ],
  },
];

/**
 * Realistic pastoral reasons and initiators for dynamic transfers fallback.
 */
export const SAMPLE_TRANSFER_REASONS = [
  'Relocated for higher academic studies and university coursework',
  'Professional employment transfer in the regional economic hub',
  'Pastoral recommendation following family residence relocation',
  'Transitioned to regional fellowship due to vocational internship',
  'Approved deanery reassignment and fellowship community integration',
  'Medical residency and health services regional rotation',
  'Youth fellowship leadership assistance and mission territory support',
];

export const SAMPLE_TRANSFER_INITIATORS = [
  'Animateur Principal LRC',
  'PC Douala 1 (Jean Dupont)',
  'PC Douala 2 (Marie Claire)',
  'PC Yaoundé 1 (Emmanuel Nguema)',
  'PC Yaoundé 2 (Grace Ndongo)',
  'PC Bafoussam 1 (David Kamga)',
  'PC Edéa 1 (Patrice Manga)',
];
