import { ActivityStatus, ActivityType, type IActivity } from '@jrs/shared';
import {
  CalendarBlank,
  ChatCircleText,
  Clock,
  Confetti,
  GraduationCap,
  HandHeart,
  type Icon,
  Megaphone,
} from '@phosphor-icons/react';

export interface ActivityTypeConfig {
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  icon: Icon;
}

export interface ActivityStatusConfig {
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dotColor: string;
  isPulse?: boolean;
}

export function getActivityTypeConfig(
  type: ActivityType,
  t?: (key: string, options?: any) => string,
): ActivityTypeConfig {
  switch (type) {
    case ActivityType.MONTHLY_MEETING:
      return {
        label: t ? t('activities:types.MONTHLY_MEETING') : 'Monthly Meeting',
        badgeBg: 'bg-[#ffdbcf]/50',
        badgeText: 'text-[#812901]',
        badgeBorder: 'border-[#ffb59c]/50',
        icon: CalendarBlank,
      };
    case ActivityType.SERVICE:
      return {
        label: t ? t('activities:types.SERVICE') : 'Service',
        badgeBg: 'bg-[#edf3ee]',
        badgeText: 'text-[#486b52]',
        badgeBorder: 'border-[#c2e9ca]',
        icon: HandHeart,
      };
    case ActivityType.CONFERENCE:
      return {
        label: t ? t('activities:types.CONFERENCE') : 'Conference',
        badgeBg: 'bg-[#faf2ee]',
        badgeText: 'text-[#b85028]',
        badgeBorder: 'border-[#e8e1dd]',
        icon: GraduationCap,
      };
    case ActivityType.RECREATIONAL:
      return {
        label: t ? t('activities:types.RECREATIONAL') : 'Recreational',
        badgeBg: 'bg-[#f4ece9]',
        badgeText: 'text-[#57423b]',
        badgeBorder: 'border-[#e8e1dd]',
        icon: Confetti,
      };
    case ActivityType.CAUSERIE:
      return {
        label: t ? t('activities:types.CAUSERIE') : 'Causerie',
        badgeBg: 'bg-[#ffdad4]/40',
        badgeText: 'text-[#9f2f23]',
        badgeBorder: 'border-[#ffb4a8]/50',
        icon: ChatCircleText,
      };
    case ActivityType.JPO:
      return {
        label: t ? t('activities:types.JPO') : 'JPO (Portes Ouvertes)',
        badgeBg: 'bg-[#faf2ee]',
        badgeText: 'text-[#1e1b19]',
        badgeBorder: 'border-[#e8e1dd]',
        icon: Megaphone,
      };
    default:
      return {
        label: type,
        badgeBg: 'bg-[#faf2ee]',
        badgeText: 'text-[#57423b]',
        badgeBorder: 'border-[#e8e1dd]',
        icon: Clock,
      };
  }
}

export function getActivityStatusConfig(
  status: ActivityStatus,
  t?: (key: string, options?: any) => string,
): ActivityStatusConfig {
  switch (status) {
    case ActivityStatus.SCHEDULED:
      return {
        label: t ? t('activities:statuses.SCHEDULED') : 'Scheduled',
        badgeBg: 'bg-[#faf2ee]',
        badgeText: 'text-[#b85028]',
        badgeBorder: 'border-[#ffdbcf]',
        dotColor: 'bg-[#b85028]',
      };
    case ActivityStatus.IN_PROGRESS:
      return {
        label: t ? t('activities:statuses.IN_PROGRESS') : 'In Progress / Live',
        badgeBg: 'bg-[#edf3ee]',
        badgeText: 'text-[#486b52]',
        badgeBorder: 'border-[#c2e9ca]',
        dotColor: 'bg-[#486b52]',
        isPulse: true,
      };
    case ActivityStatus.COMPLETED:
      return {
        label: t ? t('activities:statuses.COMPLETED') : 'Completed',
        badgeBg: 'bg-[#edf3ee]',
        badgeText: 'text-[#486b52]',
        badgeBorder: 'border-[#c2e9ca]',
        dotColor: 'bg-[#486b52]',
      };
    case ActivityStatus.CANCELLED:
      return {
        label: t ? t('activities:statuses.CANCELLED') : 'Cancelled',
        badgeBg: 'bg-[#ffdad6]/50',
        badgeText: 'text-[#ba1a1a]',
        badgeBorder: 'border-[#ffb4a8]',
        dotColor: 'bg-[#ba1a1a]',
      };
    default:
      return {
        label: status,
        badgeBg: 'bg-[#faf2ee]',
        badgeText: 'text-[#57423b]',
        badgeBorder: 'border-[#e8e1dd]',
        dotColor: 'bg-[#8a726a]',
      };
  }
}

export function formatActivityDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function formatActivityTime(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return '';
  }
}

export function formatActivityDateRange(
  startDateStr: string,
  endDateStr?: string,
): { dateRange: string; timeRange: string; isMultiDay: boolean } {
  try {
    const start = new Date(startDateStr);
    const startValid = !Number.isNaN(start.getTime());

    if (!startValid) {
      return {
        dateRange: startDateStr,
        timeRange: '',
        isMultiDay: false,
      };
    }

    const startTime = formatActivityTime(startDateStr);

    if (!endDateStr) {
      return {
        dateRange: formatActivityDate(startDateStr),
        timeRange: startTime,
        isMultiDay: false,
      };
    }

    const end = new Date(endDateStr);
    const endValid = !Number.isNaN(end.getTime());

    if (!endValid) {
      return {
        dateRange: formatActivityDate(startDateStr),
        timeRange: startTime,
        isMultiDay: false,
      };
    }

    const isSameDay =
      start.getFullYear() === end.getFullYear() &&
      start.getMonth() === end.getMonth() &&
      start.getDate() === end.getDate();

    const endTime = formatActivityTime(endDateStr);

    if (isSameDay) {
      return {
        dateRange: formatActivityDate(startDateStr),
        timeRange: endTime ? `${startTime} – ${endTime}` : startTime,
        isMultiDay: false,
      };
    }

    // Multi-day
    const startDayMonth = start.toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'short',
    });
    const endFormatted = formatActivityDate(endDateStr);

    return {
      dateRange: `${startDayMonth} – ${endFormatted}`,
      timeRange: `${startTime} – ${endTime}`,
      isMultiDay: true,
    };
  } catch {
    return {
      dateRange: startDateStr,
      timeRange: '',
      isMultiDay: false,
    };
  }
}

export function isActivityStarted(startDateStr: string): boolean {
  try {
    const start = new Date(startDateStr);
    if (Number.isNaN(start.getTime())) return true;
    return new Date() >= start;
  } catch {
    return true;
  }
}

export function getTimeUntilStart(startDateStr: string): string {
  try {
    const start = new Date(startDateStr);
    const now = new Date();
    const diffMs = start.getTime() - now.getTime();

    if (diffMs <= 0) return 'Started';

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 1) return `Starts in ${diffDays} days`;
    if (diffDays === 1) return 'Starts tomorrow';
    if (diffHours >= 1)
      return `Starts in ${diffHours} hour${diffHours > 1 ? 's' : ''}`;

    const diffMinutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));
    return `Starts in ${diffMinutes} min`;
  } catch {
    return '';
  }
}

export function getActivityTurnoutStats(activity: IActivity) {
  const members = activity.attendanceCount?.members ?? 0;
  const guests = activity.attendanceCount?.guests ?? 0;
  const total = activity.attendanceCount?.total ?? members + guests;

  return {
    members,
    guests,
    total,
    turnoutLabel: `${total} attendee${total === 1 ? '' : 's'}`,
    breakdownLabel: `${members} Mbr${members === 1 ? '' : 's'} + ${guests} Gst`,
  };
}
