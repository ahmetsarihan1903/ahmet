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
  PlusCircle,
  Cloud,
  Cpu,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { getLastSavedTime, loadActiveDraft, getAuditHistory } from '../utils/storage';
import { AuditFormData } from '../types';
import { FontSizeControl } from './FontSizeControl';
import { AdminUserSettingsSection } from './AdminUserSettingsSection';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSyncModal: () => void;
  onOpenDriveModal?: () => void;
  onOpenHistoryModal: () => void;
  onManualSave: () => void;
  onRestoreDraftOrAudit: (data: AuditFormData) => void;
  onEditInspectionInfo?: () => void;
  onNewInspection?: () => void;
  lastSavedFeedback?: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onOpenSyncModal,
  onOpenDriveModal,
  onOpenHistoryModal,
  onManualSave,
  onRestoreDraftOrAudit,
  onEditInspectionInfo,
  onNewInspection,
  lastSavedFeedback,
}) => {
  const { theme, setTheme, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'general' | 'saved_data'>('general');
  const [isConfirmingNewInspection, setIsConfirmingNewInspection] = useState(false);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className={`rounded-xl max-w-lg w-full p-3.5 sm:p-4 shadow-2xl border max-h-[85vh] sm:max-h-[88vh] flex flex-col ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
      }`}>
        {/* Modal Header */}
        <div className={`flex items-center justify-between pb-3 border-b mb-3 ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
              isDark ? 'bg-orange-600/20 text-orange-400' : 'bg-orange-100 text-orange-700'
            }`}>
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className={`font-black text-sm sm:text-base tracking-tight ${
                isDark ? 'text-slate-100' : 'text-slate-900'
              }`}>
                UYGULAMA AYARLARI & TASLAKLAR
              </h3>
              <p className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Görünüm, Kayıtlı Veriler & Senkronizasyon
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDark
                ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub Navigation Tabs inside Settings */}
        <div className={`flex rounded-lg p-1 mb-3 border shrink-0 ${
          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}>
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`flex-1 py-1.5 px-3 rounded text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'general'
                ? 'bg-orange-600 text-white shadow-xs'
                : isDark
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-slate-600 hover:text-slate-900'
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
                : isDark
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-slate-600 hover:text-slate-900'
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
              <div className={`p-3.5 rounded-lg border ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                    isDark ? 'text-slate-200' : 'text-slate-800'
                  }`}>
                    {isDark ? <Moon className="w-3.5 h-3.5 text-blue-400" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
                    Ekran Teması
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-800'
                  }`}>
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
                        : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
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
                        : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    <Sun className="w-4 h-4" />
                    <span>Gündüz Modu</span>
                  </button>
                </div>
                <p className={`text-[10px] mt-2 font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Şantiye güneşinde Gündüz Modu, asansör kuyusunda Karanlık Mod önerilir.
                </p>
              </div>

              {/* 2. Font Size (Punto Büyütme) Kontrolü */}
              <FontSizeControl />

              {/* 3. Denetçi Profili & Yönetici Paneli */}
              <AdminUserSettingsSection />

              {/* 4. Manual Save Action */}
              <div className={`p-3.5 rounded-lg border ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                    isDark ? 'text-slate-200' : 'text-slate-800'
                  }`}>
                    <Save className={`w-3.5 h-3.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                    Hızlı Taslak Kaydet
                  </span>
                  {lastSavedTime && (
                    <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Son Kayıt: {lastSavedTime}
                    </span>
                  )}
                </div>
                <p className={`text-[11px] mb-2.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Mevcut inceleme adımlarınızı, işaretlenen uygunsuzlukları ve ölçüleri hafızaya güvenle kilitler.
                </p>
                <button
                  type="button"
                  onClick={onManualSave}
                  className={`w-full py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    lastSavedFeedback
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                      : isDark
                      ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border-slate-700'
                      : 'bg-white hover:bg-slate-100 text-emerald-700 border-slate-300 shadow-xs'
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

              {/* 4. Edit Inspection Info (if provided) */}
              {onEditInspectionInfo && (
                <div className={`p-3.5 rounded-lg border ${
                  isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                      isDark ? 'text-slate-200' : 'text-slate-800'
                    }`}>
                      <Edit3 className={`w-3.5 h-3.5 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
                      Proje & Asansör Bilgilerini Düzenle
                    </span>
                  </div>
                  <p className={`text-[11px] mb-2.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
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

              {/* 5. YENİ DENETİM BAŞLAT BUTONU (E-Tablodan Güncelle'nin Üstünde) */}
              {onNewInspection && (
                <div className={`p-3.5 rounded-lg border ${
                  isDark ? 'bg-slate-950 border-slate-800' : 'bg-blue-50/70 border-blue-200'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                      isDark ? 'text-slate-200' : 'text-blue-950'
                    }`}>
                      <PlusCircle className={`w-3.5 h-3.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                      Yeni Denetim Başlat
                    </span>
                  </div>
                  <p className={`text-[11px] mb-2.5 ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>
                    Tüm alanları ve seçimleri sıfırlayarak yeni bir asansör kalite kontrol denetimi başlatır.
                  </p>
                  
                  {isConfirmingNewInspection ? (
                    <div className="p-3 rounded-lg bg-amber-500/15 border-2 border-amber-500 text-center space-y-2">
                      <p className="text-xs font-bold text-amber-500 flex items-center justify-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>Mevcut denetim sıfırlanacak. Emin misiniz?</span>
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          id="btn-settings-new-inspection-confirm"
                          onClick={() => {
                            setIsConfirmingNewInspection(false);
                            onClose();
                            onNewInspection();
                          }}
                          className="py-2 px-3 bg-red-600 hover:bg-red-500 text-white rounded-lg border border-red-500 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-transform active:scale-95"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Evet, Başlat</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsConfirmingNewInspection(false)}
                          className={`py-2 px-3 rounded-lg border text-xs font-bold cursor-pointer transition-colors ${
                            isDark
                              ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                              : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                          }`}
                        >
                          Vazgeç
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      id="btn-settings-new-inspection"
                      onClick={() => setIsConfirmingNewInspection(true)}
                      className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-500 active:scale-98 text-white rounded-lg border border-blue-500 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Yeni Denetim Başlat</span>
                    </button>
                  )}
                </div>
              )}

              {/* 6. Google Drive Bulut Arşivi ve Ortak Klasör */}
              {onOpenDriveModal && (
                <div className={`p-3.5 rounded-lg border ${
                  isDark ? 'bg-slate-950 border-slate-800' : 'bg-blue-50/60 border-blue-200'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                      isDark ? 'text-slate-200' : 'text-blue-950'
                    }`}>
                      <Cloud className={`w-3.5 h-3.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                      Google Drive Ortak Bulut Arşivi
                    </span>
                  </div>
                  <p className={`text-[11px] mb-2.5 ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>
                    3 tablet arası ortak klasöre (KALITEKONTROL ARSIV) proje yükleyin ve indirin.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenDriveModal();
                    }}
                    className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg border border-blue-500 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                  >
                    <Cloud className="w-4 h-4" />
                    <span>Drive Bulut Arşivini Aç</span>
                  </button>
                </div>
              )}

              {/* 7. Google Sheets Sync Modal Trigger (E-Tablodan Madde Güncelleme) */}
              <div className={`p-3.5 rounded-lg border ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                    isDark ? 'text-slate-200' : 'text-slate-800'
                  }`}>
                    <RefreshCw className={`w-3.5 h-3.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                    E-Tablodan Madde Güncelleme
                  </span>
                </div>
                <p className={`text-[11px] mb-2.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
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
                <div className={`p-3.5 rounded-lg border-2 ${
                  isDark ? 'bg-amber-950/30 border-amber-500/50' : 'bg-amber-50 border-amber-400'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                      isDark ? 'text-amber-300' : 'text-amber-900'
                    }`}>
                      <FileEdit className="w-3.5 h-3.5 text-amber-500" />
                      Mevcut Aktif Taslak
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                      isDark ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-amber-200 text-amber-900 border-amber-300'
                    }`}>
                      Son Aşama: {activeDraft.currentStep.toUpperCase()}
                    </span>
                  </div>

                  <div className={`text-xs font-bold mb-1 ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                    {activeDraft.clientProjectName || 'İsimsiz Proje'} — {activeDraft.serialNumber || 'Seri No Yok'}
                  </div>

                  <div className={`flex items-center gap-3 text-[11px] mb-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {activeDraft.dateDisplay}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {activeDraft.startTime || 'Saat bilgisi yok'}
                    </span>
                    <span className="flex items-center gap-1 text-red-500 font-bold">
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
                <div className={`p-3 rounded-lg border text-center text-xs ${
                  isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
                }`}>
                  Şu anda aktif bir taslak bulunmuyor.
                </div>
              )}

              {/* History Audits & Checkpoints */}
              <div className="pt-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                    isDark ? 'text-slate-200' : 'text-slate-800'
                  }`}>
                    <History className="w-3.5 h-3.5 text-blue-500" />
                    Kayıtlı Raporlar & Yedekler ({historyList.length})
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenHistoryModal();
                    }}
                    className="text-[11px] text-blue-500 hover:text-blue-600 underline font-bold cursor-pointer"
                  >
                    Tümünü Gör
                  </button>
                </div>

                {historyList.length === 0 ? (
                  <div className={`p-4 text-center rounded-lg border text-xs ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
                  }`}>
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
                          className={`p-2.5 rounded-lg border transition-all flex items-center justify-between gap-2 ${
                            isDark
                              ? 'bg-slate-950 hover:bg-slate-850 border-slate-800'
                              : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-xs font-bold truncate ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                                {item.clientProjectName || 'İsimsiz Proje'}
                              </span>
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold border shrink-0 ${
                                isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-200 text-slate-800 border-slate-300'
                              }`}>
                                {item.serialNumber || 'SN Yok'}
                              </span>
                              {isCompleted ? (
                                <span className={`px-1 py-0.2 text-[8px] font-bold rounded shrink-0 ${
                                  isDark ? 'bg-emerald-950 text-emerald-400' : 'bg-emerald-100 text-emerald-800'
                                }`}>
                                  Rapor
                                </span>
                              ) : (
                                <span className={`px-1 py-0.2 text-[8px] font-bold rounded shrink-0 ${
                                  isDark ? 'bg-amber-950 text-amber-400' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  Taslak
                                </span>
                              )}
                            </div>

                            <div className={`flex items-center gap-2 text-[10px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                              <span>{item.dateDisplay}</span>
                              <span>•</span>
                              <span>{item.totalDurationFormatted || item.startTime || 'Saat Yok'}</span>
                              <span>•</span>
                              <span className={udCount > 0 ? 'text-red-500 font-bold' : 'text-emerald-600 font-bold'}>
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
          <div className={`pt-2 border-t flex items-center justify-between text-[10px] ${
            isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'
          }`}>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              %100 Cihaz Hafızasında Güvende
            </span>
            <span className="font-mono font-bold">Beta Asansör QC v2.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};
