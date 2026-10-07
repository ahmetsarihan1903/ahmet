export interface AppVersionInfo {
  version: string;
  updateCount: number;
  releaseDate: string;
  buildChannel: string;
  notes: string[];
}

export const CURRENT_APP_VERSION: AppVersionInfo = {
  version: '1.8.0',
  updateCount: 9,
  releaseDate: '07.10.2026',
  buildChannel: 'Saha Canlı Üretim (APK / Release v9 - Final)',
  notes: [
    '2. Kontrol (Eksik Kapatma) ekranında [ Yapıldı ], [ BETA ] ve [ Kaldı ] olmak üzere 3 seçenekli buton sistemi tamamlandı',
    'PDF Raporunda 2. Kontrol tablosu kullanıcının belirlediği kesin sıralamaya kavuşturuldu: [Sıra No, Bölüm, Kontrol Maddesi, Kontrol Maddesi Açıklama, Durak, 2. Kontrol Durumu & Notu]',
    'Durum kısmında BETA sade ve şık olarak konumlandırıldı, otomatik gereksiz notlar kaldırılarak kullanıcının serbest açıklamasına bırakıldı',
    'APK güncellemelerinde eski sürümün kalmasını önleyen no-cache meta protokolleri ve WebView önbellek yönetimi aktive edildi',
    'Tüm 4 ana modül (Kuyu Röleve, Ray-Kapı Kontrolü, Kalite Kontrol, Müşteri İşleri) tam uyumlu olarak derlendi',
  ],
};
