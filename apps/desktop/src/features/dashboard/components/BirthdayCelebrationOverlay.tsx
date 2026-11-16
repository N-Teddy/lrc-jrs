import type { IUpcomingBirthday } from '@jrs/shared';
import {
  Cake,
  Confetti,
  Sparkle,
  WhatsappLogo,
  X,
} from '@phosphor-icons/react';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { UserAvatar } from '../../../components/UserAvatar';

interface BirthdayCelebrationOverlayProps {
  celebrants: IUpcomingBirthday[];
  isOpen: boolean;
  onClose: () => void;
  isSelfCelebrant?: boolean;
}

const BALLOON_COLORS = [
  '#b85028', // Brand Terracotta
  '#2e7d32', // Forest Green
  '#e65100', // Deep Orange
  '#f59e0b', // Golden Amber
  '#7c3aed', // Festive Purple
  '#0284c7', // Sky Blue
  '#db2777', // Rose Pink
  '#10b981', // Emerald
];

const CONFETTI_COLORS = [
  '#b85028',
  '#f59e0b',
  '#2e7d32',
  '#7c3aed',
  '#0284c7',
  '#ef4444',
  '#10b981',
  '#ec4899',
  '#f97316',
];

export const BirthdayCelebrationOverlay: React.FC<
  BirthdayCelebrationOverlayProps
> = ({ celebrants, isOpen, onClose, isSelfCelebrant = false }) => {
  const [animationKey, setAnimationKey] = useState(0);

  // Generate randomized balloons
  // biome-ignore lint/correctness/useExhaustiveDependencies: animationKey is an intentional trigger to regenerate randomized positions
  const balloons = useMemo(() => {
    return Array.from({ length: 16 }).map((_, i) => {
      const left = 5 + Math.random() * 90; // 5% to 95%
      const duration = 5.5 + Math.random() * 3.5; // 5.5s to 9s
      const delay = Math.random() * 2.5; // 0 to 2.5s
      const size = 38 + Math.random() * 30; // 38px to 68px
      const color =
        BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)];
      const wobbleDuration = 2 + Math.random() * 1.5;
      const wobbleOffset = (Math.random() - 0.5) * 40;

      return {
        id: i,
        left,
        duration,
        delay,
        size,
        color,
        wobbleDuration,
        wobbleOffset,
      };
    });
  }, [animationKey]);

  // Generate randomized confetti particles
  // biome-ignore lint/correctness/useExhaustiveDependencies: animationKey is an intentional trigger to regenerate randomized positions
  const confettiParticles = useMemo(() => {
    return Array.from({ length: 42 }).map((_, i) => {
      const left = Math.random() * 100; // 0% to 100%
      const duration = 3.5 + Math.random() * 3; // 3.5s to 6.5s
      const delay = Math.random() * 2;
      const size = 6 + Math.random() * 8; // 6px to 14px
      const color =
        CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
      const isRound = Math.random() > 0.6;
      const rotationSpeed = 2 + Math.random() * 3;

      return {
        id: i,
        left,
        duration,
        delay,
        size,
        color,
        isRound,
        rotationSpeed,
      };
    });
  }, [animationKey]);

  // Restart animation
  const handleReplay = () => {
    setAnimationKey((prev) => prev + 1);
  };

  // Keyboard escape handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || celebrants.length === 0) return null;

  const primaryCelebrant = celebrants[0];
  const hasMultiple = celebrants.length > 1;

  // Pre-fill WhatsApp greeting message
  const whatsappUrl = primaryCelebrant.phoneNumber
    ? `https://wa.me/${primaryCelebrant.phoneNumber.replace(/\D/g, '')}?text=${encodeURIComponent(
        `Joyeux Anniversaire ${primaryCelebrant.fullName} de la part de toute la communauté JRS ! 🎂🎉 Que cette nouvelle année t'apporte joie, rayonnement et bénédictions ! ✨`,
      )}`
    : undefined;

  return (
    <div className="fixed inset-0 z-50 pointer-events-auto overflow-hidden select-none animate-in fade-in duration-300">
      {/* Subtle celebratory dark backdrop */}
      <div
        className="absolute inset-0 bg-[#1e1b19]/40 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      {/* Floating Balloons Layer (Ascending from bottom) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {balloons.map((b) => (
          <div
            key={`balloon-${animationKey}-${b.id}`}
            className="absolute bottom-[-160px]"
            style={{
              left: `${b.left}%`,
              animation: `floatUpward ${b.duration}s ease-in-out ${b.delay}s infinite`,
            }}
          >
            <div
              style={{
                animation: `balloonWobble ${b.wobbleDuration}s ease-in-out infinite alternate`,
              }}
              className="flex flex-col items-center drop-shadow-md"
            >
              {/* Balloon Shape */}
              <div
                style={{
                  width: `${b.size}px`,
                  height: `${b.size * 1.22}px`,
                  backgroundColor: b.color,
                  borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%',
                  boxShadow: `inset -4px -6px 10px rgba(0,0,0,0.25), inset 4px 6px 8px rgba(255,255,255,0.4)`,
                }}
                className="relative"
              >
                {/* Specular Highlight */}
                <div className="absolute top-[12%] left-[18%] w-[22%] h-[30%] bg-white/45 rounded-full rotate-[-25deg]" />
              </div>

              {/* Balloon Knot */}
              <div
                style={{
                  borderTopColor: b.color,
                }}
                className="w-0 h-0 border-x-[4px] border-x-transparent border-t-[5px] -mt-[1px]"
              />

              {/* Balloon String */}
              <svg
                width="12"
                height="45"
                viewBox="0 0 12 45"
                className="stroke-[#4a403b]/60 stroke-[1.2] fill-none -mt-[1px]"
              >
                <path d="M 6 0 Q 1 12, 6 22 T 6 45" />
              </svg>
            </div>
          </div>
        ))}
      </div>

      {/* Falling Confetti Particles Layer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {confettiParticles.map((c) => (
          <div
            key={`confetti-${animationKey}-${c.id}`}
            className="absolute top-[-25px]"
            style={{
              left: `${c.left}%`,
              width: `${c.size}px`,
              height: c.isRound ? `${c.size}px` : `${c.size * 1.8}px`,
              backgroundColor: c.color,
              borderRadius: c.isRound ? '50%' : '2px',
              animation: `fallDown ${c.duration}s linear ${c.delay}s infinite`,
              transform: `rotate(${c.id * 35}deg)`,
            }}
          />
        ))}
      </div>

      {/* Android Celebration Banner Card (Centered / Lower Third) */}
      <div className="absolute inset-x-4 bottom-8 sm:bottom-12 flex justify-center pointer-events-none">
        <div className="pointer-events-auto w-full max-w-lg bg-white/95 backdrop-blur-md rounded-2xl border-2 border-[#b85028]/25 shadow-2xl p-5 sm:p-6 flex flex-col gap-4 animate-in slide-in-from-bottom-8 duration-500">
          {/* Top Bar with Badges and Close Button */}
          <div className="flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fff2ee] text-[#b85028] text-xs font-bold border border-[#ffdbcf] shadow-2xs">
              <Sparkle
                size={14}
                weight="fill"
                className="animate-spin text-[#b85028]"
              />
              <span>
                {isSelfCelebrant
                  ? '🎉 Joyeux Anniversaire à Vous !'
                  : '🎂 Anniversaire Communautaire'}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleReplay}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-[#57423b] hover:text-[#b85028] hover:bg-[#faf2ee] transition-colors flex items-center gap-1 cursor-pointer"
                title="Rejouer l'animation de fête"
              >
                <Confetti size={14} weight="bold" />
                <span>Rejouer</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 rounded-lg text-[#8a726a] hover:text-[#1e1b19] hover:bg-[#faf2ee] flex items-center justify-center transition-colors cursor-pointer"
                title="Fermer"
              >
                <X size={16} weight="bold" />
              </button>
            </div>
          </div>

          {/* Celebrant Profile & Greeting */}
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <UserAvatar
                avatarUrl={primaryCelebrant.avatarUrl}
                name={primaryCelebrant.fullName}
                size="lg"
                className="ring-4 ring-[#b85028]/20 shadow-sm"
              />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#b85028] text-white flex items-center justify-center shadow-xs border-2 border-white">
                <Cake size={13} weight="fill" />
              </div>
            </div>

            <div className="flex flex-col min-w-0 flex-1">
              <h3 className="font-extrabold text-base sm:text-lg text-[#1e1b19] truncate leading-tight">
                {isSelfCelebrant
                  ? `Joyeux Anniversaire, ${primaryCelebrant.fullName} !`
                  : `C'est l'anniversaire de ${primaryCelebrant.fullName} !`}
              </h3>
              <p className="text-xs text-[#57423b] mt-0.5 font-medium">
                {primaryCelebrant.ageTurning > 0 ? (
                  <span className="font-bold text-[#b85028]">
                    {primaryCelebrant.ageTurning} ans aujourd'hui ! 🎈
                  </span>
                ) : (
                  <span>Une nouvelle année célébrée dans la joie !</span>
                )}
                {primaryCelebrant.homeTownName && (
                  <span className="text-[#8a726a]">
                    {' '}
                    • Pôle {primaryCelebrant.homeTownName}
                  </span>
                )}
              </p>
              {hasMultiple && (
                <p className="text-[11px] text-[#486b52] font-bold mt-1">
                  + {celebrants.length - 1} autre(s) membre(s) fêtent leur
                  anniversaire aujourd'hui !
                </p>
              )}
            </div>
          </div>

          {/* Motivational Quote / Warm Greeting */}
          <div className="bg-[#faf2ee] rounded-xl p-3 border border-[#e8e1dd] text-xs text-[#57423b] leading-relaxed italic">
            {isSelfCelebrant
              ? 'Toute la communauté JRS vous remercie pour votre engagement et vous souhaite une année féconde, rayonnante et remplie de succès !'
              : `N'hésitez pas à lui souhaiter une merveilleuse journée et à lui témoigner la bienveillance de la jeunesse de ${primaryCelebrant.homeTownName || 'la communauté'} !`}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-1 border-t border-[#f4ece9]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white border border-[#e8e1dd] text-[#57423b] font-bold text-xs hover:bg-[#faf2ee] transition-colors cursor-pointer"
            >
              Plus tard
            </button>

            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <WhatsappLogo size={16} weight="fill" />
                <span>Souhaiter sur WhatsApp</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Embedded Keyframes for Android-style physics */}
      <style>{`
        @keyframes floatUpward {
          0% {
            transform: translateY(0) scale(0.85);
            opacity: 0;
          }
          10% {
            opacity: 0.95;
          }
          85% {
            opacity: 0.95;
          }
          100% {
            transform: translateY(-120vh) scale(1.05);
            opacity: 0;
          }
        }

        @keyframes balloonWobble {
          0% {
            transform: rotate(-7deg) translateX(-12px);
          }
          100% {
            transform: rotate(7deg) translateX(12px);
          }
        }

        @keyframes fallDown {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          80% {
            opacity: 0.9;
          }
          100% {
            transform: translateY(110vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};
