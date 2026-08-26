import React from 'react';
import { AlertCircle, Trash2, CheckCircle2 } from 'lucide-react';
import { InspectionItem } from '../types';
import { SmartTextInput } from './SmartTextInput';

interface InspectionItemCardProps {
  item: InspectionItem;
  index: number;
  onToggleUD: (id: string) => void;
  onDescriptionChange: (id: string, description: string) => void;
  onDeleteCustomItem?: (id: string) => void;
}

export const InspectionItemCard: React.FC<InspectionItemCardProps> = ({
  item,
  index,
  onToggleUD,
  onDescriptionChange,
  onDeleteCustomItem,
}) => {
  const isDescriptionMissing = item.isNonCompliant && item.isRequiredDescription && !item.description.trim();

  return (
    <div
      className={`rounded transition-all border ${
        item.isNonCompliant
          ? 'bg-slate-900 border-red-500 shadow-md ring-2 ring-red-500/60'
          : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
      } p-3 sm:p-3.5`}
    >
      <div className="flex items-start justify-between gap-2.5">
        {/* Item Title & Index */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
              #{index + 1}
            </span>
            {item.floorLabel && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/40 uppercase">
                {item.floorLabel}
              </span>
            )}
            {item.isCustom && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/40 uppercase">
                Ekstra Madde
              </span>
            )}
          </div>

          <h3 className={`text-xs sm:text-sm font-bold mt-1 break-words leading-snug ${
            item.isNonCompliant ? 'text-red-300 font-black' : 'text-slate-100'
          }`}>
            {item.title}
          </h3>

          {item.isRequiredDescription && (
            <p className="text-[10px] text-amber-400 font-semibold mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
              <span>UD durumunda açıklama yazılması zorunludur</span>
            </p>
          )}
        </div>

        {/* Action Controls: [ UD ] Button + Optional Delete */}
        <div className="flex items-center gap-1.5 shrink-0">
          {item.isCustom && onDeleteCustomItem && (
            <button
              type="button"
              onClick={() => onDeleteCustomItem(item.id)}
              title="Bu ekstra maddeyi sil"
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {/* High Contrast [ UD ] (Uygun Değil) Button for Tablet Sunlight & Visibility */}
          <button
            type="button"
            id={`btn-ud-${item.id}`}
            onClick={() => onToggleUD(item.id)}
            className={`min-h-[42px] px-3.5 py-2 rounded font-black text-xs sm:text-sm tracking-wider uppercase transition-all shadow-md active:scale-95 flex items-center gap-1.5 border-2 ${
              item.isNonCompliant
                ? 'bg-red-600 hover:bg-red-500 text-white border-red-400 shadow-red-900/50 ring-2 ring-red-400'
                : 'bg-slate-800/90 hover:bg-slate-700 text-slate-300 border-slate-600 hover:border-slate-500'
            }`}
          >
            {item.isNonCompliant ? (
              <>
                <AlertCircle className="w-4 h-4 text-white fill-red-800 shrink-0" />
                <span className="font-black text-white">UD (HATALI)</span>
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
        <div className="mt-3 pt-3 border-t border-red-500/30 space-y-1.5 animate-fadeIn">
          <div className="flex items-center justify-between text-[10px] font-bold text-red-300 uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-red-400" />
              <span>Uygunsuzluk / Hata Açıklaması</span>
            </span>
            {item.isRequiredDescription && (
              <span className="text-[10px] text-red-400 uppercase font-black">
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
            <p className="text-[11px] text-red-400 font-bold flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-red-400 shrink-0" />
              <span>Bu madde için açıklama girilmesi zorunludur.</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
};
