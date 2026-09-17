import React from 'react';
import { X, History, ArrowRight, Clock, Calendar, FileEdit, Trash2, CheckCircle2 } from 'lucide-react';
import { AuditFormData } from '../types';
import { getAuditHistory, deleteAuditFromHistory, loadActiveDraft } from '../utils/storage';

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
  const [historyList, setHistoryList] = React.useState<AuditFormData[]>([]);

  React.useEffect(() => {
    if (isOpen) {
      setHistoryList(getAuditHistory());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const activeDraft = loadActiveDraft();

  const countIssues = (item: AuditFormData) => {
    let count = 0;
    const all = [
      ...(item.controlPanelItems || []),
      ...(item.motorChassisItems || []),
      ...(item.cabinTopItems || []),
      ...(item.counterweightItems || []),
      ...(item.shaftAndPitItems || []),
      ...(item.cabinAndFloorButtonsItems || []),
      ...(item.doorsItems || []),
    ];
    count += all.filter((i) => i.isNonCompliant).length;
    if (item.rideComfortNonCompliant) count += 1;
    return count;
  };

  const handleDeleteItem = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    const updated = deleteAuditFromHistory(index);
    setHistoryList([...updated]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
      <div className="bg-slate-900 rounded-xl max-w-xl w-full p-4 sm:p-5 shadow-2xl border border-slate-800 text-slate-100 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-100 uppercase tracking-wider">
                Kayıtlı Denetimler & Taslaklar
              </h3>
              <p className="text-[10px] text-slate-400 font-medium">
                Cihaz yerel hafızasındaki tüm rapor ve taslak kayıtları
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-0.5">
          {/* Active Draft Banner */}
          {hasActiveDraft && activeDraft && (
            <div className="p-3 bg-amber-950/40 rounded-lg border-2 border-amber-500/50 flex items-center justify-between gap-2.5">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1">
                    <FileEdit className="w-3.5 h-3.5 text-amber-400" />
                    Aktif Çalışma Taslağı
                  </span>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {activeDraft.currentStep.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-200 truncate mt-0.5">
                  {activeDraft.clientProjectName || 'İsimsiz Proje'} — {activeDraft.serialNumber || 'SN Yok'}
                </p>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                  <span>{activeDraft.dateDisplay}</span>
                  <span>•</span>
                  <span>{activeDraft.startTime || 'Saat Yok'}</span>
                  <span>•</span>
                  <span className="text-red-400 font-bold">{countIssues(activeDraft)} UD</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onRestoreDraft();
                  onClose();
                }}
                className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-black shrink-0 transition-all shadow-md uppercase tracking-wider cursor-pointer"
              >
                Geri Yükle
              </button>
            </div>
          )}

          {/* Past Completed Audits */}
          <div className="flex items-center justify-between pt-1">
            <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-200">
              Kayıtlı Rapor & Taslak Geçmişi ({historyList.length})
            </h4>
            <span className="text-[10px] text-slate-400">Seçtiğiniz kaydı ekrana aktarır</span>
          </div>

          {historyList.length === 0 ? (
            <div className="p-6 text-center bg-slate-950 rounded-lg border border-slate-800">
              <p className="text-xs text-slate-400">Henüz kaydedilmiş bir denetim bulunmuyor.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {historyList.map((item, idx) => {
                const udCount = countIssues(item);
                const isReport = item.currentStep === 'report';

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      onSelectAudit(item);
                      onClose();
                    }}
                    className="p-3 bg-slate-950 hover:bg-slate-850 rounded-lg border border-slate-800 hover:border-blue-500 transition-all cursor-pointer flex items-center justify-between gap-2.5 group shadow-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-slate-100 truncate">
                          {item.clientProjectName || 'İsimsiz Proje'}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          [{item.elevatorType}] {item.serialNumber || 'SN Yok'}
                        </span>
                        {isReport ? (
                          <span className="px-1.5 py-0.2 text-[9px] font-bold bg-emerald-950 text-emerald-400 rounded flex items-center gap-0.5">
                            <CheckCircle2 className="w-2.5 h-2.5" /> Rapor
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 text-[9px] font-bold bg-amber-950 text-amber-400 rounded flex items-center gap-0.5">
                            <FileEdit className="w-2.5 h-2.5" /> Taslak
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2.5 text-[10px] text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {item.dateDisplay}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {item.totalDurationFormatted || item.startTime || 'Saat Yok'}
                        </span>
                        <span className={`font-bold ${udCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                          {udCount} UD
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleDeleteItem(e, idx)}
                        title="Bu kaydı sil"
                        className="p-1.5 text-slate-500 hover:text-red-400 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <div className="px-2.5 py-1.5 bg-blue-600 group-hover:bg-blue-500 text-white rounded text-xs font-bold flex items-center gap-1 transition-colors shadow-xs">
                        <span>Yükle</span>
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2.5 border-t border-slate-800 mt-3 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold border border-slate-700 uppercase tracking-wider cursor-pointer transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
