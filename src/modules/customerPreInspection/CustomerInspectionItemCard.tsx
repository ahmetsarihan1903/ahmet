import React, { useState, useRef, useEffect } from 'react';
import { CheckCircle2, Trash2, Sparkles } from 'lucide-react';
import { CustomerInspectionItem } from './customerChecklistData';
import { VoiceInputButton } from '../../components/VoiceInputButton';

interface CustomerInspectionItemCardProps {
  item: CustomerInspectionItem;
  isDark: boolean;
  onToggleDefective: (id: string) => void;
  onTogglePassed: (id: string) => void;
  onUpdateNotes: (id: string, notes: string) => void;
  onDeleteItem: (id: string) => void;
}

export const CustomerInspectionItemCard: React.FC<CustomerInspectionItemCardProps> = ({
  item,
  isDark,
  onToggleDefective,
  onTogglePassed,
  onUpdateNotes,
  onDeleteItem,
}) => {
  // Long-press 2-second timer states & refs
  const [isPressing, setIsPressing] = useState(false);
  const [pressProgress, setPressProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);

  const clearPressTimers = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    setIsPressing(false);
    setPressProgress(0);
    startPosRef.current = null;
  };

  useEffect(() => {
    return () => {
      clearPressTimers();
    };
  }, []);

  const handleStartPress = (clientX: number, clientY: number) => {
    clearPressTimers();
    setIsPressing(true);
    setPressProgress(0);
    startPosRef.current = { x: clientX, y: clientY };

    const startTime = Date.now();
    const duration = 2000; // 2 seconds

    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.floor((elapsed / duration) * 100));
      setPressProgress(pct);
    }, 30);

    timerRef.current = setTimeout(() => {
      clearPressTimers();
      try {
        if (navigator.vibrate) {
          navigator.vibrate([60, 40, 60]);
        }
      } catch {
        // ignore vibrate error
      }
      onTogglePassed(item.id);
    }, duration);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const target = e.target as HTMLElement;
    if (target.closest('button, input, textarea, a, select, [data-no-press]')) {
      return;
    }
    handleStartPress(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!startPosRef.current) return;
    const dx = Math.abs(e.clientX - startPosRef.current.x);
    const dy = Math.abs(e.clientY - startPosRef.current.y);
    if (dx > 20 || dy > 20) {
      clearPressTimers();
    }
  };

  const handlePointerEnd = () => {
    clearPressTimers();
  };

  const isGreenPassed = Boolean(item.isPassed) && !item.isDefective;

  let cardClass = isDark
    ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
    : 'bg-[#FFFFFF] border-amber-200/80 hover:border-amber-300';

  if (item.isDefective) {
    cardClass = isDark
      ? 'bg-[#2b0c0c] border-2 border-rose-500/70 hover:border-rose-500 shadow-md'
      : 'bg-rose-50/90 border-2 border-rose-400 hover:border-rose-500 shadow-sm';
  } else if (isGreenPassed) {
    cardClass = isDark
      ? 'bg-[#063320] border-2 border-emerald-500 shadow-md'
      : 'bg-[#d1fae5] border-2 border-emerald-600 shadow-md';
  }

  return (
    <div
      className={`relative p-3 sm:p-3.5 rounded-xl border transition-all duration-150 select-none overflow-hidden ${cardClass} ${
        isPressing ? 'ring-2 ring-emerald-500 scale-[0.99]' : ''
      }`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onPointerLeave={handlePointerEnd}
      onContextMenu={(e) => {
        if (isPressing) e.preventDefault();
      }}
    >
      {/* Long-press 2s progress bar */}
      {isPressing && (
        <div className="absolute top-0 left-0 right-0 h-2 bg-slate-800/80 z-20 overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-75 ease-linear shadow-[0_0_12px_rgba(16,185,129,0.8)]"
            style={{ width: `${pressProgress}%` }}
          />
        </div>
      )}

      {/* Floating 2s Holding indicator */}
      {isPressing && (
        <div className="absolute top-2 right-2 z-20 px-2 py-0.5 rounded-full bg-emerald-600 text-white font-mono font-black text-[10px] flex items-center gap-1 shadow-lg animate-pulse">
          <Sparkles className="w-3 h-3" />
          <span>UYGUN İŞARETLENİYOR %{pressProgress}</span>
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          {/* Toggle Butonu (Kusurlu/Uygun) */}
          <button
            type="button"
            data-no-press="true"
            onClick={() => onToggleDefective(item.id)}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 font-black text-xs border transition-all cursor-pointer ${
              item.isDefective
                ? 'bg-rose-600 border-rose-500 text-white shadow-md shadow-rose-600/30'
                : isGreenPassed
                ? 'bg-emerald-600 border-emerald-400 text-white shadow-md shadow-emerald-600/30'
                : isDark
                ? 'bg-emerald-950/60 border-emerald-600/40 text-emerald-400 hover:bg-emerald-900'
                : 'bg-emerald-100 border-emerald-300 text-emerald-800 hover:bg-emerald-200'
            }`}
            title={
              item.isDefective
                ? 'Eksik Olarak İşaretlendi (Tıklayarak Eksik İşaretini Kaldır)'
                : 'Uygun (Tıklayarak Eksik Olarak İşaretle)'
            }
          >
            {item.isDefective ? '✕' : '✓'}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span
                className={`text-xs font-black ${
                  isGreenPassed
                    ? isDark
                      ? 'text-emerald-300'
                      : 'text-emerald-900'
                    : isDark
                    ? 'text-slate-300'
                    : 'text-slate-800'
                }`}
              >
                #{item.itemNumber}
              </span>
              <span
                className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded border ${
                  item.category === 'COMMON'
                    ? isDark
                      ? 'bg-slate-800 text-slate-300 border-slate-700'
                      : 'bg-slate-100 text-slate-700 border-slate-300'
                    : item.category === 'MR'
                    ? isDark
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                      : 'bg-blue-100 text-blue-800 border-blue-300'
                    : item.category === 'MRL'
                    ? isDark
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                      : 'bg-purple-100 text-purple-800 border-purple-300'
                    : isDark
                    ? 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                    : 'bg-orange-100 text-orange-800 border-orange-300'
                }`}
              >
                {item.category === 'COMMON' ? 'ORTAK' : item.category}
              </span>

              {isGreenPassed ? (
                <span
                  data-no-press="true"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTogglePassed(item.id);
                  }}
                  title="Kontrol Edildi (Uygun) - Durumu kaldırmak için tıklayabilirsiniz"
                  className={`text-[10px] sm:text-[11px] font-black px-2.5 py-0.5 rounded-md uppercase inline-flex items-center gap-1.5 border shadow-sm cursor-pointer transition-transform active:scale-95 ${
                    isDark
                      ? 'bg-emerald-600 text-white border-emerald-400'
                      : 'bg-emerald-600 text-white border-emerald-700'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  <span>UYGUN (KONTROL EDİLDİ)</span>
                </span>
              ) : (
                <span
                  className={`text-[10px] font-bold ${
                    item.isDefective ? 'text-rose-600' : 'text-emerald-600'
                  }`}
                >
                  {item.isDefective ? '• EKSİK / BİNA SORUMLULUĞUNDA' : '• UYGUN'}
                </span>
              )}
            </div>

            <p
              className={`text-xs sm:text-sm font-medium leading-relaxed ${
                item.isDefective
                  ? isDark
                    ? 'text-white'
                    : 'text-slate-900 font-semibold'
                  : isGreenPassed
                  ? isDark
                    ? 'text-emerald-200 font-semibold'
                    : 'text-emerald-950 font-semibold'
                  : isDark
                  ? 'text-slate-300'
                  : 'text-slate-700'
              }`}
            >
              {item.description}
            </p>

            {!isGreenPassed && (
              <p
                className={`text-[10px] mt-1 font-medium flex items-center gap-1 ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>
                  Yeşil ve uygun olarak işaretlemek için <strong>2 sn basılı tutunuz</strong>.
                </span>
              </p>
            )}

            {/* Not Alanı ve Sesli Giriş */}
            <div className="mt-2 flex items-center gap-2 select-text" data-no-press="true">
              <input
                type="text"
                value={item.notes || ''}
                onChange={(e) => onUpdateNotes(item.id, e.target.value)}
                placeholder="Bu maddeye özel şantiye/bina notu ekle..."
                className={`flex-1 rounded-lg px-2.5 py-1.5 text-xs outline-none border transition-all ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-emerald-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-amber-500'
                }`}
              />
              <VoiceInputButton
                onTranscript={(text) => {
                  const current = item.notes || '';
                  onUpdateNotes(item.id, current ? `${current} ${text}` : text);
                }}
              />
            </div>
          </div>
        </div>

        {item.isCustom && (
          <button
            type="button"
            data-no-press="true"
            onClick={() => onDeleteItem(item.id)}
            className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
            title="Özel Maddeyi Sil"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
