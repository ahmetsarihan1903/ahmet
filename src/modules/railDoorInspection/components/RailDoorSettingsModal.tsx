import React, { useState, useEffect } from 'react';
import {
  X,
  Settings,
  Moon,
  Sun,
  History,
  Save,
  CheckCircle2,
  ShieldCheck,
  Calendar,
  Clock,
  ArrowRight,
  FileEdit,
  AlertTriangle,
  RotateCcw,
  Edit3,
  Sliders,
  Trash2,
  PlusCircle,
} from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { RailDoorInspectionFullData } from '../types';
import { FontSizeControl } from '../../../components/FontSizeControl';

interface RailDoorSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: RailDoorInspectionFullData;
  onManualSave: () => void;
  onRestoreData: (data: RailDoorInspectionFullData) => void;
  onEditInspectionInfo?: () => void;
  onResetForm?: () => void;
  lastSavedFeedback?: boolean;
}

const STORAGE_KEY = 'beta_asansor_rail_door_inspection_v2_full';
const HISTORY_KEY = 'beta_asansor_rail_door_history_v1';
const LAST_SAVED_TIME_KEY = 'beta_asansor_rail_door_last_saved_time';

export const RailDoorSettingsModal: React.FC<RailDoorSettingsModalProps> = ({
  isOpen,
  onClose,
  formData,
  onManualSave,
  onRestoreData,
  onEditInspectionInfo,
  onResetForm,
  lastSavedFeedback,
}) => {
  const { theme, setTheme, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'general' | 'saved_data'>('general');
  const [historyList, setHistoryList] = useState<RailDoorInspectionFullData[]>([]);
  const [lastSavedTime, setLastSavedTime] = useState<string>('');
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setConfirmReset(false);
      // Load last saved time
      try {
        const t = localStorage.getItem(LAST_SAVED_TIME_KEY);
        if (t) setLastSavedTime(t);
        else {
          const now = new Date();
          setLastSavedTime(
            `${now.toLocaleDateString('tr-TR')} ${now.toLocaleTimeString('tr-TR', {
              hour: '2-digit',
              minute: '2-digit',
            })}`
          );
        }
      } catch (e) {
        console.error(e);
      }

      // Load history
      try {
        const histRaw = localStorage.getItem(HISTORY_KEY);
        if (histRaw) {
          const parsed = JSON.parse(histRaw);
          if (Array.isArray(parsed)) {
            setHistoryList(parsed);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Ölçü doluluk sayımı
  const countFilledMeasures = (data: RailDoorInspectionFullData) => {
    let filled = 0;
    const matrix = data.floorMatrixMeasurements || {};
    Object.values(matrix).forEach((row) => {
      Object.values(row).forEach((v) => {
        if (v && v.trim() !== '') filled++;
      });
    });
    const chassis = data.machineChassisMeasurements || {};
    Object.values(chassis).forEach((v) => {
      if (v?.actualValueMm && v.actualValueMm.trim() !== '') filled++;
    });
    return filled;
  };

  const handleDeleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updated = historyList.filter((item) => item.id !== id);
      setHistoryList(updated);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
  };

  const activeFilledCount = countFilledMeasures(formData);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
      <div className="bg-slate-900 light:bg-white rounded-xl max-w-lg w-full p-4 sm:p-5 shadow-2xl border border-slate-800 light:border-slate-300 text-slate-100 light:text-slate-900 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 light:border-slate-200 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 light:bg-amber-100 text-amber-400 light:text-amber-600 flex items-center justify-center font-bold">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-slate-100 light:text-slate-900 tracking-tight">
                UYGULAMA AYARLARI & TASLAKLAR
              </h3>
              <p className="text-[11px] text-slate-400 light:text-slate-500 font-medium">
                Görünüm & Kayıtlı Veri Yönetimi
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
                ? 'bg-amber-500 text-slate-950 shadow-xs'
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
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-0.5 custom-scrollbar">
          {activeTab === 'general' ? (
            <>
              {/* 1. Theme Selection (Karanlık / Gündüz Modu) */}
              <div className="p-3.5 bg-slate-950 light:bg-slate-50 rounded-lg border border-slate-800 light:border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-300 light:text-slate-700 flex items-center gap-1.5">
                    {isDark ? (
                      <Moon className="w-3.5 h-3.5 text-blue-400" />
                    ) : (
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                    )}
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

              {/* 2. Font Size (Punto Büyütme) Kontrolü */}
              <FontSizeControl />

              {/* 3. Manual Save Action */}
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
                  Mevcut ray, kapı, şase ölçümlerinizi ve uygunsuzluk notlarınızı hafızaya güvenle kilitler.
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

              {/* 3. Edit Inspection Info (Proje Bilgileri & Durak Ayarları) */}
              {onEditInspectionInfo && (
                <div className="p-3.5 bg-slate-950 light:bg-slate-50 rounded-lg border border-slate-800 light:border-slate-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-300 light:text-slate-700 flex items-center gap-1.5">
                      <Edit3 className="w-3.5 h-3.5 text-amber-400 light:text-amber-600" />
                      Proje & Kuyu Bilgilerini Düzenle
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 light:text-slate-600 mb-2.5">
                    Proje referansı, seri numarası, kuyu tipi veya durak sayısını güncelleyin.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onEditInspectionInfo();
                    }}
                    className="w-full py-2 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg border border-amber-400 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer font-black"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Bilgileri Düzenle (1. Adıma Dön)</span>
                  </button>
                </div>
              )}

              {/* 4. Yeni Boş Form Başlatma */}
              {onResetForm && (
                <div className="p-3.5 bg-slate-950 light:bg-slate-50 rounded-lg border border-slate-800 light:border-slate-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-300 light:text-slate-700 flex items-center gap-1.5">
                      <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                      Yeni Boş Kontrol Formu
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 light:text-slate-600 mb-2.5">
                    Mevcut formu arşivleyip yeni bir asansör için sıfır form başlatır.
                  </p>

                  {!confirmReset ? (
                    <button
                      type="button"
                      onClick={() => setConfirmReset(true)}
                      className="w-full py-2 px-3 bg-slate-800 hover:bg-rose-950/40 text-rose-300 rounded-lg border border-slate-700 hover:border-rose-500/40 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Yeni Form Başlat</span>
                    </button>
                  ) : (
                    <div className="p-2.5 bg-rose-950/30 border border-rose-600/50 rounded-lg space-y-2 animate-fadeIn">
                      <div className="text-[11px] font-bold text-rose-300 leading-snug">
                        ⚠️ Mevcut formunuz arşive kaydedilecek ve sıfır boş form açılacaktır. Devam etmek istiyor musunuz?
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            onResetForm();
                            setConfirmReset(false);
                            onClose();
                          }}
                          className="flex-1 py-1.5 px-2 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-black transition cursor-pointer shadow-sm active:scale-95"
                        >
                          Evet, Yeni Form Başlat
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmReset(false)}
                          className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-bold transition cursor-pointer"
                        >
                          Vazgeç
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            /* SAVED DATA & DRAFTS TAB */
            <div className="space-y-3">
              {/* Active Draft Snapshot */}
              <div className="p-3.5 bg-amber-950/30 light:bg-amber-50 rounded-lg border-2 border-amber-500/50 light:border-amber-300">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-amber-300 light:text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                    <FileEdit className="w-3.5 h-3.5 text-amber-400 light:text-amber-600" />
                    Mevcut Aktif Taslak
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 light:text-amber-700 border border-amber-500/30">
                    {formData.stopCount || 1} Durak
                  </span>
                </div>

                <div className="text-xs text-slate-200 light:text-slate-800 font-bold mb-1">
                  {formData.identity.reference || 'İsimsiz Proje'} — {formData.identity.serialNumber || 'SN Yok'}
                </div>

                <div className="flex items-center gap-3 text-[11px] text-slate-400 light:text-slate-600 mb-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formData.inspectionDateDisplay || 'Bugün'}
                  </span>
                  <span className="flex items-center gap-1 text-amber-400 font-bold">
                    <Sliders className="w-3 h-3" />
                    {activeFilledCount} Ölçü Girildi
                  </span>
                  {(formData.nonConformities || []).length > 0 && (
                    <span className="flex items-center gap-1 text-rose-400 font-bold">
                      <AlertTriangle className="w-3 h-3" />
                      {(formData.nonConformities || []).length} Kusur
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onRestoreData(formData);
                    onClose();
                  }}
                  className="w-full py-2 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer uppercase tracking-wider"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Bu Taslağa Devam Et</span>
                </button>
              </div>

              {/* History Audits & Checkpoints */}
              <div className="pt-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 light:text-slate-700 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-blue-400" />
                    Geçmiş Formlar & Yedekler ({historyList.length})
                  </h4>
                </div>

                {historyList.length === 0 ? (
                  <div className="p-4 text-center bg-slate-950 light:bg-slate-50 rounded-lg border border-slate-800 light:border-slate-200 text-xs text-slate-400 light:text-slate-500">
                    Henüz arşivlenmiş geçmiş form bulunmuyor. Her &apos;Yeni Form Başlat&apos; işleminde mevcut veriniz buraya güvenle yedeklenir.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-0.5 custom-scrollbar">
                    {historyList.map((item, idx) => {
                      const filled = countFilledMeasures(item);
                      const ncCount = (item.nonConformities || []).length;

                      return (
                        <div
                          key={item.id || idx}
                          className="p-2.5 bg-slate-950 light:bg-slate-50 hover:bg-slate-800 light:hover:bg-slate-100 rounded-lg border border-slate-800 light:border-slate-300 transition-all flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-100 light:text-slate-900 truncate">
                                {item.identity?.reference || 'İsimsiz Proje'}
                              </span>
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-slate-800 light:bg-slate-200 text-slate-300 light:text-slate-700 border border-slate-700 light:border-slate-300 shrink-0">
                                {item.identity?.serialNumber || 'SN Yok'}
                              </span>
                              <span className="px-1 py-0.2 text-[8px] font-bold bg-amber-950 text-amber-400 rounded shrink-0">
                                {item.stopCount || 1} Durak
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-[10px] text-slate-400 light:text-slate-500 mt-1">
                              <span>{item.inspectionDateDisplay || '-'}</span>
                              <span>•</span>
                              <span>{filled} Ölçü</span>
                              {ncCount > 0 && (
                                <>
                                  <span>•</span>
                                  <span className="text-red-400 font-bold">{ncCount} Kusur</span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                onRestoreData(item);
                                onClose();
                              }}
                              title="Bu kaydı geri çağır"
                              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] font-black transition-colors shadow-xs flex items-center gap-1 cursor-pointer"
                            >
                              <span>Yükle</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                              title="Sil"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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
            <span className="font-mono font-bold">Beta Asansör v2.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};
