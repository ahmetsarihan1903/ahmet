import React, { useState, useRef } from 'react';
import {
  X,
  Settings,
  Moon,
  Sun,
  Download,
  Upload,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
  Database,
  Smartphone,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { FontSizeControl } from './FontSizeControl';
import { AdminUserSettingsSection } from './AdminUserSettingsSection';
import { CURRENT_APP_VERSION } from '../constants/version';
import {
  downloadBackupFile,
  restoreDataFromBackup,
  BetaBackupPackage,
} from '../utils/backupManager';

interface HubSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HubSettingsModal: React.FC<HubSettingsModalProps> = ({ isOpen, onClose }) => {
  const { setTheme, isDark } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info' | null;
    text: string;
  }>({ type: null, text: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReleaseNotes, setShowReleaseNotes] = useState(false);

  if (!isOpen) return null;

  // 1. Tüm verileri tek tıkla JSON olarak yedekle
  const handleBackup = () => {
    try {
      setIsProcessing(true);
      const res = downloadBackupFile();
      setStatusMessage({
        type: 'success',
        text: `Tüm saha verileri (${res.count} adet kayıt, taslak ve ayar) "${res.filename}" olarak başarıyla yedeklendi ve indirildi.`,
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Yedekleme başarısız oldu: ${err?.message || 'Bilinmeyen hata'}`,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. JSON dosyasından tüm verileri geri yükle
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setStatusMessage({
      type: 'info',
      text: `"${file.name}" dosyası inceleniyor ve veriler yükleniyor...`,
    });

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const rawText = event.target?.result as string;
        if (!rawText) throw new Error('Dosya içeriği boş veya okunamadı.');

        const backupData: BetaBackupPackage = JSON.parse(rawText);
        const result = restoreDataFromBackup(backupData);

        setStatusMessage({
          type: 'success',
          text: `${result.message} Değişikliklerin tüm modüllere uygulanması için sayfa 2 saniye içinde yenilenecektir.`,
        });

        // Sayfayı yenileyerek yeni yüklenen tüm context ve localStorage verilerini aktif et
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } catch (err: any) {
        setStatusMessage({
          type: 'error',
          text: `Yedekten geri yükleme başarısız: ${err?.message || 'Geçersiz JSON formatı'}`,
        });
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      setStatusMessage({
        type: 'error',
        text: 'Dosya okunurken bir sistem hatası meydana geldi.',
      });
      setIsProcessing(false);
    };

    reader.readAsText(file);
    // Sıfırla
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div
        className={`rounded-2xl max-w-lg w-full p-4 sm:p-5 shadow-2xl border max-h-[92vh] flex flex-col ${
          isDark
            ? 'bg-slate-900 border-slate-800 text-slate-100'
            : 'bg-white border-slate-300 text-slate-900'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between pb-3.5 border-b mb-3.5 ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                isDark ? 'bg-orange-600/20 text-orange-400' : 'bg-orange-100 text-orange-600'
              }`}
            >
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`font-black text-sm sm:text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  SAHA PORTALI AYARLARI
                </h3>
                <span className="px-1.5 py-0.2 text-[9px] font-black uppercase bg-orange-500 text-slate-950 rounded">
                  v{CURRENT_APP_VERSION.version}
                </span>
              </div>
              <p className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Sürüm Kontrolü, Tam Yedekleme, Tema & Yönetici Paneli
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isDark
                ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* İçerik */}
        <div className="space-y-4 overflow-y-auto pr-1">
          {/* Status Message (Yedekleme & Geri Yükleme Bildirimleri) */}
          {statusMessage.type && (
            <div
              className={`p-3 rounded-xl text-xs flex items-start gap-2 border ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-300'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-950/50 border-rose-500/50 text-rose-300'
                  : 'bg-blue-950/50 border-blue-500/50 text-blue-300'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : statusMessage.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              ) : (
                <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5 animate-pulse" />
              )}
              <div className="leading-relaxed font-medium">{statusMessage.text}</div>
            </div>
          )}

          {/* 1. SÜRÜM & GÜNCELLEME TAKİP KUTUSU (Sadece Saha Portalı'na Özel) */}
          <div
            className={`p-3.5 rounded-xl border ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                  isDark ? 'text-slate-300' : 'text-slate-800'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Uygulama Sürümü & Güncelleme Sayacı
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Canlı Sürüm
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div
                className={`p-2 rounded-lg border ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Versiyon:</span>
                <span className="text-sm font-black text-orange-500 font-mono">
                  v{CURRENT_APP_VERSION.version}
                </span>
              </div>

              <div
                className={`p-2 rounded-lg border ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Güncelleme Sayacı:</span>
                <span className="text-sm font-black text-sky-400 font-mono">
                  Güncelleme: #{CURRENT_APP_VERSION.updateCount}
                </span>
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
              <span>Yayın Tarihi: <strong>{CURRENT_APP_VERSION.releaseDate}</strong></span>
              <span>Kanal: <strong className="text-slate-300">{CURRENT_APP_VERSION.buildChannel}</strong></span>
            </div>

            {/* Sürüm Notları / Değişiklik Özeti */}
            <div className="mt-2.5 pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setShowReleaseNotes(!showReleaseNotes)}
                className="w-full flex items-center justify-between text-[11px] font-bold text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <span>Sürüm Özellikleri & Güncelleme Notları</span>
                {showReleaseNotes ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showReleaseNotes && (
                <ul className="mt-2 space-y-1 list-disc list-inside text-[11px] text-slate-300 leading-relaxed bg-slate-900/70 p-2.5 rounded-lg border border-slate-800">
                  {CURRENT_APP_VERSION.notes.map((note, idx) => (
                    <li key={idx}>{note}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* 2. SİSTEM GÜVENLİK & TAM VERİ YEDEKLEME (Sadece Saha Portalı'na Özel) */}
          <div
            className={`p-3.5 rounded-xl border ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                  isDark ? 'text-slate-300' : 'text-slate-800'
                }`}
              >
                <Database className="w-3.5 h-3.5 text-blue-400" />
                Saha Veri Güvenliği & Tam Yedekleme
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Tüm Modüller
              </span>
            </div>

            <p className={`text-[11px] leading-relaxed mb-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Telefon değiştirirken veya güvenlik amacıyla; <strong>Kuyu Röleve</strong>,{' '}
              <strong>Ray & Kapı</strong>, <strong>Kalite Kontrol</strong> ve{' '}
              <strong>Müşteri İşleri</strong> dahil tüm kayıtlarınızı tek tıkla dosya olarak yedekleyebilir veya geri yükleyebilirsiniz.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Yedek İndir Butonu */}
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleBackup}
                className="py-2.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>Tüm Verileri Yedekle (.json)</span>
              </button>

              {/* Yedekten Geri Yükle Butonu */}
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => fileInputRef.current?.click()}
                className={`py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 border transition-all cursor-pointer disabled:opacity-50 ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-xs'
                }`}
              >
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>Yedekten Geri Yükle</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Güncelleme Koruma Güvencesi Rozeti */}
            <div
              className={`mt-3 p-2.5 rounded-lg border text-[11px] leading-relaxed flex items-start gap-2 ${
                isDark
                  ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong>Otomatik Güncelleme Koruması:</strong> Yeni bir APK veya sürüm kurulduğunda cihazınızdaki mevcut veriler silinmez, olduğu gibi korunur.
              </div>
            </div>
          </div>

          {/* 3. Ekran Teması */}
          <div
            className={`p-3.5 rounded-xl border ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2.5">
              <span
                className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                  isDark ? 'text-slate-300' : 'text-slate-800'
                }`}
              >
                {isDark ? (
                  <Moon className="w-3.5 h-3.5 text-blue-400" />
                ) : (
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                )}
                Ekran Teması
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-800'
                }`}
              >
                {isDark ? 'Karanlık Mod' : 'Gündüz Modu'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isDark
                    ? 'bg-blue-600 text-white border-blue-400 shadow-md font-black'
                    : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500'
                }`}
              >
                <Moon className="w-4 h-4" />
                <span>Karanlık Mod</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  !isDark
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black'
                    : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500'
                }`}
              >
                <Sun className="w-4 h-4" />
                <span>Gündüz Modu</span>
              </button>
            </div>
          </div>

          {/* 4. Yazı Boyutu & Punto Kontrolü */}
          <FontSizeControl />

          {/* 5. Aktif Denetçi & Yönetici Paneli */}
          <AdminUserSettingsSection />
        </div>

        {/* Modal Alt Kısım */}
        <div className={`mt-3.5 pt-2.5 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-black transition cursor-pointer"
          >
            Kapat / Tamam
          </button>
        </div>
      </div>
    </div>
  );
};
