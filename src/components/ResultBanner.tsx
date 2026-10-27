import React from 'react';
import { DiceValues, ResultType, classifyResult } from '../types/game';

interface ResultBannerProps {
  dice: DiceValues | null;
  total: number | null;
  resultType: ResultType | null;
  roundNumber?: number;
  isVisible: boolean;
}

export const ResultBanner: React.FC<ResultBannerProps> = ({
  dice,
  total,
  resultType,
  roundNumber,
  isVisible,
}) => {
  if (!isVisible || !dice) {
    return null;
  }

  // Luôn tính toán tổng thực tế trực tiếp từ 3 viên xúc xắc
  const calculatedTotal = dice.d1 + dice.d2 + dice.d3;
  const resolvedType = classifyResult(calculatedTotal);

  const getTypeStyles = () => {
    switch (resolvedType) {
      case 'tai':
        return {
          title: 'TÀI',
          sub: 'Kết quả: TÀI (11 - 18)',
          badgeClass: 'bg-rose-500/15 border-rose-500/40 text-rose-300',
          gradientClass: 'from-rose-500/20 via-slate-900/80 to-slate-900/90',
          borderClass: 'border-rose-500/30',
        };
      case 'xiu':
        return {
          title: 'XỈU',
          sub: 'Kết quả: XỈU (3 - 10)',
          badgeClass: 'bg-sky-500/15 border-sky-500/40 text-sky-300',
          gradientClass: 'from-sky-500/20 via-slate-900/80 to-slate-900/90',
          borderClass: 'border-sky-500/30',
        };
    }
  };

  const style = getTypeStyles();


  return (
    <div className={`w-full max-w-2xl mx-auto rounded-xl p-4 sm:p-5 border bg-gradient-to-b ${style.gradientClass} ${style.borderClass} shadow-2xl backdrop-blur-md transition-all animate-fadeIn`}>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left: 3 Dice Individual Breakdown */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center justify-center w-14 h-16 rounded-lg bg-slate-950/80 border border-slate-700/80 shadow-inner">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Viên 1</span>
            <span className="text-2xl font-black text-amber-400 tabular-nums">{dice.d1}</span>
          </div>

          <span className="text-slate-500 font-bold">+</span>

          <div className="flex flex-col items-center justify-center w-14 h-16 rounded-lg bg-slate-950/80 border border-slate-700/80 shadow-inner">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Viên 2</span>
            <span className="text-2xl font-black text-amber-400 tabular-nums">{dice.d2}</span>
          </div>

          <span className="text-slate-500 font-bold">+</span>

          <div className="flex flex-col items-center justify-center w-14 h-16 rounded-lg bg-slate-950/80 border border-slate-700/80 shadow-inner">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Viên 3</span>
            <span className="text-2xl font-black text-amber-400 tabular-nums">{dice.d3}</span>
          </div>

          <span className="text-slate-500 font-bold">=</span>

          {/* Total Sum */}
          <div className="flex flex-col items-center justify-center px-4 h-16 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <span className="text-[11px] text-amber-300/80 uppercase tracking-wider font-semibold">Tổng điểm</span>
            <span className="text-2xl sm:text-3xl font-black text-amber-300 tabular-nums">{calculatedTotal}</span>
          </div>
        </div>

        {/* Right: Big Outcome Badge & Subtext */}
        <div className="text-center sm:text-right">
          <div className={`inline-block px-4 py-1.5 rounded-lg border font-black text-xl sm:text-2xl tracking-wider ${style.badgeClass} shadow-md`}>
            {style.title}
          </div>
          <p className="text-xs text-slate-400 mt-1 font-medium">{style.sub}</p>
        </div>
      </div>
    </div>
  );
};
