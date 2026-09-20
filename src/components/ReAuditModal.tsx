import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Save,
  Undo2,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  User,
  Check,
  AlertCircle,
  FileCheck2,
  Sparkles,
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

  const [showConfirmReset, setShowConfirmReset] = useState(false);

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
      setShowConfirmReset(false);
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
  checkCategory('cabinTopItems', 'Kabin Üstü Kontrolleri');
  checkCategory('counterweightItems', 'Ağırlık Karkası Kontrolleri');
  checkCategory('shaftAndPitItems', 'Kuyu İçerisi ve Kuyu Dibi');
  checkCategory('cabinAndFloorButtonsItems', 'Kabin İçi ve Kat Butonları');
  checkCategory('doorsItems', 'Kabin ve Kat Kapısı Montajları');

  const totalUDCount = nonCompliantItems.length + (workingData.rideComfortNonCompliant ? 1 : 0);
  
  const resolvedCount =
    nonCompliantItems.filter((i) => i.item.isResolved).length +
    (workingData.rideComfortNonCompliant && workingData.rideComfortResolved ? 1 : 0);

  const pendingCount = totalUDCount - resolvedCount;

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

  // Mark all resolved
  const handleMarkAllResolved = () => {
    setWorkingData((prev) => {
      const copy = { ...prev };
      const keys: (keyof AuditFormData)[] = [
        'controlPanelItems',
        'motorChassisItems',
        'cabinTopItems',
        'counterweightItems',
        'shaftAndPitItems',
        'cabinAndFloorButtonsItems',
        'doorsItems',
      ];

      keys.forEach((k) => {
        const list = copy[k] as InspectionItem[];
        if (Array.isArray(list)) {
          copy[k] = list.map((it) => {
            if (it.isNonCompliant) {
              return {
                ...it,
                isResolved: true,
                resolvedAt: reAuditDate,
                resolutionNote: it.resolutionNote || 'Giderildi / Düzeltildi',
              };
            }
            return it;
          }) as any;
        }
      });

      if (copy.rideComfortNonCompliant) {
        copy.rideComfortResolved = true;
        copy.rideComfortResolutionNote =
          copy.rideComfortResolutionNote || 'Seyir konforu test edildi ve uygun bulundu.';
      }

      return copy;
    });
  };

  // Reset all to original initial state (Revert punch list)
  const handleResetToOriginal = () => {
    setWorkingData((prev) => {
      const copy = { ...prev };
      const keys: (keyof AuditFormData)[] = [
        'controlPanelItems',
        'motorChassisItems',
        'cabinTopItems',
        'counterweightItems',
        'shaftAndPitItems',
        'cabinAndFloorButtonsItems',
        'doorsItems',
      ];

      keys.forEach((k) => {
        const list = copy[k] as InspectionItem[];
        if (Array.isArray(list)) {
          copy[k] = list.map((it) => {
            return {
              ...it,
              isResolved: false,
              resolvedAt: undefined,
              resolutionNote: undefined,
            };
          }) as any;
        }
      });

      copy.rideComfortResolved = false;
      copy.rideComfortResolutionNote = undefined;
      copy.reAuditCompleted = false;
      copy.reAuditDate = undefined;
      copy.reAuditInspector = undefined;

      return copy;
    });
    setShowConfirmReset(false);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
      <div
        className={`w-full max-w-4xl max-h-[92vh] flex flex-col rounded-xl shadow-2xl border-2 overflow-hidden ${
          isDark
            ? 'bg-slate-900 border-slate-700 text-slate-100'
            : 'bg-white border-slate-300 text-slate-900'
        }`}
      >
        {/* MODAL HEADER */}
        <div
          className={`p-4 sm:p-5 flex items-center justify-between border-b-2 shrink-0 ${
            isDark
              ? 'bg-slate-950 border-slate-800 text-white'
              : 'bg-[#0A2647] border-[#0A2647] text-white'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0">
              <RotateCcw className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight uppercase">
                  Eksik Kapatma &amp; Yeniden Muayene
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500 text-slate-950 uppercase">
                  Punch List
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {workingData.clientProjectName || 'Proje'} &bull; Seri No:{' '}
                <span className="font-mono font-bold text-amber-300">
                  {workingData.serialNumber || 'BETA-QC'}
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* METRICS & QUICK CONTROLS BAR */}
        <div
          className={`p-3.5 sm:p-4 border-b shrink-0 flex flex-wrap items-center justify-between gap-3 ${
            isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-100 border-slate-200'
          }`}
        >
          {/* Status Counter Chips */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span
              className={`px-3 py-1.5 rounded-md font-bold flex items-center gap-1.5 border ${
                isDark
                  ? 'bg-slate-900 border-slate-700 text-slate-200'
                  : 'bg-white border-slate-300 text-slate-800'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-red-500" />
              <span>Toplam Eksik:</span>
              <strong className="font-black text-red-500">{totalUDCount}</strong>
            </span>

            <span
              className={`px-3 py-1.5 rounded-md font-bold flex items-center gap-1.5 border ${
                resolvedCount === totalUDCount && totalUDCount > 0
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                  : isDark
                  ? 'bg-slate-900 border-slate-700 text-emerald-400'
                  : 'bg-white border-slate-300 text-emerald-700'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Giderilen (Yapılan):</span>
              <strong className="font-black text-emerald-500">{resolvedCount}</strong>
            </span>

            <span
              className={`px-3 py-1.5 rounded-md font-bold flex items-center gap-1.5 border ${
                pendingCount > 0
                  ? 'bg-red-500/20 border-red-500 text-red-400'
                  : isDark
                  ? 'bg-slate-900 border-slate-700 text-slate-400'
                  : 'bg-white border-slate-300 text-slate-500'
              }`}
            >
              <XCircle className="w-4 h-4 text-red-500" />
              <span>Kalan Eksik:</span>
              <strong className="font-black text-red-500">{pendingCount}</strong>
            </span>
          </div>

          {/* Quick Bulk Action */}
          {totalUDCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllResolved}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tümünü Giderildi Yap</span>
            </button>
          )}
        </div>

        {/* RE-AUDIT INSPECTOR & DATE ROW */}
        <div
          className={`px-4 py-3 border-b grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0 ${
            isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1">
              <User className="w-3.5 h-3.5 text-cyan-400" />
              <span>Tekrar Kontrol Eden Denetçi:</span>
            </label>
            <input
              type="text"
              value={inspectorName}
              onChange={(e) => setInspectorName(e.target.value)}
              placeholder="Denetçi / Mühendis Adı"
              className={`w-full px-3 py-1.5 rounded-md text-xs font-bold border ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-white focus:border-cyan-400'
                  : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-600'
              } outline-hidden`}
            />
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span>Eksik Kapatma Tarihi &amp; Saati:</span>
            </label>
            <input
              type="text"
              value={reAuditDate}
              onChange={(e) => setReAuditDate(e.target.value)}
              placeholder="Örn: 17.09.2026 14:30"
              className={`w-full px-3 py-1.5 rounded-md text-xs font-bold border ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-white focus:border-cyan-400'
                  : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-600'
              } outline-hidden`}
            />
          </div>
        </div>

        {/* SCROLLABLE LIST OF NON-COMPLIANT ITEMS */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {totalUDCount === 0 ? (
            <div
              className={`p-8 text-center rounded-xl border-2 ${
                isDark
                  ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}
            >
              <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
              <h3 className="text-base font-black uppercase tracking-wider">
                Kapatılacak Eksik Madde Bulunmuyor
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Bu asansörde ilk denetimde herhangi bir uygunsuzluk (UD) kaydı açılmamıştır veya tüm kontroller eksiksiz geçmiştir.
              </p>
            </div>
          ) : (
            nonCompliantItems.map((entry, idx) => {
              const isItemResolved = !!entry.item.isResolved;

              return (
                <div
                  key={entry.itemId}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    isItemResolved
                      ? isDark
                        ? 'bg-emerald-950/20 border-emerald-500/60 shadow-xs shadow-emerald-950/50'
                        : 'bg-emerald-50/80 border-emerald-400 shadow-xs'
                      : isDark
                      ? 'bg-slate-800/90 border-red-500/50'
                      : 'bg-red-50/70 border-red-300'
                  }`}
                >
                  {/* ITEM HEADER */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-700/40">
                    <div className="flex items-start gap-2.5">
                      <span
                        className={`w-6 h-6 rounded-full font-black text-xs flex items-center justify-center shrink-0 ${
                          isItemResolved
                            ? 'bg-emerald-500 text-white'
                            : 'bg-red-500 text-white'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                              isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-800'
                            }`}
                          >
                            {entry.category}
                          </span>
                          {entry.item.floorLabel && (
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                              Kat: {entry.item.floorLabel}
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-black mt-1 leading-snug">
                          {entry.item.title}
                        </h4>
                      </div>
                    </div>

                    {/* STATUS TOGGLE BUTTONS */}
                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => handleToggleItemResolved(entry.listKey, entry.itemId, true)}
                        className={`px-3 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                          isItemResolved
                            ? 'bg-emerald-600 text-white ring-2 ring-emerald-400 shadow-md scale-102'
                            : isDark
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-600'
                            : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-300'
                        }`}
                      >
                        <Check className="w-4 h-4" />
                        <span>Giderildi (Yapıldı)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleItemResolved(entry.listKey, entry.itemId, false)}
                        className={`px-3 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                          !isItemResolved
                            ? 'bg-red-600 text-white ring-2 ring-red-400 shadow-md scale-102'
                            : isDark
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-600'
                            : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-300'
                        }`}
                      >
                        <X className="w-4 h-4" />
                        <span>Kaldı (UD)</span>
                      </button>
                    </div>
                  </div>

                  {/* INITIAL UD DESCRIPTION & RESOLUTION NOTE */}
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {/* Left: Original defect note */}
                    <div
                      className={`p-2.5 rounded-lg border ${
                        isDark
                          ? 'bg-red-950/30 border-red-900/50 text-red-200'
                          : 'bg-red-100/70 border-red-200 text-red-950'
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 block mb-0.5">
                        İlk Denetimde Yazılan Hata / Açıklama:
                      </span>
                      <p className="font-semibold">
                        {entry.item.description || '(Açıklama girilmedi - doğrudan UD işaretlendi)'}
                      </p>
                    </div>

                    {/* Right: Resolution Note */}
                    <div
                      className={`p-2.5 rounded-lg border ${
                        isItemResolved
                          ? isDark
                            ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
                            : 'bg-emerald-100/70 border-emerald-200 text-emerald-950'
                          : isDark
                          ? 'bg-slate-900/40 border-slate-800 text-slate-400'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <label className="text-[10px] font-bold uppercase tracking-wider block mb-1 text-slate-400">
                        {isItemResolved ? '✅ Giderilme / Kapatma Açıklaması:' : 'İşlem / Kapatma Notu:'}
                      </label>
                      <input
                        type="text"
                        value={entry.item.resolutionNote || ''}
                        onChange={(e) =>
                          handleResolutionNoteChange(entry.listKey, entry.itemId, e.target.value)
                        }
                        placeholder={
                          isItemResolved
                            ? 'Örn: Usta klemensi sıktı, yenisiyle değiştirildi.'
                            : 'Henüz yapılmadı...'
                        }
                        className={`w-full px-2.5 py-1 rounded text-xs font-semibold border ${
                          isDark
                            ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-400'
                            : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-emerald-600'
                        } outline-hidden`}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* RIDE COMFORT IF APPLICABLE */}
          {workingData.rideComfortNonCompliant && (
            <div
              className={`p-4 rounded-xl border-2 transition-all ${
                workingData.rideComfortResolved
                  ? isDark
                    ? 'bg-emerald-950/20 border-emerald-500/60'
                    : 'bg-emerald-50/80 border-emerald-400'
                  : isDark
                  ? 'bg-slate-800/90 border-red-500/50'
                  : 'bg-red-50/70 border-red-300'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-700/40">
                <div>
                  <span
                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                      isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-800'
                    }`}
                  >
                    Seyir ve Konfor
                  </span>
                  <h4 className="text-sm font-black mt-1">Seyir ve Konfor Uygunsuzluğu</h4>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => handleToggleComfortResolved(true)}
                    className={`px-3 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer ${
                      workingData.rideComfortResolved
                        ? 'bg-emerald-600 text-white ring-2 ring-emerald-400 shadow-md'
                        : isDark
                        ? 'bg-slate-800 text-slate-400 border border-slate-600'
                        : 'bg-white text-slate-600 border border-slate-300'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    <span>Giderildi</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleComfortResolved(false)}
                    className={`px-3 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer ${
                      !workingData.rideComfortResolved
                        ? 'bg-red-600 text-white ring-2 ring-red-400 shadow-md'
                        : isDark
                        ? 'bg-slate-800 text-slate-400 border border-slate-600'
                        : 'bg-white text-slate-600 border border-slate-300'
                    }`}
                  >
                    <X className="w-4 h-4" />
                    <span>Kaldı (UD)</span>
                  </button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div
                  className={`p-2.5 rounded-lg border ${
                    isDark
                      ? 'bg-red-950/30 border-red-900/50 text-red-200'
                      : 'bg-red-100/70 border-red-200 text-red-950'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 block mb-0.5">
                    İlk Konfor Notu:
                  </span>
                  <p className="font-semibold">{workingData.rideComfortNotes || '-'}</p>
                </div>

                <div
                  className={`p-2.5 rounded-lg border ${
                    workingData.rideComfortResolved
                      ? isDark
                        ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
                        : 'bg-emerald-100/70 border-emerald-200 text-emerald-950'
                      : isDark
                      ? 'bg-slate-900/40 border-slate-800 text-slate-400'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <label className="text-[10px] font-bold uppercase tracking-wider block mb-1 text-slate-400">
                    Konfor Kapatma Notu:
                  </label>
                  <input
                    type="text"
                    value={workingData.rideComfortResolutionNote || ''}
                    onChange={(e) =>
                      setWorkingData((p) => ({
                        ...p,
                        rideComfortResolutionNote: e.target.value,
                      }))
                    }
                    placeholder="Örn: Ray yağlandı, paten ayarı yapıldı, titreşim kesildi."
                    className={`w-full px-2.5 py-1 rounded text-xs font-semibold border ${
                      isDark
                        ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-400'
                        : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-emerald-600'
                    } outline-hidden`}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div
          className={`p-4 border-t shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}
        >
          {/* RESET / REVERT BUTTON */}
          <div>
            {!showConfirmReset ? (
              <button
                type="button"
                onClick={() => setShowConfirmReset(true)}
                className="text-xs font-bold text-slate-400 hover:text-amber-400 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Tüm eksik kapatma işlemlerini sıfırlar ve ilk denetim haline geri döner"
              >
                <Undo2 className="w-4 h-4" />
                <span>İlk Denetim Haline Sıfırla</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 animate-fadeIn">
                <span className="text-xs font-bold text-amber-400">Emin misiniz?</span>
                <button
                  type="button"
                  onClick={handleResetToOriginal}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded text-xs font-black uppercase cursor-pointer"
                >
                  Evet, Sıfırla
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmReset(false)}
                  className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-xs hover:bg-slate-700 cursor-pointer"
                >
                  İptal
                </button>
              </div>
            )}
          </div>

          {/* SAVE & CANCEL BUTTONS */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border cursor-pointer ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                  : 'bg-white hover:bg-slate-200 border-slate-300 text-slate-700'
              }`}
            >
              Vazgeç
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white rounded-lg text-xs sm:text-sm font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-cyan-900/30 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Kaydet &amp; Raporu Güncelle</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
