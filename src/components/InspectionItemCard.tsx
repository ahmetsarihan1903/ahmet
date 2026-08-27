import React, { useState, useRef, useEffect } from 'react';
import { AlertCircle, Trash2, CheckCircle2, Check } from 'lucide-react';
import { InspectionItem } from '../types';
import { SmartTextInput } from './SmartTextInput';

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
  const isDescriptionMissing = item.isNonCompliant && item.isRequiredDescription && !item.description.trim();

  // Long-press 2-second timer states & refs
  const [isPressing, setIsPressing] = useState(false);
  const [pressProgress, setPressProgress] = useState(0); // 0 to 100%
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTouchPosRef = useRef<{ x: number; y: number } | null>(null);

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
    startTouchPosRef.current = null;
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
    startTouchPosRef.current = { x: clientX, y: clientY };

    const startTime = Date.now();
    const duration = 2000; // 2 seconds

    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.floor((elapsed / duration) * 100));
      setPressProgress(pct);
    }, 40);

    timerRef.current = setTimeout(() => {
      clearPressTimers();
      try {
        if (navigator.vibrate) {
          navigator.vibrate(60);
        }
      } catch {
        // ignore vibrate error
      }
      onTogglePassed(item.id);
    }, duration);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      handleStartPress(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!startTouchPosRef.current || e.touches.length !== 1) return;
    const dx = Math.abs(e.touches[0].clientX - startTouchPosRef.current.x);
    const dy = Math.abs(e.touches[0].clientY - startTouchPosRef.current.y);
    if (dx > 12 || dy > 12) {
      clearPressTimers();
    }
  };

  const handleTouchEnd = () => {
    clearPressTimers();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only primary mouse button
    if (e.button === 0) {
      handleStartPress(e.clientX, e.clientY);
    }
  };

  const handleMouseUp = () => {
    clearPressTimers();
  };

  const handleMouseLeave = () => {
    clearPressTimers();
  };

  // Card theme classes
  let cardClass = 'bg-slate-900 border-slate-800 hover:border-slate-700';
  let titleClass = 'text-slate-200';

  if (item.isNonCompliant) {
    cardClass = 'bg-red-950/40 border-red-500/80 shadow-md shadow-red-950/50';
    titleClass = 'text-red-200';
  } else if (item.isPassed) {
    cardClass = 'bg-emerald-950/30 border-emerald-500/80 shadow-sm shadow-emerald-950/40';
    titleClass = 'text-emerald-300';
  }

  return (
    <div
      className={`relative rounded border transition-all select-none overflow-hidden ${cardClass} p-3 sm:p-3.5`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {/* Long-press Progress Bar when holding for 2 seconds */}
      {isPressing && (
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-800 z-10">
          <div
            className="h-full bg-emerald-500 transition-all duration-75 ease-linear"
            style={{ width: `${pressProgress}%` }}
          />
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        {/* Item Title & Index */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-mono text-slate-400 uppercase">
              #{index + 1}
            </span>
            {item.floorLabel && (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-400/40 uppercase">
                {item.floorLabel}
              </span>
            )}
            {item.isCustom && (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-400/40 uppercase">
                Ekstra Madde
              </span>
            )}
            {item.isPassed && !item.isNonCompliant && (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 uppercase inline-flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-400" />
                <span>KONTROL EDİLDİ (UYGUN)</span>
              </span>
            )}
          </div>

          <h3 className={`text-xs sm:text-sm font-semibold mt-1 break-words transition-colors ${titleClass}`}>
            {item.title}
          </h3>

          {item.isRequiredDescription && (
            <p className="text-[11px] text-amber-400/90 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
              <span>UD durumunda açıklama yazılması zorunludur</span>
            </p>
          )}

          {allowLongPressPass && !item.isPassed && !item.isNonCompliant && (
            <p className="text-[10px] text-slate-500 mt-1">
              * Uygun olduğunu onaylamak için 2 sn basılı tutunuz.
            </p>
          )}
        </div>

        {/* Action Controls: [ UD ] Button + Optional Delete */}
        <div
          className="flex items-center gap-2 shrink-0"
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          {item.isCustom && onDeleteCustomItem && (
            <button
              type="button"
              onClick={() => onDeleteCustomItem(item.id)}
              title="Bu ekstra maddeyi sil"
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {/* [ UD ] (Uygun Değil) Button */}
          <button
            type="button"
            id={`btn-ud-${item.id}`}
            onClick={() => onToggleUD(item.id)}
            className={`min-h-[38px] px-3.5 py-1.5 rounded font-black text-xs tracking-wider uppercase transition-all shadow-sm active:scale-95 flex items-center gap-1.5 border cursor-pointer ${
              item.isNonCompliant
                ? 'bg-red-600 hover:bg-red-500 text-white border-red-400 shadow-red-600/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            {item.isNonCompliant ? (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-white shrink-0" />
                <span>UD</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
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
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-red-300 uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-red-400" />
              <span>Uygunsuzluk / Hata Açıklaması</span>
            </span>
            {item.isRequiredDescription && (
              <span className="text-[10px] text-red-400 uppercase">
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
            <p className="text-[11px] text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>Bu madde için açıklama girilmesi zorunludur.</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
};

