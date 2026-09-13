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

// 2. AĞIRLIK YANDA (SAĞDA) (1-15 Ölçüleri)
export const MEASUREMENTS_CWT_SIDE_RIGHT: MeasurementFieldDef[] = [
  { code: '1', title: '1 - Sol Kabin Rayı - Kapı Kasası Mesafesi', unit: 'mm', category: 'car_rail' },
  { code: '2', title: '2 - Sağ Kabin Rayı - Kapı Kasası Mesafesi', unit: 'mm', category: 'car_rail' },
  { code: '3', title: '3 - Ön Ağırlık Rayı - Ön Kuyu / Kapı Duvarı Mesafesi', unit: 'mm', category: 'cwt_rail' },
  { code: '4', title: '4 - Ağırlık Rayı - Sağ Kuyu Duvarı Mesafesi', unit: 'mm', category: 'cwt_rail' },
  { code: '5', title: '5 - Sağ Kabin Rayı - Sol Kapı Kasası Çaprazı', unit: 'mm', category: 'car_rail' },
  { code: '6', title: '6 - Sol Kabin Rayı - Sağ Kapı Kasası Çaprazı', unit: 'mm', category: 'car_rail' },
  { code: '7', title: '7 - Kabin Ray Arası DBG (Kabin Ray Açıklığı)', unit: 'mm', category: 'car_rail' },
  { code: '8', title: '8 - Ağırlık Ray Arası DBG (Ağırlık Ray Açıklığı)', unit: 'mm', category: 'cwt_rail' },
  { code: '9', title: '9 - Kuyu / Kapı Eksen Kaçıklığı (Merkez Aks)', unit: 'mm', category: 'shaft' },
  { code: '10', title: '10 - Sağ Kabin Ray Sırtı - Ağırlık Ray Ekseni Mesafesi', unit: 'mm', category: 'cwt_rail' },
  { code: '11', title: '11 - Arka Ağırlık Rayı - Arka Duvar Mesafesi', unit: 'mm', category: 'cwt_rail' },
  { code: '12', title: '12 - Kabin Ray Ekseni - Arka Duvar Mesafesi', unit: 'mm', category: 'car_rail' },
  { code: '13', title: '13 - Sol Kuyu Duvarı - Sol Kapı Kasası Yan Boşluğu', unit: 'mm', category: 'door' },
  { code: '14', title: '14 - Sağ Kuyu Duvarı - Sağ Kapı Kasası Yan Boşluğu', unit: 'mm', category: 'door' },
  { code: '15', title: '15 - Kapı Eşik Genişliği / Derinliği', unit: 'mm', category: 'door' },
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
