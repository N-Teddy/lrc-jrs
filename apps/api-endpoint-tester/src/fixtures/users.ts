import dotenv from 'dotenv';

dotenv.config();

export const TEST_USERS = {
  ap: {
    identifier: process.env.TEST_AP_IDENTIFIER || 'ap.overseer@lrcjrs.org',
    password: process.env.TEST_AP_PASSWORD || 'AdminPassword123!',
    role: 'AP',
  },
  pc: {
    identifier: process.env.TEST_PC_IDENTIFIER || 'pc.douala1@lrcjrs.org',
    password: process.env.TEST_PC_PASSWORD || 'PcPassword123!',
    role: 'PC',
  },
  member: {
    identifier: process.env.TEST_MEMBER_IDENTIFIER || 'member.dla1@lrcjrs.org',
    password: process.env.TEST_MEMBER_PASSWORD || 'MemberPassword123!',
    role: 'MEMBER',
  },
} as const;
