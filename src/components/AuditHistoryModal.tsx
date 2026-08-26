import React from 'react';
import { X, History, ArrowRight, Clock, Calendar } from 'lucide-react';
import { AuditFormData } from '../types';
import { getAuditHistory } from '../utils/storage';

interface AuditHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAudit: (data: AuditFormData) => void;
  hasActiveDraft: boolean;
  onRestoreDraft: () => void;
}

export const AuditHistoryModal: React.FC<AuditHistoryModalProps> = ({
  isOpen,
  onClose,
  onSelectAudit,
  hasActiveDraft,
  onRestoreDraft,
}) => {
  if (!isOpen) return null;

  const history = getAuditHistory();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-lg max-w-xl w-full p-4 sm:p-5 shadow-xl border border-slate-300 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-[#0A2647] text-white flex items-center justify-center font-bold">
              <History className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 uppercase tracking-wider">Kayıtlı Denetimler & Geçmiş</h3>
              <p className="text-[10px] text-slate-500">Cihazınızda yerel tutulan raporlar</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {/* Active Draft Banner */}
          {hasActiveDraft && (
            <div className="p-3 bg-amber-50 rounded border border-amber-300 flex items-center justify-between gap-2.5">
              <div>
                <span className="text-xs font-bold text-amber-950 block">
                  Kayıtlı Aktif Taslak Bulundu
                </span>
                <span className="text-[11px] text-amber-800">
                  Yarım kalan denetiminize kaldığınız yerden devam edebilirsiniz.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onRestoreDraft();
                  onClose();
                }}
                className="px-2.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded text-xs font-bold shrink-0 transition-colors shadow-xs uppercase tracking-wider"
              >
                Taslağı Yükle
              </button>
            </div>
          )}

          {/* Past Completed Audits */}
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 pt-1">
            Tamamlanan Raporlar ({history.length})
          </h4>

          {history.length === 0 ? (
            <div className="p-6 text-center bg-slate-50 rounded border border-slate-200">
              <p className="text-xs text-slate-500">Henüz tamamlanmış bir denetim kaydı bulunmuyor.</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {history.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    onSelectAudit(item);
                    onClose();
                  }}
                  className="p-2.5 bg-white hover:bg-slate-50 rounded border border-slate-300 hover:border-blue-400 transition-all cursor-pointer flex items-center justify-between gap-2.5 group"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {item.clientProjectName || 'İsimsiz Proje'}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        [{item.elevatorType}] {item.serialNumber}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5 text-[10px] text-slate-500 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {item.dateDisplay}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {item.totalDurationFormatted || item.startTime}
                      </span>
                    </div>
                  </div>

                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-700 transition-colors shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2.5 border-t border-slate-200 mt-3 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-bold border border-slate-300 uppercase tracking-wider"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
