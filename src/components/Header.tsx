import React from 'react';
import { Volume2, VolumeX, Eye, Sparkles, RotateCcw } from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface HeaderProps {
  soundEnabled: boolean;
  onToggleSound: () => void;
  reducedMotion: boolean;
  onToggleMotion: () => void;
  totalRolls: number;
  onResetApp: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  soundEnabled,
  onToggleSound,
  reducedMotion,
  onToggleMotion,
  totalRolls,
  onResetApp,
}) => {
  return (
    <header className="flex items-center justify-between gap-3 sm:gap-6 px-4 sm:px-8 py-3.5 bg-slate-950/85 border-b border-slate-800/80 backdrop-blur-md sticky top-0 z-40">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3">
        <a href="/" className="flex items-center gap-2.5 group text-white">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black text-sm">
            🎲
          </div>
          <span className="text-base sm:text-lg font-extrabold tracking-tight text-slate-100 whitespace-nowrap">
            DICE GAME
          </span>
        </a>
        <span className="hidden md:inline-block text-xs text-slate-400">
          Xúc xắc Tài Xỉu truyền thống
        </span>
      </div>

      {/* Zone 2: Informational summary text with clean separators (Anti-Pill discipline) */}
      <div className="hidden lg:flex items-center gap-3 text-xs text-slate-400 tabular-nums">
        <span>Đã quay: <strong className="text-slate-200">{totalRolls}</strong> lượt</span>
        <span aria-hidden="true" className="text-slate-600">·</span>
        <span>Xúc xắc 2D</span>
        <span aria-hidden="true" className="text-slate-600">·</span>
        <span>Kéo đĩa mở kết quả</span>
      </div>

      {/* Zone 3: Functional tool actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Reset App button */}
        <button
          onClick={() => {
            soundManager.playClick();
            onResetApp();
          }}
          title="Đưa toàn bộ ứng dụng về trạng thái ban đầu"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border rounded-xl transition-all cursor-pointer text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-900/60 border-rose-700/50 shadow-sm"
        >
          <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
          <span>RESET APP</span>
        </button>

        {/* Motion toggle */}
        <button
          onClick={() => {
            soundManager.playClick();
            onToggleMotion();
          }}
          title={reducedMotion ? "Chuyển động: Rút gọn (Đang bật)" : "Chuyển động: Mượt mà"}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border rounded-xl transition-colors whitespace-nowrap cursor-pointer ${
            reducedMotion
              ? 'text-amber-300 bg-amber-950/40 border-amber-700/50'
              : 'text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border-slate-700/60'
          }`}
        >
          {reducedMotion ? <Eye className="w-3.5 h-3.5 text-amber-400" /> : <Sparkles className="w-3.5 h-3.5 text-slate-400" />}
          <span className="hidden sm:inline">{reducedMotion ? 'Gọn' : 'Mượt'}</span>
        </button>

        {/* Sound toggle */}
        <button
          onClick={() => {
            onToggleSound();
          }}
          title={soundEnabled ? "Tắt âm thanh" : "Bật âm thanh"}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold border rounded-xl transition-colors whitespace-nowrap cursor-pointer ${
            soundEnabled
              ? 'text-emerald-300 bg-emerald-950/40 border-emerald-700/50'
              : 'text-slate-400 bg-slate-900 border-slate-700/60 hover:text-slate-200'
          }`}
        >
          {soundEnabled ? (
            <>
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden xs:inline">Âm thanh</span>
            </>
          ) : (
            <>
              <VolumeX className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden xs:inline">Tắt tiếng</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};

