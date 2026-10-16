import type { IUser } from '@jrs/shared';
import {
  CheckCircle,
  ClockCounterClockwise,
  Globe,
  LockKey,
  Prohibit,
} from '@phosphor-icons/react';
import type React from 'react';
import { useMemo } from 'react';
import { UserAvatar } from '../../../components';

interface SecurityAuditFeedViewProps {
  members: IUser[];
  onOpenManageAccess: (member: IUser) => void;
}

interface AuditEvent {
  id: string;
  member: IUser;
  type: 'INVITE_SENT' | 'PASSWORD_SET' | 'TEMP_PASSWORD' | 'SUSPENDED';
  timestamp: string;
  title: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  badgeBg: string;
}

// fallow-ignore-next-line unused-export
export const SecurityAuditFeedView: React.FC<SecurityAuditFeedViewProps> = ({
  members,
  onOpenManageAccess,
}) => {
  // Derive audit timeline from member account records
  const events: AuditEvent[] = useMemo(() => {
    const list: AuditEvent[] = [];

    for (const m of members) {
      if (m.account?.hasAppAccess) {
        if (m.account.isAccessRevoked) {
          list.push({
            id: `revoked-${m.id}`,
            member: m,
            type: 'SUSPENDED',
            timestamp: m.updatedAt || 'Recent',
            title: 'Portal Access Suspended',
            description: `Security access temporarily revoked for ${m.fullName}. Account cannot authenticate on mobile or desktop clients.`,
            icon: Prohibit,
            iconColor: 'text-[#ba1a1a]',
            badgeBg: 'bg-[#ffdad6] border-[#ffb4a8]',
          });
        } else if (m.isTemporaryPassword) {
          list.push({
            id: `temp-${m.id}`,
            member: m,
            type: 'TEMP_PASSWORD',
            timestamp: m.account.invitedAt || m.updatedAt || 'Recent',
            title: 'Temporary Password Issued',
            description: `Single-use temporary credentials dispatched for ${m.fullName}. Setup countdown active (valid for 48 hours).`,
            icon: LockKey,
            iconColor: 'text-[#b78103]',
            badgeBg: 'bg-[#fff8e1] border-[#ffe082]',
          });
        } else {
          list.push({
            id: `active-${m.id}`,
            member: m,
            type: 'PASSWORD_SET',
            timestamp: m.updatedAt || 'Recent',
            title: 'Permanent Password Configured',
            description: `${m.fullName} completed the first-time setup phase and initialized a permanent password. Account is active in good standing.`,
            icon: CheckCircle,
            iconColor: 'text-[#2c4e37]',
            badgeBg: 'bg-[#c2e9ca] border-[#a9d0b2]',
          });
        }

        if (
          m.account.allowedReadTownIds &&
          m.account.allowedReadTownIds.length > 0
        ) {
          list.push({
            id: `scope-${m.id}`,
            member: m,
            type: 'INVITE_SENT',
            timestamp: m.updatedAt || 'Recent',
            title: 'Cross-Town Read Scope Assigned',
            description: `${m.account.allowedReadTownIds.length} external parish hubs granted to ${m.fullName} for read-only roster auditing.`,
            icon: Globe,
            iconColor: 'text-[#b85028]',
            badgeBg: 'bg-[#fff2ee] border-[#ffdbcf]',
          });
        }
      }
    }

    return list;
  }, [members]);

  return (
    <div className="bg-white rounded-3xl border border-[#e8e1dd] p-6 shadow-xs flex flex-col gap-6">
      <div className="flex items-center justify-between pb-4 border-b border-[#e8e1dd]">
        <div>
          <h3 className="text-sm font-bold text-[#1e1b19] flex items-center gap-2">
            <ClockCounterClockwise size={18} className="text-[#b85028]" />
            <span>Security & Credential Activity Stream</span>
          </h3>
          <p className="text-xs text-[#8a726a] mt-0.5">
            Audit feed of portal onboarding, password lifecycle, and access
            status events
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#faf2ee] text-[#57423b] border border-[#e8e1dd]">
          {events.length} security entries
        </span>
      </div>

      {events.length === 0 ? (
        <div className="p-12 text-center text-xs text-[#8a726a]">
          No security or credential logs recorded for members in the active
          scope.
        </div>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#f4ece9]">
          {events.map((ev) => {
            const Icon = ev.icon;
            return (
              <div key={ev.id} className="relative flex items-start gap-4">
                <div
                  className={`w-7 h-7 rounded-xl border flex items-center justify-center shrink-0 z-10 ${ev.badgeBg} ${ev.iconColor}`}
                >
                  <Icon size={14} weight="bold" />
                </div>

                <div className="flex-1 bg-[#faf2ee] rounded-2xl p-4 border border-[#e8e1dd] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <UserAvatar
                      avatarUrl={ev.member.avatarUrl}
                      name={ev.member.fullName}
                      size="sm"
                    />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-[#1e1b19]">
                          {ev.title}
                        </span>
                        <span className="text-[11px] text-[#8a726a]">
                          • {ev.member.fullName} (
                          {ev.member.homeTown?.code ?? 'HUB'})
                        </span>
                      </div>
                      <p className="text-xs text-[#57423b] mt-0.5 leading-relaxed">
                        {ev.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <span className="text-[11px] font-mono text-[#8a726a]">
                      {ev.timestamp.includes('T')
                        ? new Date(ev.timestamp).toLocaleDateString()
                        : ev.timestamp}
                    </span>
                    <button
                      type="button"
                      onClick={() => onOpenManageAccess(ev.member)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-[#e8e1dd] text-[11px] font-bold text-[#57423b] hover:bg-[#f4ece9] cursor-pointer"
                    >
                      Manage
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
