export interface AppVersionInfo {
  version: string;
  updateCount: number;
  releaseDate: string;
  buildChannel: string;
  notes: string[];
}

export const CURRENT_APP_VERSION: AppVersionInfo = {
  version: '1.4.0',
  updateCount: 5,
  releaseDate: '28.09.2026',
  buildChannel: 'Saha Canlı Üretim (APK / Release v5)',
  notes: [
    'Birleşik Tek Rapor Mimarisi: 1. Sayfa Yönetici Özeti, 2.+ Sayfalar Detaylı Denetim ve Eksik Kapatma Dökümü',
    'Sekmeli yapı kaldırılarak tek tıkla hem özet hem detayları içeren resmi tek PDF çıktısı',
    '1. Sayfada 8 ana bölüm için saf sayısal ve 2. kontrolde düzeltilme durumu özeti',
    '2. Kontrol (Eksik Kapatma & Yeniden Muayene) başlatma ve düzenleme butonu',
    'Seyir Konforu & Saha Ölçüleri kartları ile kurumsal kalite güvence standardı',
    'Ray & Kapı modülünde kalıcı teknik çizim/şema ekleme ve PDF sabitlemesi',
  ],
};
