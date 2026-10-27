import React from 'react';
import { Play, RotateCw, Loader2, Sparkles } from 'lucide-react';
import { GameState } from '../types/game';

interface ControlDockProps {
  gameState: GameState;
  onRoll: () => void;
  onNextRound: () => void;
  onDirectRoll: () => void;
}

export const ControlDock: React.FC<ControlDockProps> = ({
  gameState,
  onRoll,
  onNextRound,
  onDirectRoll,
}) => {
  const isBusy = gameState === 'shaking';

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center gap-3">
      {/* Primary Action Button */}
      {gameState === 'idle' && (
        <button
          onClick={onRoll}
          disabled={isBusy}
          className="w-full sm:w-80 py-4 px-8 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xl tracking-wide rounded-xl shadow-xl shadow-amber-500/25 transition-all transform active:scale-95 flex items-center justify-center gap-3 cursor-pointer"
        >
          <Play className="w-6 h-6 fill-current text-slate-950" />
          <span>QUAY XÚC XẮC</span>
        </button>
      )}

      {gameState === 'shaking' && (
        <button
          disabled
          className="w-full sm:w-80 py-4 px-8 bg-slate-800/90 text-amber-300 border border-amber-500/30 font-bold text-lg rounded-xl shadow-lg flex items-center justify-center gap-3 cursor-not-allowed"
        >
          <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
          <span>ĐANG XÓC...</span>
        </button>
      )}

      {gameState === 'ready_to_open' && (
        <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-3">
          <div className="py-3 px-6 bg-amber-500/10 border border-amber-500/40 text-amber-300 font-bold text-base rounded-xl shadow-lg flex items-center justify-center gap-2.5 animate-pulse">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span>KÉO ĐĨA TRÊN BÀN ĐỂ MỞ KẾT QUẢ</span>
          </div>
        </div>
      )}

      {gameState === 'revealed' && (
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          {/* LƯỢT TIẾP THEO */}
          <button
            onClick={onNextRound}
            disabled={isBusy}
            className="w-full sm:w-64 py-3.5 px-6 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-base tracking-wide rounded-xl shadow-xl shadow-amber-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCw className="w-5 h-5 text-slate-950" />
            <span>LƯỢT TIẾP THEO</span>
          </button>
        </div>
      )}

      {/* Helper hint */}
      <p className="text-[12px] text-slate-400 font-normal text-center">
        {gameState === 'idle' && 'Nhấn QUAY để xóc 3 viên xúc xắc 2D dưới đĩa úp'}
        {gameState === 'shaking' && 'Đang xóc xúc xắc và rung đĩa trong 2 giây...'}
        {gameState === 'ready_to_open' && 'Đĩa đã úp kín. Dùng ngón tay hoặc chuột kéo đĩa sang trái hoặc phải để mở từ từ!'}
        {gameState === 'revealed' && 'Kết quả đã được ghi lại. Nhấn LƯỢT TIẾP THEO để úp đĩa chuẩn bị lượt mới.'}
      </p>
    </div>
  );
};
