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
          ? 'bg-red-50/70 border-red-300 shadow-xs ring-1 ring-red-300'
          : 'bg-white border-slate-300 hover:border-slate-400'
      } p-2.5 sm:p-3`}
    >
      <div className="flex items-start justify-between gap-2.5">
        {/* Item Title & Index */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
              #{index + 1}
            </span>
            {item.floorLabel && (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-900 border border-blue-200 uppercase">
                {item.floorLabel}
              </span>
            )}
            {item.isCustom && (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300 uppercase">
                Ekstra Madde
              </span>
            )}
          </div>

          <h3 className={`text-xs sm:text-sm font-bold mt-0.5 break-words leading-snug ${
            item.isNonCompliant ? 'text-red-950 font-black' : 'text-slate-900'
          }`}>
            {item.title}
          </h3>

          {item.isRequiredDescription && (
            <p className="text-[10px] text-amber-800 font-semibold mt-0.5 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-amber-700" />
              <span>UD durumunda açıklama yazılması zorunludur</span>
            </p>
          )}
        </div>

        {/* Action Controls: [ UD ] Button + Optional Delete */}
        <div className="flex items-center gap-1 shrink-0">
          {item.isCustom && onDeleteCustomItem && (
            <button
              type="button"
              onClick={() => onDeleteCustomItem(item.id)}
              title="Bu ekstra maddeyi sil"
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* [ UD ] (Uygun Değil) Button */}
          <button
            type="button"
            id={`btn-ud-${item.id}`}
            onClick={() => onToggleUD(item.id)}
            className={`px-2.5 py-1.5 rounded font-bold text-[11px] sm:text-xs tracking-wider uppercase transition-all shadow-xs active:scale-95 flex items-center gap-1 border ${
              item.isNonCompliant
                ? 'bg-red-600 hover:bg-red-700 text-white border-red-700 ring-1 ring-red-300'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
            }`}
          >
            {item.isNonCompliant ? (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-white" />
                <span>UD (Uygun Değil)</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3 h-3 text-slate-400" />
                <span>[ UD ]</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Expandable Free-Text Description Area when UD is active */}
      {item.isNonCompliant && (
        <div className="mt-2.5 pt-2.5 border-t border-red-200 space-y-1 animate-fadeIn">
          <div className="flex items-center justify-between text-[10px] font-bold text-red-900 uppercase tracking-wider">
            <span>Uygunsuzluk / Hata Açıklaması</span>
            {item.isRequiredDescription && (
              <span className="text-[10px] text-red-700 uppercase font-black">
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
            <p className="text-[11px] text-red-700 font-bold flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              <span>Bu madde için açıklama girilmesi zorunludur.</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
};
