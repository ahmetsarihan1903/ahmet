import React from 'react';
import { X, AlertTriangle, FileText } from 'lucide-react';
import { SmartTextInput } from './SmartTextInput';
import { BetaLogo } from './BetaLogo';

interface Step4FinalComfortModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalUDCount: number;
  rideComfortNonCompliant: boolean;
  rideComfortNotes: string;
  onToggleRideComfortUD: () => void;
  onRideComfortNotesChange: (notes: string) => void;
  onGenerateReport: () => void;
}

export const Step4FinalComfortModal: React.FC<Step4FinalComfortModalProps> = ({
  isOpen,
  onClose,
  totalUDCount,
  rideComfortNonCompliant,
  rideComfortNotes,
  onToggleRideComfortUD,
  onRideComfortNotesChange,
  onGenerateReport,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-lg max-w-lg w-full p-4 sm:p-5 shadow-xl border border-slate-300 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3.5">
          <div className="flex items-center gap-2.5">
            <BetaLogo size="sm" className="shadow-xs shrink-0" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase text-orange-600 tracking-wider">
                  ADIM 4 / 4
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Son Onay</span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Denetimi Bitir & Konfor Kontrolü
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Audit Status Overview */}
        <div className="mb-3.5 p-3 rounded bg-slate-50 border border-slate-300 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Tespit Edilen Hatalar:</span>
            <span className={`text-xs sm:text-sm font-extrabold ${totalUDCount > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
              {totalUDCount > 0 ? `${totalUDCount} Adet Uygunsuzluk (UD)` : 'Kusursuz / Hata Tespit Edilmedi'}
            </span>
          </div>
          <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
            totalUDCount > 0 ? 'bg-red-50 text-red-800 border-red-300' : 'bg-emerald-50 text-emerald-800 border-emerald-300'
          }`}>
            {totalUDCount > 0 ? 'Hatalı Maddeler Raporlanacak' : 'Temiz Rapor'}
          </div>
        </div>

        {/* Mandatory Final Ride Comfort Check Item */}
        <div className={`rounded p-3 border transition-all ${
          rideComfortNonCompliant
            ? 'bg-red-50/70 border-red-300 ring-1 ring-red-300'
            : 'bg-white border-slate-300'
        }`}>
          <div className="flex items-start justify-between gap-2.5">
            <div className="flex-1">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                Asansör Seyir ve Konfor Uygunsuzluğu
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Kabin seyir esnasında sarsıntı, gürültü, rezonans, ani duruş veya kalkış hissi var mı?
              </p>
            </div>

            {/* UD Toggle Button */}
            <button
              type="button"
              id="btn-ud-comfort"
              onClick={onToggleRideComfortUD}
              className={`px-2.5 py-1.5 rounded font-bold text-xs uppercase tracking-wider transition-all shadow-xs shrink-0 flex items-center gap-1 border ${
                rideComfortNonCompliant
                  ? 'bg-red-600 text-white border-red-700 ring-1 ring-red-300'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300'
              }`}
            >
              {rideComfortNonCompliant ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-white" />
                  <span>UD (Uygun Değil)</span>
                </>
              ) : (
                <span>[ UD ]</span>
              )}
            </button>
          </div>

          {/* If Comfort UD is selected: Textarea */}
          {rideComfortNonCompliant && (
            <div className="mt-2.5 pt-2.5 border-t border-red-200 space-y-1 animate-fadeIn">
              <label htmlFor="desc-ride-comfort" className="block text-[10px] font-bold text-red-900 uppercase tracking-wider">
                Konfor Şikayetleri ve Sarsıntı Detayı:
              </label>
              <SmartTextInput
                id="desc-ride-comfort"
                value={rideComfortNotes}
                onChange={onRideComfortNotesChange}
                placeholder="Örn: 3. ve 4. kat arasında kılavuz ray sürtmesi ve sarsıntı mevcut..."
                isTextarea
                rows={3}
                required
              />
            </div>
          )}
        </div>

        {/* Bottom Buttons */}
        <div className="mt-4 space-y-2">
          <button
            type="button"
            id="btn-generate-report"
            onClick={onGenerateReport}
            className="w-full py-3 px-4 rounded font-bold text-xs uppercase tracking-wider text-white bg-[#0A2647] hover:bg-[#081f3a] active:scale-[0.99] transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>[ FORMU OLUŞTUR VE RAPORLA ]</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 px-3 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
          >
            Denetime Devam Et (Geri Dön)
          </button>
        </div>
      </div>
    </div>
  );
};
