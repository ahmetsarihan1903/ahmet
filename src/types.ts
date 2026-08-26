export type ElevatorType = 'MR' | 'MRL';

export interface FloorMapping {
  stopIndex: number; // 1-based stop number (1..32)
  floorValue: number; // raw numeric floor e.g. -1, 0, 1, 2
  floorLabel: string; // formatted e.g. "-1. Kat", "Zemin / 0", "1. Kat"
}

export interface InspectionItem {
  id: string;
  title: string;
  isNonCompliant: boolean; // True when [ UD ] is active (red)
  description: string;
  isCustom?: boolean; // Added via "+ Ekstra Madde Ekle"
  isRequiredDescription?: boolean; // E.g., Boy fotosel, Denge zinciri
  category: string;
  floorLabel?: string; // For Page 8 door items
}

export interface MeasureItem {
  id: string;
  name: string;
  value: string;
  notes?: string;
}

export interface AuditFormData {
  // Step 1: Welcome / Basic Info
  date: string; // ISO date or localized string
  dateDisplay: string;
  inspectorName: string;
  clientProjectName: string;

  // Step 2: Elevator Specifications & Locks
  elevatorType: ElevatorType;
  serialNumber: string;
  capacityKg: string;
  stopCount: number; // 1 - 32
  floorStart: number; // -6 ..
  isDateTimeConfirmed: boolean; // Checkbox 6
  isHardwareMatched: boolean; // Checkbox 7

  // Process timing
  startTime: string | null; // e.g. "14:25:30"
  startTimestamp: number | null;
  endTime: string | null;
  endTimestamp: number | null;
  totalDurationFormatted: string | null;

  // Step 3: Checklists per page
  measures: MeasureItem[]; // Page 1
  controlPanelItems: InspectionItem[]; // Page 2
  motorChassisItems: InspectionItem[]; // Page 3 (Dynamic MR or MRL)
  cabinTopItems: InspectionItem[]; // Page 4
  counterweightItems: InspectionItem[]; // Page 5
  shaftAndPitItems: InspectionItem[]; // Page 6
  cabinAndFloorButtonsItems: InspectionItem[]; // Page 7
  doorsItems: InspectionItem[]; // Page 8

  // Step 4: Final Comfort Evaluation
  rideComfortNonCompliant: boolean;
  rideComfortNotes: string;

  // Flow State
  currentStep: 'welcome' | 'specs' | 'audit' | 'report';
  activeAuditTab: number; // 0 to 7
}
