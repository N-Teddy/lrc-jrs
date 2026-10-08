export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  towns: {
    all: ['towns'] as const,
    detail: (id: string) => ['towns', id] as const,
  },
  users: {
    all: ['users'] as const,
    list: (query?: unknown) => ['users', 'list', query] as const,
    stats: (townId?: string) => ['users', 'stats', townId] as const,
    byTown: (townId: string) => ['users', 'byTown', townId] as const,
    detail: (id: string) => ['users', id] as const,
  },
  activities: {
    all: ['activities'] as const,
    byTown: (townId?: string) => ['activities', { townId }] as const,
    detail: (id: string) => ['activities', id] as const,
  },
  attendance: {
    byActivity: (activityId: string) =>
      ['attendance', 'activity', activityId] as const,
  },
};
