import { ArrowClockwise, Fingerprint, LockKey } from '@phosphor-icons/react';
import type React from 'react';

interface SessionTerminatedModalProps {
  isOpen: boolean;
  onAcknowledge: () => void;
}

export const SessionTerminatedModal: React.FC<SessionTerminatedModalProps> = ({
  isOpen,
  onAcknowledge,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1e1b19]/70 p-4 backdrop-blur-[3px] animate-fadeIn"
    >
      <div className="w-full max-w-md rounded-2xl border border-[#e8e1dd] bg-white p-7 sm:p-8 shadow-2xl text-center flex flex-col items-center gap-5">
        {/* Badge Icon */}
        <div className="w-16 h-16 rounded-2xl bg-[#ffdbcf] text-[#983912] flex items-center justify-center shadow-inner">
          <LockKey size={36} weight="fill" />
        </div>

        {/* Title & Explanation */}
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#b85028]">
            Session Expiry Guard
          </span>
          <h2 id="session-title" className="text-xl font-bold text-[#1e1b19]">
            Session Terminated for Security
          </h2>
        </div>

        <p className="text-xs sm:text-sm leading-relaxed text-[#57423b]">
          A security irregularity or session expiration was detected. To protect
          your personal information, all active sessions on this device have
          been signed out.
        </p>

        {/* Audit Tag */}
        <div className="w-full bg-[#faf2ee] rounded-xl px-4 py-2.5 flex items-center justify-center gap-2 text-xs text-[#8a726a] border border-[#e8e1dd]">
          <Fingerprint size={16} weight="bold" />
          <span>Security Event Logged • Session Refresh Required</span>
        </div>

        {/* Primary Action */}
        <button
          type="button"
          onClick={onAcknowledge}
          className="w-full py-3.5 px-6 rounded-xl bg-[#b85028] text-white text-sm font-semibold shadow-md hover:bg-[#983912] active:scale-[0.99] transition flex items-center justify-center gap-2 mt-1"
        >
          <ArrowClockwise size={18} weight="bold" />
          <span>Sign In Again</span>
        </button>
      </div>
    </div>
  );
};
