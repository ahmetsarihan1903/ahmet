export type RailElevatorMainType = 'MR' | 'MRL' | 'MRL_MR' | 'HYDRAULIC';

export type RailLayoutPosition = 
  | 'CWT_REAR'        // Arkadan Ağırlık
  | 'CWT_SIDE_RIGHT'   // Yandan Ağırlık - Ağırlık Sağda
  | 'CWT_SIDE_LEFT'    // Yandan Ağırlık - Ağırlık Solda
  | 'PISTON_SINGLE'    // Hidrolik - Tek Piston
  | 'PISTON_DOUBLE';   // Hidrolik - Çift Piston

export interface RailProjectIdentity {
  serialNumber: string;    // Asansör Seri Numarası (Örn: 05.01.25.206)
  reference: string;       // Referans (Örn: AHMET İNŞ)
  location: string;        // Tesis Yeri (Örn: KADIKÖY)
  installerMaster: string; // Montajı Yapan Usta (Örn: NAZIM KÜÇÜK)
  projectManager: string;  // Proje Sorumlusu (Örn: MÜFİT GÖNCE)
  inspector: string;       // Kontrolü Yapan (Örn: AHMET SARIHAN)
}

export interface FloorDefinition {
  stopIndex: number;  // 1..32
  floorNumber: number; // -6, -5, ... 0, 1, 2 ...
  floorLabel: string; // "-1. Kat", "Zemin Kat", "1. Kat", "2. Kat"
}

export interface MeasurementFieldDef {
  code: string;       // "1", "2", "3" veya "A", "B", "C"
  title: string;      // "Kuyu Genişliği (A)", "Kabin Ray DBG (C)" vb.
  unit: string;       // "mm"
  defaultProjectMm?: string;
  hint?: string;
  category?: 'shaft' | 'car_rail' | 'cwt_rail' | 'door' | 'plumb';
}

export interface FloorMeasurementValue {
  code: string;           // Measurement field code
  projectValueMm: string; // Proje Ölçüsü (mm)
  actualValueMm: string;  // Gerçekleşen Saha Ölçüsü (mm)
  notes?: string;
}

export interface FloorInspectionRecord {
  floorIndex: number;
  floorLabel: string;
  floorNumber: number;
  measurements: Record<string, FloorMeasurementValue>;
  generalFloorNotes?: string;
  isCompleted?: boolean;
}

export type InspectionActiveTab = 'RAIL_DOOR' | 'MACHINE_CHASSIS' | 'NON_CONFORMITIES';

export interface RailDoorNonConformityItem {
  id: string;
  floor?: string;
  title: string;
  description?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: number;
}

export interface SingleMeasurementValue {
  code: string;
  projectValueMm: string;
  actualValueMm: string;
  notes?: string;
}

export interface RailDoorInspectionFullData {
  id: string;
  createdAt: number;
  updatedAt: number;
  inspectionDateDisplay: string; // Otomatik o günün tarihi (Örn: 13.09.2026)
  
  // 1. Proje Kimlik Bilgileri
  identity: RailProjectIdentity;

  // 2. Akıllı Kat Motoru (Duraklar ve Kat Rumuzları)
  stopCount: number;  // 1..32
  startFloor: number; // -6..+15
  floors: FloorInspectionRecord[];
  floorAliases?: Record<number, string>; // Durak Rumuzları (1.DR -> "-2", 2.DR -> "-1", 3.DR -> "Z" vb.)

  // 3. Teknik Özellik ve Yerleşim
  mainType: RailElevatorMainType;
  layoutPosition: RailLayoutPosition;

  // 4. Proje Nominal / Referans Değerleri (1..15 ve Özel Eklenen Kolonlar İçin)
  projectNominalValues?: Record<string, string>;

  // 15'ten sonra kullanıcının kendi belirlediği özel sütun kodları (Örn: ['16', '18', '20'])
  customColumnCodes?: string[];

  // 9 Nolu Sütun İbaresi (SAĞ, SOL, MRK - Eksen Kaçıklığı)
  column9Direction?: 'SAĞ' | 'SOL' | 'MRK' | string;
  column7Direction?: 'SAĞ' | 'SOL' | 'MRK' | string;
  columnSubOptions?: Record<string, string>;

  // 5. Matris Kat Ölçümleri (Kat x Sütun Matrisi):
  // [stopIndex (1..N)]: { [colCode (1..15)]: '1205' }
  floorMatrixMeasurements: Record<string, Record<string, string>>;

  // 6. Makine Şase Ölçümleri (Eski uyumluluk)
  machineChassisMeasurements: Record<string, SingleMeasurementValue>;

  // Yeni Şase Ölçüleri Tablosu 1 (A, B, C, D, E, F(11), G, H, I)
  chaseMeasurementsTable1?: Record<string, string>;

  // Konsol Mesafeleri Tablosu (K, L, M, N sütunları x 2 satır: U Bölme Tarafı, Tek Ray Tarafı)
  consoleMeasurementsTable2?: {
    uBolmeSide: Record<string, string>; // K, L, M, N
    tekRaySide: Record<string, string>; // K, L, M, N
  };

  // Kuyudibi Ölçüsü ve Son Kat Ölçüsü
  pitDepth?: string;
  headroom?: string;
  
  // 7. Uygunsuzluk Kayıtları
  nonConformities?: RailDoorNonConformityItem[];

  // Eski tekil uyumluluk
  railDoorMeasurements?: Record<string, SingleMeasurementValue>;

  // Genel Notlar & Onay
  generalNotes: string;
  isApproved: boolean;

  // Eklenen PDF Proje Dosyası (Kullanıcının kendi PDF teknik projesi)
  attachedPdfName?: string;
  attachedPdfDataUrl?: string;

  // Şema / Yerleşim Bazlı Özel Resimler (Her kuyu şemasının resmi sadece kendi bölümünde gözükür)
  layoutImages?: Partial<Record<RailLayoutPosition, { imageName?: string; imageUrl?: string }>>;

  // Makine Şase Resimleri (Sağ / Sol için kullanıcı yüklemeleri)
  chassisImages?: Partial<Record<'SASE_SAG' | 'SASE_SOL', { imageName?: string; imageUrl?: string }>>;

  // Eklenen Teknik Resim (Aktif seçimin görseli)
  attachedImageName?: string;
  attachedImageUrl?: string;
}
