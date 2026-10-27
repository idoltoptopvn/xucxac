import { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { DiceTable2D } from './components/DiceTable2D';
import { ResultBanner } from './components/ResultBanner';
import { ControlDock } from './components/ControlDock';
import { HistoryTable } from './components/HistoryTable';
import { ConfirmModal } from './components/ConfirmModal';
import {
  DiceValues,
  GameState,
  RollHistoryItem,
  ResultType,
  classifyResult,
  generateRoundDice,
} from './types/game';
import { soundManager } from './audio/soundManager';
import { RotateCcw, CheckCircle2, X } from 'lucide-react';

const STORAGE_KEY_HISTORY = 'dice_2d_history_v1';
const STORAGE_KEY_SOUND = 'dice_2d_sound_v1';
const STORAGE_KEY_MOTION = 'dice_2d_motion_v1';
const STORAGE_KEY_ROUND_COUNTER = 'dice_2d_round_counter_v1';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('idle');
  const [activeDice, setActiveDice] = useState<DiceValues>({ d1: 1, d2: 2, d3: 3 });
  const [currentDice, setCurrentDice] = useState<DiceValues | null>(null);
  const [currentTotal, setCurrentTotal] = useState<number | null>(null);
  const [currentType, setCurrentType] = useState<ResultType | null>(null);
  const [currentRoundNumber, setCurrentRoundNumber] = useState<number | null>(null);

  // Modal & Toast states
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Persistent roundCounter to ensure clearing history does not reset round number sequence
  const [roundCounter, setRoundCounter] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ROUND_COUNTER);
      if (saved !== null) {
        const val = parseInt(saved, 10);
        if (Number.isFinite(val) && val >= 0) return val;
      }
      const savedHistory = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const max = Math.max(...parsed.map((item: RollHistoryItem) => item.roundNumber || 0));
          return max;
        }
      }
      return 0;
    } catch {
      return 0;
    }
  });

  // Sound settings
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SOUND);
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  // Reduced motion
  const [reducedMotion, setReducedMotion] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MOTION);
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  // Roll History (đồng bộ quy tắc phân loại chuẩn duy nhất bằng classifyResult(total))
  const [history, setHistory] = useState<RollHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => ({
            ...item,
            // Đảm bảo dữ liệu cũ nếu bị sai lệch cũng tự động được tính lại chuẩn xác
            total: item.d1 + item.d2 + item.d3,
            type: classifyResult(item.d1 + item.d2 + item.d3),
          }));
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  const pendingResultRef = useRef<{
    dice: DiceValues;
    total: number;
    type: ResultType;
    roundNumber: number;
  } | null>(null);
  const shakeTimerRef = useRef<number | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  // Sync sound settings
  useEffect(() => {
    soundManager.setEnabled(soundEnabled);
    try {
      localStorage.setItem(STORAGE_KEY_SOUND, JSON.stringify(soundEnabled));
    } catch {}
  }, [soundEnabled]);

  // Sync motion setting
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MOTION, JSON.stringify(reducedMotion));
    } catch {}
  }, [reducedMotion]);

  // Sync history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
    } catch {}
  }, [history]);

  // Sync roundCounter to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ROUND_COUNTER, JSON.stringify(roundCounter));
    } catch {}
  }, [roundCounter]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (shakeTimerRef.current !== null) {
        clearTimeout(shakeTimerRef.current);
      }
      if (toastTimerRef.current !== null) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const showToast = (message: string) => {
    setToastMessage(message);
    if (toastTimerRef.current !== null) {
      clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleToggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      soundManager.setEnabled(next);
      if (next) soundManager.playClick();
      return next;
    });
  };

  const handleToggleMotion = () => {
    setReducedMotion((prev) => !prev);
  };

  // Roll action
  const handleRoll = useCallback(() => {
    if (gameState === 'shaking' || gameState === 'ready_to_open') return;

    soundManager.playClick();

    // 1. Calculate actual round number for this turn using persistent roundCounter
    const nextRoundNumber = roundCounter + 1;
    setRoundCounter(nextRoundNumber);

    // 2. Sinh xúc xắc với bảo đảm tính đồng bộ toán học 100% giữa xúc xắc và ngoại lệ lượt
    const { dice: targetDice, total, type } = generateRoundDice(nextRoundNumber);

    pendingResultRef.current = {
      dice: targetDice,
      total,
      type,
      roundNumber: nextRoundNumber,
    };

    // Khởi tạo và giữ nguyên 3 giá trị xúc xắc trong suốt lượt chơi
    setActiveDice(targetDice);

    // Xóa kết quả hiển thị của lượt trước, chỉ hiển thị lại khi đĩa được mở hoàn toàn
    setCurrentDice(null);
    setCurrentTotal(null);
    setCurrentType(null);
    setCurrentRoundNumber(null);

    // 3. Start Shaking
    setGameState('shaking');
    const shakeDuration = reducedMotion ? 800 : 2000;
    soundManager.startShakeSound(shakeDuration);

    if (shakeTimerRef.current !== null) {
      clearTimeout(shakeTimerRef.current);
    }

    // 4. After duration: stop shaking, settle dice underneath closed plate, enter ready_to_open
    shakeTimerRef.current = window.setTimeout(() => {
      setGameState('ready_to_open');
      soundManager.playReadyToOpen();
    }, shakeDuration);
  }, [gameState, reducedMotion, roundCounter]);

  // When player drags plate and fully reveals all 3 dice
  const handleResultRevealed = useCallback(() => {
    if (gameState !== 'ready_to_open') return;

    const pending = pendingResultRef.current;
    if (!pending) return;

    setGameState('revealed');
    setCurrentDice(pending.dice);
    setCurrentTotal(pending.total);
    setCurrentType(pending.type);
    setCurrentRoundNumber(pending.roundNumber);

    // Fanfare sound
    soundManager.playResultFanfare(pending.type);

    // Append to history table once (guaranteed no duplicate)
    setHistory((prevHistory) => {
      if (prevHistory.some((item) => item.roundNumber === pending.roundNumber)) {
        return prevHistory;
      }
      const newItem: RollHistoryItem = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        roundNumber: pending.roundNumber,
        timestamp: Date.now(),
        d1: pending.dice.d1,
        d2: pending.dice.d2,
        d3: pending.dice.d3,
        total: pending.total,
        type: pending.type,
      };
      return [newItem, ...prevHistory];
    });

    pendingResultRef.current = null;
  }, [gameState]);

  // Next Round: reset plate over dice and return to idle
  const handleNextRound = () => {
    if (gameState === 'shaking' || gameState === 'ready_to_open') return;
    soundManager.playClick();
    soundManager.playCupDrop();
    setGameState('idle');
    setCurrentDice(null);
    setCurrentTotal(null);
    setCurrentType(null);
    setCurrentRoundNumber(null);
  };

  // Clear history only (bảo lưu roundCounter)
  const handleClearHistory = () => {
    soundManager.playClick();
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY_HISTORY);
    } catch {}
    showToast('Đã xóa toàn bộ lịch sử quay.');
  };

  // Reset App: Đưa toàn bộ ứng dụng về trạng thái ban đầu
  const handleConfirmResetApp = () => {
    // 1. Dừng mọi tiến trình đang chạy
    if (shakeTimerRef.current !== null) {
      clearTimeout(shakeTimerRef.current);
      shakeTimerRef.current = null;
    }
    soundManager.stopAll();
    soundManager.playResetSuccess();

    // 2. Đặt lại toàn bộ state về mặc định
    setRoundCounter(0);
    setHistory([]);
    setActiveDice({ d1: 1, d2: 2, d3: 3 });
    setCurrentDice(null);
    setCurrentTotal(null);
    setCurrentType(null);
    setCurrentRoundNumber(null);
    setGameState('idle');
    pendingResultRef.current = null;

    // 3. Xóa bộ nhớ trình duyệt
    try {
      localStorage.removeItem(STORAGE_KEY_HISTORY);
      localStorage.removeItem(STORAGE_KEY_ROUND_COUNTER);
    } catch {}

    // 4. Đóng modal và hiển thị Toast thông báo
    setShowResetModal(false);
    showToast('Đã đưa DICE GAME về trạng thái ban đầu.');
  };


  const activeRoundNumber =
    pendingResultRef.current?.roundNumber ??
    (gameState === 'revealed' && currentRoundNumber ? currentRoundNumber : roundCounter + 1);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Bar Header */}
      <Header
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        reducedMotion={reducedMotion}
        onToggleMotion={handleToggleMotion}
        totalRolls={history.length}
        onResetApp={() => setShowResetModal(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-7 flex flex-col gap-6">
        {/* Intro Title */}
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
            Game Xúc Xắc Tài Xỉu 2D
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
            Trải nghiệm xóc đĩa truyền thống với cơ chế kéo đĩa mở kết quả chân thực bằng chuột hoặc ngón tay.
          </p>
        </div>

        {/* Result Banner: ONLY displays when dice are fully revealed */}
        <ResultBanner
          dice={currentDice}
          total={currentTotal}
          resultType={currentType}
          roundNumber={currentRoundNumber ?? undefined}
          isVisible={gameState === 'revealed' && currentDice !== null}
        />

        {/* 2D Dice Table with Draggable Cover Plate */}
        <DiceTable2D
          gameState={gameState}
          diceValues={activeDice}
          roundNumber={activeRoundNumber}
          onResultRevealed={handleResultRevealed}
        />

        {/* Action Controls */}
        <ControlDock
          gameState={gameState}
          onRoll={handleRoll}
          onNextRound={handleNextRound}
          onDirectRoll={handleRoll}
        />

        {/* History Table & Statistics */}
        <HistoryTable
          history={history}
          onClearHistory={handleClearHistory}
        />
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/90 py-5 px-4 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>© 2026 Dice Game · Trò chơi xúc xắc 2D trực tuyến</span>
          <span className="text-slate-600">
            Ứng dụng giải trí mô phỏng · Không hỗ trợ cá cược hoặc nạp rút tiền thật
          </span>
        </div>
      </footer>

      {/* Reset App Confirmation Modal */}
      <ConfirmModal
        isOpen={showResetModal}
        title="RESET APP?"
        message="Bạn có chắc chắn muốn đưa DICE GAME về trạng thái ban đầu? Toàn bộ tiến trình phiên, kết quả và thống kê sẽ được làm mới."
        confirmText="XÁC NHẬN RESET"
        cancelText="HỦY"
        confirmIcon={<RotateCcw className="w-4 h-4" />}
        headerIcon={<RotateCcw className="w-5 h-5 text-rose-400" />}
        onConfirm={handleConfirmResetApp}
        onCancel={() => setShowResetModal(false)}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-emerald-950/90 border border-emerald-500/40 text-emerald-200 text-sm font-semibold rounded-xl shadow-2xl backdrop-blur-md animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 hover:bg-emerald-900/50 rounded-lg text-emerald-400 hover:text-emerald-200 transition-colors ml-2 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

