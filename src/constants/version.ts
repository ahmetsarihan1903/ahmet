export interface AppVersionInfo {
  version: string;
  updateCount: number;
  releaseDate: string;
  buildChannel: string;
  notes: string[];
}

export const CURRENT_APP_VERSION: AppVersionInfo = {
  version: '1.6.0',
  updateCount: 7,
  releaseDate: '29.09.2026',
  buildChannel: 'Saha Canlı Üretim (APK / Release v7)',
  notes: [
    'Ray & Kapı formunda basılı tutma (long-press) mekanizması kaldırılarak hücre seçimli mimariye geçildi',
    'Üst menü çubuğundaki Rapor butonu kaldırılarak yerine "Hücreyi İşaretle" / "İşareti Kaldır" butonu eklendi',
    'Kullanıcı istediği hücreye dokunduğunda tek tıkla Siyah Zemin / Beyaz Yazı yapabilir ve aynı butonla normale döndürebilir',
    'Zorunlu Başlangıç Onaylarına (Kilit Şartı) "Bakım Günü Tarihi" eklendi',
    'Rapor sayfasında Donanım Eşleştirme ve Sistem Saati Güncelleme onayları üst kimlik tablosuna sabitlendi',
  ],
};
