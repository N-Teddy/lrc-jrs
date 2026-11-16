import {
  ChatCenteredText,
  CheckCircle,
  GraduationCap,
  HandHeart,
  Plus,
  Users,
} from '@phosphor-icons/react';
import type React from 'react';

interface GoalsTrackerCardProps {
  onAddGoal?: () => void;
}

export const GoalsTrackerCard: React.FC<GoalsTrackerCardProps> = ({
  onAddGoal,
}) => {
  const goals = [
    {
      id: 'g1',
      title: 'Accueil & Nouveaux JR',
      current: 25,
      target: 30,
      unit: 'membres',
      category: 'Trimestre',
      icon: Users,
      color: '#70C044',
    },
    {
      id: 'g2',
      title: 'Assiduité aux Causeries',
      current: 92,
      target: 100,
      unit: 'présences',
      category: 'Trimestre',
      icon: ChatCenteredText,
      color: '#3b82f6',
    },
    {
      id: 'g3',
      title: 'Actions Caritatives & Solidarité',
      current: 4,
      target: 5,
      unit: 'actions',
      category: 'Annuel',
      icon: HandHeart,
      color: '#f59e0b',
    },
    {
      id: 'g4',
      title: 'Formation Animateurs',
      current: 12,
      target: 12,
      unit: 'validés',
      category: 'Annuel',
      icon: GraduationCap,
      color: '#8b5cf6',
    },
  ];

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 flex flex-col justify-between transition-all hover:border-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">
            Objectifs & Jalons Paroissiaux
          </h3>
          <p className="text-[11px] text-slate-400 font-medium">
            Progression des initiatives clés
          </p>
        </div>

        {onAddGoal && (
          <button
            type="button"
            onClick={onAddGoal}
            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-full transition-colors cursor-pointer border border-emerald-100/60"
          >
            <Plus size={12} weight="bold" />
            <span>Objectif</span>
          </button>
        )}
      </div>

      {/* Goals List (Matching Reference Goal Tracker) */}
      <div className="my-2 flex flex-col gap-3">
        {goals.map((g) => {
          const Icon = g.icon;
          const pct = Math.min(100, Math.round((g.current / g.target) * 100));

          return (
            <div key={g.id} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-white shrink-0 shadow-2xs"
                    style={{ backgroundColor: g.color }}
                  >
                    <Icon size={13} weight="bold" />
                  </div>
                  <span className="font-bold text-slate-800 text-xs">
                    {g.title}
                  </span>
                </div>
                <div className="flex items-center gap-1 font-mono text-[11px]">
                  <strong className="text-slate-900 font-extrabold">
                    {g.current}
                  </strong>
                  <span className="text-slate-400">
                    /{g.target} {g.unit}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden flex items-center p-0.5">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: g.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Subtext info */}
      <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 font-medium flex items-center justify-between">
        <span>Taux global de réalisation : 89%</span>
        <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
          <CheckCircle size={13} weight="fill" />
          <span>Sur la bonne voie</span>
        </span>
      </div>
    </div>
  );
};
