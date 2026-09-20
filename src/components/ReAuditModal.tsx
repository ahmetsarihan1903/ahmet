import React, { useState, useEffect } from 'react';
import {
  X,
  RotateCcw,
  Save,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { AuditFormData, InspectionItem } from '../types';
import { useTheme } from '../context/ThemeContext';

interface ReAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: AuditFormData;
  onSaveReAudit: (updatedData: AuditFormData) => void;
}

interface ItemRef {
  listKey: keyof AuditFormData;
  itemId: string;
  category: string;
  item: InspectionItem;
}

export const ReAuditModal: React.FC<ReAuditModalProps> = ({
  isOpen,
  onClose,
  data,
  onSaveReAudit,
}) => {
  const { isDark } = useTheme();

  // Working state copy of entire formData
  const [workingData, setWorkingData] = useState<AuditFormData>(() =>
    JSON.parse(JSON.stringify(data))
  );

  const [inspectorName, setInspectorName] = useState<string>(
    data.reAuditInspector || data.inspectorName || ''
  );

  const [reAuditDate, setReAuditDate] = useState<string>(() => {
    if (data.reAuditDate) return data.reAuditDate;
    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = now.getFullYear();
    const h = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    return `${d}.${m}.${y} ${h}:${min}`;
  });

  // Sync when data prop changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setWorkingData(JSON.parse(JSON.stringify(data)));
      setInspectorName(data.reAuditInspector || data.inspectorName || '');
      if (!data.reAuditDate) {
        const now = new Date();
        const d = String(now.getDate()).padStart(2, '0');
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const y = now.getFullYear();
        const h = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        setReAuditDate(`${d}.${m}.${y} ${h}:${min}`);
      } else {
        setReAuditDate(data.reAuditDate);
      }
    }
  }, [isOpen, data]);

  if (!isOpen) return null;

  // Extract all items that are either marked as non-compliant or were previously non-compliant
  const nonCompliantItems: ItemRef[] = [];

  const checkCategory = (listKey: keyof AuditFormData, categoryName: string) => {
    const list = workingData[listKey] as InspectionItem[] | undefined;
    if (Array.isArray(list)) {
      list.forEach((item) => {
        if (item.isNonCompliant) {
          nonCompliantItems.push({
            listKey,
            itemId: item.id,
            category: categoryName,
            item,
          });
        }
      });
    }
  };

  checkCategory('controlPanelItems', 'Kumanda Panosu');
  checkCategory('motorChassisItems', `Motor / Şase (${workingData.elevatorType})`);
  checkCategory('cabinTopItems', 'Kabin Üstü');
  checkCategory('counterweightItems', 'Ağırlık Karkası');
  checkCategory('shaftAndPitItems', 'Kuyu ve Dip');
  checkCategory('cabinAndFloorButtonsItems', 'Kabin ve Butonlar');
  checkCategory('doorsItems', 'Kapılar');

  const totalUDCount = nonCompliantItems.length + (workingData.rideComfortNonCompliant ? 1 : 0);
  
  const resolvedCount =
    nonCompliantItems.filter((i) => i.item.isResolved).length +
    (workingData.rideComfortNonCompliant && workingData.rideComfortResolved ? 1 : 0);

  // Toggle single item resolved status
  const handleToggleItemResolved = (listKey: keyof AuditFormData, itemId: string, isResolved: boolean) => {
    setWorkingData((prev) => {
      const copy = { ...prev };
      const list = copy[listKey] as InspectionItem[];
      if (Array.isArray(list)) {
        copy[listKey] = list.map((it) => {
          if (it.id === itemId) {
            return {
              ...it,
              isResolved,
              resolvedAt: isResolved ? reAuditDate : undefined,
              resolutionNote: isResolved ? (it.resolutionNote || 'Giderildi / Düzeltildi') : '',
            };
          }
          return it;
        }) as any;
      }
      return copy;
    });
  };

  // Update item resolution note
  const handleResolutionNoteChange = (listKey: keyof AuditFormData, itemId: string, note: string) => {
    setWorkingData((prev) => {
      const copy = { ...prev };
      const list = copy[listKey] as InspectionItem[];
      if (Array.isArray(list)) {
        copy[listKey] = list.map((it) => {
          if (it.id === itemId) {
            return {
              ...it,
              resolutionNote: note,
            };
          }
          return it;
        }) as any;
      }
      return copy;
    });
  };

  // Toggle Comfort Resolution
  const handleToggleComfortResolved = (isResolved: boolean) => {
    setWorkingData((prev) => ({
      ...prev,
      rideComfortResolved: isResolved,
      rideComfortResolutionNote: isResolved
        ? prev.rideComfortResolutionNote || 'Seyir konforu test edildi ve uygun bulundu.'
        : '',
    }));
  };

  // Save changes
  const handleSave = () => {
    const finalData: AuditFormData = {
      ...workingData,
      reAuditDate: reAuditDate.trim(),
      reAuditInspector: inspectorName.trim(),
      reAuditCompleted: resolvedCount === totalUDCount && totalUDCount > 0,
    };
    onSaveReAudit(finalData);
    onClose();
  };

  return (
    <div
      id="reaudit-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-xs animate-fadeIn"
    >
      <div
        id="reaudit-modal-container"
        className={`w-full max-w-4xl max-h-[94vh] flex flex-col rounded-xl shadow-2xl border overflow-hidden ${
          isDark
            ? 'bg-slate-900 border-slate-700 text-slate-100'
            : 'bg-white border-slate-300 text-slate-900'
        }`}
      >
        {/* SADE VE YÜKSEKLİĞİ MİNİMUM BAŞLIK ÇUBUĞU */}
        <div
          className={`px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between border-b shrink-0 ${
            isDark
              ? 'bg-slate-950 border-slate-800 text-white'
              : 'bg-[#0A2647] border-[#0A2647] text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-amber-400 shrink-0" />
            <h2 className="text-sm sm:text-base font-black uppercase tracking-tight">
              Eksik Kapatma
            </h2>
            <span className="text-xs font-bold text-amber-400">
              ({resolvedCount}/{totalUDCount} Giderildi)
            </span>
          </div>

          <button
            type="button"
            id="btn-close-reaudit-header"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* EKSİK LİSTESİ - KOMPAKT TASARIM: TABLETTE EN AZ 3-4 MADDE DİREKT GÖRÜNÜR */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-2">
          {totalUDCount === 0 ? (
            <div
              className={`p-6 text-center rounded-xl border ${
                isDark
                  ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}
            >
              <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-1.5" />
              <h3 className="text-sm font-black uppercase">
                Kapatılacak Eksik Madde Bulunmuyor
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Tüm kontroller uygun veya giderilmiştir.
              </p>
            </div>
          ) : (
            nonCompliantItems.map((entry, idx) => {
              const isItemResolved = !!entry.item.isResolved;

              return (
                <div
                  key={entry.itemId}
                  className={`p-2 sm:p-2.5 rounded-lg border transition-all ${
                    isItemResolved
                      ? isDark
                        ? 'bg-emerald-950/25 border-emerald-500/50'
                        : 'bg-emerald-50 border-emerald-300'
                      : isDark
                      ? 'bg-slate-800/90 border-rose-500/50'
                      : 'bg-rose-50/90 border-rose-300'
                  }`}
                >
                  {/* Satır 1: No, Kategori/Kat, Başlık ve Hızlı Durum Butonları */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <span
                        className={`w-5 h-5 rounded-md text-[11px] font-black flex items-center justify-center shrink-0 ${
                          isItemResolved ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <span
                          className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded shrink-0 ${
                            isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-800'
                          }`}
                        >
                          {entry.category}
                        </span>
                        {entry.item.floorLabel && (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 shrink-0">
                            Kat {entry.item.floorLabel}
                          </span>
                        )}
                        <h4 className="text-xs sm:text-sm font-bold truncate">
                          {entry.item.title}
                        </h4>
                      </div>
                    </div>

                    {/* Hızlı Butonlar: Yapıldı / Kaldı */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleItemResolved(entry.listKey, entry.itemId, true)}
                        className={`px-2.5 py-1 rounded text-xs font-black uppercase flex items-center gap-1 transition-all cursor-pointer select-none active:scale-95 ${
                          isItemResolved
                            ? 'bg-emerald-600 text-white ring-2 ring-emerald-400 shadow-sm font-black'
                            : isDark
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700'
                            : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-300'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Yapıldı</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleItemResolved(entry.listKey, entry.itemId, false)}
                        className={`px-2.5 py-1 rounded text-xs font-black uppercase flex items-center gap-1 transition-all cursor-pointer select-none active:scale-95 ${
                          !isItemResolved
                            ? 'bg-rose-600 text-white ring-2 ring-rose-400 shadow-sm font-black'
                            : isDark
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700'
                            : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-300'
                        }`}
                      >
                        <X className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Kaldı</span>
                      </button>
                    </div>
                  </div>

                  {/* Satır 2: Hata Özeti ve Kompakt Kapatma Notu */}
                  <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="text-[11px] truncate flex items-center gap-1">
                      <span className="font-bold text-rose-500 shrink-0">Hata:</span>
                      <span className="truncate text-slate-300 font-medium">
                        {entry.item.description || 'Uygunsuzluk girildi'}
                      </span>
                    </div>

                    <div>
                      <input
                        type="text"
                        value={entry.item.resolutionNote || ''}
                        onChange={(e) =>
                          handleResolutionNoteChange(entry.listKey, entry.itemId, e.target.value)
                        }
                        placeholder="Kapatma notu (opsiyonel)..."
                        className={`w-full px-2 py-0.5 rounded text-[11px] border ${
                          isDark
                            ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-400'
                            : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-emerald-600'
                        } outline-hidden`}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* SEYİR VE KONFOR UYGUNSUZLUĞU (VARSA) */}
          {workingData.rideComfortNonCompliant && (
            <div
              className={`p-2 sm:p-2.5 rounded-lg border transition-all ${
                workingData.rideComfortResolved
                  ? isDark
                    ? 'bg-emerald-950/25 border-emerald-500/50'
                    : 'bg-emerald-50 border-emerald-300'
                  : isDark
                  ? 'bg-slate-800/90 border-rose-500/50'
                  : 'bg-rose-50/90 border-rose-300'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                    Seyir ve Konfor
                  </span>
                  <h4 className="text-xs sm:text-sm font-bold truncate">
                    Seyir ve Konfor Uygunsuzluğu
                  </h4>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleComfortResolved(true)}
                    className={`px-2.5 py-1 rounded text-xs font-black uppercase flex items-center gap-1 cursor-pointer ${
                      workingData.rideComfortResolved
                        ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                        : isDark
                        ? 'bg-slate-800 text-slate-400 border border-slate-700'
                        : 'bg-white text-slate-600 border border-slate-300'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Yapıldı</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleComfortResolved(false)}
                    className={`px-2.5 py-1 rounded text-xs font-black uppercase flex items-center gap-1 cursor-pointer ${
                      !workingData.rideComfortResolved
                        ? 'bg-rose-600 text-white ring-2 ring-rose-400'
                        : isDark
                        ? 'bg-slate-800 text-slate-400 border border-slate-700'
                        : 'bg-white text-slate-600 border border-slate-300'
                    }`}
                  >
                    <X className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Kaldı</span>
                  </button>
                </div>
              </div>

              <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="text-[11px] truncate flex items-center gap-1">
                  <span className="font-bold text-rose-500 shrink-0">İlk Not:</span>
                  <span className="truncate text-slate-300 font-medium">
                    {workingData.rideComfortNotes || '-'}
                  </span>
                </div>

                <div>
                  <input
                    type="text"
                    value={workingData.rideComfortResolutionNote || ''}
                    onChange={(e) =>
                      setWorkingData((p) => ({
                        ...p,
                        rideComfortResolutionNote: e.target.value,
                      }))
                    }
                    placeholder="Konfor kapatma notu..."
                    className={`w-full px-2 py-0.5 rounded text-[11px] border ${
                      isDark
                        ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-400'
                        : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-emerald-600'
                    } outline-hidden`}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER: SADECE VAZGEÇ VE KAYDET & RAPORU GÜNCELLE */}
        <div
          className={`p-2.5 sm:p-3 border-t shrink-0 flex items-center justify-end gap-2.5 ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}
        >
          <button
            type="button"
            id="btn-cancel-reaudit"
            onClick={onClose}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border cursor-pointer transition-colors ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                : 'bg-white hover:bg-slate-200 border-slate-300 text-slate-700'
            }`}
          >
            Vazgeç
          </button>

          <button
            type="button"
            id="btn-save-reaudit"
            onClick={handleSave}
            className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white rounded-lg text-xs sm:text-sm font-black uppercase tracking-wider flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Kaydet ve Raporu Güncelle</span>
          </button>
        </div>
      </div>
    </div>
  );
};
