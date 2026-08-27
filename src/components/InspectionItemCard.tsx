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
      className={`rounded border transition-all ${
        item.isNonCompliant
          ? 'bg-red-950/40 border-red-500/80 shadow-md shadow-red-950/50'
          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
      } p-3 sm:p-3.5`}
    >
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
          </div>

          <h3 className={`text-xs sm:text-sm font-semibold mt-1 break-words ${
            item.isNonCompliant ? 'text-red-200' : 'text-slate-200'
          }`}>
            {item.title}
          </h3>

          {item.isRequiredDescription && (
            <p className="text-[11px] text-amber-400/90 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
              <span>UD durumunda açıklama yazılması zorunludur</span>
            </p>
          )}
        </div>

        {/* Action Controls: [ UD ] Button + Optional Delete */}
        <div className="flex items-center gap-2 shrink-0">
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
        <div className="mt-3 pt-2.5 border-t border-red-500/30 space-y-1.5 animate-fadeIn">
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
