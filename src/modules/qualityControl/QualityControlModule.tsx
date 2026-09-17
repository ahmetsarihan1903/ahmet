import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
} from '../../utils/textUtils';
import {
  saveActiveDraft,
  loadActiveDraft,
  clearActiveDraft,
  saveCompletedAuditToHistory,
  saveManualAuditSnapshot,
} from '../../utils/storage';

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

  const masterMap = new Map(masterItems.map((it) => [it.id, it]));
  const draftMap = new Map(draftItems.map((it) => [it.id, it]));

  const synced: InspectionItem[] = masterItems.map((masterIt) => {
    const userIt = draftMap.get(masterIt.id);
    if (userIt) {
      return {
        ...masterIt,
        isNonCompliant: userIt.isNonCompliant || false,
        description: userIt.description || '',
      };
    }
    return { ...masterIt };
  });

  const customItems = draftItems.filter((it) => it.isCustom);
  return [...synced, ...customItems];
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
import { loadSyncedItemsFromStorage } from '../../services/dataSyncService';

interface QualityControlModuleProps {
  onBackToMainMenu?: () => void;
}

export function QualityControlModule({ onBackToMainMenu }: QualityControlModuleProps) {
  const [formData, setFormData] = useState<AuditFormData>(() => {
    // Try to load active draft on initial mount
    const draft = loadActiveDraft();
    if (draft && draft.currentStep !== 'report') {
      return syncDraftWithMaster(draft);
    }

    const defaultStopCount = 10;
    const defaultFloorStart = -1;

    // Check if custom synced items exist in local storage
    const customSynced = loadSyncedItemsFromStorage();

    return {
      auditId: `audit_${Date.now()}`,
      date: new Date().toISOString(),
      dateDisplay: getCurrentDateFormatted(),
      inspectorName: '',
      clientProjectName: '',
      elevatorType: 'MR',
      serialNumber: '',
      capacityKg: '800',
      stopCount: defaultStopCount,
      floorStart: defaultFloorStart,
      isDateTimeConfirmed: false,
      isHardwareMatched: false,
      startTime: null,
      startTimestamp: null,
      endTime: null,
      endTimestamp: null,
      totalDurationFormatted: null,
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
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isSaveSuccess, setIsSaveSuccess] = useState(false);
  const [saveToastMessage, setSaveToastMessage] = useState<string | null>(null);

  // Periodic auto-save draft every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (formData.currentStep !== 'report') {
        saveActiveDraft(formData);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [formData]);

  // Auto-save draft whenever formData changes (offline local storage)
  useEffect(() => {
    if (formData.currentStep !== 'report') {
      saveActiveDraft(formData);
    }
  }, [formData]);

  // Manual save triggered by Save button in header or settings
  const handleManualSave = useCallback(() => {
    saveManualAuditSnapshot(formData);
    setIsSaveSuccess(true);
    setSaveToastMessage('Denetim taslağı ve veriler başarıyla kaydedildi');
    setTimeout(() => {
      setIsSaveSuccess(false);
    }, 2500);
    setTimeout(() => {
      setSaveToastMessage(null);
    }, 3000);
  }, [formData]);

  // Sync Motor Chassis items when elevator type changes in Step 2
  const handleTypeChange = (newType: ElevatorType) => {
    const customSynced = loadSyncedItemsFromStorage();
    setFormData((prev) => ({
      ...prev,
      elevatorType: newType,
      motorChassisItems: JSON.parse(JSON.stringify(resolveMotorChassisItems(newType, customSynced))),
    }));
  };

  // Sync Door items when stop count or floor start changes (preserving custom door items)
  const handleStopCountChange = (count: number) => {
    setFormData((prev) => {
      const generatedDoors = generateDoorInspectionItems(count, prev.floorStart);
      const customDoors = (prev.doorsItems || []).filter((it) => it.isCustom);
      return {
        ...prev,
        stopCount: count,
        doorsItems: [...generatedDoors, ...customDoors],
      };
    });
  };

  const handleFloorStartChange = (start: number) => {
    setFormData((prev) => {
      const generatedDoors = generateDoorInspectionItems(prev.stopCount, start);
      const customDoors = (prev.doorsItems || []).filter((it) => it.isCustom);
      return {
        ...prev,
        floorStart: start,
        doorsItems: [...generatedDoors, ...customDoors],
      };
    });
  };

  // Start Audit Trigger (ADIM 2 -> ADIM 3)
  const handleStartAudit = () => {
    const now = new Date();
    const timeFormatted = getCurrentTimeFormatted();
    const timestamp = now.getTime();

    setFormData((prev) => ({
      ...prev,
      startTime: prev.startTime || timeFormatted,
      startTimestamp: prev.startTimestamp || timestamp,
      currentStep: 'audit',
    }));
  };

  // Toggle UD (Uygun Değil) status on an inspection item
  const handleToggleUD = useCallback((categoryKey: string, id: string) => {
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

      switch (categoryKey) {
        case 'controlPanel':
          return { ...prev, controlPanelItems: updateList(prev.controlPanelItems) };
        case 'motorChassis':
          return { ...prev, motorChassisItems: updateList(prev.motorChassisItems) };
        case 'cabinTop':
          return { ...prev, cabinTopItems: updateList(prev.cabinTopItems) };
        case 'counterweight':
          return { ...prev, counterweightItems: updateList(prev.counterweightItems) };
        case 'shaftAndPit':
          return { ...prev, shaftAndPitItems: updateList(prev.shaftAndPitItems) };
        case 'cabinAndButtons':
          return { ...prev, cabinAndFloorButtonsItems: updateList(prev.cabinAndFloorButtonsItems) };
        case 'doors':
          return { ...prev, doorsItems: updateList(prev.doorsItems) };
        default:
          return prev;
      }
    });
  }, []);

  // Toggle Passed/Verified status (when long-pressed for 2s on tabs 1-6)
  const handleTogglePassed = useCallback((categoryKey: string, id: string) => {
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

      switch (categoryKey) {
        case 'controlPanel':
          return { ...prev, controlPanelItems: updateList(prev.controlPanelItems) };
        case 'motorChassis':
          return { ...prev, motorChassisItems: updateList(prev.motorChassisItems) };
        case 'cabinTop':
          return { ...prev, cabinTopItems: updateList(prev.cabinTopItems) };
        case 'counterweight':
          return { ...prev, counterweightItems: updateList(prev.counterweightItems) };
        case 'shaftAndPit':
          return { ...prev, shaftAndPitItems: updateList(prev.shaftAndPitItems) };
        case 'cabinAndButtons':
          return { ...prev, cabinAndFloorButtonsItems: updateList(prev.cabinAndFloorButtonsItems) };
        case 'doors':
          return { ...prev, doorsItems: updateList(prev.doorsItems) };
        default:
          return prev;
      }
    });
  }, []);

  // Update item description
  const handleDescriptionChange = useCallback((categoryKey: string, id: string, desc: string) => {
    setFormData((prev) => {
      const updateList = (list: InspectionItem[]) =>
        list.map((item) => (item.id === id ? { ...item, description: desc } : item));

      switch (categoryKey) {
        case 'controlPanel':
          return { ...prev, controlPanelItems: updateList(prev.controlPanelItems) };
        case 'motorChassis':
          return { ...prev, motorChassisItems: updateList(prev.motorChassisItems) };
        case 'cabinTop':
          return { ...prev, cabinTopItems: updateList(prev.cabinTopItems) };
        case 'counterweight':
          return { ...prev, counterweightItems: updateList(prev.counterweightItems) };
        case 'shaftAndPit':
          return { ...prev, shaftAndPitItems: updateList(prev.shaftAndPitItems) };
        case 'cabinAndButtons':
          return { ...prev, cabinAndFloorButtonsItems: updateList(prev.cabinAndFloorButtonsItems) };
        case 'doors':
          return { ...prev, doorsItems: updateList(prev.doorsItems) };
        default:
          return prev;
      }
    });
  }, []);

  // Add Extra Item (allowed on Pages 1, 2, 4, 5, 6, 7)
  const handleAddExtraItem = useCallback((categoryKey: string, title: string) => {
    setFormData((prev) => {
      const newItem: InspectionItem = {
        id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title,
        isNonCompliant: true,
        description: '',
        isCustom: true,
        category: categoryKey,
      };

      switch (categoryKey) {
        case 'controlPanel':
          return { ...prev, controlPanelItems: [...prev.controlPanelItems, newItem] };
        case 'motorChassis':
          return { ...prev, motorChassisItems: [...prev.motorChassisItems, newItem] };
        case 'cabinTop':
          return { ...prev, cabinTopItems: [...prev.cabinTopItems, newItem] };
        case 'counterweight':
          return { ...prev, counterweightItems: [...prev.counterweightItems, newItem] };
        case 'shaftAndPit':
          return { ...prev, shaftAndPitItems: [...prev.shaftAndPitItems, newItem] };
        case 'cabinAndButtons':
          return { ...prev, cabinAndFloorButtonsItems: [...prev.cabinAndFloorButtonsItems, newItem] };
        case 'doors':
          return { ...prev, doorsItems: [...prev.doorsItems, newItem] };
        default:
          return prev;
      }
    });
  }, []);

  // Delete Custom Extra Item
  const handleDeleteCustomItem = useCallback((categoryKey: string, id: string) => {
    setFormData((prev) => {
      const filterList = (list: InspectionItem[]) => list.filter((item) => item.id !== id);

      switch (categoryKey) {
        case 'controlPanel':
          return { ...prev, controlPanelItems: filterList(prev.controlPanelItems) };
        case 'motorChassis':
          return { ...prev, motorChassisItems: filterList(prev.motorChassisItems) };
        case 'cabinTop':
          return { ...prev, cabinTopItems: filterList(prev.cabinTopItems) };
        case 'counterweight':
          return { ...prev, counterweightItems: filterList(prev.counterweightItems) };
        case 'shaftAndPit':
          return { ...prev, shaftAndPitItems: filterList(prev.shaftAndPitItems) };
        case 'cabinAndButtons':
          return { ...prev, cabinAndFloorButtonsItems: filterList(prev.cabinAndFloorButtonsItems) };
        case 'doors':
          return { ...prev, doorsItems: filterList(prev.doorsItems) };
        default:
          return prev;
      }
    });
  }, []);

  // Measure Management
  const handleAddMeasure = (measure: MeasureItem) => {
    setFormData((prev) => ({
      ...prev,
      measures: [...prev.measures, measure],
    }));
  };

  const handleUpdateMeasure = (id: string, updated: Partial<MeasureItem>) => {
    setFormData((prev) => ({
      ...prev,
      measures: prev.measures.map((m) => (m.id === id ? { ...m, ...updated } : m)),
    }));
  };

  const handleDeleteMeasure = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      measures: prev.measures.filter((m) => m.id !== id),
    }));
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
    setIsComfortModalOpen(true);
  };

  // Generate Report & Calculate Elapsed Duration (ADIM 4 -> Report)
  const handleGenerateReport = () => {
    const endTimeFormatted = getCurrentTimeFormatted();
    const endTimestamp = Date.now();
    const startTimestamp = formData.startTimestamp || endTimestamp;
    const elapsedSeconds = Math.max(0, Math.floor((endTimestamp - startTimestamp) / 1000));
    const durationFormatted = formatDurationSeconds(elapsedSeconds);

    const finalizedData: AuditFormData = {
      ...formData,
      endTime: endTimeFormatted,
      endTimestamp,
      totalDurationFormatted: durationFormatted,
      currentStep: 'report',
    };

    setFormData(finalizedData);
    setIsComfortModalOpen(false);

    // Save completed audit to history & clear active draft
    saveCompletedAuditToHistory(finalizedData);
    clearActiveDraft();
  };

  // Start fresh new inspection
  const handleNewInspection = () => {
    clearActiveDraft();
    const defaultStopCount = 10;
    const defaultFloorStart = -1;
    const customSynced = loadSyncedItemsFromStorage();

    setFormData({
      auditId: `audit_${Date.now()}`,
      date: new Date().toISOString(),
      dateDisplay: getCurrentDateFormatted(),
      inspectorName: '',
      clientProjectName: '',
      elevatorType: 'MR',
      serialNumber: '',
      capacityKg: '800',
      stopCount: defaultStopCount,
      floorStart: defaultFloorStart,
      isDateTimeConfirmed: false,
      isHardwareMatched: false,
      startTime: null,
      startTimestamp: null,
      endTime: null,
      endTimestamp: null,
      totalDurationFormatted: null,
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
    setFormData((prev) => ({
      ...prev,
      controlPanelItems: synced.controlPanel?.length ? JSON.parse(JSON.stringify(synced.controlPanel)) : prev.controlPanelItems,
      motorChassisItems: JSON.parse(JSON.stringify(resolveMotorChassisItems(prev.elevatorType || 'MR', synced))),
      cabinTopItems: synced.cabinTop?.length ? JSON.parse(JSON.stringify(synced.cabinTop)) : prev.cabinTopItems,
      counterweightItems: synced.counterweight?.length ? JSON.parse(JSON.stringify(synced.counterweight)) : prev.counterweightItems,
      shaftAndPitItems: synced.shaftAndPit?.length ? JSON.parse(JSON.stringify(synced.shaftAndPit)) : prev.shaftAndPitItems,
      cabinAndFloorButtonsItems: synced.cabinAndButtons?.length ? JSON.parse(JSON.stringify(synced.cabinAndButtons)) : prev.cabinAndFloorButtonsItems,
    }));
  };

  const handleResetToDefault = () => {
    setFormData((prev) => ({
      ...prev,
      controlPanelItems: JSON.parse(JSON.stringify(CONTROL_PANEL_ITEMS)),
      motorChassisItems: JSON.parse(JSON.stringify(getMotorChassisItems(prev.elevatorType || 'MR'))),
      cabinTopItems: JSON.parse(JSON.stringify(CABIN_TOP_ITEMS)),
      counterweightItems: JSON.parse(JSON.stringify(COUNTERWEIGHT_ITEMS)),
      shaftAndPitItems: JSON.parse(JSON.stringify(SHAFT_AND_PIT_ITEMS)),
      cabinAndFloorButtonsItems: JSON.parse(JSON.stringify(CABIN_AND_BUTTONS_ITEMS)),
    }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-orange-500 selection:text-white app-root">
      {/* App Header */}
      <Header
        currentStep={formData.currentStep}
        startTimestamp={formData.startTimestamp}
        nonCompliantCount={totalUDCount}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onManualSave={handleManualSave}
        isSaveSuccess={isSaveSuccess}
        onBackToMainMenu={onBackToMainMenu}
      />

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
            onInspectorChange={(val) => setFormData((p) => ({ ...p, inspectorName: val }))}
            onClientProjectChange={(val) => setFormData((p) => ({ ...p, clientProjectName: val }))}
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
            isDateTimeConfirmed={formData.isDateTimeConfirmed}
            isHardwareMatched={formData.isHardwareMatched}
            onTypeChange={handleTypeChange}
            onSerialChange={(val) => setFormData((p) => ({ ...p, serialNumber: val }))}
            onCapacityChange={(val) => setFormData((p) => ({ ...p, capacityKg: val }))}
            onStopCountChange={handleStopCountChange}
            onFloorStartChange={handleFloorStartChange}
            onDateTimeConfirmToggle={() =>
              setFormData((p) => ({ ...p, isDateTimeConfirmed: !p.isDateTimeConfirmed }))
            }
            onHardwareMatchToggle={() =>
              setFormData((p) => ({ ...p, isHardwareMatched: !p.isHardwareMatched }))
            }
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
            onEditAudit={() => setFormData((p) => ({ ...p, currentStep: 'audit' }))}
            onNewInspection={handleNewInspection}
          />
        )}
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onOpenHistoryModal={() => setIsHistoryModalOpen(true)}
        onManualSave={handleManualSave}
        onEditInspectionInfo={() => setFormData((p) => ({ ...p, currentStep: 'welcome' }))}
        onNewInspection={handleNewInspection}
        onRestoreDraftOrAudit={(audit) => {
          setFormData(audit);
          setSaveToastMessage('Taslak / Rapor başarıyla geri yüklendi');
          setTimeout(() => setSaveToastMessage(null), 2500);
        }}
        lastSavedFeedback={isSaveSuccess}
      />

      {/* Step 4 Final Comfort Modal */}
      <Step4FinalComfortModal
        isOpen={isComfortModalOpen}
        onClose={() => setIsComfortModalOpen(false)}
        totalUDCount={totalUDCount}
        rideComfortNonCompliant={formData.rideComfortNonCompliant}
        rideComfortNotes={formData.rideComfortNotes}
        onToggleRideComfortUD={() =>
          setFormData((p) => ({
            ...p,
            rideComfortNonCompliant: !p.rideComfortNonCompliant,
          }))
        }
        onRideComfortNotesChange={(notes) =>
          setFormData((p) => ({ ...p, rideComfortNotes: notes }))
        }
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
    </div>
  );
}
