import {
  ChatCircleText,
  EnvelopeSimple,
  ShieldWarning,
  SignOut,
} from '@phosphor-icons/react';
import type React from 'react';

interface AccountRevokedModalProps {
  isOpen: boolean;
  onAcknowledge: () => void;
}

export const AccountRevokedModal: React.FC<AccountRevokedModalProps> = ({
  isOpen,
  onAcknowledge,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="revoked-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1e1b19]/70 p-4 backdrop-blur-[3px] animate-fadeIn"
    >
      <div className="w-full max-w-md rounded-2xl border border-[#e8e1dd] bg-white p-7 sm:p-8 shadow-2xl text-center flex flex-col items-center gap-5">
        {/* Badge Icon */}
        <div className="w-16 h-16 rounded-2xl bg-[#ffdad4] text-[#9f2f23] flex items-center justify-center shadow-inner">
          <ShieldWarning size={36} weight="fill" />
        </div>

        {/* Title & Explanation */}
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#ba1a1a]">
            Security Alert • 403 Forbidden
          </span>
          <h2 id="revoked-title" className="text-xl font-bold text-[#1e1b19]">
            Account Access Suspended
          </h2>
        </div>

        <p className="text-xs sm:text-sm leading-relaxed text-[#57423b]">
          Your account access has been revoked or suspended by a community
          administrator. You have been safely logged out. Please reach out to
          your local coordinator or fellowship leader to resolve this.
        </p>

        {/* Contact details card */}
        <div className="w-full bg-[#faf2ee] rounded-xl p-4 text-left flex flex-col gap-2.5 border border-[#e8e1dd]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a726a]">
            Community Youth Desk
          </span>
          <div className="flex items-center gap-2.5 text-xs font-medium text-[#1e1b19]">
            <EnvelopeSimple
              size={18}
              weight="bold"
              className="text-[#983912]"
            />
            <a href="mailto:support@lrc-jrs.org" className="hover:underline">
              support@lrc-jrs.org
            </a>
          </div>
          <div className="flex items-center gap-2.5 text-xs font-medium text-[#1e1b19]">
            <ChatCircleText
              size={18}
              weight="bold"
              className="text-[#43664d]"
            />
            <span>WhatsApp: +237 690-00-11-22</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={onAcknowledge}
          className="w-full py-3.5 px-6 rounded-xl bg-[#b85028] text-white text-sm font-semibold shadow-md hover:bg-[#983912] active:scale-[0.99] transition flex items-center justify-center gap-2 mt-1"
        >
          <SignOut size={18} weight="bold" />
          <span>Return to Sign In</span>
        </button>
      </div>
    </div>
  );
};
