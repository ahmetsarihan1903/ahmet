export interface AppVersionInfo {
  version: string;
  updateCount: number;
  releaseDate: string;
  buildChannel: string;
  notes: string[];
}

export const CURRENT_APP_VERSION: AppVersionInfo = {
  version: '1.2.0',
  updateCount: 2,
  releaseDate: '25.09.2026',
  buildChannel: 'Saha Canlı Üretim (APK / Release v2)',
  notes: [
    'Ray & Kapı Raporuna 2 adet teknik çizim/şema ekleme ve PDF çıktısına sabitleme özelliği',
    'Rapor çizimlerinin kalıcı hafızada saklanması (Yeni projelerde çizimlerin otomatik hazır gelmesi)',
    'Ray & Kapı Kat Ölçü Matrisi altına tüm sütunların en küçük ölçüsünü hesaplayan "SONUÇ / MIN" satırı',
    'Hücreye 2 saniye basılı tutarak Siyah Zemin / Beyaz Yazı ile anormallik/özel durum işaretleme',
    '1. ve 2. Sütun arasında 3 mm üzeri farklar için otomatik uyarı sistemi',
    'Mevcut saha verilerini sıfır kayıpla koruyan APK yükseltme güvencesi',
  ],
};
