import React, { useState, useRef, useEffect } from 'react';
import { AlertCircle, Trash2, CheckCircle2, Check, Sparkles } from 'lucide-react';
import { InspectionItem } from '../types';
import { SmartTextInput } from './SmartTextInput';
import { useTheme } from '../context/ThemeContext';

interface InspectionItemCardProps {
  item: InspectionItem;
  index: number;
  onToggleUD: (id: string) => void;
  onTogglePassed?: (id: string) => void;
  onDescriptionChange: (id: string, description: string) => void;
  onDeleteCustomItem?: (id: string) => void;
  allowLongPressPass?: boolean;
}

export const InspectionItemCard: React.FC<InspectionItemCardProps> = ({
  item,
  index,
  onToggleUD,
  onTogglePassed,
  onDescriptionChange,
  onDeleteCustomItem,
  allowLongPressPass = false,
}) => {
  const { isDark } = useTheme();
  const isDescriptionMissing = item.isNonCompliant && item.isRequiredDescription && !item.description.trim();

  // Long-press 2-second timer states & refs
  const [isPressing, setIsPressing] = useState(false);
  const [pressProgress, setPressProgress] = useState(0); // 0 to 100%
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
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
    if (!allowLongPressPass || !onTogglePassed) return;

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

  // Pointer event handlers (Works uniformly on Touch, Pen & Mouse)
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only primary button or touch
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    // Don't trigger long press if clicking inside buttons, inputs or textareas
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
    // Allow small finger jitter (20px), cancel on actual scroll
    if (dx > 20 || dy > 20) {
      clearPressTimers();
    }
  };

  const handlePointerUp = () => {
    clearPressTimers();
  };

  const handlePointerCancel = () => {
    clearPressTimers();
  };

  const handlePointerLeave = () => {
    clearPressTimers();
  };

  // Card theme classes
  let cardClass = isDark
    ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
    : 'bg-white border-slate-300 hover:border-slate-400 shadow-xs';
  let titleClass = isDark ? 'text-slate-100' : 'text-slate-900';

  if (item.isNonCompliant) {
    cardClass = isDark
      ? 'bg-red-950/40 border-2 border-red-500 shadow-md shadow-red-950/50'
      : 'bg-red-50 border-2 border-red-600 shadow-md';
    titleClass = isDark ? 'text-red-200 font-bold' : 'text-red-900 font-bold';
  } else if (item.isPassed) {
    cardClass = isDark
      ? 'bg-emerald-950/40 border-2 border-emerald-500 shadow-md shadow-emerald-950/40'
      : 'bg-emerald-50 border-2 border-emerald-600 shadow-md';
    titleClass = isDark ? 'text-emerald-300 font-bold' : 'text-emerald-950 font-bold';
  }

  return (
    <div
      className={`relative rounded-xl border transition-all select-none overflow-hidden ${cardClass} p-3 sm:p-3.5 ${
        isPressing ? 'ring-2 ring-emerald-500 scale-[0.99]' : ''
      }`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onPointerLeave={handlePointerLeave}
    >
      {/* Long-press Progress Bar when holding for 2 seconds */}
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
        {/* Item Title & Index */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'
              }`}
            >
              #{index + 1}
            </span>
            {item.floorLabel && (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${
                  isDark
                    ? 'bg-blue-950/60 text-blue-300 border-blue-500/40'
                    : 'bg-blue-100 text-blue-900 border-blue-300'
                }`}
              >
                {item.floorLabel}
              </span>
            )}
            {item.isCustom && (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${
                  isDark
                    ? 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                    : 'bg-amber-100 text-amber-900 border-amber-300'
                }`}
              >
                Ekstra Madde
              </span>
            )}

            {/* Yeşil UYGUN Rozeti (Kontrol Edildi) */}
            {item.isPassed && !item.isNonCompliant && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  if (onTogglePassed) onTogglePassed(item.id);
                }}
                title="Kontrol Edildi (Uygun) - Durumu kaldırmak için tıklayabilirsiniz"
                className={`text-[10px] sm:text-[11px] font-black px-2.5 py-0.5 rounded-md uppercase inline-flex items-center gap-1.5 border shadow-sm cursor-pointer transition-transform active:scale-95 ${
                  isDark
                    ? 'bg-emerald-600 text-white border-emerald-400'
                    : 'bg-emerald-600 text-white border-emerald-700'
                }`}
                data-no-press="true"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                <span>UYGUN (KONTROL EDİLDİ)</span>
              </span>
            )}
          </div>

          <h3 className={`text-xs sm:text-sm font-bold mt-1.5 break-words transition-colors ${titleClass}`}>
            {item.title}
          </h3>

          {item.isRequiredDescription && (
            <p className="text-[11px] text-amber-500 mt-1 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
              <span>UD durumunda açıklama yazılması zorunludur</span>
            </p>
          )}

          {allowLongPressPass && !item.isPassed && !item.isNonCompliant && (
            <p className={`text-[10px] mt-1 font-medium flex items-center gap-1 ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Uygun olarak işaretlemek için <strong>2 sn basılı tutunuz</strong> veya dokunup bekleyiniz.</span>
            </p>
          )}
        </div>

        {/* Action Controls: [ UD ] Button + Optional Delete */}
        <div
          className="flex items-center gap-2 shrink-0"
          data-no-press="true"
        >
          {item.isCustom && onDeleteCustomItem && (
            <button
              type="button"
              onClick={() => onDeleteCustomItem(item.id)}
              title="Bu ekstra maddeyi sil"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isDark
                  ? 'text-slate-400 hover:text-red-400 hover:bg-slate-800'
                  : 'text-slate-500 hover:text-red-600 hover:bg-slate-100'
              }`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {/* [ UD ] (Uygun Değil) Button */}
          <button
            type="button"
            id={`btn-ud-${item.id}`}
            onClick={() => onToggleUD(item.id)}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-lg font-black text-xs tracking-wider uppercase transition-all shadow-sm active:scale-95 flex items-center gap-1.5 border cursor-pointer ${
              item.isNonCompliant
                ? 'bg-red-600 hover:bg-red-500 text-white border-red-400 shadow-red-600/30 font-black'
                : isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
            }`}
          >
            {item.isNonCompliant ? (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-white shrink-0" />
                <span>UD</span>
              </>
            ) : (
              <>
                <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-600'}`} />
                <span>[ UD ]</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Expandable Free-Text Description Area when UD is active */}
      {item.isNonCompliant && (
        <div
          className="mt-3 pt-2.5 border-t border-red-500/30 space-y-1.5 animate-fadeIn select-text"
          data-no-press="true"
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-red-400 uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-red-500" />
              <span>Uygunsuzluk / Hata Açıklaması</span>
            </span>
            {item.isRequiredDescription && (
              <span className="text-[10px] text-red-500 uppercase font-black">
                * Zorunlu Alan
              </span>
            )}
          </div>

          <SmartTextInput
            id={`desc-${item.id}`}
            value={item.description}
            onChange={(val) => onDescriptionChange(item.id, val)}
            placeholder="Hatanın detayını, tespit edilen kusuru yazın veya [🎙️] ile söyleyin..."
            isTextarea
            rows={2}
            className="w-full"
          />

          {isDescriptionMissing && (
            <p className="text-[11px] text-red-500 font-bold flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>Bu madde için açıklama girilmesi zorunludur.</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
};

