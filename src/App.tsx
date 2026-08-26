import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AuditFormData, ElevatorType, InspectionItem, MeasureItem } from './types';
import {
  CONTROL_PANEL_ITEMS,
  CABIN_TOP_ITEMS,
  COUNTERWEIGHT_ITEMS,
  SHAFT_AND_PIT_ITEMS,
  CABIN_AND_BUTTONS_ITEMS,
  getMotorChassisItems,
} from './data/initialChecklists';
import { generateDoorInspectionItems } from './utils/floorMatrix';
import {
  getCurrentDateFormatted,
  getCurrentTimeFormatted,
  formatDurationSeconds,
} from './utils/textUtils';
import {
  saveActiveDraft,
  loadActiveDraft,
  clearActiveDraft,
  saveCompletedAuditToHistory,
} from './utils/storage';

// Helper to sync draft items with master checklist definitions
function syncItemsWithMaster(draftItems: InspectionItem[], masterItems: InspectionItem[]): InspectionItem[] {
  if (!draftItems || draftItems.length === 0) {
    return JSON.parse(JSON.stringify(masterItems));
  }

  // Map master items with user state preserved
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

  // Retain any user-created custom items
  const customItems = draftItems.filter((it) => it.isCustom);
  return [...synced, ...customItems];
}

function syncDraftWithMaster(draft: AuditFormData): AuditFormData {
  const motorMaster = getMotorChassisItems(draft.elevatorType || 'MR');
  return {
    ...draft,
    controlPanelItems: syncItemsWithMaster(draft.controlPanelItems, CONTROL_PANEL_ITEMS),
    motorChassisItems: syncItemsWithMaster(draft.motorChassisItems, motorMaster),
    cabinTopItems: syncItemsWithMaster(draft.cabinTopItems, CABIN_TOP_ITEMS),
    counterweightItems: syncItemsWithMaster(draft.counterweightItems, COUNTERWEIGHT_ITEMS),
    shaftAndPitItems: syncItemsWithMaster(draft.shaftAndPitItems, SHAFT_AND_PIT_ITEMS),
    cabinAndFloorButtonsItems: syncItemsWithMaster(draft.cabinAndFloorButtonsItems, CABIN_AND_BUTTONS_ITEMS),
  };
}

import { Header } from './components/Header';
import { Step1Welcome } from './components/Step1Welcome';
import { Step2ElevatorSpecs } from './components/Step2ElevatorSpecs';
import { Step3SwipePanel } from './components/Step3SwipePanel';
import { Step4FinalComfortModal } from './components/Step4FinalComfortModal';
import { ReportView } from './components/ReportView';
import { AuditHistoryModal } from './components/AuditHistoryModal';

export default function App() {
  const [formData, setFormData] = useState<AuditFormData>(() => {
    // Try to load active draft on initial mount
    const draft = loadActiveDraft();
    if (draft && draft.currentStep !== 'report') {
      return syncDraftWithMaster(draft);
    }

    const defaultStopCount = 10;
    const defaultFloorStart = -1;

    return {
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
      measures: [],
      controlPanelItems: JSON.parse(JSON.stringify(CONTROL_PANEL_ITEMS)),
      motorChassisItems: JSON.parse(JSON.stringify(getMotorChassisItems('MR'))),
      cabinTopItems: JSON.parse(JSON.stringify(CABIN_TOP_ITEMS)),
      counterweightItems: JSON.parse(JSON.stringify(COUNTERWEIGHT_ITEMS)),
      shaftAndPitItems: JSON.parse(JSON.stringify(SHAFT_AND_PIT_ITEMS)),
      cabinAndFloorButtonsItems: JSON.parse(JSON.stringify(CABIN_AND_BUTTONS_ITEMS)),
      doorsItems: generateDoorInspectionItems(defaultStopCount, defaultFloorStart),
      rideComfortNonCompliant: false,
      rideComfortNotes: '',
      currentStep: 'welcome',
      activeAuditTab: 0,
    };
  });

  const [isComfortModalOpen, setIsComfortModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Auto-save draft whenever formData changes (offline local storage)
  useEffect(() => {
    if (formData.currentStep !== 'report') {
      saveActiveDraft(formData);
    }
  }, [formData]);

  // Sync Motor Chassis items when elevator type changes in Step 2
  const handleTypeChange = (newType: ElevatorType) => {
    setFormData((prev) => ({
      ...prev,
      elevatorType: newType,
      motorChassisItems: JSON.parse(JSON.stringify(getMotorChassisItems(newType))),
    }));
  };

  // Sync Door items when stop count or floor start changes
  const handleStopCountChange = (count: number) => {
    setFormData((prev) => ({
      ...prev,
      stopCount: count,
      doorsItems: generateDoorInspectionItems(count, prev.floorStart),
    }));
  };

  const handleFloorStartChange = (start: number) => {
    setFormData((prev) => ({
      ...prev,
      floorStart: start,
      doorsItems: generateDoorInspectionItems(prev.stopCount, start),
    }));
  };

  // Start Audit Trigger (ADIM 2 -> ADIM 3)
  const handleStartAudit = () => {
    const now = new Date();
    const timeFormatted = getCurrentTimeFormatted();
    const timestamp = now.getTime();

    setFormData((prev) => ({
      ...prev,
      startTime: timeFormatted,
      startTimestamp: timestamp,
      currentStep: 'audit',
      activeAuditTab: 0,
    }));
  };

  // Toggle UD (Uygun Değil) status on an inspection item
  const handleToggleUD = useCallback((categoryKey: string, id: string) => {
    setFormData((prev) => {
      const updateList = (list: InspectionItem[]) =>
        list.map((item) =>
          item.id === id ? { ...item, isNonCompliant: !item.isNonCompliant } : item
        );

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

  // Add Extra Item (allowed on Pages 1, 2, 4, 5, 6)
  const handleAddExtraItem = useCallback((categoryKey: string, title: string) => {
    setFormData((prev) => {
      const newItem: InspectionItem = {
        id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title,
        isNonCompliant: true, // Default to UD so user can describe immediately
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

    setFormData({
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
      measures: [],
      controlPanelItems: JSON.parse(JSON.stringify(CONTROL_PANEL_ITEMS)),
      motorChassisItems: JSON.parse(JSON.stringify(getMotorChassisItems('MR'))),
      cabinTopItems: JSON.parse(JSON.stringify(CABIN_TOP_ITEMS)),
      counterweightItems: JSON.parse(JSON.stringify(COUNTERWEIGHT_ITEMS)),
      shaftAndPitItems: JSON.parse(JSON.stringify(SHAFT_AND_PIT_ITEMS)),
      cabinAndFloorButtonsItems: JSON.parse(JSON.stringify(CABIN_AND_BUTTONS_ITEMS)),
      doorsItems: generateDoorInspectionItems(defaultStopCount, defaultFloorStart),
      rideComfortNonCompliant: false,
      rideComfortNotes: '',
      currentStep: 'welcome',
      activeAuditTab: 0,
    });
  };

  return (
    <div className="min-h-screen bg-[#F1F3F5] text-slate-800 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {/* App Header */}
      <Header
        currentStep={formData.currentStep}
        startTimestamp={formData.startTimestamp}
        nonCompliantCount={totalUDCount}
        onOpenHistory={() => setIsHistoryModalOpen(true)}
        onNewInspection={handleNewInspection}
      />

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
    </div>
  );
}
