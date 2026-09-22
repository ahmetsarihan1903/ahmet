import React, { useState } from 'react';
import {
  X,
  Settings,
  Moon,
  Sun,
  Save,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  FileText,
  Plus,
  Trash2,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { CustomerThemeMode } from './customerThemes';
import { CustomerInspectionMetadata, CustomerInspectionItem, CustomerInspectionRecord } from './customerChecklistData';
import { formatDateDMY } from '../../utils/dateUtils';
import { FontSizeControl } from '../../components/FontSizeControl';

interface CustomerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSyncModal: () => void;
  themeMode: CustomerThemeMode;
  onSelectTheme: (mode: CustomerThemeMode) => void;
  onManualSave: () => void;
  lastSavedFeedback?: boolean;
  metadata: CustomerInspectionMetadata | null;
  items: CustomerInspectionItem[];
  history: CustomerInspectionRecord[];
  onLoadRecord: (record: CustomerInspectionRecord) => void;
  onDeleteRecord?: (id: string) => void;
  onClearAllHistory?: () => void;
  onNewInspection?: () => void;
}

export const CustomerSettingsModal: React.FC<CustomerSettingsModalProps> = ({
  isOpen,
  onClose,
  onOpenSyncModal,
  themeMode,
  onSelectTheme,
  onManualSave,
  lastSavedFeedback,
  metadata,
  items,
  history,
  onLoadRecord,
  onDeleteRecord,
  onClearAllHistory,
  onNewInspection,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'history'>('general');

  if (!isOpen) return null;

  const isDark = themeMode === 'dark';
  const defectiveCount = items.filter((i) => i.isDefective).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay-safe bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
      <div className="bg-slate-900 light:bg-white rounded-xl max-w-lg w-full p-4 sm:p-5 shadow-2xl border border-slate-800 light:border-slate-300 text-slate-100 light:text-slate-900 modal-box-safe flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 light:border-slate-200 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-600/20 light:bg-orange-100 text-orange-400 light:text-orange-600 flex items-center justify-center font-bold">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-slate-100 light:text-slate-900 tracking-tight">
                MÜŞTERİ İŞLERİ AYARLARI & TASLAKLAR
              </h3>
              <p className="text-[11px] text-slate-400 light:text-slate-500 font-medium">
                Görünüm, Yeni Denetim & Geçmiş Kayıtlar
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
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-1.5 px-3 rounded text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 relative ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 light:text-slate-600 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Geçmiş Kayıtlar ({history.length})</span>
            {history.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1" />
            )}
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-0.5">
          {activeTab === 'general' ? (
            <>
              {/* 1. Theme Selection */}
              <div className="p-3.5 bg-slate-950 light:bg-slate-50 rounded-lg border border-slate-800 light:border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-300 light:text-slate-700 flex items-center gap-1.5">
                    {isDark ? <Moon className="w-3.5 h-3.5 text-blue-400" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
                    Ekran Teması
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 light:bg-slate-200 text-slate-300 light:text-slate-700">
                    {isDark ? 'Gece (Kuyu Modu)' : 'Gündüz (Şantiye Modu)'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectTheme('dark')}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      isDark
                        ? 'bg-blue-600 text-white border-blue-400 shadow-md font-black'
                        : 'bg-slate-900 light:bg-white text-slate-400 light:text-slate-600 border-slate-700 light:border-slate-300 hover:border-slate-500'
                    }`}
                  >
                    <Moon className="w-4 h-4" />
                    <span>Gece Modu</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectTheme('light')}
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
                  Şantiye güneşinde Gündüz Modu, asansör kuyusunda Gece Modu önerilir.
                </p>
              </div>

              {/* 2. Font Size (Punto Büyütme) Kontrolü */}
              <FontSizeControl />

              {/* 3. Manual Save Action */}
              <div className="p-3.5 bg-slate-950 light:bg-slate-50 rounded-lg border border-slate-800 light:border-slate-200">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-300 light:text-slate-700 flex items-center gap-1.5">
                    <Save className="w-3.5 h-3.5 text-emerald-400 light:text-emerald-600" />
                    Hızlı Taslak Kaydet
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 light:text-slate-600 mb-2.5">
                  Mevcut inceleme adımlarınızı ve işaretlenen maddeleri hafızaya güvenle kilitler.
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

              {/* 3. New Inspection Start */}
              {metadata && onNewInspection && (
                <div className="p-3.5 bg-slate-950 light:bg-slate-50 rounded-lg border border-slate-800 light:border-slate-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-300 light:text-slate-700 flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5 text-orange-400 light:text-orange-600" />
                      Yeni Denetim Başlat
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 light:text-slate-600 mb-2.5">
                    Mevcut denetimi geçmişe kaydeder ve yeni bir şantiye girişi açar.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNewInspection();
                    }}
                    className="w-full py-2 px-3 bg-orange-600 hover:bg-orange-500 text-white rounded-lg border border-orange-500 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Yeni Denetim Formu Aç</span>
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
            /* HISTORY TAB */
            <div className="space-y-3">
              {metadata && (
                <div className="p-3.5 bg-emerald-950/30 light:bg-emerald-50 rounded-lg border-2 border-emerald-500/50 light:border-emerald-300">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black text-emerald-300 light:text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-emerald-400 light:text-emerald-600" />
                      Şu An Açık Olan Denetim
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-slate-950 font-black text-[10px]">
                      AKTİF
                    </span>
                  </div>
                  <div className="text-xs text-slate-100 light:text-slate-900 font-bold mb-1">
                    {metadata.projectName} — {metadata.serialNumber}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 light:text-slate-600">
                    <span>Tip: {metadata.elevatorType}</span>
                    <span>•</span>
                    <span className={defectiveCount > 0 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                      {defectiveCount} Eksik
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 light:text-slate-700 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-400" />
                    Geçmiş Denetimler ({history.length})
                  </h4>
                  {history.length > 0 && onClearAllHistory && (
                    <button
                      type="button"
                      onClick={onClearAllHistory}
                      className="text-[11px] text-rose-400 hover:text-rose-300 underline font-bold cursor-pointer"
                    >
                      Tümünü Temizle
                    </button>
                  )}
                </div>

                {history.length === 0 ? (
                  <div className="p-4 text-center bg-slate-950 light:bg-slate-50 rounded-lg border border-slate-800 light:border-slate-200 text-xs text-slate-400 light:text-slate-500">
                    Henüz kayıtlı geçmiş veri bulunmuyor.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-0.5">
                    {history.map((rec) => {
                      const defCount = rec.items.filter((i) => i.isDefective).length;

                      return (
                        <div
                          key={rec.id}
                          className="p-2.5 bg-slate-950 light:bg-slate-50 hover:bg-slate-800 light:hover:bg-slate-100 rounded-lg border border-slate-800 light:border-slate-300 transition-all flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-100 light:text-slate-900 truncate">
                                {rec.metadata.projectName}
                              </span>
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-slate-800 light:bg-slate-200 text-slate-300 light:text-slate-700 border border-slate-700 light:border-slate-300 shrink-0">
                                {rec.metadata.serialNumber}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-[10px] text-slate-400 light:text-slate-500 mt-1">
                              <span>{formatDateDMY(rec.metadata.inspectionDate)}</span>
                              <span>•</span>
                              <span>{rec.metadata.elevatorType}</span>
                              <span>•</span>
                              <span className={defCount > 0 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                                {defCount > 0 ? `${defCount} Eksik` : 'Kusursuz'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                onLoadRecord(rec);
                                onClose();
                              }}
                              title="Bu kaydı geri çağır"
                              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] font-black shrink-0 transition-colors shadow-xs flex items-center gap-1 cursor-pointer"
                            >
                              <span>Yükle</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>

                            {onDeleteRecord && (
                              <button
                                type="button"
                                onClick={() => onDeleteRecord(rec.id)}
                                title="Sil"
                                className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
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
            <span className="font-mono font-bold">Müşteri Ön İnceleme v2.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};
