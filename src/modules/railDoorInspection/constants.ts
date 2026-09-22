import {
  FloorDefinition,
  MeasurementFieldDef,
  RailElevatorMainType,
  RailLayoutPosition,
} from './types';

// ============================================================================
// AKILLI KAT HESAPLAMA MOTORU (Smart Floor Generation Engine)
// ============================================================================
export function calculateFloors(stopCount: number, startFloor: number): FloorDefinition[] {
  const clampedStops = Math.max(1, Math.min(32, stopCount || 1));
  const floors: FloorDefinition[] = [];

  for (let i = 0; i < clampedStops; i++) {
    const floorNum = startFloor + i;
    let label = '';
    
    if (floorNum < 0) {
      label = `${floorNum}. Kat (Bodrum ${Math.abs(floorNum)})`;
    } else if (floorNum === 0) {
      label = 'Zemin Kat (0)';
    } else {
      label = `${floorNum}. Kat`;
    }

    floors.push({
      stopIndex: i + 1,
      floorNumber: floorNum,
      floorLabel: label,
    });
  }

  return floors;
}

// ============================================================================
// ASANSÖR TİPLERİ VE YERLEŞİM HİYERARŞİSİ
// ============================================================================
export interface MainTypeOption {
  type: RailElevatorMainType;
  label: string;
  badge: string;
  description: string;
  allowedLayouts: {
    layout: RailLayoutPosition;
    label: string;
    subLabel: string;
  }[];
}

export const ELEVATOR_TYPE_CONFIGS: MainTypeOption[] = [
  {
    type: 'MR',
    label: '1. MR (Makine Daireli)',
    badge: 'MR',
    description: 'Üst makine dairesi bulunan standart asansör konfigürasyonu',
    allowedLayouts: [
      {
        layout: 'CWT_REAR',
        label: 'Ağırlık Arkada',
        subLabel: 'Ağırlık karkası kuyu arka duvarında konumlandırılmıştır',
      },
      {
        layout: 'CWT_SIDE_RIGHT',
        label: 'Ağırlık Yanda (Sağda)',
        subLabel: 'Ağırlık karkası kuyu sağ duvarında konumlandırılmıştır',
      },
      {
        layout: 'CWT_SIDE_LEFT',
        label: 'Ağırlık Yanda (Solda)',
        subLabel: 'Ağırlık karkası kuyu sol duvarında konumlandırılmıştır',
      },
    ],
  },
  {
    type: 'MRL',
    label: '2. MRL (Makine Dairesiz)',
    badge: 'MRL',
    description: 'Makine dairesi bulunmayan, motoru kuyu içine monte asansör',
    allowedLayouts: [
      {
        layout: 'CWT_REAR',
        label: 'Ağırlık Arkada',
        subLabel: 'Ağırlık karkası kuyu arka duvarında konumlandırılmıştır',
      },
      {
        layout: 'CWT_SIDE_RIGHT',
        label: 'Ağırlık Yanda (Sağda)',
        subLabel: 'Ağırlık karkası kuyu sağ duvarında konumlandırılmıştır',
      },
      {
        layout: 'CWT_SIDE_LEFT',
        label: 'Ağırlık Yanda (Solda)',
        subLabel: 'Ağırlık karkası kuyu sol duvarında konumlandırılmıştır',
      },
    ],
  },
  {
    type: 'MRL_MR',
    label: '3. MRL - Makine Daireli',
    badge: 'MRL-MR',
    description: 'MRL şaseli ancak makine dairesiyle kombine edilmiş hibrit model',
    allowedLayouts: [
      {
        layout: 'CWT_REAR',
        label: 'Ağırlık Arkada',
        subLabel: 'Ağırlık karkası kuyu arka duvarında konumlandırılmıştır',
      },
      {
        layout: 'CWT_SIDE_RIGHT',
        label: 'Ağırlık Yanda (Sağda)',
        subLabel: 'Ağırlık karkası kuyu sağ duvarında konumlandırılmıştır',
      },
      {
        layout: 'CWT_SIDE_LEFT',
        label: 'Ağırlık Yanda (Solda)',
        subLabel: 'Ağırlık karkası kuyu sol duvarında konumlandırılmıştır',
      },
    ],
  },
  {
    type: 'HYDRAULIC',
    label: '4. Hidrolik Asansör',
    badge: 'HİDROLİK',
    description: 'Hidrolik piston tahrikli yolcu veya yük asansörü',
    allowedLayouts: [
      {
        layout: 'PISTON_SINGLE',
        label: 'Tek Piston',
        subLabel: 'Yandan veya alttan tek hidrolik silindirli sistem',
      },
      {
        layout: 'PISTON_DOUBLE',
        label: 'Çift Piston',
        subLabel: 'Karşılıklı çift yan silindirli veya tandem sistem',
      },
    ],
  },
];

// ============================================================================
// DİNAMİK ÖLÇÜ KODLARI VE ŞEMA TANIMLARI (AUTOCAD BİREBİR ŞABLONU)
// ============================================================================

// 1. AĞIRLIK ARKADA (1-15 Nolu Şema Ölçüleri)
export const MEASUREMENTS_CWT_REAR: MeasurementFieldDef[] = [
  { code: '1', title: '1 - Sol Kabin Rayı - Kapı Kasası / Eşik Mesafesi', unit: 'mm', category: 'car_rail' },
  { code: '2', title: '2 - Sağ Kabin Rayı - Kapı Kasası / Eşik Mesafesi', unit: 'mm', category: 'car_rail' },
  { code: '3', title: '3 - Sol Kabin Rayı - Sol Ağırlık Rayı Mesafesi', unit: 'mm', category: 'car_rail' },
  { code: '4', title: '4 - Sağ Kabin Rayı - Sağ Ağırlık Rayı Mesafesi', unit: 'mm', category: 'cwt_rail' },
  { code: '5', title: '5 - Sağ Kabin Rayı - Sol Kapı Kasası Çaprazı', unit: 'mm', category: 'car_rail' },
  { code: '6', title: '6 - Sol Kabin Rayı - Sağ Kapı Kasası Çaprazı', unit: 'mm', category: 'car_rail' },
  { code: '7', title: '7 - Kabin Ray Arası DBG (Kabin Ray Açıklığı)', unit: 'mm', category: 'car_rail' },
  { code: '8', title: '8 - Ağırlık Ray Arası DBG (Ağırlık Ray Açıklığı)', unit: 'mm', category: 'cwt_rail' },
  { code: '9', title: '9 - Kuyu / Kapı Eksen Kaçıklığı (Merkez Aks)', unit: 'mm', category: 'shaft' },
  { code: '10', title: '10 - Ağırlık Rayı - Arka Kuyu Duvarı Mesafesi', unit: 'mm', category: 'cwt_rail' },
  { code: '11', title: '11 - Sol Kabin Rayı - Sağ Ağırlık Rayı Çaprazı', unit: 'mm', category: 'car_rail' },
  { code: '12', title: '12 - Sağ Kabin Rayı - Sol Ağırlık Rayı Çaprazı', unit: 'mm', category: 'car_rail' },
  { code: '13', title: '13 - Sol Kuyu Duvarı - Sol Kapı Kasası Yan Boşluğu', unit: 'mm', category: 'door' },
  { code: '14', title: '14 - Sağ Kuyu Duvarı - Sağ Kapı Kasası Yan Boşluğu', unit: 'mm', category: 'door' },
  { code: '15', title: '15 - Kapı Eşik Genişliği / Derinliği', unit: 'mm', category: 'door' },
];

// 2. AĞIRLIK YANDA (SAĞDA) (1-16 Birebir Teknik Şema Ölçüleri)
export const MEASUREMENTS_CWT_SIDE_RIGHT: MeasurementFieldDef[] = [
  { code: '1', title: '1 - Sol Kabin Rayı - Kapı Kasası / Eşik Ön Mesafesi', unit: 'mm', category: 'car_rail', hint: 'Sol kabin rayı ekseninden kapı kasasına dik mesafe' },
  { code: '2', title: '2 - Sağ Kabin Rayı - Kapı Kasası / Eşik Ön Mesafesi', unit: 'mm', category: 'car_rail', hint: 'Sağ kabin rayı ekseninden kapı kasasına dik mesafe' },
  { code: '3', title: '3 - Alt/Ön Ağırlık Rayı - Ön Kuyu / Kapı Ön Duvarı Mesafesi', unit: 'mm', category: 'cwt_rail', hint: 'Ön ağırlık rayı ile ön kuyu duvarı arası mesafe' },
  { code: '4', title: '4 - Ağırlık Rayları - Sağ Kuyu Duvarı Mesafesi', unit: 'mm', category: 'cwt_rail', hint: 'Ağırlık raylarının sağ kuyu duvarına olan dik mesafesi (Üst ve Alt)' },
  { code: '5', title: '5 - Sol Kapı Kasası / Köşesi - Sağ Kabin Rayı Çaprazı', unit: 'mm', category: 'car_rail', hint: 'Sol kapı kasasından sağ kabin rayı ucuna çapraz gönye ölçüsü' },
  { code: '6', title: '6 - Sağ Kapı Kasası / Köşesi - Sol Kabin Rayı Çaprazı', unit: 'mm', category: 'car_rail', hint: 'Sağ kapı kasasından sol kabin rayı ucuna çapraz gönye ölçüsü' },
  { code: '7', title: '7 - Kabin Ray Arası DBG (Kabin Ray Açıklığı)', unit: 'mm', category: 'car_rail', hint: 'İki kabin rayının karşılıklı uçtan uca DBG açıklığı' },
  { code: '8', title: '8 - Ağırlık Ray Arası DBG (Ağırlık Ray Açıklığı)', unit: 'mm', category: 'cwt_rail', hint: 'İki ağırlık rayı ucu arası DBG açıklığı' },
  { code: '9', title: '9 - Kuyu / Kapı Eksen Kaçıklığı (Merkez Aks)', unit: 'mm', category: 'shaft', hint: 'Kuyu merkezi düşey aksı ile kapı merkezi arasındaki kaçıklık' },
  { code: '10', title: '10 - Sağ Kabin Rayı Sırtı - Ağırlık Ray Ekseni Mesafesi', unit: 'mm', category: 'cwt_rail', hint: 'Sağ kabin rayı arkası ile ağırlık rayı ekseni arası yatay mesafe' },
  { code: '11', title: '11 - Ağırlık Rayları Düşey Eksen / Ray Referans Ölçüleri', unit: 'mm', category: 'cwt_rail', hint: 'Ağırlık raylarının kuyu tavan ve ray eksenine dik mesafeleri' },
  { code: '12', title: '12 - Kabin Rayları - Arka Kuyu Duvarı Mesafesi (Sol & Sağ)', unit: 'mm', category: 'car_rail', hint: 'Sol ve sağ kabin raylarının arka kuyu duvarına olan dik mesafeleri' },
  { code: '13', title: '13 - Sol Kuyu Duvarı - Sol Kapı Kasası / Giriş Boşluğu', unit: 'mm', category: 'door', hint: 'Sol kuyu duvarı ile sol kapı kasası arası yan boşluk' },
  { code: '14', title: '14 - Sağ Kuyu Duvarı - Sağ Kapı Kasası / Giriş Boşluğu', unit: 'mm', category: 'door', hint: 'Sağ kuyu duvarı ile sağ kapı kasası arası yan boşluk' },
  { code: '15', title: '15 - Kapı Eşik Genişliği / Derinliği', unit: 'mm', category: 'door', hint: 'Kapı kasası ve eşik montaj derinliği' },
  { code: '16', title: '16 - Sol Kabin Rayı Sırtı - Sol Kuyu Duvarı Mesafesi', unit: 'mm', category: 'car_rail', hint: 'Sol kabin rayı arkasından sol kuyu duvarına olan dik mesafe' },
];

// 3. AĞIRLIK YANDA (SOLDA) - YÜKLENEN PDF ÇİZİMİ BİREBİR TANIMLARI
export const MEASUREMENTS_CWT_SIDE_LEFT: MeasurementFieldDef[] = [
  { code: '1', title: '1 - Sol Kabin Rayı - Kapı Kasası Ön Mesafesi', unit: 'mm', category: 'car_rail', hint: 'Sol kabin rayı ekseninden kapı kasası / eşiğine dik mesafe' },
  { code: '2', title: '2 - Sağ Kabin Rayı - Kapı Kasası Ön Mesafesi', unit: 'mm', category: 'car_rail', hint: 'Sağ kabin rayı ekseninden kapı kasası / eşiğine dik mesafe' },
  { code: '3', title: '3 - Ön Ağırlık Rayı - Kapı Ön Duvarı Mesafesi', unit: 'mm', category: 'cwt_rail', hint: 'Sol ön ağırlık rayı ile ön kuyu duvarı arası mesafe' },
  { code: '4', title: '4 - Ağırlık Rayları - Sol Kuyu Duvarı Mesafesi', unit: 'mm', category: 'cwt_rail', hint: 'Ağırlık raylarının sırtından sol yan kuyu duvarına dik mesafe' },
  { code: '5', title: '5 - Sol Kapı Kasası - Sağ Kabin Rayı Çaprazı', unit: 'mm', category: 'car_rail', hint: 'Sol kapı kasası/sövesinden sağ kabin rayına giden çapraz gönye ölçüsü' },
  { code: '6', title: '6 - Sağ Kapı Kasası - Sol Kabin Rayı Çaprazı', unit: 'mm', category: 'car_rail', hint: 'Sağ kapı kasası/sövesinden sol kabin rayına giden çapraz gönye ölçüsü' },
  { code: '7', title: '7 - Kabin Ray Arası (DBG / Açıklık)', unit: 'mm', category: 'car_rail', hint: 'İki kabin rayının karşılıklı içten içe DBG açıklığı' },
  { code: '8', title: '8 - Ağırlık Ray Arası (DBG / Açıklık)', unit: 'mm', category: 'cwt_rail', hint: 'İki ağırlık rayı arası DBG açıklığı' },
  { code: '9', title: '9 - Kuyu / Kapı Eksen Kaçıklığı (Aks)', unit: 'mm', category: 'shaft', hint: 'Kuyu merkezi aks çizgisi ile kapı merkezi arasındaki kaçıklık' },
  { code: '10', title: '10 - Sol Kabin Ray Sırtı - Ağırlık Ray Ekseni Mesafesi', unit: 'mm', category: 'cwt_rail', hint: 'Sol kabin rayı ile ağırlık rayı ekseni arası yatay mesafe' },
  { code: '11', title: '11 - Ön Ağırlık Rayı - Sol Kabin Rayı Mesafesi', unit: 'mm', category: 'cwt_rail', hint: 'Ön ağırlık rayı ile kabin ray ekseni arasındaki mesafe' },
  { code: '12', title: '12 - Kabin Rayları - Arka Kuyu Duvarı Mesafesi', unit: 'mm', category: 'car_rail', hint: 'Kabin raylarının arka kuyu duvarına olan dik mesafeleri' },
  { code: '13', title: '13 - Sağ Kapı Kasası - Sağ Kuyu Duvarı Yan Boşluğu', unit: 'mm', category: 'door', hint: 'Kapı kasası sağ kenarı ile sağ kuyu duvarı arası boşluk' },
  { code: '14', title: '14 - Sol Kuyu Duvarı - Kapı Eksen/Giriş Boşluğu', unit: 'mm', category: 'door', hint: 'Sol kuyu duvarından kapı kasası/giriş sol başlangıcına olan mesafe' },
  { code: '15', title: '15 - Kapı Eşik Genişliği / Derinliği', unit: 'mm', category: 'door', hint: 'Kapı eşiği montaj derinlik ve genişlik ölçüsü' },
];

// 4. HİDROLİK ASANSÖR ŞEMASI
export const MEASUREMENTS_HYDRAULIC: MeasurementFieldDef[] = [
  { code: '1', title: '1 - Sol Kabin Rayı - Kapı Kasası Mesafesi', unit: 'mm', category: 'car_rail' },
  { code: '2', title: '2 - Sağ Kabin Rayı - Kapı Kasası Mesafesi', unit: 'mm', category: 'car_rail' },
  { code: '3', title: '3 - Kabin Ray Arası DBG (Kabin Ray Açıklığı)', unit: 'mm', category: 'car_rail' },
  { code: '4', title: '4 - Piston / Silindir Eksen Mesafesi', unit: 'mm', category: 'cwt_rail' },
  { code: '5', title: '5 - Kabin Ray Ekseni - Arka Duvar', unit: 'mm', category: 'car_rail' },
  { code: '6', title: '6 - Kabin Rayı - Yan Duvar Mesafesi', unit: 'mm', category: 'car_rail' },
  { code: '7', title: '7 - Silindir - Kuyu Duvarı Emniyet Boşluğu', unit: 'mm', category: 'cwt_rail' },
  { code: '8', title: '8 - Kapı Kasası - Kabin Ray Ekseni', unit: 'mm', category: 'door' },
  { code: '9', title: '9 - Kapı Eşik Boşluğu / Açıklığı', unit: 'mm', category: 'door' },
  { code: '10', title: '10 - Kuyu / Kapı Eksen Kaçıklığı (Merkez Aks)', unit: 'mm', category: 'shaft' },
  { code: '11', title: '11 - Sol Kapı Yan Boşluğu', unit: 'mm', category: 'door' },
  { code: '12', title: '12 - Sağ Kapı Yan Boşluğu', unit: 'mm', category: 'door' },
  { code: '13', title: '13 - Kuyu Derinliği Eksen Kontrolü', unit: 'mm', category: 'shaft' },
  { code: '14', title: '14 - Kuyu Genişliği Eksen Kontrolü', unit: 'mm', category: 'shaft' },
  { code: '15', title: '15 - Kapı Eşik Genişliği / Derinliği', unit: 'mm', category: 'door' },
];

export function getDefaultFloorAlias(floorNumber: number): string {
  if (floorNumber < 0) {
    return `${floorNumber}`;
  } else if (floorNumber === 0) {
    return 'Z';
  } else {
    return `${floorNumber}`;
  }
}

// 5. MAKİNE ŞASE ÖLÇÜLERİ TANIMLARI
export const MEASUREMENTS_MACHINE_CHASSIS: MeasurementFieldDef[] = [
  { code: 'M1', title: 'M1 - Makine / Motor Eksen Kaçıklığı (Ray Eksenine Göre)', unit: 'mm', category: 'shaft', hint: 'Makine tahrik kasnağının ray aksına olan mesafesi' },
  { code: 'M2', title: 'M2 - Şase Ön-Arka İzolasyon Takozu Mesafesi', unit: 'mm', category: 'shaft', hint: 'Titreşim sönümleyici takozlar arası mesafe' },
  { code: 'M3', title: 'M3 - Şase Sağ-Sol Genişlik Ölçüsü', unit: 'mm', category: 'shaft', hint: 'Şase profilleri dıştan dışa genişlik' },
  { code: 'M4', title: 'M4 - Kasnak Merkezinden Ağırlık Askı Eksenine Mesafe', unit: 'mm', category: 'cwt_rail', hint: 'Tahrik kasnağı ve saptırma kasnağı ağırlık düşüşü' },
  { code: 'M5', title: 'M5 - Kasnak Merkezinden Kabin Askı Eksenine Mesafe', unit: 'mm', category: 'car_rail', hint: 'Kabin süspansiyon askı ekseni mesafesi' },
  { code: 'M6', title: 'M6 - Şase Altı Kuyu Tavanı / Betonarme Boşluğu', unit: 'mm', category: 'shaft', hint: 'Kuyu tavanı veya döşeme ile şase altı açıklığı' },
  { code: 'M7', title: 'M7 - Halat Delikleri Merkezleme ve Kaçıklık Ölçüsü', unit: 'mm', category: 'shaft', hint: 'Kuyu tavanı halat deliklerinin halat eksenine uygunluğu' },
  { code: 'M8', title: 'M8 - Hız Regülatörü Eksen Ölçüsü', unit: 'mm', category: 'car_rail', hint: 'Regülatör kasnağı ile kabin rayı referansı' },
  { code: 'M9', title: 'M9 - Makine Şase Terazi / Düzlemsellik Kontrolü', unit: 'mm', category: 'shaft', hint: 'Su terazisi / şakül sapma değeri (mm/m)' },
];

export const LAYOUT_TITLES: Record<RailLayoutPosition, string> = {
  CWT_REAR: 'Ağırlık Arkada',
  CWT_SIDE_RIGHT: 'Ağırlık Yanda (Sağ)',
  CWT_SIDE_LEFT: 'Ağırlık Yanda (Sol)',
  PISTON_SINGLE: 'Hidrolik - Tek Piston',
  PISTON_DOUBLE: 'Hidrolik - Çift Piston',
};

export function getMeasurementDefsForLayout(layout: RailLayoutPosition): MeasurementFieldDef[] {
  switch (layout) {
    case 'CWT_REAR':
      return MEASUREMENTS_CWT_REAR;
    case 'CWT_SIDE_RIGHT':
      return MEASUREMENTS_CWT_SIDE_RIGHT;
    case 'CWT_SIDE_LEFT':
      return MEASUREMENTS_CWT_SIDE_LEFT;
    case 'PISTON_SINGLE':
    case 'PISTON_DOUBLE':
      return MEASUREMENTS_HYDRAULIC;
    default:
      return MEASUREMENTS_CWT_REAR;
  }
}

// ============================================================================
// CM -> MM DÖNÜŞTÜRÜCÜ VE SAYISAL AYRIŞTIRICI MOTORU (Virgül ve Nokta Desteği)
// ============================================================================
/**
 * Kullanıcının girdiği CM değerini sayısal MM değerine dönüştürür.
 * Hem virgül (120,5) hem nokta (120.5) girişlerini destekler.
 * 120.5 cm -> 1205 mm
 */
export function parseCmToMm(val: string | number | undefined | null): number | null {
  if (val === undefined || val === null) return null;
  const str = String(val).trim().replace(',', '.');
  if (str === '' || str === '-' || isNaN(Number(str))) {
    const parsed = parseFloat(str);
    return isNaN(parsed) ? null : Math.round(parsed * 10 * 100) / 100;
  }
  const num = parseFloat(str);
  if (isNaN(num)) return null;
  return Math.round(num * 10 * 100) / 100;
}

/**
 * CM olarak girilen değeri raporda gösterilmek üzere MM metnine dönüştürür.
 * Örn: "120" -> "1200", "120,5" -> "1205", "120.55" -> "1205.5"
 */
export function formatCmToMm(val: string | number | undefined | null, fallback = '-'): string {
  const mm = parseCmToMm(val);
  if (mm === null) return fallback;
  return Number.isInteger(mm) ? mm.toString() : mm.toFixed(1);
}

/**
 * Saha Ölçümü ve Proje Nominal Değeri Arasındaki Sapmayı MM Cinsinden Hesaplar
 * Yerleşim Özel Kuralları:
 *   - AGIRLIK YANDA SAĞ (CWT_SIDE_RIGHT) & AGIRLIK YANDA SOL (CWT_SIDE_LEFT):
 *       - 4 Numaralı Sütun: Proje nominali girilmişse o değer, girilmemişse varsayılan 12 cm (120 mm) alt sınır kabul edilir. Altı kırmızı hata, üstü UYGUN.
 *       - 12 Numaralı Sütun: Proje nominali girilmişse bu değer alt sınır kabul edilir. Altı kırmızı hata, üstü UYGUN.
 *       - Diğer Sütunlar: Proje nominali yoksa sütun kendi içinde analiz edilir (0 mm tam, 1-3 mm sarı, >3 mm kırmızı kritik sapma).
 *   - AGIRLIK ARKADA (CWT_REAR):
 *       - Standart eksen / ray kuralları (arka ağırlık senaryosuna hazır).
 */
export function calculateMmDeviation(
  cellValCm: string | number | undefined | null,
  nomValCm: string | number | undefined | null,
  colCode?: string,
  inferredNominalMm?: number | null,
  layoutPosition?: RailLayoutPosition
): {
  cellMm: number;
  nomMm: number | null;
  diffMm: number;
  badgeText: string;
  isMatch: boolean;
  isWarning: boolean;
  isCritical: boolean;
  isCol4UnderLimit?: boolean;
  isUnderLimit?: boolean;
  isInferred?: boolean;
} | null {
  const cellMm = parseCmToMm(cellValCm);
  const nomMm = parseCmToMm(nomValCm);

  if (cellMm === null) return null;

  const isSideCwt = !layoutPosition || layoutPosition === 'CWT_SIDE_RIGHT' || layoutPosition === 'CWT_SIDE_LEFT';
  const isRearCwt = layoutPosition === 'CWT_REAR';

  // 4 Numaralı Sütun Senaryosu (Ağırlık Yanda için col 4, Ağırlık Arkada için col 10)
  const isCol4Rule = (isSideCwt && String(colCode) === '4') || (isRearCwt && String(colCode) === '10');
  if (isCol4Rule) {
    const thresholdMm = nomMm !== null ? nomMm : (inferredNominalMm ?? 120);

    if (cellMm < thresholdMm) {
      const diffMm = Math.round((cellMm - thresholdMm) * 100) / 100;
      return {
        cellMm,
        nomMm: nomMm !== null ? nomMm : thresholdMm,
        diffMm,
        badgeText: `${diffMm} mm`,
        isMatch: false,
        isWarning: false,
        isCritical: true,
        isCol4UnderLimit: true,
        isUnderLimit: true,
        isInferred: nomMm === null && inferredNominalMm !== undefined && inferredNominalMm !== null,
      };
    }

    // Eşik değer ve üzerindeki tüm değerlerde ne kadar sapma/fark olursa olsun UYGUN (işaretsiz)
    return {
      cellMm,
      nomMm: nomMm !== null ? nomMm : thresholdMm,
      diffMm: 0,
      badgeText: '',
      isMatch: true,
      isWarning: false,
      isCritical: false,
      isCol4UnderLimit: false,
      isUnderLimit: false,
      isInferred: nomMm === null && inferredNominalMm !== undefined && inferredNominalMm !== null,
    };
  }

  // 12 Numaralı Sütun Senaryosu (Ağırlık Yanda için col 12, Ağırlık Arkada için col 3 ve 4)
  const isCol12Rule = (isSideCwt && String(colCode) === '12') || (isRearCwt && (String(colCode) === '3' || String(colCode) === '4'));
  if (isCol12Rule) {
    const thresholdMm = nomMm !== null ? nomMm : (inferredNominalMm ?? null);
    if (thresholdMm !== null) {
      if (cellMm < thresholdMm) {
        const diffMm = Math.round((cellMm - thresholdMm) * 100) / 100;
        return {
          cellMm,
          nomMm: thresholdMm,
          diffMm,
          badgeText: `${diffMm} mm`,
          isMatch: false,
          isWarning: false,
          isCritical: true,
          isCol4UnderLimit: false,
          isUnderLimit: true,
          isInferred: nomMm === null,
        };
      }

      // Proje nominali ve üzerindeki tüm değerlerde UYGUN (işaretsiz)
      return {
        cellMm,
        nomMm: thresholdMm,
        diffMm: 0,
        badgeText: '',
        isMatch: true,
        isWarning: false,
        isCritical: false,
        isCol4UnderLimit: false,
        isUnderLimit: false,
        isInferred: nomMm === null,
      };
    }
    return null;
  }

  // Standart sütunlar (veya Ağırlık Arkada senaryosu):
  // Eğer Proje Nominal değeri varsa onu kullan; yoksa sütunun kendi iç analizinden çıkan inferredNominalMm'yi kullan!
  const targetNominalMm = nomMm !== null ? nomMm : (inferredNominalMm ?? null);
  if (targetNominalMm === null) return null;

  const diffMm = Math.round((cellMm - targetNominalMm) * 100) / 100;
  const badgeText = `${diffMm > 0 ? '+' : ''}${diffMm} mm`;

  // 3 mm tolerans kuralı:
  // - 0 mm: Tam Uyumlu
  // - 1-3 mm (0 < |diff| <= 3): Hafif Fark / Değişik Ölçü (Sarı)
  // - >3 mm (|diff| > 3): KRİTİK SAPMA (Kırmızı)
  return {
    cellMm,
    nomMm: targetNominalMm,
    diffMm,
    badgeText,
    isMatch: diffMm === 0,
    isWarning: Math.abs(diffMm) > 0 && Math.abs(diffMm) <= 3,
    isCritical: Math.abs(diffMm) > 3,
    isCol4UnderLimit: false,
    isUnderLimit: false,
    isInferred: nomMm === null,
  };
}

/**
 * Tablodaki tüm sütunların girilen kat değerlerini kendi içerisinde analiz eder.
 * Eğer bir sütunda Proje Nominal değeri girilmemişse, o sütunun en çok tekrarlanan (mod)
 * veya medyan değerini otomatik referans olarak hesaplar.
 */
export function getColumnInferredNominals(
  floorMatrixMeasurements: Record<string, Record<string, string>>,
  columnCodes: string[]
): Record<string, number> {
  const result: Record<string, number> = {};

  columnCodes.forEach((cCode) => {
    const values: number[] = [];
    Object.values(floorMatrixMeasurements).forEach((row) => {
      const val = row[cCode];
      const mm = parseCmToMm(val);
      if (mm !== null) values.push(mm);
    });

    if (values.length >= 2) {
      // Mod (en sık tekrar eden) bul
      const freq: Record<number, number> = {};
      let maxCount = 0;
      let modeVal = values[0];

      values.forEach((v) => {
        freq[v] = (freq[v] || 0) + 1;
        if (freq[v] > maxCount) {
          maxCount = freq[v];
          modeVal = v;
        }
      });

      if (maxCount === 1) {
        // Hepsi farklıysa medyan
        const sorted = [...values].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        result[cCode] = sorted[mid];
      } else {
        result[cCode] = modeVal;
      }
    }
  });

  return result;
}

// ============================================================================
// SABİT / REFERANS TEKNİK ÇİZİM VE ŞEMA TANIMLARI
// ============================================================================
export const FIXED_LAYOUT_DRAWINGS: Record<RailLayoutPosition, { url: string; title: string }> = {
  CWT_SIDE_RIGHT: {
    url: '/teknik-cizimler/ag-yan-sag.jpg',
    title: 'Ağırlık Yanda Sağ Kuyu Şeması',
  },
  CWT_SIDE_LEFT: {
    url: '/teknik-cizimler/ag-yan-sol.png',
    title: 'Ağırlık Yanda Sol Kuyu Şeması',
  },
  CWT_REAR: {
    url: '/teknik-cizimler/ag-arka.png',
    title: 'Ağırlık Arkada Kuyu Şeması',
  },
  PISTON_SINGLE: {
    url: '/teknik-cizimler/ag-yan-sag.jpg',
    title: 'Tek Piston (Hidrolik) Kuyu Şeması',
  },
  PISTON_DOUBLE: {
    url: '/teknik-cizimler/ag-arka.png',
    title: 'Çift Piston (Hidrolik) Kuyu Şeması',
  },
};

export const FIXED_CHASSIS_DRAWINGS: Record<'SASE_SAG' | 'SASE_SOL', { url: string; title: string }> = {
  SASE_SAG: {
    url: '/teknik-cizimler/makine-sase-sag.png',
    title: 'Makine Şasesi (Sağ) Şeması',
  },
  SASE_SOL: {
    url: '/teknik-cizimler/makine-sase-sol.png',
    title: 'Makine Şasesi (Sol) Şeması',
  },
};


