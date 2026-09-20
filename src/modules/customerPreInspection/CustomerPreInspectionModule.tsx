import React, { useState, useEffect } from 'react';
import {
  CustomerInspectionMetadata,
  CustomerInspectionItem,
  CustomerInspectionRecord,
  generateInitialCustomerItems,
  MASTER_CUSTOMER_CHECKLIST,
} from './customerChecklistData';
import { CustomerThemeMode } from './customerThemes';
import { BetaLogo } from '../../components/BetaLogo';
import { VoiceInputButton } from '../../components/VoiceInputButton';
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Plus,
  Trash2,
  RotateCcw,
  Edit3,
  Calendar,
  User,
  Hash,
  Layers,
  Sparkles,
  Settings,
  Save,
  Check,
  RefreshCw,
} from 'lucide-react';
import { CustomerReportPreviewModal } from './CustomerReportPreviewModal';
import { CustomerInspectionForm } from './CustomerInspectionForm';
import { CustomerSettingsModal } from './CustomerSettingsModal';
import { CustomerSyncModal } from './CustomerSyncModal';
import { useTheme } from '../../context/ThemeContext';

interface CustomerPreInspectionModuleProps {
  onBackToMainMenu: () => void;
}

const STORAGE_KEY_ACTIVE = 'beta_asansor_active_customer_inspection_v2';
const STORAGE_KEY_HISTORY = 'beta_asansor_customer_inspection_history_v2';

export const CustomerPreInspectionModule: React.FC<CustomerPreInspectionModuleProps> = ({
  onBackToMainMenu,
}) => {
  const { theme, setTheme, isDark } = useTheme();

  const handleSelectTheme = (mode: CustomerThemeMode) => {
    setTheme(mode);
  };

  const [metadata, setMetadata] = useState<CustomerInspectionMetadata | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ACTIVE);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.metadata || null;
      }
    } catch (e) {
      console.error('Error loading active customer inspection', e);
    }
    return null;
  });

  const [items, setItems] = useState<CustomerInspectionItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ACTIVE);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.items && Array.isArray(parsed.items) && parsed.items.length > 0) {
          return parsed.items.map((it: CustomerInspectionItem) => {
            if (!it.isCustom) {
              const matched = MASTER_CUSTOMER_CHECKLIST.find(
                (m) => m.category === it.category && m.itemNumber === it.itemNumber
              );
              if (matched) {
                return { ...it, description: matched.description };
              }
            }
            return it;
          });
        }
      }
    } catch (e) {
      console.error('Error loading active customer items', e);
    }
    return [];
  });

  const [history, setHistory] = useState<CustomerInspectionRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading history', e);
    }
    return [];
  });

  // UI state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [lastSavedFeedback, setLastSavedFeedback] = useState(false);
  const [newCustomTitle, setNewCustomTitle] = useState('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'DEFECTIVE' | 'COMPLIANT'>('ALL');

  // Auto-save active inspection to localStorage
  useEffect(() => {
    if (metadata && items.length > 0) {
      const activeState = {
        metadata,
        items,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY_ACTIVE, JSON.stringify(activeState));
    }
  }, [metadata, items]);

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save history to storage', e);
    }
  }, [history]);

  // Toggle Defective state (Kırmızı / Yeşil)
  const handleToggleDefective = (id: string) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, isDefective: !item.isDefective } : item
      )
    );
  };

  // Update item notes - automatically marks item as defective (uygunsuz/eksik) when note is added
  const handleUpdateNotes = (id: string, notes: string) => {
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === id) {
          // Bir maddeye not yazıldığı anda otomatik olarak UYGUNSUZ (isDefective: true) yapılır
          const shouldBeDefective = notes.trim().length > 0 ? true : item.isDefective;
          return { ...item, notes, isDefective: shouldBeDefective };
        }
        return item;
      })
    );
  };

  // Add custom item
  const handleAddCustomItem = () => {
    if (!newCustomTitle.trim()) return;
    const nextNumber = items.reduce((max, item) => Math.max(max, item.itemNumber), 0) + 1;
    const newItem: CustomerInspectionItem = {
      id: `custom-${Date.now()}-${nextNumber}`,
      itemNumber: nextNumber,
      category: 'CUSTOM',
      description: newCustomTitle.trim(),
      isDefective: true,
      notes: '',
      isCustom: true,
    };
    setItems((prev) => [...prev, newItem]);
    setNewCustomTitle('');
  };

  // Delete custom item
  const handleDeleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Reset/sync to latest template
  const handleResetToTemplate = () => {
    if (!metadata) return;
    if (
      window.confirm(
        'Maddeler orijinal şablona getirilsin mi? (İşaretlediğiniz eksikler sıfırlanacaktır)'
      )
    ) {
      const initialItems = generateInitialCustomerItems(metadata.elevatorType);
      setItems(initialItems);
    }
  };

  // Manual save trigger
  const handleManualSave = () => {
    if (metadata && items.length > 0) {
      const activeState = {
        metadata,
        items,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY_ACTIVE, JSON.stringify(activeState));

      // Also create/update in history snapshot
      const recordId = `rec-draft-${metadata.serialNumber || Date.now()}`;
      const newRecord: CustomerInspectionRecord = {
        id: recordId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata,
        items,
        status: 'draft',
      };

      setHistory((prev) => [
        newRecord,
        ...prev.filter((r) => r.metadata.serialNumber !== metadata.serialNumber),
      ]);

      setLastSavedFeedback(true);
      setTimeout(() => setLastSavedFeedback(false), 2500);
    }
  };

  // Complete and save record
  const handleCompleteAndGenerateReport = () => {
    if (!metadata) return;

    const recordId = `rec-${Date.now()}`;
    const newRecord: CustomerInspectionRecord = {
      id: recordId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata,
      items,
      status: 'completed',
    };

    setHistory((prev) => [
      newRecord,
      ...prev.filter((r) => r.metadata.serialNumber !== metadata.serialNumber),
    ]);
    setIsReportModalOpen(true);
  };

  // Start fresh new inspection - seamlessly archives to history and goes directly to the info entry screen
  const handleNewInspection = () => {
    // Save current active inspection to history if metadata exists
    if (metadata && items.length > 0) {
      const recordId = `rec-${Date.now()}`;
      const record: CustomerInspectionRecord = {
        id: recordId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata,
        items,
        status: 'draft',
      };
      setHistory((prev) => [record, ...prev.filter((r) => r.metadata.serialNumber !== metadata.serialNumber)]);
    }

    // Clear active storage and return to project info entry form
    localStorage.removeItem(STORAGE_KEY_ACTIVE);
    setMetadata(null);
    setItems([]);
    setIsEditingInfo(false);
    setIsSettingsModalOpen(false);
  };

  const defectiveCount = items.filter((i) => i.isDefective).length;
  const compliantCount = items.filter((i) => !i.isDefective).length;
  const totalCount = items.length;

  const filteredItems = items.filter((item) => {
    if (filterMode === 'DEFECTIVE') return item.isDefective;
    if (filterMode === 'COMPLIANT') return !item.isDefective;
    return true;
  });

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        isDark
          ? 'bg-slate-950 text-slate-100'
          : 'bg-[#FDFBF7] text-slate-900'
      }`}
    >
      {/* Header Bar: SADECE MENÜ, LOGO, BAŞLIK - SAĞDA SADECE KAYDET & AYARLAR */}
      <header
        className={`sticky top-0 z-40 shadow-md border-b-4 pt-safe-or-4 print:hidden transition-colors ${
          isDark
            ? 'bg-[#0A2647] text-white border-emerald-500'
            : 'bg-[#1E293B] text-white border-amber-500'
        }`}
      >
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between gap-3">
          {/* Sol Kısım: Menü Butonu & Logo */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <button
              type="button"
              id="btn-back-hub"
              onClick={onBackToMainMenu}
              className="px-2.5 py-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white rounded border border-slate-600 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden xs:inline">Menü</span>
            </button>
            <BetaLogo size="sm" className="shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm sm:text-base font-black leading-none text-white truncate">
                  MÜŞTERİ İŞLERİ
                </h1>
                <span className="px-1.5 py-0.5 text-[9px] font-black uppercase bg-emerald-500 text-slate-950 rounded shrink-0">
                  YEŞİL ETİKET
                </span>
              </div>
              <p className="text-[10px] text-slate-300 font-medium truncate mt-0.5">
                {metadata
                  ? `${metadata.projectName} (${metadata.elevatorType})`
                  : 'Bina & Şantiye Uygunluk Denetimi'}
              </p>
            </div>
          </div>

          {/* Sağ Kısım: YENİ DENETİM, KAYDET VE AYARLAR */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* 1. Yeni Denetim Butonu */}
            {metadata && (
              <button
                type="button"
                onClick={handleNewInspection}
                title="Mevcut denetimi arşivleyip yeni denetim bilgi girişine git"
                className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Yeni Denetim</span>
              </button>
            )}

            {/* 2. Manuel Kaydet Butonu */}
            {metadata && (
              <button
                type="button"
                onClick={handleManualSave}
                title="Taslağı Hafızaya Kaydet"
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                  lastSavedFeedback
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-md scale-105'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-600'
                }`}
              >
                {lastSavedFeedback ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                    <span className="hidden xs:inline">Kaydedildi</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="hidden xs:inline">Kaydet</span>
                  </>
                )}
              </button>
            )}

            {/* 3. Ayarlar Butonu (İçinde Gece/Gündüz, Yeni Denetim, Geçmiş ve Sıfırlama) */}
            <button
              type="button"
              onClick={() => setIsSettingsModalOpen(true)}
              title="Ayarlar, Görünüm Modu ve Geçmiş"
              className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-600 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ayarlar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6 space-y-4">
        {!metadata || isEditingInfo ? (
          <CustomerInspectionForm
            initialData={metadata || undefined}
            themeMode={theme}
            onCancel={metadata ? () => setIsEditingInfo(false) : undefined}
            onSubmit={(newMeta) => {
              if (!metadata || metadata.elevatorType !== newMeta.elevatorType || items.length === 0) {
                const initialItems = generateInitialCustomerItems(newMeta.elevatorType);
                setItems(initialItems);
              }
              setMetadata(newMeta);
              setIsEditingInfo(false);
            }}
          />
        ) : (
          /* DENETİM LİSTESİ EKRANI (ChecklistSection) */
          <div className="space-y-4">
            {/* Üst Özet ve Filtre Çubuğu */}
            <div
              className={`border rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm transition-all ${
                isDark
                  ? 'bg-slate-900 border-slate-800 text-white'
                  : 'bg-[#FFFFFF] border-amber-200 text-slate-900 shadow-amber-900/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-black">
                      {metadata.projectName}
                    </h2>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                        isDark
                          ? 'bg-slate-800 text-emerald-400 border-slate-700'
                          : 'bg-amber-100 text-amber-900 border-amber-300'
                      }`}
                    >
                      {metadata.elevatorType}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsEditingInfo(true)}
                      title="Proje ve Asansör Bilgilerini Düzenle"
                      className={`px-2 py-0.5 text-[10px] font-bold rounded flex items-center gap-1 border transition-colors cursor-pointer ${
                        isDark
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                      }`}
                    >
                      <Edit3 className="w-3 h-3 text-emerald-500" />
                      <span>Bilgileri Düzenle</span>
                    </button>
                  </div>
                  <p
                    className={`text-xs mt-0.5 ${
                      isDark ? 'text-slate-400' : 'text-slate-600'
                    }`}
                  >
                    Toplam: {totalCount} |{' '}
                    <span className="text-rose-600 font-bold">
                      {defectiveCount} Eksik
                    </span>{' '}
                    |{' '}
                    <span className="text-emerald-600 font-bold">
                      {compliantCount} Uygun
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Filtreler */}
                <div
                  className={`flex items-center p-0.5 rounded-lg border text-xs font-bold ${
                    isDark
                      ? 'bg-slate-800 border-slate-700'
                      : 'bg-slate-100 border-slate-300'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setFilterMode('ALL')}
                    className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                      filterMode === 'ALL'
                        ? isDark
                          ? 'bg-slate-700 text-white shadow-xs'
                          : 'bg-white text-slate-900 shadow-xs'
                        : isDark
                        ? 'text-slate-400'
                        : 'text-slate-600'
                    }`}
                  >
                    Tümü ({totalCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterMode('DEFECTIVE')}
                    className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                      filterMode === 'DEFECTIVE'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : isDark
                        ? 'text-slate-400'
                        : 'text-slate-600'
                    }`}
                  >
                    Eksikler ({defectiveCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterMode('COMPLIANT')}
                    className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                      filterMode === 'COMPLIANT'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : isDark
                        ? 'text-slate-400'
                        : 'text-slate-600'
                    }`}
                  >
                    Tamam ({compliantCount})
                  </button>
                </div>

                {/* Rapor & Tamamla Butonu */}
                <button
                  type="button"
                  onClick={handleCompleteAndGenerateReport}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-lg text-xs font-black flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Rapor / PDF</span>
                </button>
              </div>
            </div>

            {/* Maddeler Listesi */}
            <div className="space-y-2.5">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 sm:p-3.5 rounded-xl border transition-all duration-150 ${
                    item.isDefective
                      ? isDark
                        ? 'bg-slate-900 border-rose-500/40 hover:border-rose-500'
                        : 'bg-rose-50/70 border-rose-300 hover:border-rose-400'
                      : isDark
                      ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      : 'bg-[#FFFFFF] border-amber-200/80 hover:border-amber-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      {/* Toggle Butonu (Kusurlu/Uygun) */}
                      <button
                        type="button"
                        onClick={() => handleToggleDefective(item.id)}
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 font-black text-xs border transition-all cursor-pointer ${
                          item.isDefective
                            ? 'bg-rose-600 border-rose-500 text-white shadow-md shadow-rose-600/30'
                            : isDark
                            ? 'bg-emerald-950/60 border-emerald-600/40 text-emerald-400 hover:bg-emerald-900'
                            : 'bg-emerald-100 border-emerald-300 text-emerald-800 hover:bg-emerald-200'
                        }`}
                        title={
                          item.isDefective
                            ? 'Eksik Olarak İşaretlendi (Tıklayarak Uygun Yap)'
                            : 'Uygun Olarak İşaretlendi (Tıklayarak Eksik Yap)'
                        }
                      >
                        {item.isDefective ? '✕' : '✓'}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span
                            className={`text-xs font-black ${
                              isDark ? 'text-slate-300' : 'text-slate-800'
                            }`}
                          >
                            #{item.itemNumber}
                          </span>
                          <span
                            className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded border ${
                              item.category === 'COMMON'
                                ? isDark
                                  ? 'bg-slate-800 text-slate-300 border-slate-700'
                                  : 'bg-slate-100 text-slate-700 border-slate-300'
                                : item.category === 'MR'
                                ? isDark
                                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                  : 'bg-blue-100 text-blue-800 border-blue-300'
                                : item.category === 'MRL'
                                ? isDark
                                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                                  : 'bg-purple-100 text-purple-800 border-purple-300'
                                : isDark
                                ? 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                                : 'bg-orange-100 text-orange-800 border-orange-300'
                            }`}
                          >
                            {item.category === 'COMMON' ? 'ORTAK' : item.category}
                          </span>
                          <span
                            className={`text-[10px] font-bold ${
                              item.isDefective
                                ? 'text-rose-600'
                                : 'text-emerald-600'
                            }`}
                          >
                            {item.isDefective ? '• EKSİK / BİNA SORUMLULUĞUNDA' : '• UYGUN'}
                          </span>
                        </div>

                        <p
                          className={`text-xs sm:text-sm font-medium leading-relaxed ${
                            item.isDefective
                              ? isDark
                                ? 'text-white'
                                : 'text-slate-900 font-semibold'
                              : isDark
                              ? 'text-slate-300'
                              : 'text-slate-700'
                          }`}
                        >
                          {item.description}
                        </p>

                        {/* Not Alanı ve Sesli Giriş */}
                        <div className="mt-2 flex items-center gap-2">
                          <input
                            type="text"
                            value={item.notes || ''}
                            onChange={(e) => handleUpdateNotes(item.id, e.target.value)}
                            placeholder="Bu maddeye özel şantiye/bina notu ekle..."
                            className={`flex-1 rounded-lg px-2.5 py-1.5 text-xs outline-none border transition-all ${
                              isDark
                                ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-emerald-500'
                                : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-amber-500'
                            }`}
                          />
                          <VoiceInputButton
                            onTranscript={(text) => {
                              const current = item.notes || '';
                              handleUpdateNotes(item.id, current ? `${current} ${text}` : text);
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {item.isCustom && (
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                        title="Özel Maddeyi Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Ekstra Özel Madde Ekleme */}
            <div
              className={`border rounded-xl p-3 sm:p-4 space-y-2 ${
                isDark
                  ? 'bg-slate-900 border-slate-800 text-white'
                  : 'bg-[#FFFFFF] border-amber-200 text-slate-900'
              }`}
            >
              <span
                className={`text-xs font-bold block ${
                  isDark ? 'text-slate-300' : 'text-slate-800'
                }`}
              >
                + Şantiyeye Özel Ekstra Madde Ekle
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newCustomTitle}
                  onChange={(e) => setNewCustomTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCustomItem()}
                  placeholder="Ekstra eksiklik veya özel talimat maddesi..."
                  className={`flex-1 rounded-lg px-3 py-2 text-xs outline-none border ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-emerald-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-amber-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={handleAddCustomItem}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ekle</span>
                </button>
              </div>
            </div>

            {/* Alt İşlemler */}
            <div
              className={`flex items-center justify-between text-xs pt-2 ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}
            >
              <button
                type="button"
                onClick={() => setIsSyncModalOpen(true)}
                className="hover:underline flex items-center gap-1 cursor-pointer text-emerald-400 font-bold"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                E-Tablodan Madde Güncelle
              </button>

              <button
                type="button"
                onClick={() => setMetadata(null)}
                className="hover:underline text-emerald-500 flex items-center gap-1 cursor-pointer font-semibold"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Proje Bilgilerini Düzenle
              </button>
            </div>
          </div>
        )}
      </main>

      {/* RAPOR & PDF MODALI (CustomerReportPreviewModal) */}
      {isReportModalOpen && metadata && (
        <CustomerReportPreviewModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          metadata={metadata}
          items={items}
        />
      )}

      {/* AYARLAR MODALI (Gece/Gündüz Modu, Yeni Denetim, Geçmiş Kayıtlar & E-Tablo Senkronizasyonu) */}
      <CustomerSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        themeMode={theme}
        onSelectTheme={handleSelectTheme}
        onManualSave={handleManualSave}
        lastSavedFeedback={lastSavedFeedback}
        metadata={metadata}
        items={items}
        history={history}
        onLoadRecord={(rec) => {
          setMetadata(rec.metadata);
          setItems(rec.items);
        }}
        onDeleteRecord={(id) => {
          setHistory((prev) => prev.filter((r) => r.id !== id));
        }}
        onClearAllHistory={() => {
          if (window.confirm('Tüm kayıtlı geçmişi silmek istediğinizden emin misiniz?')) {
            setHistory([]);
            localStorage.removeItem(STORAGE_KEY_HISTORY);
          }
        }}
        onNewInspection={handleNewInspection}
      />

      {/* E-TABLO SENKROZİNASYON MODALI (CustomerSyncModal) */}
      <CustomerSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        onApplySyncedData={() => {
          if (metadata) {
            setItems(generateInitialCustomerItems(metadata.elevatorType));
          }
        }}
        onResetToDefault={() => {
          if (metadata) {
            setItems(generateInitialCustomerItems(metadata.elevatorType));
          }
        }}
      />
    </div>
  );
};
