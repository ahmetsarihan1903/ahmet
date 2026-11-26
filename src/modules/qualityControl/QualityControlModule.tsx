import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Clock, Play, Pause } from 'lucide-react';
import { AuditFormData, ElevatorType, InspectionItem, MeasureItem } from '../../types';
import {
  CONTROL_PANEL_ITEMS,
  CABIN_TOP_ITEMS,
  COUNTERWEIGHT_ITEMS,
  SHAFT_AND_PIT_ITEMS,
  CABIN_AND_BUTTONS_ITEMS,
  DEFAULT_FIXED_MEASURES,
  getMotorChassisItems,
} from '../../data/initialChecklists';
import { generateDoorInspectionItems } from '../../utils/floorMatrix';
import {
  getCurrentDateFormatted,
  getCurrentTimeFormatted,
  formatDurationSeconds,
  formatTimerDisplay,
} from '../../utils/textUtils';
import {
  saveActiveDraft,
  loadActiveDraft,
  clearActiveDraft,
  saveCompletedAuditToHistory,
  saveManualAuditSnapshot,
} from '../../utils/storage';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import {
  uploadAuditJsonToDrive,
  queueAuditForCloudSync,
  getQueuedAuditForCloudSync,
  clearQueuedAuditForCloudSync,
  getCachedDriveToken,
  isCloudConfigured,
} from '../../services/googleDriveService';

// Helper to sync draft measures with default fixed measures
function syncMeasuresWithMaster(draftMeasures: MeasureItem[] | undefined): MeasureItem[] {
  if (!draftMeasures || draftMeasures.length === 0) {
    return JSON.parse(JSON.stringify(DEFAULT_FIXED_MEASURES));
  }

  const draftMap = new Map(draftMeasures.map((m) => [m.id, m]));
  const nameMap = new Map(draftMeasures.map((m) => [m.name.trim().toUpperCase(), m]));

  const syncedFixed: MeasureItem[] = DEFAULT_FIXED_MEASURES.map((fixed) => {
    const existing = draftMap.get(fixed.id) || nameMap.get(fixed.name.trim().toUpperCase());
    if (existing) {
      return {
        ...fixed,
        value: existing.value || '',
        notes: existing.notes || '',
      };
    }
    return { ...fixed };
  });

  const fixedIds = new Set(DEFAULT_FIXED_MEASURES.map((f) => f.id));
  const fixedNames = new Set(DEFAULT_FIXED_MEASURES.map((f) => f.name.trim().toUpperCase()));
  const customMeasures = draftMeasures.filter(
    (m) => !fixedIds.has(m.id) && !fixedNames.has(m.name.trim().toUpperCase())
  );

  return [...syncedFixed, ...customMeasures];
}

// Helper to sync draft items with master checklist definitions
function syncItemsWithMaster(draftItems: InspectionItem[], masterItems: InspectionItem[]): InspectionItem[] {
  if (!draftItems || draftItems.length === 0) {
    return JSON.parse(JSON.stringify(masterItems));
  }

  const draftMap = new Map(draftItems.map((it) => [it.id, it]));

  const synced: InspectionItem[] = masterItems.map((masterIt) => {
    const userIt = draftMap.get(masterIt.id);
    if (userIt) {
      return {
        ...masterIt,
        isNonCompliant: userIt.isNonCompliant || false,
        isPassed: userIt.isPassed || false,
        description: userIt.description || '',
        isResolved: userIt.isResolved,
        resolutionType: userIt.resolutionType,
        resolvedAt: userIt.resolvedAt,
        resolutionNote: userIt.resolutionNote,
        contractorDone: userIt.contractorDone,
        contractorNote: userIt.contractorNote,
        contractorUpdatedAt: userIt.contractorUpdatedAt,
        contractorName: userIt.contractorName,
      };
    }
    return { ...masterIt };
  });

  const customItems = draftItems.filter((it) => it.isCustom);
  return [...synced, ...customItems];
}

function getLiveAccumulatedSeconds(data: AuditFormData, paused: boolean): number {
  const base = data.accumulatedElapsedSeconds || 0;
  if (paused || !data.lastTimerAnchorTimestamp || data.endTimestamp) {
    return base;
  }
  const seg = Math.max(0, Math.floor((Date.now() - data.lastTimerAnchorTimestamp) / 1000));
  if (seg > 8 * 3600) {
    return base;
  }
  return base + seg;
}

function getInitialPausedElapsedSeconds(draft: AuditFormData): number {
  if (typeof draft.accumulatedElapsedSeconds === 'number') {
    return draft.accumulatedElapsedSeconds;
  }
  if (draft.startTimestamp && !draft.endTimestamp) {
    const diff = Math.max(0, Math.floor((Date.now() - draft.startTimestamp) / 1000));
    return diff > 8 * 3600 ? 0 : diff;
  }
  return 0;
}

function buildPersistedAuditSnapshot(data: AuditFormData, paused: boolean): AuditFormData {
  const isActiveRunning = !paused && data.currentStep === 'audit' && !data.endTimestamp && !!data.startTimestamp;
  return {
    ...data,
    accumulatedElapsedSeconds: getLiveAccumulatedSeconds(data, paused),
    lastTimerAnchorTimestamp: isActiveRunning ? Date.now() : null,
  };
}

function resolveMotorChassisItems(type: ElevatorType, customSynced?: Record<string, InspectionItem[]> | null): InspectionItem[] {
  if (customSynced) {
    if (type === 'MR' && customSynced.motorChassisMR?.length) {
      return customSynced.motorChassisMR;
    }
    if (type === 'MRL' && customSynced.motorChassisMRL?.length) {
      return customSynced.motorChassisMRL;
    }
    if (customSynced.motorChassis?.length) {
      return customSynced.motorChassis;
    }
  }
  return getMotorChassisItems(type);
}

function syncDraftWithMaster(draft: AuditFormData): AuditFormData {
  const customSynced = loadSyncedItemsFromStorage();
  const cpMaster = customSynced?.controlPanel?.length ? customSynced.controlPanel : CONTROL_PANEL_ITEMS;
  const motorMaster = resolveMotorChassisItems(draft.elevatorType || 'MR', customSynced);
  const ctMaster = customSynced?.cabinTop?.length ? customSynced.cabinTop : CABIN_TOP_ITEMS;
  const cwMaster = customSynced?.counterweight?.length ? customSynced.counterweight : COUNTERWEIGHT_ITEMS;
  const spMaster = customSynced?.shaftAndPit?.length ? customSynced.shaftAndPit : SHAFT_AND_PIT_ITEMS;
  const cbMaster = customSynced?.cabinAndButtons?.length ? customSynced.cabinAndButtons : CABIN_AND_BUTTONS_ITEMS;

  return {
    ...draft,
    measures: syncMeasuresWithMaster(draft.measures),
    controlPanelItems: syncItemsWithMaster(draft.controlPanelItems, cpMaster),
    motorChassisItems: syncItemsWithMaster(draft.motorChassisItems, motorMaster),
    cabinTopItems: syncItemsWithMaster(draft.cabinTopItems, ctMaster),
    counterweightItems: syncItemsWithMaster(draft.counterweightItems, cwMaster),
    shaftAndPitItems: syncItemsWithMaster(draft.shaftAndPitItems, spMaster),
    cabinAndFloorButtonsItems: syncItemsWithMaster(draft.cabinAndFloorButtonsItems, cbMaster),
  };
}

import { Header } from '../../components/Header';
import { Step1Welcome } from '../../components/Step1Welcome';
import { Step2ElevatorSpecs } from '../../components/Step2ElevatorSpecs';
import { Step3SwipePanel } from '../../components/Step3SwipePanel';
import { Step4FinalComfortModal } from '../../components/Step4FinalComfortModal';
import { ReportView } from '../../components/ReportView';
import { AuditHistoryModal } from '../../components/AuditHistoryModal';
import { SyncModal } from '../../components/SyncModal';
import { SettingsModal } from '../../components/SettingsModal';
import { DriveSyncModal } from '../../components/DriveSyncModal';
import { loadSyncedItemsFromStorage } from '../../services/dataSyncService';
import { WindowsModeBanner } from '../../components/WindowsModeBanner';
import { appendWindowsChangeLog } from '../../utils/windowsAuth';

interface QualityControlModuleProps {
  onBackToMainMenu?: () => void;
}

export function QualityControlModule({ onBackToMainMenu }: QualityControlModuleProps) {
  const { isDark } = useTheme();
  const {
    userName,
    isWindowsDesktop,
    windowsUser,
    isReadOnlyMonitoringMode,
    openWindowsAuthModal,
  } = useUser();
  const [initialLoadedDraft] = useState<AuditFormData | null>(() => loadActiveDraft());
  const shouldPromptResumeOnMount = Boolean(
    !isReadOnlyMonitoringMode &&
      initialLoadedDraft &&
      initialLoadedDraft.currentStep === 'audit' &&
      initialLoadedDraft.startTimestamp &&
      !initialLoadedDraft.endTimestamp
  );

  const [isTimerPaused, setIsTimerPaused] = useState<boolean>(
    Boolean(
      initialLoadedDraft &&
        initialLoadedDraft.currentStep === 'audit' &&
        initialLoadedDraft.startTimestamp &&
        !initialLoadedDraft.endTimestamp
    )
  );
  const [showResumeTimerPrompt, setShowResumeTimerPrompt] = useState<boolean>(shouldPromptResumeOnMount);

  const [formData, setFormData] = useState<AuditFormData>(() => {
    // 1. Önce aktif taslağı yükle (hangi adımda kalmışsa: welcome, specs, audit veya report)
    const draft = initialLoadedDraft;
    if (draft) {
      const synced = syncDraftWithMaster(draft);
      if (synced.currentStep === 'audit' && synced.startTimestamp && !synced.endTimestamp) {
        return {
          ...synced,
          accumulatedElapsedSeconds: getInitialPausedElapsedSeconds(synced),
          lastTimerAnchorTimestamp: null,
        };
      }
      return synced;
    }

    const defaultStopCount = 10;
    const defaultFloorStart = -1;

    // Check if custom synced items exist in local storage
    const customSynced = loadSyncedItemsFromStorage();

    const storedUser = localStorage.getItem('beta_asansor_user_name') || '';

    return {
      auditId: `audit_${Date.now()}`,
      date: new Date().toISOString(),
      dateDisplay: getCurrentDateFormatted(),
      inspectorName: storedUser,
      clientProjectName: '',
      elevatorType: 'MR',
      serialNumber: '',
      capacityKg: '800',
      stopCount: defaultStopCount,
      floorStart: defaultFloorStart,
      maintenanceDate: '',
      isDateTimeConfirmed: false,
      isHardwareMatched: false,
      startTime: null,
      startTimestamp: null,
      endTime: null,
      endTimestamp: null,
      totalDurationFormatted: null,
      accumulatedElapsedSeconds: 0,
      lastTimerAnchorTimestamp: null,
      measures: JSON.parse(JSON.stringify(DEFAULT_FIXED_MEASURES)),
      controlPanelItems: customSynced?.controlPanel?.length
        ? JSON.parse(JSON.stringify(customSynced.controlPanel))
        : JSON.parse(JSON.stringify(CONTROL_PANEL_ITEMS)),
      motorChassisItems: JSON.parse(JSON.stringify(resolveMotorChassisItems('MR', customSynced))),
      cabinTopItems: customSynced?.cabinTop?.length
        ? JSON.parse(JSON.stringify(customSynced.cabinTop))
        : JSON.parse(JSON.stringify(CABIN_TOP_ITEMS)),
      counterweightItems: customSynced?.counterweight?.length
        ? JSON.parse(JSON.stringify(customSynced.counterweight))
        : JSON.parse(JSON.stringify(COUNTERWEIGHT_ITEMS)),
      shaftAndPitItems: customSynced?.shaftAndPit?.length
        ? JSON.parse(JSON.stringify(customSynced.shaftAndPit))
        : JSON.parse(JSON.stringify(SHAFT_AND_PIT_ITEMS)),
      cabinAndFloorButtonsItems: customSynced?.cabinAndButtons?.length
        ? JSON.parse(JSON.stringify(customSynced.cabinAndButtons))
        : JSON.parse(JSON.stringify(CABIN_AND_BUTTONS_ITEMS)),
      doorsItems: generateDoorInspectionItems(defaultStopCount, defaultFloorStart),
      rideComfortNonCompliant: false,
      rideComfortNotes: '',
      currentStep: 'welcome',
      activeAuditTab: 0,
    };
  });

  const [isComfortModalOpen, setIsComfortModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isSaveSuccess, setIsSaveSuccess] = useState(false);
  const [saveToastMessage, setSaveToastMessage] = useState<string | null>(null);

  // Keep synchronous references to latest formData & timer pause state for background/unload handlers
  const formDataRef = useRef<AuditFormData>(formData);
  const isTimerPausedRef = useRef<boolean>(isTimerPaused);
  const isReadOnlyRef = useRef<boolean>(isReadOnlyMonitoringMode);
  const windowsUserRef = useRef(windowsUser);
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);
  useEffect(() => {
    isTimerPausedRef.current = isTimerPaused;
  }, [isTimerPaused]);
  useEffect(() => {
    isReadOnlyRef.current = isReadOnlyMonitoringMode;
  }, [isReadOnlyMonitoringMode]);
  useEffect(() => {
    windowsUserRef.current = windowsUser;
  }, [windowsUser]);

  const guardWindowsWrite = useCallback(
    (reason = 'Değişiklik yapmak için adınız ve şifrenizle giriş yapın.') => {
      if (isReadOnlyRef.current) {
        openWindowsAuthModal('login', reason);
        return false;
      }
      return true;
    },
    [openWindowsAuthModal]
  );

  const withWindowsLog = useCallback(
    (audit: AuditFormData, actionSummary: string): AuditFormData => {
      if (!isWindowsDesktop || !windowsUserRef.current) return audit;
      return appendWindowsChangeLog(audit, windowsUserRef.current, actionSummary);
    },
    [isWindowsDesktop]
  );

  // Auto-save active draft whenever formData or pause state changes (skipped in Windows read-only mode)
  useEffect(() => {
    if (isReadOnlyMonitoringMode) return;
    const persisted = buildPersistedAuditSnapshot(formData, isTimerPaused);
    saveActiveDraft(persisted);
    if (persisted.clientProjectName || persisted.serialNumber || persisted.startTimestamp) {
      saveManualAuditSnapshot(persisted);
    }
  }, [formData, isTimerPaused, isReadOnlyMonitoringMode]);

  // Periodic auto-save draft & active duration checkpoint every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (isReadOnlyRef.current) return;
      if (formDataRef.current) {
        const persisted = buildPersistedAuditSnapshot(formDataRef.current, isTimerPausedRef.current);
        saveActiveDraft(persisted);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Comprehensive Mobile & Desktop Lifecycle Listeners
  useEffect(() => {
    const handleImmediatePersist = () => {
      if (isReadOnlyRef.current) return;
      if (formDataRef.current) {
        const persisted = buildPersistedAuditSnapshot(formDataRef.current, isTimerPausedRef.current);
        saveActiveDraft(persisted);
        if (
          persisted.clientProjectName ||
          persisted.serialNumber ||
          persisted.startTimestamp
        ) {
          saveManualAuditSnapshot(persisted);
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleImmediatePersist();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handleImmediatePersist);
    window.addEventListener('beforeunload', handleImmediatePersist);
    window.addEventListener('blur', handleImmediatePersist);
    window.addEventListener('freeze' as any, handleImmediatePersist);

    return () => {
      handleImmediatePersist();
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handleImmediatePersist);
      window.removeEventListener('beforeunload', handleImmediatePersist);
      window.removeEventListener('blur', handleImmediatePersist);
      window.removeEventListener('freeze' as any, handleImmediatePersist);
    };
  }, []);

  // Auto-sync queued offline saves whenever connection is restored
  useEffect(() => {
    const handleOnline = async () => {
      if (isReadOnlyRef.current) return;
      const queuedData = getQueuedAuditForCloudSync();
      const hasCloud = isCloudConfigured();
      if (queuedData && hasCloud) {
        try {
          await uploadAuditJsonToDrive(queuedData, undefined, { silent: true });
          setSaveToastMessage('İnternet bağlantısı sağlandı: Bekleyen veriler Drive\'a senkronize edildi ✓');
          setTimeout(() => setSaveToastMessage(null), 3500);
        } catch (err) {
          console.warn('Auto-sync on reconnect failed:', err);
        }
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  // Manual save triggered by Save button in header or settings
  const handleManualSave = useCallback(async () => {
    if (!guardWindowsWrite('Kayıt ve bulut yedekleme işlemi için giriş yapmalısınız.')) return;

    const dataToSave = withWindowsLog(formData, 'Windows üzerinden kayıt / Drive güncelleme yapıldı');
    if (dataToSave !== formData) {
      setFormData(dataToSave);
    }

    // 1. Always save locally immediately
    saveManualAuditSnapshot(dataToSave);
    setIsSaveSuccess(true);

    const isOnline = typeof navigator === 'undefined' || navigator.onLine;
    const hasCloud = isCloudConfigured();

    // 2. If online and drive cloud configured, sync immediately with overwrite
    if (isOnline && hasCloud) {
      setSaveToastMessage('Yerel kaydedildi. Drive bulutuna senkronize ediliyor...');
      try {
        const res = await uploadAuditJsonToDrive(dataToSave, undefined, { silent: true });
        if (res.isUpdated) {
          setSaveToastMessage('Yerel kaydedildi & Drive referans dosyasının üzerine güncellendi ✓');
        } else {
          setSaveToastMessage('Yerel kaydedildi & Drive bulutuna başarıyla yüklendi ✓');
        }
      } catch (err: any) {
        queueAuditForCloudSync(dataToSave);
        setSaveToastMessage('Yerel kaydedildi. Bulut yüklemesi sıraya alındı (internet geldiğinde yüklenecek)');
      }
    } else if (!isOnline) {
      // 3. If offline, queue for when connection is restored
      queueAuditForCloudSync(dataToSave);
      setSaveToastMessage('Cihaz çevrimdışı: Yerel kaydedildi (İnternet gelince Drive\'a yüklenecek) ✓');
    } else {
      // Online but no drive cloud configured yet
      queueAuditForCloudSync(dataToSave);
      setSaveToastMessage('Denetim taslağı başarıyla yerel olarak kaydedildi ✓');
    }

    setTimeout(() => {
      setIsSaveSuccess(false);
    }, 2500);
    setTimeout(() => {
      setSaveToastMessage(null);
    }, 3500);
  }, [formData, guardWindowsWrite, withWindowsLog]);

  // Sync Motor Chassis items when elevator type changes in Step 2
  const handleTypeChange = (newType: ElevatorType) => {
    if (!guardWindowsWrite('Asansör tipini değiştirmek için giriş yapmalısınız.')) return;
    const customSynced = loadSyncedItemsFromStorage();
    setFormData((prev) =>
      withWindowsLog(
        {
          ...prev,
          elevatorType: newType,
          motorChassisItems: JSON.parse(JSON.stringify(resolveMotorChassisItems(newType, customSynced))),
        },
        'Asansör teknik özellikleri güncellendi'
      )
    );
  };

  // Sync Door items when stop count or floor start changes (preserving custom door items)
  const handleStopCountChange = (count: number) => {
    if (!guardWindowsWrite('Durak sayısını değiştirmek için giriş yapmalısınız.')) return;
    setFormData((prev) => {
      const generatedDoors = generateDoorInspectionItems(count, prev.floorStart);
      const customDoors = (prev.doorsItems || []).filter((it) => it.isCustom);
      return withWindowsLog(
        {
          ...prev,
          stopCount: count,
          doorsItems: [...generatedDoors, ...customDoors],
        },
        'Asansör teknik özellikleri güncellendi'
      );
    });
  };

  const handleFloorStartChange = (start: number) => {
    if (!guardWindowsWrite('Kat başlangıcını değiştirmek için giriş yapmalısınız.')) return;
    setFormData((prev) => {
      const generatedDoors = generateDoorInspectionItems(prev.stopCount, start);
      const customDoors = (prev.doorsItems || []).filter((it) => it.isCustom);
      return withWindowsLog(
        {
          ...prev,
          floorStart: start,
          doorsItems: [...generatedDoors, ...customDoors],
        },
        'Asansör teknik özellikleri güncellendi'
      );
    });
  };

  // Start Audit Trigger (ADIM 2 -> ADIM 3)
  const handleStartAudit = () => {
    if (isReadOnlyMonitoringMode) {
      if (formData.startTimestamp) {
        setFormData((prev) => ({ ...prev, currentStep: 'audit' }));
        return;
      }
      openWindowsAuthModal('login', 'Denetimi başlatmak veya değiştirmek için giriş yapmalısınız.');
      return;
    }
    const now = new Date();
    const timeFormatted = getCurrentTimeFormatted();
    const timestamp = now.getTime();

    setIsTimerPaused(false);
    setShowResumeTimerPrompt(false);

    setFormData((prev) =>
      withWindowsLog(
        {
          ...prev,
          startTime: prev.startTime || timeFormatted,
          startTimestamp: prev.startTimestamp || timestamp,
          accumulatedElapsedSeconds: prev.accumulatedElapsedSeconds ?? 0,
          lastTimerAnchorTimestamp: timestamp,
          currentStep: 'audit',
        },
        'Denetim başlatıldı / güncellendi'
      )
    );
  };

  // Timer choice handler when reopening an unfinished audit after app close
  const handleResumeTimerChoice = (shouldStart: boolean) => {
    setShowResumeTimerPrompt(false);
    if (isReadOnlyRef.current) return;
    if (shouldStart) {
      setIsTimerPaused(false);
      setFormData((prev) => ({
        ...prev,
        lastTimerAnchorTimestamp: Date.now(),
      }));
    } else {
      setIsTimerPaused(true);
      setFormData((prev) => ({
        ...prev,
        lastTimerAnchorTimestamp: null,
      }));
    }
  };

  // Manual toggle in Header (Pause / Resume active timer)
  const handleToggleTimerPause = useCallback(() => {
    if (!guardWindowsWrite('Denetim süresini değiştirmek için giriş yapmalısınız.')) return;
    if (formDataRef.current.endTimestamp) return;
    if (isTimerPausedRef.current) {
      setIsTimerPaused(false);
      setFormData((prev) => ({
        ...prev,
        lastTimerAnchorTimestamp: Date.now(),
      }));
    } else {
      const totalSoFar = getLiveAccumulatedSeconds(formDataRef.current, false);
      setIsTimerPaused(true);
      setFormData((prev) => ({
        ...prev,
        accumulatedElapsedSeconds: totalSoFar,
        lastTimerAnchorTimestamp: null,
      }));
    }
  }, [guardWindowsWrite]);

  // Toggle UD (Uygun Değil) status on an inspection item
  const handleToggleUD = useCallback(
    (categoryKey: string, id: string) => {
      if (!guardWindowsWrite('Denetim maddesi durumunu değiştirmek için giriş yapmalısınız.')) return;
      setFormData((prev) => {
        const updateList = (list: InspectionItem[]) =>
          list.map((item) => {
            if (item.id === id) {
              const nextUD = !item.isNonCompliant;
              return {
                ...item,
                isNonCompliant: nextUD,
                isPassed: nextUD ? false : item.isPassed,
              };
            }
            return item;
          });

        let nextState = prev;
        switch (categoryKey) {
          case 'controlPanel':
            nextState = { ...prev, controlPanelItems: updateList(prev.controlPanelItems) };
            break;
          case 'motorChassis':
            nextState = { ...prev, motorChassisItems: updateList(prev.motorChassisItems) };
            break;
          case 'cabinTop':
            nextState = { ...prev, cabinTopItems: updateList(prev.cabinTopItems) };
            break;
          case 'counterweight':
            nextState = { ...prev, counterweightItems: updateList(prev.counterweightItems) };
            break;
          case 'shaftAndPit':
            nextState = { ...prev, shaftAndPitItems: updateList(prev.shaftAndPitItems) };
            break;
          case 'cabinAndButtons':
            nextState = { ...prev, cabinAndFloorButtonsItems: updateList(prev.cabinAndFloorButtonsItems) };
            break;
          case 'doors':
            nextState = { ...prev, doorsItems: updateList(prev.doorsItems) };
            break;
          default:
            return prev;
        }
        return withWindowsLog(nextState, 'Denetim maddesi (UD) durumu değiştirildi');
      });
    },
    [guardWindowsWrite, withWindowsLog]
  );

  // Toggle Passed/Verified status (when long-pressed for 2s on tabs 1-6)
  const handleTogglePassed = useCallback(
    (categoryKey: string, id: string) => {
      if (!guardWindowsWrite('Denetim maddesi onay durumunu değiştirmek için giriş yapmalısınız.')) return;
      setFormData((prev) => {
        const updateList = (list: InspectionItem[]) =>
          list.map((item) => {
            if (item.id === id) {
              const nextPassed = !item.isPassed;
              return {
                ...item,
                isPassed: nextPassed,
                isNonCompliant: nextPassed ? false : item.isNonCompliant,
              };
            }
            return item;
          });

        let nextState = prev;
        switch (categoryKey) {
          case 'controlPanel':
            nextState = { ...prev, controlPanelItems: updateList(prev.controlPanelItems) };
            break;
          case 'motorChassis':
            nextState = { ...prev, motorChassisItems: updateList(prev.motorChassisItems) };
            break;
          case 'cabinTop':
            nextState = { ...prev, cabinTopItems: updateList(prev.cabinTopItems) };
            break;
          case 'counterweight':
            nextState = { ...prev, counterweightItems: updateList(prev.counterweightItems) };
            break;
          case 'shaftAndPit':
            nextState = { ...prev, shaftAndPitItems: updateList(prev.shaftAndPitItems) };
            break;
          case 'cabinAndButtons':
            nextState = { ...prev, cabinAndFloorButtonsItems: updateList(prev.cabinAndFloorButtonsItems) };
            break;
          case 'doors':
            nextState = { ...prev, doorsItems: updateList(prev.doorsItems) };
            break;
          default:
            return prev;
        }
        return withWindowsLog(nextState, 'Denetim maddesi uygunluk durumu değiştirildi');
      });
    },
    [guardWindowsWrite, withWindowsLog]
  );

  // Update item description
  const handleDescriptionChange = useCallback(
    (categoryKey: string, id: string, desc: string) => {
      if (!guardWindowsWrite('Madde açıklaması düzenlemek için giriş yapmalısınız.')) return;
      setFormData((prev) => {
        const updateList = (list: InspectionItem[]) =>
          list.map((item) => (item.id === id ? { ...item, description: desc } : item));

        let nextState = prev;
        switch (categoryKey) {
          case 'controlPanel':
            nextState = { ...prev, controlPanelItems: updateList(prev.controlPanelItems) };
            break;
          case 'motorChassis':
            nextState = { ...prev, motorChassisItems: updateList(prev.motorChassisItems) };
            break;
          case 'cabinTop':
            nextState = { ...prev, cabinTopItems: updateList(prev.cabinTopItems) };
            break;
          case 'counterweight':
            nextState = { ...prev, counterweightItems: updateList(prev.counterweightItems) };
            break;
          case 'shaftAndPit':
            nextState = { ...prev, shaftAndPitItems: updateList(prev.shaftAndPitItems) };
            break;
          case 'cabinAndButtons':
            nextState = { ...prev, cabinAndFloorButtonsItems: updateList(prev.cabinAndFloorButtonsItems) };
            break;
          case 'doors':
            nextState = { ...prev, doorsItems: updateList(prev.doorsItems) };
            break;
          default:
            return prev;
        }
        return withWindowsLog(nextState, 'Madde açıklaması düzenlendi');
      });
    },
    [guardWindowsWrite, withWindowsLog]
  );

  // Add Extra Item (allowed on Pages 1, 2, 4, 5, 6, 7)
  const handleAddExtraItem = useCallback(
    (categoryKey: string, title: string) => {
      if (!guardWindowsWrite('Ekstra madde eklemek için giriş yapmalısınız.')) return;
      setFormData((prev) => {
        const newItem: InspectionItem = {
          id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          title,
          isNonCompliant: true,
          description: '',
          isCustom: true,
          category: categoryKey,
        };

        let nextState = prev;
        switch (categoryKey) {
          case 'controlPanel':
            nextState = { ...prev, controlPanelItems: [...prev.controlPanelItems, newItem] };
            break;
          case 'motorChassis':
            nextState = { ...prev, motorChassisItems: [...prev.motorChassisItems, newItem] };
            break;
          case 'cabinTop':
            nextState = { ...prev, cabinTopItems: [...prev.cabinTopItems, newItem] };
            break;
          case 'counterweight':
            nextState = { ...prev, counterweightItems: [...prev.counterweightItems, newItem] };
            break;
          case 'shaftAndPit':
            nextState = { ...prev, shaftAndPitItems: [...prev.shaftAndPitItems, newItem] };
            break;
          case 'cabinAndButtons':
            nextState = { ...prev, cabinAndFloorButtonsItems: [...prev.cabinAndFloorButtonsItems, newItem] };
            break;
          case 'doors':
            nextState = { ...prev, doorsItems: [...prev.doorsItems, newItem] };
            break;
          default:
            return prev;
        }
        return withWindowsLog(nextState, `Ekstra madde eklendi (${title})`);
      });
    },
    [guardWindowsWrite, withWindowsLog]
  );

  // Delete Custom Extra Item
  const handleDeleteCustomItem = useCallback(
    (categoryKey: string, id: string) => {
      if (!guardWindowsWrite('Özel madde silmek için giriş yapmalısınız.')) return;
      setFormData((prev) => {
        const filterList = (list: InspectionItem[]) => list.filter((item) => item.id !== id);

        let nextState = prev;
        switch (categoryKey) {
          case 'controlPanel':
            nextState = { ...prev, controlPanelItems: filterList(prev.controlPanelItems) };
            break;
          case 'motorChassis':
            nextState = { ...prev, motorChassisItems: filterList(prev.motorChassisItems) };
            break;
          case 'cabinTop':
            nextState = { ...prev, cabinTopItems: filterList(prev.cabinTopItems) };
            break;
          case 'counterweight':
            nextState = { ...prev, counterweightItems: filterList(prev.counterweightItems) };
            break;
          case 'shaftAndPit':
            nextState = { ...prev, shaftAndPitItems: filterList(prev.shaftAndPitItems) };
            break;
          case 'cabinAndButtons':
            nextState = { ...prev, cabinAndFloorButtonsItems: filterList(prev.cabinAndFloorButtonsItems) };
            break;
          case 'doors':
            nextState = { ...prev, doorsItems: filterList(prev.doorsItems) };
            break;
          default:
            return prev;
        }
        return withWindowsLog(nextState, 'Özel madde silindi');
      });
    },
    [guardWindowsWrite, withWindowsLog]
  );

  // Measure Management
  const handleAddMeasure = (measure: MeasureItem) => {
    if (!guardWindowsWrite('Saha ölçüsü eklemek için giriş yapmalısınız.')) return;
    setFormData((prev) =>
      withWindowsLog(
        {
          ...prev,
          measures: [...prev.measures, measure],
        },
        'Saha ölçü değerleri güncellendi'
      )
    );
  };

  const handleUpdateMeasure = (id: string, updated: Partial<MeasureItem>) => {
    if (!guardWindowsWrite('Saha ölçüsü düzenlemek için giriş yapmalısınız.')) return;
    setFormData((prev) =>
      withWindowsLog(
        {
          ...prev,
          measures: prev.measures.map((m) => (m.id === id ? { ...m, ...updated } : m)),
        },
        'Saha ölçü değerleri güncellendi'
      )
    );
  };

  const handleDeleteMeasure = (id: string) => {
    if (!guardWindowsWrite('Saha ölçüsü silmek için giriş yapmalısınız.')) return;
    setFormData((prev) =>
      withWindowsLog(
        {
          ...prev,
          measures: prev.measures.filter((m) => m.id !== id),
        },
        'Saha ölçü değerleri güncellendi'
      )
    );
  };

  // Calculate total UD items count for badges & headers
  const totalUDCount = useMemo(() => {
    const countUD = (list: InspectionItem[]) => list.filter((it) => it.isNonCompliant).length;
    return (
      countUD(formData.controlPanelItems) +
      countUD(formData.motorChassisItems) +
      countUD(formData.cabinTopItems) +
      countUD(formData.counterweightItems) +
      countUD(formData.shaftAndPitItems) +
      countUD(formData.cabinAndFloorButtonsItems) +
      countUD(formData.doorsItems) +
      (formData.rideComfortNonCompliant ? 1 : 0)
    );
  }, [formData]);

  // Finish Audit -> Open Final Comfort Modal (ADIM 4)
  const handleFinishAuditClick = () => {
    if (isReadOnlyMonitoringMode) {
      if (formData.endTime && formData.totalDurationFormatted) {
        setFormData((p) => ({ ...p, currentStep: 'report' }));
        return;
      }
      openWindowsAuthModal('login', 'Denetimi tamamlamak ve rapor oluşturmak için giriş yapmalısınız.');
      return;
    }
    setIsComfortModalOpen(true);
  };

  // Generate Report & Calculate Elapsed Duration (ADIM 4 -> Report)
  const handleGenerateReport = () => {
    if (!guardWindowsWrite('Rapor oluşturmak ve kaydetmek için giriş yapmalısınız.')) return;
    const isAlreadyFinalized = Boolean(formData.totalDurationFormatted && formData.endTime);

    let endTimeFormatted = formData.endTime;
    let endTimestamp = formData.endTimestamp;
    let durationFormatted = formData.totalDurationFormatted;
    let activeSeconds = formData.accumulatedElapsedSeconds || 0;

    if (!isAlreadyFinalized) {
      endTimeFormatted = getCurrentTimeFormatted();
      endTimestamp = Date.now();

      if (typeof formData.accumulatedElapsedSeconds === 'number' || formData.lastTimerAnchorTimestamp) {
        activeSeconds = getLiveAccumulatedSeconds(formData, isTimerPaused);
      } else {
        const startTimestamp = formData.startTimestamp || endTimestamp;
        const rawDiff = Math.max(0, Math.floor((endTimestamp - startTimestamp) / 1000));
        activeSeconds = rawDiff > 8 * 3600 ? 2700 : rawDiff;
      }

      durationFormatted = formatDurationSeconds(activeSeconds);
    }

    setIsTimerPaused(false);
    setShowResumeTimerPrompt(false);

    const finalizedData: AuditFormData = withWindowsLog(
      {
        ...formData,
        endTime: endTimeFormatted || getCurrentTimeFormatted(),
        endTimestamp: endTimestamp || Date.now(),
        accumulatedElapsedSeconds: activeSeconds,
        lastTimerAnchorTimestamp: null,
        totalDurationFormatted: durationFormatted || '30 dk',
        currentStep: 'report',
      },
      'Denetim tamamlandı / Rapor oluşturuldu'
    );

    setFormData(finalizedData);
    setIsComfortModalOpen(false);

    saveCompletedAuditToHistory(finalizedData);
    saveActiveDraft(finalizedData);
  };

  // Start fresh new inspection
  const handleNewInspection = () => {
    if (!guardWindowsWrite('Yeni denetim başlatmak için giriş yapmalısınız.')) return;
    clearActiveDraft();
    setIsTimerPaused(false);
    setShowResumeTimerPrompt(false);
    const defaultStopCount = 10;
    const defaultFloorStart = -1;
    const customSynced = loadSyncedItemsFromStorage();

    setFormData({
      auditId: `audit_${Date.now()}`,
      date: new Date().toISOString(),
      dateDisplay: getCurrentDateFormatted(),
      inspectorName: windowsUser?.name || userName || '',
      clientProjectName: '',
      elevatorType: 'MR',
      serialNumber: '',
      capacityKg: '800',
      stopCount: defaultStopCount,
      floorStart: defaultFloorStart,
      maintenanceDate: '',
      isDateTimeConfirmed: false,
      isHardwareMatched: false,
      startTime: null,
      startTimestamp: null,
      endTime: null,
      endTimestamp: null,
      totalDurationFormatted: null,
      accumulatedElapsedSeconds: 0,
      lastTimerAnchorTimestamp: null,
      measures: JSON.parse(JSON.stringify(DEFAULT_FIXED_MEASURES)),
      controlPanelItems: customSynced?.controlPanel?.length
        ? JSON.parse(JSON.stringify(customSynced.controlPanel))
        : JSON.parse(JSON.stringify(CONTROL_PANEL_ITEMS)),
      motorChassisItems: JSON.parse(JSON.stringify(resolveMotorChassisItems('MR', customSynced))),
      cabinTopItems: customSynced?.cabinTop?.length
        ? JSON.parse(JSON.stringify(customSynced.cabinTop))
        : JSON.parse(JSON.stringify(CABIN_TOP_ITEMS)),
      counterweightItems: customSynced?.counterweight?.length
        ? JSON.parse(JSON.stringify(customSynced.counterweight))
        : JSON.parse(JSON.stringify(COUNTERWEIGHT_ITEMS)),
      shaftAndPitItems: customSynced?.shaftAndPit?.length
        ? JSON.parse(JSON.stringify(customSynced.shaftAndPit))
        : JSON.parse(JSON.stringify(SHAFT_AND_PIT_ITEMS)),
      cabinAndFloorButtonsItems: customSynced?.cabinAndButtons?.length
        ? JSON.parse(JSON.stringify(customSynced.cabinAndButtons))
        : JSON.parse(JSON.stringify(CABIN_AND_BUTTONS_ITEMS)),
      doorsItems: generateDoorInspectionItems(defaultStopCount, defaultFloorStart),
      rideComfortNonCompliant: false,
      rideComfortNotes: '',
      currentStep: 'welcome',
      activeAuditTab: 0,
    });
  };

  // Handle Dynamic Sync from Google Sheets
  const handleApplySyncedData = (synced: Record<string, InspectionItem[]>) => {
    if (!guardWindowsWrite('E-Tablo maddelerini uygulamak için giriş yapmalısınız.')) return;
    setFormData((prev) =>
      withWindowsLog(
        {
          ...prev,
          controlPanelItems: synced.controlPanel?.length ? JSON.parse(JSON.stringify(synced.controlPanel)) : prev.controlPanelItems,
          motorChassisItems: JSON.parse(JSON.stringify(resolveMotorChassisItems(prev.elevatorType || 'MR', synced))),
          cabinTopItems: synced.cabinTop?.length ? JSON.parse(JSON.stringify(synced.cabinTop)) : prev.cabinTopItems,
          counterweightItems: synced.counterweight?.length ? JSON.parse(JSON.stringify(synced.counterweight)) : prev.counterweightItems,
          shaftAndPitItems: synced.shaftAndPit?.length ? JSON.parse(JSON.stringify(synced.shaftAndPit)) : prev.shaftAndPitItems,
          cabinAndFloorButtonsItems: synced.cabinAndButtons?.length ? JSON.parse(JSON.stringify(synced.cabinAndButtons)) : prev.cabinAndFloorButtonsItems,
        },
        'E-Tablo maddeleri güncellendi'
      )
    );
  };

  const handleResetToDefault = () => {
    if (!guardWindowsWrite('Varsayılan maddelere sıfırlamak için giriş yapmalısınız.')) return;
    setFormData((prev) =>
      withWindowsLog(
        {
          ...prev,
          controlPanelItems: JSON.parse(JSON.stringify(CONTROL_PANEL_ITEMS)),
          motorChassisItems: JSON.parse(JSON.stringify(getMotorChassisItems(prev.elevatorType || 'MR'))),
          cabinTopItems: JSON.parse(JSON.stringify(CABIN_TOP_ITEMS)),
          counterweightItems: JSON.parse(JSON.stringify(COUNTERWEIGHT_ITEMS)),
          shaftAndPitItems: JSON.parse(JSON.stringify(SHAFT_AND_PIT_ITEMS)),
          cabinAndFloorButtonsItems: JSON.parse(JSON.stringify(CABIN_AND_BUTTONS_ITEMS)),
        },
        'Kontrol listesi varsayılan şablona döndürüldü'
      )
    );
  };

  return (
    <div
      className={`min-h-screen flex flex-col font-sans selection:bg-orange-500 selection:text-white transition-colors duration-150 app-root ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
      }`}
    >
      {/* App Header */}
      <Header
        currentStep={formData.currentStep}
        startTimestamp={formData.startTimestamp}
        endTimestamp={formData.endTimestamp}
        totalDurationFormatted={formData.totalDurationFormatted}
        accumulatedElapsedSeconds={formData.accumulatedElapsedSeconds || 0}
        lastTimerAnchorTimestamp={formData.lastTimerAnchorTimestamp || null}
        isTimerPaused={isTimerPaused}
        onToggleTimerPause={handleToggleTimerPause}
        nonCompliantCount={totalUDCount}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenDriveModal={() => setIsDriveModalOpen(true)}
        onManualSave={handleManualSave}
        isSaveSuccess={isSaveSuccess}
        onBackToMainMenu={onBackToMainMenu}
      />

      <WindowsModeBanner />

      {/* Save Toast Notification */}
      {saveToastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-xl border border-emerald-400 flex items-center gap-1.5 animate-fadeIn pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span>{saveToastMessage}</span>
        </div>
      )}

      {/* Main Flow Content */}
      <main className="flex-1 w-full">
        {formData.currentStep === 'welcome' && (
          <Step1Welcome
            dateDisplay={formData.dateDisplay}
            inspectorName={formData.inspectorName}
            clientProjectName={formData.clientProjectName}
            onInspectorChange={(val) => {
              if (!guardWindowsWrite('Denetçi adını değiştirmek için giriş yapmalısınız.')) return;
              setFormData((p) => withWindowsLog({ ...p, inspectorName: val }, 'Proje / denetçi bilgisi düzenlendi'));
            }}
            onClientProjectChange={(val) => {
              if (!guardWindowsWrite('Proje adını değiştirmek için giriş yapmalısınız.')) return;
              setFormData((p) => withWindowsLog({ ...p, clientProjectName: val }, 'Proje / şantiye adı düzenlendi'));
            }}
            onProceed={() => setFormData((p) => ({ ...p, currentStep: 'specs' }))}
          />
        )}

        {formData.currentStep === 'specs' && (
          <Step2ElevatorSpecs
            elevatorType={formData.elevatorType}
            serialNumber={formData.serialNumber}
            capacityKg={formData.capacityKg}
            stopCount={formData.stopCount}
            floorStart={formData.floorStart}
            maintenanceDate={formData.maintenanceDate || ''}
            isDateTimeConfirmed={formData.isDateTimeConfirmed}
            isHardwareMatched={formData.isHardwareMatched}
            onTypeChange={handleTypeChange}
            onSerialChange={(val) => {
              if (!guardWindowsWrite('Seri numarasını değiştirmek için giriş yapmalısınız.')) return;
              setFormData((p) => withWindowsLog({ ...p, serialNumber: val }, 'Asansör seri numarası düzenlendi'));
            }}
            onCapacityChange={(val) => {
              if (!guardWindowsWrite('Kapasite bilgisini değiştirmek için giriş yapmalısınız.')) return;
              setFormData((p) => withWindowsLog({ ...p, capacityKg: val }, 'Asansör kapasitesi düzenlendi'));
            }}
            onStopCountChange={handleStopCountChange}
            onFloorStartChange={handleFloorStartChange}
            onMaintenanceDateChange={(val) => {
              if (!guardWindowsWrite('Bakım tarihini değiştirmek için giriş yapmalısınız.')) return;
              setFormData((p) => withWindowsLog({ ...p, maintenanceDate: val }, 'Bakım günü tarihi düzenlendi'));
            }}
            onDateTimeConfirmToggle={() => {
              if (!guardWindowsWrite('Başlangıç onaylarını değiştirmek için giriş yapmalısınız.')) return;
              setFormData((p) => withWindowsLog({ ...p, isDateTimeConfirmed: !p.isDateTimeConfirmed }, 'Başlangıç onayları güncellendi'));
            }}
            onHardwareMatchToggle={() => {
              if (!guardWindowsWrite('Donanım onayını değiştirmek için giriş yapmalısınız.')) return;
              setFormData((p) => withWindowsLog({ ...p, isHardwareMatched: !p.isHardwareMatched }, 'Başlangıç onayları güncellendi'));
            }}
            onBack={() => setFormData((p) => ({ ...p, currentStep: 'welcome' }))}
            onStartAudit={handleStartAudit}
            isAlreadyStarted={!!formData.startTimestamp}
          />
        )}

        {formData.currentStep === 'audit' && (
          <Step3SwipePanel
            elevatorType={formData.elevatorType}
            activeTab={formData.activeAuditTab}
            onTabChange={(tabIndex) => setFormData((p) => ({ ...p, activeAuditTab: tabIndex }))}
            measures={formData.measures}
            controlPanelItems={formData.controlPanelItems}
            motorChassisItems={formData.motorChassisItems}
            cabinTopItems={formData.cabinTopItems}
            counterweightItems={formData.counterweightItems}
            shaftAndPitItems={formData.shaftAndPitItems}
            cabinAndFloorButtonsItems={formData.cabinAndFloorButtonsItems}
            doorsItems={formData.doorsItems}
            onAddMeasure={handleAddMeasure}
            onUpdateMeasure={handleUpdateMeasure}
            onDeleteMeasure={handleDeleteMeasure}
            onToggleUD={handleToggleUD}
            onTogglePassed={handleTogglePassed}
            onDescriptionChange={handleDescriptionChange}
            onAddExtraItem={handleAddExtraItem}
            onDeleteCustomItem={handleDeleteCustomItem}
            onFinishAudit={handleFinishAuditClick}
          />
        )}

        {formData.currentStep === 'report' && (
          <ReportView
            data={formData}
            onEditAudit={() => {
              if (!guardWindowsWrite('Rapor maddelerini düzenlemek için adınız ve şifrenizle giriş yapın.')) return;
              setFormData((p) => ({ ...p, currentStep: 'audit' }));
            }}
            onNewInspection={handleNewInspection}
            onUpdateData={(updated) => {
              if (!guardWindowsWrite('Rapor üzerinde değişiklik yapmak için giriş yapmalısınız.')) return;
              setFormData(updated);
              saveActiveDraft(updated);
              saveManualAuditSnapshot(updated);
            }}
          />
        )}
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onOpenSyncModal={() => {
          if (!guardWindowsWrite('E-Tablo senkronizasyonu için giriş yapmalısınız.')) return;
          setIsSyncModalOpen(true);
        }}
        onOpenDriveModal={() => setIsDriveModalOpen(true)}
        onOpenHistoryModal={() => setIsHistoryModalOpen(true)}
        onManualSave={handleManualSave}
        onEditInspectionInfo={() => {
          if (!guardWindowsWrite('Proje bilgilerini düzenlemek için giriş yapmalısınız.')) return;
          setFormData((p) => ({ ...p, currentStep: 'welcome' }));
        }}
        onNewInspection={handleNewInspection}
        onRestoreDraftOrAudit={(audit) => {
          setFormData(audit);
          setSaveToastMessage('Taslak / Rapor görüntülendi');
          setTimeout(() => setSaveToastMessage(null), 2500);
        }}
        lastSavedFeedback={isSaveSuccess}
      />

      {/* Google Drive Cloud Sync Modal (3 Tablet Ortak Klasör Arşivi) */}
      <DriveSyncModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        currentAuditData={formData}
        onLoadAuditFromDrive={(loadedAudit) => {
          setFormData(loadedAudit);
          if (!isReadOnlyRef.current) {
            saveActiveDraft(loadedAudit);
            saveManualAuditSnapshot(loadedAudit);
          }
          setSaveToastMessage(`"${loadedAudit.serialNumber || loadedAudit.clientProjectName}" Drive'dan başarıyla yüklendi`);
          setTimeout(() => setSaveToastMessage(null), 3000);
        }}
      />

      {/* Step 4 Final Comfort Modal */}
      <Step4FinalComfortModal
        isOpen={isComfortModalOpen}
        onClose={() => setIsComfortModalOpen(false)}
        totalUDCount={totalUDCount}
        rideComfortNonCompliant={formData.rideComfortNonCompliant}
        rideComfortNotes={formData.rideComfortNotes}
        onToggleRideComfortUD={() => {
          if (!guardWindowsWrite('Konfor durumunu değiştirmek için giriş yapmalısınız.')) return;
          setFormData((p) =>
            withWindowsLog(
              {
                ...p,
                rideComfortNonCompliant: !p.rideComfortNonCompliant,
              },
              'Seyir ve konfor değerlendirmesi güncellendi'
            )
          );
        }}
        onRideComfortNotesChange={(notes) => {
          if (!guardWindowsWrite('Konfor notunu düzenlemek için giriş yapmalısınız.')) return;
          setFormData((p) =>
            withWindowsLog({ ...p, rideComfortNotes: notes }, 'Seyir ve konfor notu düzenlendi')
          );
        }}
        onGenerateReport={handleGenerateReport}
      />

      {/* History & Drafts Modal */}
      <AuditHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        onSelectAudit={(audit) => {
          setFormData(audit);
        }}
        hasActiveDraft={!!loadActiveDraft()}
        onRestoreDraft={() => {
          const draft = loadActiveDraft();
          if (draft) setFormData(draft);
        }}
      />

      {/* Google Sheets Data Sync Modal */}
      <SyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        onApplySyncedData={handleApplySyncedData}
        onResetToDefault={handleResetToDefault}
      />

      {/* Uygulama Kapatılıp Tekrar Açıldığında Süre Başlatma Seçimi Modalı */}
      {showResumeTimerPrompt && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div
            className={`w-full max-w-md rounded-2xl shadow-2xl border overflow-hidden ${
              isDark
                ? 'bg-slate-900 border-slate-700 text-slate-100'
                : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            <div className="bg-[#0A2647] text-white px-4 py-3 border-b-4 border-orange-500 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-500 text-slate-950 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black uppercase tracking-tight">
                  Yarım Kalan Denetim — Süre Başlasın mı?
                </h3>
                <p className="text-[11px] text-slate-300 font-semibold">
                  {formData.clientProjectName || 'Aktif Denetim'}{' '}
                  {formData.serialNumber ? `• Seri: ${formData.serialNumber}` : ''}
                </p>
              </div>
            </div>

            <div className="p-4 space-y-3 text-xs sm:text-sm">
              <div
                className={`p-3 rounded-xl border flex items-center justify-between ${
                  isDark
                    ? 'bg-slate-950/80 border-slate-700'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <span className="font-bold text-slate-400">Önceki Kayıtlı Süre:</span>
                <span className="font-mono font-black text-base text-orange-500">
                  {formatTimerDisplay(formData.accumulatedElapsedSeconds || 0)}
                </span>
              </div>

              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Uygulama kapatılıp tekrar açıldığı için denetim sayacı şu an <strong>duraklatıldı</strong>.
                Sürenin kaldığı yerden saymaya devam etmesini ister misiniz?
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleResumeTimerChoice(true)}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs sm:text-sm uppercase flex items-center justify-center gap-1.5 shadow-lg cursor-pointer transition-all"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Evet, Süre Başlasın</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleResumeTimerChoice(false)}
                  className={`w-full py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm uppercase flex items-center justify-center gap-1.5 border active:scale-95 cursor-pointer transition-all ${
                    isDark
                      ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-amber-500/50'
                      : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-400'
                  }`}
                >
                  <Pause className="w-4 h-4" />
                  <span>Hayır, Duraklatılsın</span>
                </button>
              </div>

              <p className="text-[11px] text-center text-slate-400 pt-1">
                İstediğiniz zaman üst menüdeki süre kutusuna dokunarak sayacı başlatıp duraklatabilirsiniz.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
