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
      className={`rounded-xl transition-all border-2 ${
        item.isNonCompliant
          ? 'bg-red-50 border-red-500 shadow-md ring-2 ring-red-300'
          : 'bg-white border-slate-300 hover:border-slate-400 shadow-xs'
      } p-3.5 sm:p-4`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Item Title & Index */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-mono font-black text-slate-500 uppercase">
              #{index + 1}
            </span>
            {item.floorLabel && (
              <span className="text-xs font-black px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-300 uppercase">
                {item.floorLabel}
              </span>
            )}
            {item.isCustom && (
              <span className="text-xs font-black px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 uppercase">
                Ekstra Madde
              </span>
            )}
          </div>

          <h3 className={`text-sm font-black mt-1 break-words leading-snug ${
            item.isNonCompliant ? 'text-red-950' : 'text-slate-950'
          }`}>
            {item.title}
          </h3>

          {item.isRequiredDescription && (
            <p className="text-[11px] text-amber-800 font-bold mt-1 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
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
              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {/* High Contrast [ UD ] (Uygun Değil) Button for Tablet Sunlight & Visibility */}
          <button
            type="button"
            id={`btn-ud-${item.id}`}
            onClick={() => onToggleUD(item.id)}
            className={`min-h-[44px] px-4 py-2 rounded-lg font-black text-xs sm:text-sm tracking-wider uppercase transition-all shadow-md active:scale-95 flex items-center gap-2 border-2 cursor-pointer ${
              item.isNonCompliant
                ? 'bg-red-600 hover:bg-red-700 text-white border-red-800 shadow-red-200 ring-2 ring-red-400'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
            }`}
          >
            {item.isNonCompliant ? (
              <>
                <AlertCircle className="w-4 h-4 text-white shrink-0" />
                <span className="font-black text-white">UD (HATALI)</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-slate-500 shrink-0" />
                <span>[ UD ]</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Expandable Free-Text Description Area when UD is active */}
      {item.isNonCompliant && (
        <div className="mt-3.5 pt-3 border-t-2 border-red-200 space-y-1.5 animate-fadeIn">
          <div className="flex items-center justify-between text-xs font-black text-red-900 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span>Uygunsuzluk / Hata Açıklaması</span>
            </span>
            {item.isRequiredDescription && (
              <span className="text-[11px] text-red-700 uppercase font-black">
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
              <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
              <span>Bu madde için açıklama girilmesi zorunludur.</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
};
