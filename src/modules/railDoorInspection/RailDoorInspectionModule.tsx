import React, { useState, useEffect } from 'react';
import { RailDoorInspectionFullData } from './types';
import { calculateFloors } from './constants';
import { RailDoorSetupScreen } from './components/RailDoorSetupScreen';
import { RailDoorInspectionScreen } from './components/RailDoorInspectionScreen';
import { RailDoorReportModal } from './components/RailDoorReportModal';
import { RailDoorSettingsModal } from './components/RailDoorSettingsModal';
import { BetaLogo } from '../../components/BetaLogo';
import { useTheme } from '../../context/ThemeContext';
import {
  ArrowLeft,
  Save,
  Check,
  FileText,
  Settings,
  FolderKanban,
  FileCheck2,
} from 'lucide-react';
import { getCurrentDateFormatted } from '../../utils/textUtils';
import { autoSyncLocalDrawings, syncDrawingsToServer } from './utils/drawingSync';

interface RailDoorInspectionModuleProps {
  onBackToMainMenu: () => void;
}

const STORAGE_KEY = 'beta_asansor_rail_door_inspection_v2_full';
const HISTORY_KEY = 'beta_asansor_rail_door_history_v1';
const LAST_SAVED_TIME_KEY = 'beta_asansor_rail_door_last_saved_time';
const STEP_STORAGE_KEY = 'beta_asansor_rail_door_active_step';

export const RailDoorInspectionModule: React.FC<RailDoorInspectionModuleProps> = ({
  onBackToMainMenu,
}) => {
  const { isDark } = useTheme();

  const [currentStep, setCurrentStep] = useState<'setup' | 'inspection'>(() => {
    try {
      const savedStep = localStorage.getItem(STEP_STORAGE_KEY);
      if (savedStep === 'setup' || savedStep === 'inspection') {
        return savedStep;
      }
    } catch (e) {}

    try {
      const savedDraft = localStorage.getItem(STORAGE_KEY);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        const hasProjectInfo = Boolean(
          parsed?.identity?.serialNumber?.trim() ||
          parsed?.identity?.reference?.trim() ||
          parsed?.identity?.location?.trim() ||
          parsed?.identity?.installerMaster?.trim()
        );
        if (hasProjectInfo) {
          return 'inspection';
        }
      }
    } catch (e) {}

    return 'setup';
  });

  const setStepWithPersistence = (step: 'setup' | 'inspection') => {
    setCurrentStep(step);
    try {
      localStorage.setItem(STEP_STORAGE_KEY, step);
    } catch (e) {}
  };

  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  const createInitialForm = (prev?: RailDoorInspectionFullData): RailDoorInspectionFullData => {
    const defaultStops = prev?.stopCount || 8;
    const defaultStartFloor = prev?.startFloor !== undefined ? prev.startFloor : -1;
    const floorsList = calculateFloors(defaultStops, defaultStartFloor);

    return {
      id: `raildoor_${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      inspectionDateDisplay: getCurrentDateFormatted(),

      identity: {
        serialNumber: '',
        reference: '',
        location: '',
        installerMaster: '',
        projectManager: '',
        inspector: '',
      },

      stopCount: defaultStops,
      startFloor: defaultStartFloor,
      floors: floorsList.map((f) => ({
        floorIndex: f.stopIndex,
        floorLabel: f.floorLabel,
        floorNumber: f.floorNumber,
        measurements: {},
      })),
      floorAliases: {},

      mainType: prev?.mainType || 'MR',
      layoutPosition: prev?.layoutPosition || 'CWT_SIDE_RIGHT',

      // Keep registered/uploaded PDF and blueprint images!
      layoutImages: prev?.layoutImages || {},
      customColumnCodes: prev?.customColumnCodes || [],
      column9Direction: prev?.column9Direction || '',
      column7Direction: prev?.column7Direction || '',
      columnSubOptions: prev?.columnSubOptions || {},

      attachedImageName: prev?.attachedImageName,
      attachedImageUrl: prev?.attachedImageUrl,
      attachedPdfName: prev?.attachedPdfName,
      attachedPdfDataUrl: prev?.attachedPdfDataUrl,

      // Clear measurements and project nominals for new form
      projectNominalValues: {},
      floorMatrixMeasurements: {},
      machineChassisMeasurements: {},
      chaseMeasurementsTable1: {},
      consoleMeasurementsTable2: {
        uBolmeSide: {},
        tekRaySide: {},
      },
      pitDepth: '',
      headroom: '',
      railDoorMeasurements: {},

      generalNotes: '',
      isApproved: false,
    };
  };

  const [formData, setFormData] = useState<RailDoorInspectionFullData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          inspectionDateDisplay: getCurrentDateFormatted(),
        };
      }
    } catch (e) {
      console.error('Failed to load saved rail door draft', e);
    }
    return createInitialForm();
  });

  // Otomatik Yerel Kayıt
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    } catch (e) {
      console.error('LocalStorage save error', e);
    }
  }, [formData]);

  // Çizimleri otomatik olarak sunucu/APK dosya sistemine sabitle
  useEffect(() => {
    autoSyncLocalDrawings();
  }, []);

  useEffect(() => {
    if (formData.chassisImages) {
      const payload: Record<string, { dataUrl?: string; name?: string }> = {};
      Object.entries(formData.chassisImages).forEach(([k, val]: [string, any]) => {
        if (val?.imageUrl?.startsWith('data:')) {
          payload[k] = { dataUrl: val.imageUrl, name: val.imageName };
        }
      });
      if (Object.keys(payload).length > 0) {
        syncDrawingsToServer(payload);
      }
    }
  }, [formData.chassisImages]);

  const handleManualSave = () => {
    try {
      const now = new Date();
      const timeStr = `${now.toLocaleDateString('tr-TR')} ${now.toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
      localStorage.setItem(LAST_SAVED_TIME_KEY, timeStr);

      // Save / update in history
      try {
        const histRaw = localStorage.getItem(HISTORY_KEY);
        let hist: RailDoorInspectionFullData[] = histRaw ? JSON.parse(histRaw) : [];
        if (!Array.isArray(hist)) hist = [];
        const existingIdx = hist.findIndex((h) => h.id === formData.id);
        if (existingIdx >= 0) {
          hist[existingIdx] = { ...formData, updatedAt: Date.now() };
        } else {
          hist.unshift({ ...formData, updatedAt: Date.now() });
        }
        localStorage.setItem(HISTORY_KEY, JSON.stringify(hist.slice(0, 30)));
      } catch (err) {
        console.error(err);
      }

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRestoreData = (restored: RailDoorInspectionFullData) => {
    setFormData(restored);
    setStepWithPersistence('inspection');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetForm = () => {
    // Current form save to history before reset
    try {
      const histRaw = localStorage.getItem(HISTORY_KEY);
      let hist: RailDoorInspectionFullData[] = histRaw ? JSON.parse(histRaw) : [];
      if (!Array.isArray(hist)) hist = [];
      hist.unshift({ ...formData, updatedAt: Date.now() });
      localStorage.setItem(HISTORY_KEY, JSON.stringify(hist.slice(0, 30)));
    } catch (err) {
      console.error(err);
    }

    const newForm = createInitialForm(formData);
    setFormData(newForm);
    setStepWithPersistence('setup');
    try {
      localStorage.setItem('beta_asansor_rail_door_active_tab', 'RAIL_DOOR');
    } catch (e) {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartInspection = () => {
    setStepWithPersistence('inspection');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-150 app-root ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
      }`}
    >
      {/* Üst Header: Menü, BetaLogo, Başlık + Sağ Tarafta [Proje Bilgileri] [Kaydet Simgesi] [Ayarlar Simgesi] */}
      <header className="sticky top-0 z-40 bg-[#0A2647] text-white shadow-md border-b-4 border-amber-500 pt-safe-or-4 print:hidden">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2">
          {/* Sol Kısım: Menü Butonu + BetaLogo + Başlık */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={onBackToMainMenu}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg border border-slate-600 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
              title="Ana Menüye Dön"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
              <span>Menü</span>
            </button>
            <BetaLogo size="sm" className="shrink-0 hidden sm:block" />
            <div className="min-w-0">
              <h1 className="text-xs sm:text-sm md:text-base font-black leading-none text-white truncate flex items-center gap-2">
                <span>RAY & KAPI KONTROL FORMU</span>
              </h1>
            </div>
          </div>

          {/* Sağ Kısım: Rapor Butonu | Proje Bilgileri Butonu | Kaydet Simgesi | Ayarlar Simgesi */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Raporu Önizle ve Yazdır Butonu (Hızlı Erişim) */}
            <button
              type="button"
              id="btn-header-view-report"
              onClick={() => setShowReportModal(true)}
              className="btn-amber-action px-2.5 sm:px-3 py-1.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-black rounded-lg border-2 border-amber-600 text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-amber-500/20"
              title="Resmi Kontrol Raporunu Önizle ve Yazdır"
            >
              <FileCheck2 className="w-4 h-4 text-slate-950" />
              <span>Rapor</span>
            </button>

            {/* Proje Bilgileri Butonu */}
            <button
              type="button"
              onClick={() => {
                if (currentStep === 'setup') {
                  setStepWithPersistence('inspection');
                } else {
                  setStepWithPersistence('setup');
                }
              }}
              className="px-2.5 sm:px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-amber-500 active:text-slate-950 text-slate-200 hover:text-white rounded-lg border border-slate-600 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Proje Bilgilerini Görüntüle / Düzenle"
            >
              <FolderKanban className="w-4 h-4 text-amber-400" />
              <span className="hidden xs:inline">Proje Bilgileri</span>
            </button>

            {/* Kaydet Simgesi Butonu */}
            <button
              type="button"
              onClick={handleManualSave}
              className={`p-2 rounded-lg border text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                isSaved
                  ? 'bg-emerald-600 border-emerald-400 text-white shadow-md'
                  : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border-slate-600'
              }`}
              title={isSaved ? 'Kaydedildi' : 'Taslağı Kaydet'}
            >
              {isSaved ? <Check className="w-4 h-4 text-white animate-bounce" /> : <Save className="w-4 h-4 text-amber-400" />}
            </button>

            {/* Ayarlar Simgesi Butonu */}
            <button
              type="button"
              id="btn-rail-door-settings"
              onClick={() => setShowSettingsModal(true)}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-600 text-xs font-bold flex items-center justify-center transition-colors cursor-pointer"
              title="Uygulama Ayarları & Taslaklar"
            >
              <Settings className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6">
        {currentStep === 'setup' ? (
          <RailDoorSetupScreen
            data={formData}
            onChange={setFormData}
            onStartInspection={handleStartInspection}
          />
        ) : (
          <RailDoorInspectionScreen
            data={formData}
            onChange={setFormData}
            onBackToSetup={() => setStepWithPersistence('setup')}
            onViewReport={() => setShowReportModal(true)}
            onSaveDraft={handleManualSave}
            isSaved={isSaved}
          />
        )}
      </main>

      {/* Rapor Önizleme Modalı */}
      {showReportModal && (
        <RailDoorReportModal
          data={formData}
          onClose={() => setShowReportModal(false)}
        />
      )}

      {/* Ayarlar ve Taslak Yönetimi Modalı (Kalite Kontrol ile Birebir, Senkronizasyon hariç) */}
      <RailDoorSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        formData={formData}
        onManualSave={handleManualSave}
        onRestoreData={handleRestoreData}
        onEditInspectionInfo={() => {
          setStepWithPersistence('setup');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onResetForm={handleResetForm}
        lastSavedFeedback={isSaved}
      />
    </div>
  );
};
