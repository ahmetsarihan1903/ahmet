import React, { useState } from 'react';
import {
  X,
  Settings,
  Moon,
  Sun,
  RefreshCw,
  History,
  Save,
  CheckCircle2,
  ShieldCheck,
  Calendar,
  Clock,
  ArrowRight,
  FileEdit,
  CheckCheck,
  AlertTriangle,
  RotateCcw,
  Edit3,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { getLastSavedTime, loadActiveDraft, getAuditHistory } from '../utils/storage';
import { AuditFormData } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSyncModal: () => void;
  onOpenHistoryModal: () => void;
  onManualSave: () => void;
  onRestoreDraftOrAudit: (data: AuditFormData) => void;
  onEditInspectionInfo?: () => void;
  lastSavedFeedback?: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onOpenSyncModal,
  onOpenHistoryModal,
  onManualSave,
  onRestoreDraftOrAudit,
  onEditInspectionInfo,
  lastSavedFeedback,
}) => {
  const { theme, setTheme, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'general' | 'saved_data'>('general');

  if (!isOpen) return null;

  const lastSavedTime = getLastSavedTime();
  const activeDraft = loadActiveDraft();
  const historyList = getAuditHistory();

  // Helper to count issues in a saved item
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
      <div className="bg-slate-900 light:bg-white rounded-xl max-w-lg w-full p-4 sm:p-5 shadow-2xl border border-slate-800 light:border-slate-300 text-slate-100 light:text-slate-900 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 light:border-slate-200 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-600/20 light:bg-orange-100 text-orange-400 light:text-orange-600 flex items-center justify-center font-bold">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-slate-100 light:text-slate-900 tracking-tight">
                UYGULAMA AYARLARI & TASLAKLAR
              </h3>
              <p className="text-[11px] text-slate-400 light:text-slate-500 font-medium">
                Görünüm, Kayıtlı Veriler & Senkronizasyon
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 light:hover:text-slate-700 rounded-lg hover:bg-slate-800 light:hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub Navigation Tabs inside Settings */}
        <div className="flex rounded-lg bg-slate-950 light:bg-slate-100 p-1 mb-3 border border-slate-800 light:border-slate-300 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`flex-1 py-1.5 px-3 rounded text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'general'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'text-slate-400 light:text-slate-600 hover:text-slate-200'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Genel & Tema</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('saved_data')}
            className={`flex-1 py-1.5 px-3 rounded text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 relative ${
              activeTab === 'saved_data'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 light:text-slate-600 hover:text-slate-200'
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            <span>Kayıtlı Veriler & Taslaklar</span>
            {(activeDraft || historyList.length > 0) && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1" />
            )}
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-0.5">
          {activeTab === 'general' ? (
            <>
              {/* 1. Theme Selection (Karanlık / Gündüz Modu) */}
              <div className="p-3.5 bg-slate-950 light:bg-slate-50 rounded-lg border border-slate-800 light:border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-300 light:text-slate-700 flex items-center gap-1.5">
                    {isDark ? <Moon className="w-3.5 h-3.5 text-blue-400" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
                    Ekran Teması
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 light:bg-slate-200 text-slate-300 light:text-slate-700">
                    {isDark ? 'Karanlık (Kuyu Modu)' : 'Gündüz (Şantiye Modu)'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Dark Mode Button */}
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      isDark
                        ? 'bg-blue-600 text-white border-blue-400 shadow-md font-black'
                        : 'bg-slate-900 light:bg-white text-slate-400 light:text-slate-600 border-slate-700 light:border-slate-300 hover:border-slate-500'
                    }`}
                  >
                    <Moon className="w-4 h-4" />
                    <span>Karanlık Mod</span>
                  </button>

                  {/* Light Mode Button */}
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      !isDark
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black'
                        : 'bg-slate-900 light:bg-white text-slate-400 light:text-slate-600 border-slate-700 light:border-slate-300 hover:border-slate-500'
                    }`}
                  >
                    <Sun className="w-4 h-4" />
                    <span>Gündüz Modu</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 light:text-slate-500 mt-2">
                  Şantiye güneşinde Gündüz Modu, asansör kuyusunda Karanlık Mod önerilir.
                </p>
              </div>

              {/* 2. Manual Save Action */}
              <div className="p-3.5 bg-slate-950 light:bg-slate-50 rounded-lg border border-slate-800 light:border-slate-200">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-300 light:text-slate-700 flex items-center gap-1.5">
                    <Save className="w-3.5 h-3.5 text-emerald-400 light:text-emerald-600" />
                    Hızlı Taslak Kaydet
                  </span>
                  {lastSavedTime && (
                    <span className="text-[10px] text-slate-400 light:text-slate-500 font-mono">
                      Son Kayıt: {lastSavedTime}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 light:text-slate-600 mb-2.5">
                  Mevcut inceleme adımlarınızı, işaretlenen uygunsuzlukları ve ölçüleri hafızaya güvenle kilitler.
                </p>
                <button
                  type="button"
                  onClick={onManualSave}
                  className={`w-full py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    lastSavedFeedback
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                      : 'bg-slate-800 light:bg-slate-200 hover:bg-slate-700 light:hover:bg-slate-300 text-emerald-400 light:text-emerald-700 border-slate-700 light:border-slate-300'
                  }`}
                >
                  {lastSavedFeedback ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 animate-bounce" />
                      <span>Taslak Başarıyla Kaydedildi!</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Şimdi Taslak Olarak Kaydet</span>
                    </>
                  )}
                </button>
              </div>

              {/* 3. Edit Inspection Info (if provided) */}
              {onEditInspectionInfo && (
                <div className="p-3.5 bg-slate-950 light:bg-slate-50 rounded-lg border border-slate-800 light:border-slate-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-300 light:text-slate-700 flex items-center gap-1.5">
                      <Edit3 className="w-3.5 h-3.5 text-orange-400 light:text-orange-600" />
                      Proje & Asansör Bilgilerini Düzenle
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 light:text-slate-600 mb-2.5">
                    Proje adı, denetçi, asansör tipi veya seri numarasını güncelleyin.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onEditInspectionInfo();
                    }}
                    className="w-full py-2 px-3 bg-orange-600 hover:bg-orange-500 text-white rounded-lg border border-orange-500 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Bilgileri Düzenle (1. Adıma Dön)</span>
                  </button>
                </div>
              )}

              {/* 4. Google Sheets Sync Modal Trigger */}
              <div className="p-3.5 bg-slate-950 light:bg-slate-50 rounded-lg border border-slate-800 light:border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-300 light:text-slate-700 flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-400 light:text-emerald-600" />
                    E-Tablodan Madde Güncelleme
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 light:text-slate-600 mb-2.5">
                  Google E-Tablo listenizdeki yeni kontrol maddelerini cihazınıza aktarın.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSyncModal();
                  }}
                  className="w-full py-2 px-3 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg border border-emerald-500 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>E-Tablo Veri Güncelle</span>
                </button>
              </div>
            </>
          ) : (
            /* SAVED DATA & DRAFTS TAB - DIRECT RESTORE VIEW */
            <div className="space-y-3">
              {/* Active Draft Snapshot */}
              {activeDraft ? (
                <div className="p-3.5 bg-amber-950/30 light:bg-amber-50 rounded-lg border-2 border-amber-500/50 light:border-amber-300">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black text-amber-300 light:text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                      <FileEdit className="w-3.5 h-3.5 text-amber-400 light:text-amber-600" />
                      Mevcut Aktif Taslak
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 light:text-amber-700 border border-amber-500/30">
                      Son Aşama: {activeDraft.currentStep.toUpperCase()}
                    </span>
                  </div>

                  <div className="text-xs text-slate-200 light:text-slate-800 font-bold mb-1">
                    {activeDraft.clientProjectName || 'İsimsiz Proje'} — {activeDraft.serialNumber || 'Seri No Yok'}
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 light:text-slate-600 mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {activeDraft.dateDisplay}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {activeDraft.startTime || 'Saat bilgisi yok'}
                    </span>
                    <span className="flex items-center gap-1 text-red-400 font-bold">
                      <AlertTriangle className="w-3 h-3" />
                      {countIssues(activeDraft)} UD
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onRestoreDraftOrAudit(activeDraft);
                      onClose();
                    }}
                    className="w-full py-2 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer uppercase tracking-wider"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Bu Taslağı Geri Yükle & Devam Et</span>
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-slate-950 light:bg-slate-100 rounded-lg border border-slate-800 light:border-slate-200 text-center text-xs text-slate-400">
                  Şu anda aktif bir taslak bulunmuyor.
                </div>
              )}

              {/* History Audits & Checkpoints */}
              <div className="pt-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 light:text-slate-700 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-blue-400" />
                    Kayıtlı Raporlar & Yedekler ({historyList.length})
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenHistoryModal();
                    }}
                    className="text-[11px] text-blue-400 hover:text-blue-300 underline font-bold cursor-pointer"
                  >
                    Tümünü Gör
                  </button>
                </div>

                {historyList.length === 0 ? (
                  <div className="p-4 text-center bg-slate-950 light:bg-slate-50 rounded-lg border border-slate-800 light:border-slate-200 text-xs text-slate-400 light:text-slate-500">
                    Henüz kayıtlı geçmiş veri bulunmuyor.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-0.5">
                    {historyList.slice(0, 8).map((item, idx) => {
                      const udCount = countIssues(item);
                      const isCompleted = item.currentStep === 'report';

                      return (
                        <div
                          key={idx}
                          className="p-2.5 bg-slate-950 light:bg-slate-50 hover:bg-slate-800 light:hover:bg-slate-100 rounded-lg border border-slate-800 light:border-slate-300 transition-all flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-100 light:text-slate-900 truncate">
                                {item.clientProjectName || 'İsimsiz Proje'}
                              </span>
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-slate-800 light:bg-slate-200 text-slate-300 light:text-slate-700 border border-slate-700 light:border-slate-300 shrink-0">
                                {item.serialNumber || 'SN Yok'}
                              </span>
                              {isCompleted ? (
                                <span className="px-1 py-0.2 text-[8px] font-bold bg-emerald-950 text-emerald-400 rounded shrink-0">
                                  Rapor
                                </span>
                              ) : (
                                <span className="px-1 py-0.2 text-[8px] font-bold bg-amber-950 text-amber-400 rounded shrink-0">
                                  Taslak
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-[10px] text-slate-400 light:text-slate-500 mt-1">
                              <span>{item.dateDisplay}</span>
                              <span>•</span>
                              <span>{item.totalDurationFormatted || item.startTime || 'Saat Yok'}</span>
                              <span>•</span>
                              <span className={udCount > 0 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                                {udCount} UD
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              onRestoreDraftOrAudit(item);
                              onClose();
                            }}
                            title="Bu kaydı geri çağır"
                            className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] font-black shrink-0 transition-colors shadow-xs flex items-center gap-1 cursor-pointer"
                          >
                            <span>Yükle</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* System Footer Info */}
          <div className="pt-2 border-t border-slate-800 light:border-slate-200 flex items-center justify-between text-[10px] text-slate-400 light:text-slate-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 light:text-emerald-600" />
              %100 Cihaz Hafızasında Güvende
            </span>
            <span className="font-mono font-bold">Beta Asansör QC v2.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};
