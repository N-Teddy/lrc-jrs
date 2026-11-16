import type { IAuthUser } from '@jrs/shared';
import {
  FileArrowUp,
  LockSimple,
  Plus,
  QrCode,
  ShieldCheck,
  UserPlus,
  WhatsappLogo,
} from '@phosphor-icons/react';
import type React from 'react';

interface ParishPassCardProps {
  user: IAuthUser;
  activeTownName?: string;
  activeTownCode?: string;
  totalMembers?: number;
  onOpenAttendance?: () => void;
  onOpenRegisterMember?: () => void;
  onOpenLockRegister?: () => void;
  onOpenDrive?: () => void;
  onOpenBroadcastModal?: () => void;
}

export const ParishPassCard: React.FC<ParishPassCardProps> = ({
  user,
  activeTownName = 'Douala',
  activeTownCode = 'DLA',
  totalMembers = 31,
  onOpenAttendance,
  onOpenRegisterMember,
  onOpenLockRegister,
  onOpenDrive,
  onOpenBroadcastModal,
}) => {
  const memberCode = `JR-${activeTownCode}-2026-${String(totalMembers).padStart(4, '0')}`;
  const userName = (user?.fullName || 'ANIMATEUR COORD').toUpperCase();
  const roleTitle =
    user?.role === 'AP'
      ? 'ANIMATEUR PRINCIPAL'
      : user?.role === 'PC'
        ? 'PRÉSIDENT DE CENTRE'
        : 'MEMBRE RELAIS';

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 flex flex-col gap-4">
      {/* Card Header with '+ Carte' action */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">
            Pass Digital Paroissial
          </h3>
          <p className="text-[11px] text-slate-400 font-medium">
            Accréditation & Actions rapides
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenRegisterMember}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors cursor-pointer border border-emerald-100/60"
        >
          <Plus size={12} weight="bold" />
          <span>Inscrire</span>
        </button>
      </div>

      {/* The Modern Digital Card (Matching the green card mockup in Reference) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#74c343] via-[#65b236] to-[#4c9225] p-5 text-white shadow-md shadow-emerald-500/15 flex flex-col justify-between min-h-[175px] transition-transform hover:scale-[1.01]">
        {/* Subtle Decorative Background Shapes */}
        <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-white/10 blur-xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-32 h-32 rounded-full bg-black/10 blur-lg pointer-events-none" />
        <div className="absolute right-4 bottom-2 text-white/15 pointer-events-none select-none font-black text-6xl tracking-tighter">
          JRS
        </div>

        {/* Card Top Row */}
        <div className="flex items-start justify-between relative z-10">
          <div className="flex flex-col">
            <span className="text-[10px] font-extrabold tracking-widest text-emerald-100 uppercase">
              LRC JRS • CARTE PASTORALE
            </span>
            <span className="text-xs font-black tracking-tight text-white flex items-center gap-1 mt-0.5">
              <ShieldCheck
                size={14}
                weight="fill"
                className="text-emerald-200"
              />
              <span>PÔLE {activeTownName.toUpperCase()}</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-xs text-[10px] font-black uppercase tracking-wider text-white border border-white/20">
            <span>2026</span>
          </div>
        </div>

        {/* Card Middle: EMV Chip Mockup & Masked Code */}
        <div className="my-2 relative z-10 flex items-center gap-3">
          {/* Metallic Chip */}
          <div className="w-8 h-6 rounded-md bg-gradient-to-tr from-amber-200 via-amber-100 to-amber-300 border border-amber-400/40 shadow-2xs flex items-center justify-center">
            <div className="w-4 h-3 border border-amber-500/30 rounded-xs" />
          </div>

          {/* Masked Identification Number */}
          <span className="font-mono text-sm tracking-wider font-bold text-white drop-shadow-xs">
            •••• •••• {memberCode.slice(-4)}
          </span>
        </div>

        {/* Card Bottom: Holder Name & Role */}
        <div className="flex items-end justify-between relative z-10">
          <div className="flex flex-col min-w-0 pr-2">
            <span className="text-[10px] font-semibold text-emerald-100 uppercase tracking-wider">
              {roleTitle}
            </span>
            <span className="text-xs font-black text-white truncate max-w-[180px]">
              {userName}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[9px] font-bold text-emerald-100 uppercase block">
              STATUT
            </span>
            <span className="text-[11px] font-extrabold text-white">ACTIF</span>
          </div>
        </div>
      </div>

      {/* Quick Action Buttons Row (Inspired by Top up / Send / Request / History / More) */}
      <div className="grid grid-cols-5 gap-2 pt-1">
        {/* 1. Présence QR */}
        <button
          type="button"
          onClick={onOpenAttendance}
          className="flex flex-col items-center gap-1.5 group cursor-pointer"
          title="Consulter et saisir les présences"
        >
          <div className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700 group-hover:bg-emerald-50 group-hover:border-emerald-200 group-hover:text-emerald-700 transition-all shadow-2xs">
            <QrCode size={19} weight="duotone" />
          </div>
          <span className="text-[10px] font-bold text-slate-600 group-hover:text-slate-900 transition-colors">
            Présence
          </span>
        </button>

        {/* 2. Sceller */}
        <button
          type="button"
          onClick={onOpenLockRegister}
          className="flex flex-col items-center gap-1.5 group cursor-pointer"
          title="Vérifier et sceller les registres"
        >
          <div className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700 group-hover:bg-amber-50 group-hover:border-amber-200 group-hover:text-amber-700 transition-all shadow-2xs">
            <LockSimple size={19} weight="duotone" />
          </div>
          <span className="text-[10px] font-bold text-slate-600 group-hover:text-slate-900 transition-colors">
            Sceller
          </span>
        </button>

        {/* 3. Rapport Drive */}
        <button
          type="button"
          onClick={onOpenDrive}
          className="flex flex-col items-center gap-1.5 group cursor-pointer"
          title="Dépôt et accès aux rapports Drive"
        >
          <div className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700 group-hover:bg-blue-50 group-hover:border-blue-200 group-hover:text-blue-700 transition-all shadow-2xs">
            <FileArrowUp size={19} weight="duotone" />
          </div>
          <span className="text-[10px] font-bold text-slate-600 group-hover:text-slate-900 transition-colors">
            Rapports
          </span>
        </button>

        {/* 4. Inscrire Membre */}
        <button
          type="button"
          onClick={onOpenRegisterMember}
          className="flex flex-col items-center gap-1.5 group cursor-pointer"
          title="Ajouter un nouveau membre dans le pôle"
        >
          <div className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700 group-hover:bg-emerald-50 group-hover:border-emerald-200 group-hover:text-emerald-700 transition-all shadow-2xs">
            <UserPlus size={19} weight="duotone" />
          </div>
          <span className="text-[10px] font-bold text-slate-600 group-hover:text-slate-900 transition-colors">
            Inscrire
          </span>
        </button>

        {/* 5. Broadcast WhatsApp / Plus */}
        <button
          type="button"
          onClick={onOpenBroadcastModal}
          className="flex flex-col items-center gap-1.5 group cursor-pointer"
          title="Communiquer avec la communauté"
        >
          <div className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700 group-hover:bg-emerald-50 group-hover:border-emerald-200 group-hover:text-[#25D366] transition-all shadow-2xs">
            <WhatsappLogo size={19} weight="duotone" />
          </div>
          <span className="text-[10px] font-bold text-slate-600 group-hover:text-slate-900 transition-colors">
            Message
          </span>
        </button>
      </div>
    </div>
  );
};
