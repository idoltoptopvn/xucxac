import React, { useState } from 'react';
import { Download, Trash2, History, ChevronLeft, ChevronRight } from 'lucide-react';
import { RollHistoryItem, getResultLabel, classifyResult } from '../types/game';
import { ConfirmModal } from './ConfirmModal';
import { soundManager } from '../audio/soundManager';

interface HistoryTableProps {
  history: RollHistoryItem[];
  onClearHistory: () => void;
}

/**
 * Mini SVG Dice renderer for history rows
 */
const MiniDice: React.FC<{ value: number }> = ({ value }) => {
  const pipColor = '#18181B'; // Strictly black pips

  const renderPips = () => {
    switch (value) {
      case 1:
        return <circle cx="16" cy="16" r="5.5" fill={pipColor} />;
      case 2:
        return (
          <>
            <circle cx="10" cy="10" r="3.2" fill={pipColor} />
            <circle cx="22" cy="22" r="3.2" fill={pipColor} />
          </>
        );
      case 3:
        return (
          <>
            <circle cx="9" cy="9" r="2.9" fill={pipColor} />
            <circle cx="16" cy="16" r="2.9" fill={pipColor} />
            <circle cx="23" cy="23" r="2.9" fill={pipColor} />
          </>
        );
      case 4:
        return (
          <>
            <circle cx="10" cy="10" r="3.0" fill={pipColor} />
            <circle cx="22" cy="10" r="3.0" fill={pipColor} />
            <circle cx="10" cy="22" r="3.0" fill={pipColor} />
            <circle cx="22" cy="22" r="3.0" fill={pipColor} />
          </>
        );
      case 5:
        return (
          <>
            <circle cx="9" cy="9" r="2.8" fill={pipColor} />
            <circle cx="23" cy="9" r="2.8" fill={pipColor} />
            <circle cx="16" cy="16" r="2.8" fill={pipColor} />
            <circle cx="9" cy="23" r="2.8" fill={pipColor} />
            <circle cx="23" cy="23" r="2.8" fill={pipColor} />
          </>
        );
      case 6:
        return (
          <>
            <circle cx="10" cy="8.5" r="2.8" fill={pipColor} />
            <circle cx="10" cy="16" r="2.8" fill={pipColor} />
            <circle cx="10" cy="23.5" r="2.8" fill={pipColor} />
            <circle cx="22" cy="8.5" r="2.8" fill={pipColor} />
            <circle cx="22" cy="16" r="2.8" fill={pipColor} />
            <circle cx="22" cy="23.5" r="2.8" fill={pipColor} />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <svg
      viewBox="0 0 32 32"
      className="w-7 h-7 inline-block rounded-md shadow-sm border border-slate-300 bg-gradient-to-b from-white to-slate-100 shrink-0"
    >
      {renderPips()}
    </svg>
  );
};

export const HistoryTable: React.FC<HistoryTableProps> = ({
  history,
  onClearHistory,
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState<'all' | 'tai' | 'xiu'>('all');
  const itemsPerPage = 10;

  // Hàm chuẩn lấy phân loại đồng bộ cho từng dòng dữ liệu dựa trên tổng thực tế của 3 viên xúc xắc
  const getItemType = (item: RollHistoryItem) => classifyResult(item.d1 + item.d2 + item.d3);

  // Compute statistics:
  // Bộ đếm được tính lại từ lịch sử hợp lệ theo quy tắc prompt
  const totalRolls = history.length;
  const taiCount = history.filter((item) => getItemType(item) === 'tai').length;
  const xiuCount = history.filter((item) => getItemType(item) === 'xiu').length;

  const taiPercentage = totalRolls > 0 ? ((taiCount / totalRolls) * 100).toFixed(1) : '0.0';
  const xiuPercentage = totalRolls > 0 ? ((xiuCount / totalRolls) * 100).toFixed(1) : '0.0';

  // Filtered History
  const filteredHistory = history.filter((item) => {
    if (filter === 'all') return true;
    return getItemType(item) === filter;
  });

  // Export to CSV with UTF-8 BOM
  const handleExportCsv = () => {
    soundManager.playClick();
    if (history.length === 0) return;

    const headers = [
      'STT',
      'Thoi Gian',
      'Xuc Xac 1',
      'Xuc Xac 2',
      'Xuc Xac 3',
      'Tong Diem',
      'Phan Loai',
    ];

    const rows = history.map((item) => {
      const dateStr = new Date(item.timestamp).toLocaleString('vi-VN');
      const itemTotal = item.d1 + item.d2 + item.d3;
      const itemType = classifyResult(itemTotal);
      const label = getResultLabel(itemType);
      return [
        item.roundNumber,
        `"${dateStr}"`,
        item.d1,
        item.d2,
        item.d3,
        itemTotal,
        `"${label}"`,
      ].join(',');
    });

    // Prepend UTF-8 BOM (\uFEFF) so Microsoft Excel opens it correctly
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Lich_Su_Xuc_Xac_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Pagination
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage) || 1;
  const displayedHistory = filteredHistory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <section className="w-full max-w-5xl mx-auto mt-6 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-7 shadow-xl">
      {/* Header & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg sm:text-xl font-bold text-slate-100">
              Lịch Sử Lượt Quay & Thống Kê
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Ghi lại tự động từng lượt xúc xắc và lưu trữ trên trình duyệt của bạn
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCsv}
            disabled={history.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700 rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-300" />
            <span>XUẤT LỊCH SỬ</span>
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              setShowConfirmModal(true);
            }}
            disabled={history.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-300 hover:text-rose-200 bg-rose-950/40 hover:bg-rose-900/50 disabled:opacity-40 disabled:cursor-not-allowed border border-rose-800/50 rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Trash2 className="w-4 h-4 text-rose-400" />
            <span>XÓA LỊCH SỬ</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 my-6">
        {/* Total Rolls */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Tổng số lượt</span>
          <div className="text-2xl font-black text-slate-100 mt-1 tabular-nums">{totalRolls}</div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Tất cả phiên quay</span>
        </div>

        {/* Tài Stats */}
        <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-300 uppercase tracking-wider">Số lần TÀI</span>
            <span className="text-xs font-semibold text-rose-400 tabular-nums">{taiPercentage}%</span>
          </div>
          <div className="text-2xl font-black text-rose-300 mt-1 tabular-nums">{taiCount}</div>
          <span className="text-[11px] text-rose-400/70 mt-0.5 block">Tổng điểm 11 – 18</span>
        </div>

        {/* Xỉu Stats */}
        <div className="p-4 rounded-xl bg-sky-950/20 border border-sky-900/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-300 uppercase tracking-wider">Số lần XỈU</span>
            <span className="text-xs font-semibold text-sky-400 tabular-nums">{xiuPercentage}%</span>
          </div>
          <div className="text-2xl font-black text-sky-300 mt-1 tabular-nums">{xiuCount}</div>
          <span className="text-[11px] text-sky-400/70 mt-0.5 block">Tổng điểm 3 – 10</span>
        </div>
      </div>

      {/* Filter Segmented Control */}
      {history.length > 0 && (
        <div className="flex items-center justify-between gap-3 mb-4 overflow-x-auto pb-1">
          <div className="flex items-center gap-1 p-1 bg-slate-950/70 border border-slate-800 rounded-xl">
            <button
              onClick={() => {
                soundManager.playClick();
                setFilter('all');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                filter === 'all'
                  ? 'bg-slate-800 text-amber-300 shadow-sm border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tất cả ({history.length})
            </button>
            <button
              onClick={() => {
                soundManager.playClick();
                setFilter('tai');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                filter === 'tai'
                  ? 'bg-rose-950/60 text-rose-300 shadow-sm border border-rose-800/60'
                  : 'text-slate-400 hover:text-rose-300'
              }`}
            >
              Tài ({taiCount})
            </button>
            <button
              onClick={() => {
                soundManager.playClick();
                setFilter('xiu');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                filter === 'xiu'
                  ? 'bg-sky-950/60 text-sky-300 shadow-sm border border-sky-800/60'
                  : 'text-slate-400 hover:text-sky-300'
              }`}
            >
              Xỉu ({xiuCount})
            </button>
          </div>

          <span className="text-[11px] text-slate-500 hidden sm:inline whitespace-nowrap">
            Hiển thị {displayedHistory.length} / {filteredHistory.length} kết quả
          </span>
        </div>
      )}

      {/* Table Content */}
      {history.length === 0 ? (
        <div className="py-14 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/30">
          <p className="text-slate-400 text-sm font-medium">Lịch sử đang trống</p>
          <p className="text-slate-500 text-xs mt-1">
            Nhấn nút <strong className="text-amber-400 font-semibold">QUAY XÚC XẮC</strong> bên trên để bắt đầu lượt chơi đầu tiên!
          </p>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="py-10 text-center border border-slate-800 rounded-xl bg-slate-950/30">
          <p className="text-slate-400 text-sm">Không có lượt nào khớp với bộ lọc đã chọn</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-950/40">
                <th className="py-3 px-3.5">Lượt</th>
                <th className="py-3 px-3.5">Thời gian</th>
                <th className="py-3 px-3.5 text-center">Xúc xắc 1</th>
                <th className="py-3 px-3.5 text-center">Xúc xắc 2</th>
                <th className="py-3 px-3.5 text-center">Xúc xắc 3</th>
                <th className="py-3 px-3.5 text-center">Tổng điểm</th>
                <th className="py-3 px-3.5 text-right">Phân loại</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {displayedHistory.map((item) => {
                const dateStr = new Date(item.timestamp).toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                });
                const fullDateStr = new Date(item.timestamp).toLocaleDateString('vi-VN');
                const resolvedType = getItemType(item);

                return (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-3.5 font-bold text-amber-400 tabular-nums">
                      #{item.roundNumber}
                    </td>
                    <td className="py-3.5 px-3.5 text-xs text-slate-400 tabular-nums">
                      <span className="text-slate-200 font-medium">{dateStr}</span>
                      <span className="block text-[11px] text-slate-500">{fullDateStr}</span>
                    </td>
                    <td className="py-3.5 px-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <MiniDice value={item.d1} />
                        <span className="text-xs text-slate-300 font-bold tabular-nums">({item.d1})</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <MiniDice value={item.d2} />
                        <span className="text-xs text-slate-300 font-bold tabular-nums">({item.d2})</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <MiniDice value={item.d3} />
                        <span className="text-xs text-slate-300 font-bold tabular-nums">({item.d3})</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3.5 text-center font-black text-base text-slate-100 tabular-nums">
                      {item.d1 + item.d2 + item.d3}
                    </td>
                    <td className="py-3.5 px-3.5 text-right">
                      {resolvedType === 'tai' && (
                        <span className="inline-block px-2.5 py-1 text-xs font-bold text-rose-300 bg-rose-950/50 border border-rose-800/50 rounded-lg">
                          TÀI
                        </span>
                      )}
                      {resolvedType === 'xiu' && (
                        <span className="inline-block px-2.5 py-1 text-xs font-bold text-sky-300 bg-sky-950/50 border border-sky-800/50 rounded-lg">
                          XỈU
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-800 text-xs text-slate-400">
              <span>
                Trang <strong className="text-slate-200">{currentPage}</strong> / {totalPages} (Hiển thị {displayedHistory.length} / {filteredHistory.length} lượt)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    soundManager.playClick();
                    setCurrentPage((p) => Math.max(1, p - 1));
                  }}
                  disabled={currentPage === 1}
                  className="p-1.5 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed bg-slate-800 rounded-lg border border-slate-700 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    soundManager.playClick();
                    setCurrentPage((p) => Math.min(totalPages, p + 1));
                  }}
                  disabled={currentPage === totalPages}
                  className="p-1.5 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed bg-slate-800 rounded-lg border border-slate-700 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        title="Xóa toàn bộ lịch sử quay?"
        message="Hành động này sẽ xóa vĩnh viễn toàn bộ danh sách kết quả và thống kê đã lưu trong trình duyệt. Bạn có chắc chắn muốn xóa không?"
        confirmText="Xóa lịch sử"
        cancelText="Giữ lại"
        onConfirm={() => {
          onClearHistory();
          setShowConfirmModal(false);
          setCurrentPage(1);
        }}
        onCancel={() => setShowConfirmModal(false)}
      />
    </section>
  );
};
