import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Dice2D } from './Dice2D';
import { DiceValues, GameState } from '../types/game';
import { soundManager } from '../audio/soundManager';
import { MoveHorizontal, Eye, CheckCircle2, RotateCcw } from 'lucide-react';

interface DiceTable2DProps {
  gameState: GameState;
  diceValues: DiceValues;
  roundNumber: number;
  onResultRevealed: () => void;
  onResetPlateToCenter?: () => void;
}

export const DiceTable2D: React.FC<DiceTable2DProps> = ({
  gameState,
  diceValues,
  roundNumber,
  onResultRevealed,
}) => {
  // Current plate X offset from center in pixels
  const [plateX, setPlateX] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // References for drag calculation
  const dragStartPointerXRef = useRef<number>(0);
  const initialPlateXRef = useRef<number>(0);
  const activePointerIdRef = useRef<number | null>(null);
  const lastSoundXRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Distance needed to completely uncover all 3 dice
  // Dice span ~190px width. Plate is 270px wide. At |offset| >= 165px, all dice are 100% uncovered!
  const FULL_UNCOVER_OFFSET = 165;
  const MAX_DRAG_LIMIT = 240;

  // Reset plate position when entering idle or shaking
  useEffect(() => {
    if (gameState === 'idle' || gameState === 'shaking') {
      setPlateX(0);
      setIsDragging(false);
      activePointerIdRef.current = null;
    }
  }, [gameState]);

  // Calculate reveal progress (0% to 100%)
  const revealProgress = Math.min(
    Math.round((Math.abs(plateX) / FULL_UNCOVER_OFFSET) * 100),
    100
  );
  const isFullyUncovered = Math.abs(plateX) >= FULL_UNCOVER_OFFSET;

  // Trigger result reveal when threshold is met
  useEffect(() => {
    if (gameState === 'ready_to_open' && isFullyUncovered) {
      onResultRevealed();
    }
  }, [gameState, isFullyUncovered, onResultRevealed]);

  // Pointer Event Handlers for smooth continuous drag
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Only permit dragging when dice are rolled and waiting to be uncovered
      if (gameState !== 'ready_to_open' && gameState !== 'revealed') return;

      const target = e.currentTarget;
      target.setPointerCapture(e.pointerId);
      activePointerIdRef.current = e.pointerId;

      dragStartPointerXRef.current = e.clientX;
      initialPlateXRef.current = plateX;
      setIsDragging(true);
    },
    [gameState, plateX]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging || activePointerIdRef.current !== e.pointerId) return;

      const deltaX = e.clientX - dragStartPointerXRef.current;
      let newX = initialPlateXRef.current + deltaX;

      // Clamp within realistic table boundaries
      newX = Math.max(-MAX_DRAG_LIMIT, Math.min(newX, MAX_DRAG_LIMIT));

      setPlateX(newX);

      // Play gentle ceramic friction sound
      if (Math.abs(newX - lastSoundXRef.current) > 18) {
        soundManager.playCupDrag();
        lastSoundXRef.current = newX;
      }
    },
    [isDragging]
  );

  const handlePointerUpOrCancel = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging || activePointerIdRef.current !== e.pointerId) return;

      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}

      activePointerIdRef.current = null;
      setIsDragging(false);
      // NOTE: plateX remains exactly where it was released (No auto return, no auto snap to end)
    },
    [isDragging]
  );

  const isShaking = gameState === 'shaking';
  const isReadyToOpen = gameState === 'ready_to_open';
  const isRevealed = gameState === 'revealed';

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-2xl mx-auto rounded-3xl p-4 sm:p-6 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border border-slate-800 shadow-2xl select-none overflow-hidden"
    >
      {/* Table Felt Arena */}
      <div
        className={`relative w-full h-80 sm:h-96 rounded-2xl flex items-center justify-center overflow-hidden border border-emerald-900/50 shadow-inner transition-all ${
          isReadyToOpen ? 'ring-2 ring-amber-500/30' : ''
        }`}
        style={{
          background: 'radial-gradient(circle, #13452B 0%, #0D2E1D 60%, #071910 100%)',
        }}
      >
        {/* Table Felt Decorative Circles */}
        <div className="absolute inset-4 rounded-full border border-emerald-600/20 pointer-events-none" />
        <div className="absolute inset-10 rounded-full border-2 border-dashed border-amber-500/20 pointer-events-none" />
        <div className="absolute inset-20 rounded-full border border-amber-400/25 pointer-events-none" />

        {/* Felt Watermark Emblem */}
        <div className="absolute text-center pointer-events-none opacity-15">
          <span className="text-4xl sm:text-5xl font-black text-amber-200 tracking-widest font-mono">
            ★ TÀI XỈU ★
          </span>
        </div>

        {/* Current Round Badge (Top Left of Table) */}
        <div className="absolute top-3 left-3 z-15 flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-950/80 border border-amber-500/30 text-xs font-bold text-amber-300 shadow-md">
          <span className="text-slate-400 font-normal">Phiên:</span>
          <span className="tabular-nums font-mono text-amber-300">#{roundNumber}</span>
        </div>

        {/* LAYER 1: 3 VIÊN XÚC XẮC 2D (Positioned underneath the plate) */}
        <div className="relative z-10 flex items-center justify-center gap-3 sm:gap-4">
          <Dice2D
            value={diceValues.d1}
            isShaking={isShaking}
            size={58}
          />
          <Dice2D
            value={diceValues.d2}
            isShaking={isShaking}
            size={58}
          />
          <Dice2D
            value={diceValues.d3}
            isShaking={isShaking}
            size={58}
          />
        </div>

        {/* LAYER 2: CHIẾC ĐĨA ÚP 2D (Che kín hoàn toàn, cho phép kéo sang trái/phải) */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUpOrCancel}
          onPointerCancel={handlePointerUpOrCancel}
          style={{
            transform: `translateX(${plateX}px) rotate(${plateX * 0.025}deg)`,
            touchAction: isReadyToOpen || isRevealed ? 'none' : 'auto',
          }}
          className={`absolute z-20 w-64 h-64 sm:w-72 sm:h-72 rounded-full flex flex-col items-center justify-center cursor-ew-resize select-none transition-shadow ${
            isShaking ? 'animate-plate-shake' : ''
          } ${isDragging ? 'shadow-2xl scale-[1.02]' : 'shadow-xl'}`}
        >
          {/* Porcelain Plate Rim & Face */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-slate-100 via-amber-50 to-slate-200 border-[7px] border-amber-600/70 shadow-2xl overflow-hidden">
            {/* Concentric Decorative Gold Rings */}
            <div className="absolute inset-2 rounded-full border-2 border-amber-500/50" />
            <div className="absolute inset-4 rounded-full border border-amber-400/30" />
            <div className="absolute inset-8 rounded-full border-2 border-dashed border-amber-700/30" />
            <div className="absolute inset-12 rounded-full bg-gradient-to-tr from-slate-200 via-amber-100/40 to-slate-100 border border-slate-300/80" />

            {/* Subtle Surface Texture Highlights */}
            <div className="absolute top-2 left-6 right-6 h-12 bg-gradient-to-b from-white/80 to-transparent rounded-full opacity-60 pointer-events-none" />
          </div>

          {/* Central Handle & Guidance */}
          <div className="relative z-30 flex flex-col items-center justify-center p-3 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-b from-amber-600 via-amber-500 to-amber-700 border-2 border-amber-300/80 shadow-lg flex flex-col items-center justify-center text-slate-950 font-black">
              <MoveHorizontal className="w-6 h-6 animate-pulse text-slate-950" />
              <span className="text-[10px] tracking-wider uppercase font-extrabold mt-0.5">
                KÉO ĐĨA
              </span>
            </div>

            <div className="mt-2 px-3 py-1 bg-slate-950/70 rounded-full border border-slate-800 text-[10px] sm:text-[11px] font-bold text-amber-300 whitespace-nowrap shadow-sm">
              {isReadyToOpen
                ? isFullyUncovered
                  ? 'ĐÃ MỞ HOÀN TOÀN'
                  : '← KÉO TRÁI HOẶC PHẢI →'
                : isShaking
                ? 'ĐANG XÓC...'
                : 'ĐĨA ÚP KÍN'}
            </div>
          </div>
        </div>

        {/* Live Reveal Percentage Badge on Table */}
        {isReadyToOpen && (
          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs z-30 pointer-events-none">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-700/80 text-slate-200 backdrop-blur-md">
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              <span>Tiến độ mở:</span>
              <strong className={`tabular-nums font-bold ${isFullyUncovered ? 'text-emerald-400' : 'text-amber-400'}`}>
                {revealProgress}%
              </strong>
            </div>

            {isFullyUncovered ? (
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-600/80 text-emerald-300 font-bold backdrop-blur-md">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Đã lộ hoàn toàn!</span>
              </div>
            ) : (
              <span className="text-[11px] text-slate-300 bg-slate-950/70 px-2.5 py-1 rounded-md border border-slate-800">
                Kéo thêm để xem kết quả
              </span>
            )}
          </div>
        )}
      </div>

      {/* Helper Bar under the Table */}
      <div className="flex items-center justify-center mt-4 pt-3 border-t border-slate-800/80 text-xs text-slate-400 text-center">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <span>
            {isReadyToOpen
              ? 'Dùng chuột hoặc ngón tay giữ và kéo đĩa sang trái hoặc phải từ từ'
              : isShaking
              ? 'Xúc xắc và đĩa đang xóc nhẹ trong 2 giây...'
              : isRevealed
              ? 'Kết quả đã mở! Bấm LƯỢT TIẾP THEO để chuẩn bị lượt mới'
              : 'Bấm QUAY XÚC XẮC để bắt đầu lượt mới'}
          </span>
        </div>
      </div>
    </div>
  );
};
