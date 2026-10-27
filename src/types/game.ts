export type GameState = 'idle' | 'shaking' | 'ready_to_open' | 'revealed';

export type ResultType = 'tai' | 'xiu';

export interface DiceValues {
  d1: number;
  d2: number;
  d3: number;
}

export interface RollHistoryItem {
  id: string;
  roundNumber: number;
  timestamp: number;
  d1: number;
  d2: number;
  d3: number;
  total: number;
  type: ResultType;
}

// Danh sách các lượt ngoại lệ bắt buộc theo số thứ tự
export const FORCED_XIU_ROUNDS = new Set<number>([3, 5, 7]);
export const FORCED_TAI_ROUNDS = new Set<number>([14, 15, 16, 17, 24, 26, 28]);

/**
 * Kiểm tra tính hợp lệ của giá trị xúc xắc (1 đến 6)
 */
export function isValidDiceValue(val: number): boolean {
  return Number.isInteger(val) && val >= 1 && val <= 6;
}

/**
 * HÀM PHÂN LOẠI TÀI/XỈU DUY NHẤT VÀ CHUẨN XÁC CHO TOÀN BỘ WEBSITE
 * Dùng đồng bộ 100% cho:
 * 1. Kết quả hiển thị sau khi mở đĩa (ResultBanner)
 * 2. Lịch sử từng lượt (HistoryTable rows)
 * 3. Bộ đếm số lượt Tài (taiCount)
 * 4. Bộ đếm số lượt Xỉu (xiuCount)
 * 5. Tỷ lệ phần trăm Tài/Xỉu
 * 6. Dữ liệu xuất CSV
 *
 * QUY TẮC PHÂN LOẠI CHUẨN:
 * - Tổng từ 3 đến 10: XỈU
 * - Tổng từ 11 đến 18: TÀI
 * - Công thức: total = dice1 + dice2 + dice3
 * - Logic: total >= 11 ? 'tai' : 'xiu'
 * Tuyệt đối không bao giờ để tổng điểm 10 trở xuống hiển thị là TÀI,
 * hoặc tổng điểm 11 trở lên hiển thị là XỈU.
 *
 * @param total Tổng điểm 3 viên xúc xắc (3 đến 18)
 * @param _roundNumber Tham số tùy chọn tương thích ngược
 */
export function classifyResult(total: number, _roundNumber?: number): ResultType {
  // Đảm bảo tổng nằm trong phạm vi vật lý hợp lệ của 3 viên xúc xắc
  const clampedTotal = Math.max(3, Math.min(18, Math.round(total)));
  return clampedTotal >= 11 ? 'tai' : 'xiu';
}

/**
 * SINH XÚC XẮC CHO LƯỢT CHƠI ĐẢM BẢO TÍNH ĐỒNG BỘ 100%:
 * - Lượt 3, 5, 7 (Ngoại lệ XỈU): Sinh 3 xúc xắc có tổng d1 + d2 + d3 <= 10 (3..10 -> XỈU)
 * - Lượt 14, 15, 16, 17, 24, 26, 28 (Ngoại lệ TÀI): Sinh 3 xúc xắc có tổng d1 + d2 + d3 >= 11 (11..18 -> TÀI)
 * - Các lượt khác: Sinh ngẫu nhiên hoàn toàn (1..6), kết quả theo tổng điểm (>=11 TÀI, <=10 XỈU)
 *
 * Cơ chế này đảm bảo 3 viên xúc xắc trên đĩa, tổng điểm và nhãn kết quả
 * LUÔN LUÔN KHỚP NHAU 100%, không bao giờ xảy ra tình trạng xúc xắc 2+2+6=10 mà nhãn hiển thị TÀI!
 */
export function generateRoundDice(roundNumber: number): {
  dice: DiceValues;
  total: number;
  type: ResultType;
  isException: boolean;
} {
  const isForcedXiu = FORCED_XIU_ROUNDS.has(roundNumber);
  const isForcedTai = FORCED_TAI_ROUNDS.has(roundNumber);
  const isException = isForcedXiu || isForcedTai;

  let d1 = 1;
  let d2 = 1;
  let d3 = 1;
  let total = 3;

  // Lặp sinh ngẫu nhiên cho đến khi thỏa mãn quy tắc của lượt
  do {
    d1 = Math.floor(Math.random() * 6) + 1;
    d2 = Math.floor(Math.random() * 6) + 1;
    d3 = Math.floor(Math.random() * 6) + 1;
    total = d1 + d2 + d3;
  } while (
    (isForcedXiu && total > 10) ||
    (isForcedTai && total < 11)
  );

  const type = classifyResult(total);

  return {
    dice: { d1, d2, d3 },
    total,
    type,
    isException,
  };
}

export function getResultLabel(type: ResultType): string {
  return type === 'tai' ? 'TÀI' : 'XỈU';
}

