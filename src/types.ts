// Application Types for the 4-Module Beta Asansör Saha Yönetim Sistemi

export type ActiveAppModule = 'hub' | 'shaftSurvey' | 'railDoorInspection' | 'qualityControl' | 'customerPreInspection';

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
  isPassed?: boolean; // True when verified/checked via long-press (green)
  description: string;
  isCustom?: boolean; // Added via "+ Ekstra Madde Ekle"
  isRequiredDescription?: boolean; // E.g., Boy fotosel, Denge zinciri
  category: string;
  floorLabel?: string; // For Page 8 door items
  isResolved?: boolean; // True when non-compliance has been fixed during re-audit
  resolvedAt?: string; // e.g. "17.09.2026 14:30"
  resolutionNote?: string; // Notes entered when resolving the punch-list item
}

export interface MeasureItem {
  id: string;
  name: string;
  value: string;
  notes?: string;
  isFixed?: boolean;
}

export interface AuditFormData {
  // Unique Audit Session ID (persists across saves of the same audit)
  auditId?: string;

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
  rideComfortResolved?: boolean;
  rideComfortResolutionNote?: string;

  // Step 5: Re-Audit & Punch List Tracking (Optional)
  reAuditDate?: string;
  reAuditInspector?: string;
  reAuditCompleted?: boolean;

  // Flow State
  currentStep: 'welcome' | 'specs' | 'audit' | 'report';
  activeAuditTab: number; // 0 to 7
}

// ==========================================
// 1. KUYU RÖLEVE FORMU VERİ TİPLERİ
// ==========================================
export interface ShaftSurveyFloorDoor {
  floorIndex: number;
  floorLabel: string;
  doorWidthMm: string; // Kapı net genişlik (örn 800)
  doorHeightMm: string; // Kapı net yükseklik (örn 2000)
  roughOpeningWidthMm: string; // Kaba kuyu kapı boşluğu eni
  roughOpeningHeightMm: string; // Kaba kuyu kapı boşluğu boyu
  wallThicknessMm: string; // Duvar / lento kalınlığı
  sillFloorDifferenceMm: string; // Eşik - bitmiş döşeme kot farkı
  notes?: string;
}

export interface ShaftSurveyData {
  id: string;
  date: string;
  dateDisplay: string;
  surveyorName: string; // Keşfi yapan teknisyen/mühendis
  projectName: string; // Şantiye / Proje Adı
  buildingBlock: string; // Blok / Asansör No (Örn: A Blok Asansör-1)
  address?: string;
  clientContact?: string; // Şantiye yetkilisi / tel

  // Kuyu Boyutları & Temel Ölçüler (mm)
  stopCount: number;
  floorStart: number;
  shaftWidthA: string; // Kuyu Genişliği A (mm)
  shaftDepthB: string; // Kuyu Derinliği B (mm)
  pitDepthS: string; // Kuyu Dibi Derinliği S (mm)
  headroomHeightK: string; // Son Kat Tavan Yüksekliği K (mm)
  travelHeightH: string; // Toplam Seyir Mesafesi H (mm)

  // Yapısal & Mimari Detaylar
  machineRoomType: 'MR' | 'MRL_TOP' | 'MRL_BOTTOM' | 'HYDRAULIC';
  shaftWallType: 'BETONARME' | 'TUGLA' | 'CELIK_KONSTRUKSIYON' | 'CAM';
  counterweightPosition: 'ARKA' | 'YAN_SOL' | 'YAN_SAG';
  targetCapacityKg: string; // Hedeflenen kapasite (320, 450, 630, 800, 1000...)
  targetSpeedMs: string; // Hedef hız (1.0, 1.6, 2.0...)
  doorType: 'OTOMATIK_TELESKOPIK' | 'OTOMATIK_MERKEZI' | 'YARI_OTOMATIK_CARPMA';

  // Kat Kapı Boşlukları Detayı
  floorDoors: ShaftSurveyFloorDoor[];

  // Şantiye & Saha Durumu Değerlendirmeleri
  isElectricityAvailable: boolean; // Şantiye elektriği var mı?
  isShaftDry: boolean; // Kuyu dibi kuru ve su yalıtımlı mı?
  isScaffoldingRequired: boolean; // İskele kurulması gerekiyor mu?
  isHookInstalled: boolean; // Kuyu tavanında mapa/kanca var mı?
  hookCapacityKg?: string;

  // Genel Notlar & Keşif Açıklamaları
  generalNotes: string;
  createdAt: number;
  updatedAt: number;
}

// ==========================================
// 2. RAY & KAPI KONTROL FORMU VERİ TİPLERİ
// ==========================================
export interface RailDoorCheckFloor {
  floorIndex: number;
  floorLabel: string;
  carRailDBG: string; // Kabin Ray Arası (mm)
  cwtRailDBG: string; // Ağırlık Ray Arası (mm)
  carRailPlumbDeviation: string; // Kabin Ray Şakül Sapması (mm)
  cwtRailPlumbDeviation: string; // Ağırlık Ray Şakül Sapması (mm)
  doorFramePlumb: 'UYGUN' | 'KUSURLU'; // Kapı Kasası Şakülü
  doorClearance: 'UYGUN' | 'KUSURLU'; // Kapı Açıklık ve Boşlukları
  bracketTightness: 'UYGUN' | 'KUSURLU'; // Konsol & Ray Bağlantı Cıvataları
  notes?: string;
}

export interface RailDoorInspectionData {
  id: string;
  date: string;
  dateDisplay: string;
  inspectorName: string;
  projectName: string;
  buildingBlock: string;
  stopCount: number;
  floorStart: number;
  elevatorType: ElevatorType;
  carRailType: string; // T70, T89, T90, T125
  cwtRailType: string; // T50, T70, T89

  // Kuyu Boyu Ray Genel Değerlendirmeleri
  isRailBracketsWeldedProperly: boolean; // Konsol kaynakları ve dübeller sağlam mı?
  isFishplatesAligned: boolean; // Ray ekleme flanşları (balık sırtı) düzgün taşlanmış mı?
  isPitBuffersAligned: boolean; // Kuyu dibi tampon ayakları ray ekseninde mi?
  isDoorSillAligned: boolean; // Kapı eşikleri kuyu hattına göre hizalı mı?

  floors: RailDoorCheckFloor[];
  generalNotes: string;
  createdAt: number;
  updatedAt: number;
}

// ==========================================
// 4. YEŞİL ETİKET ÖNCESİ MÜŞTERİ İŞLERİ VERİ TİPLERİ
// ==========================================
export interface CustomerPreInspectionItem {
  id: string;
  title: string;
  description: string;
  responsibleParty: 'BINA_YONETIMI' | 'ELEKTRIKCI' | 'INSAAT_YUKLENICI' | 'DIGER';
  isCompleted: boolean;
  notes: string;
  importance: 'KRITIK' | 'ONEMLI' | 'BILGI';
}

export interface CustomerPreInspectionData {
  id: string;
  date: string;
  dateDisplay: string;
  inspectorName: string;
  buildingName: string;
  buildingManagerName: string;
  buildingManagerPhone: string;
  targetInspectionDate?: string;

  items: CustomerPreInspectionItem[];
  generalNotes: string;
  createdAt: number;
  updatedAt: number;
}
