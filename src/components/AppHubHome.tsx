import React, { useState, useEffect } from 'react';
import { ActiveAppModule } from '../types';
import { BetaLogo } from './BetaLogo';
import {
  Compass,
  GitPullRequest,
  CheckCircle2,
  Building2,
  ChevronRight,
  Sparkles,
  Settings,
  X,
  Moon,
  Sun,
  PlayCircle,
  FileCheck2,
  Cpu,
  Tablet,
} from 'lucide-react';
import { FontSizeControl } from './FontSizeControl';
import { useTheme } from '../context/ThemeContext';
import { loadActiveDraft } from '../utils/storage';
import { AndroidDiagnosticModal } from './AndroidDiagnosticModal';

interface AppHubHomeProps {
  onSelectModule: (module: ActiveAppModule) => void;
}

export const AppHubHome: React.FC<AppHubHomeProps> = ({ onSelectModule }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const { theme, setTheme, isDark } = useTheme();
  const [activeDraftInfo, setActiveDraftInfo] = useState<{
    exists: boolean;
    projectName?: string;
    step?: string;
    serial?: string;
  }>({ exists: false });

  useEffect(() => {
    const draft = loadActiveDraft();
    if (draft && (draft.clientProjectName || draft.serialNumber || draft.currentStep !== 'welcome')) {
      let stepLabel = 'Giriş Ekranı';
      if (draft.currentStep === 'specs') stepLabel = 'Asansör Özellikleri';
      else if (draft.currentStep === 'audit') {
        const tabNames = ['Ölçüler', 'Pano', 'Motor', 'Kabin Üstü', 'Ağırlık', 'Kuyu', 'Kabin/Buton', 'Kapılar'];
        stepLabel = `Denetim (${tabNames[draft.activeAuditTab || 0] || 'Saha'})`;
      } else if (draft.currentStep === 'report') {
        stepLabel = 'Rapor Ekranı';
      }

      setActiveDraftInfo({
        exists: true,
        projectName: draft.clientProjectName || 'İsimsiz Proje',
        serial: draft.serialNumber,
        step: stepLabel,
      });
    }
  }, []);

  return (
    <div className={`min-h-screen flex flex-col font-sans justify-between transition-colors ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
    }`}>
      {/* Kompakt Header Bar */}
      <header className="bg-[#0A2647] text-white shadow-md border-b-4 border-orange-500 pt-safe-or-2">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BetaLogo size="sm" className="shadow-xs shrink-0" />
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm sm:text-base font-black leading-tight text-white tracking-tight">
                  BETA ASANSÖR
                </h1>
                <span className="px-1.5 py-0.5 text-[8px] sm:text-[9px] font-black uppercase tracking-wider bg-orange-500 text-slate-950 rounded">
                  SAHA PORTALI
                </span>
              </div>
              <p className="text-[9px] sm:text-[10px] text-slate-200 font-medium">
                Saha Operasyon & Denetim Yönetim Merkezi
              </p>
            </div>
          </div>

          {/* Sağ Kısım: Genel Ayarlar */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              title="Genel Ayarlar, Yazı Boyutu & Tema"
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-lg text-xs font-bold transition-all border border-white/25 cursor-pointer shadow-xs"
            >
              <Settings className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline font-bold">Görünüm & Punto</span>
            </button>
          </div>
        </div>
      </header>

      {/* Ana Liste Alanı - Tek Ekrana Sığacak Şekilde Kompakt */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-3 sm:px-4 py-3 sm:py-5 flex flex-col justify-center">
        <div className="space-y-3 sm:space-y-3.5">
          {/* 1. KUYU RÖLEVE FORMU */}
          <div
            onClick={() => onSelectModule('shaftSurvey')}
            className={`group rounded-xl p-3.5 sm:p-4 transition-all duration-150 flex items-center justify-between gap-3 cursor-pointer select-none border ${
              isDark
                ? 'bg-slate-900 hover:bg-slate-850 border-slate-800 hover:border-sky-500/60 shadow-md'
                : 'bg-white hover:bg-sky-50/40 border-slate-300 hover:border-sky-500 shadow-md'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform border ${
                isDark
                  ? 'bg-sky-500/20 border-sky-400/30 text-sky-400'
                  : 'bg-sky-100 border-sky-300 text-sky-700 shadow-xs'
              }`}>
                <Compass className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2.5">
                <h2 className={`text-sm sm:text-base font-black truncate transition-colors ${
                  isDark ? 'text-white group-hover:text-sky-300' : 'text-slate-900 group-hover:text-sky-700'
                }`}>
                  1. Kuyu Röleve Formu
                </h2>
                <span className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded shrink-0 w-fit border ${
                  isDark
                    ? 'bg-slate-800 text-sky-300 border-slate-700'
                    : 'bg-sky-50 text-sky-800 border-sky-200'
                }`}>
                  Keşif & Ön İnceleme
                </span>
              </div>
            </div>

            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors border ${
              isDark
                ? 'bg-slate-800 group-hover:bg-sky-600 text-slate-400 group-hover:text-white border-slate-700'
                : 'bg-slate-100 group-hover:bg-sky-600 text-slate-700 group-hover:text-white border-slate-300'
            }`}>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          {/* 2. RAY KAPI KONTROL FORMU */}
          <div
            onClick={() => onSelectModule('railDoorInspection')}
            className={`group rounded-xl p-3.5 sm:p-4 transition-all duration-150 flex items-center justify-between gap-3 cursor-pointer select-none border ${
              isDark
                ? 'bg-slate-900 hover:bg-slate-850 border-slate-800 hover:border-amber-500/60 shadow-md'
                : 'bg-white hover:bg-amber-50/40 border-slate-300 hover:border-amber-500 shadow-md'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform border ${
                isDark
                  ? 'bg-amber-500/20 border-amber-400/30 text-amber-400'
                  : 'bg-amber-100 border-amber-300 text-amber-800 shadow-xs'
              }`}>
                <GitPullRequest className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2.5">
                <h2 className={`text-sm sm:text-base font-black truncate transition-colors ${
                  isDark ? 'text-white group-hover:text-amber-300' : 'text-slate-900 group-hover:text-amber-800'
                }`}>
                  2. Ray & Kapı Kontrol Formu
                </h2>
                <span className={`text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded shrink-0 flex items-center gap-1 w-fit border ${
                  isDark
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-amber-100 text-amber-900 border-amber-300'
                }`}>
                  <Sparkles className="w-2.5 h-2.5" />
                  Aktif
                </span>
              </div>
            </div>

            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors border ${
              isDark
                ? 'bg-slate-800 group-hover:bg-amber-600 text-slate-400 group-hover:text-white border-slate-700'
                : 'bg-slate-100 group-hover:bg-amber-600 text-slate-700 group-hover:text-white border-slate-300'
            }`}>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          {/* 3. KALİTE KONTROL FORMU (Öne Çıkan Aktif Modül) */}
          <div
            onClick={() => onSelectModule('qualityControl')}
            className={`group rounded-xl p-3.5 sm:p-4 transition-all duration-150 flex items-center justify-between gap-3 cursor-pointer select-none border-2 ${
              isDark
                ? 'bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-orange-500/70 hover:border-orange-500 shadow-lg'
                : 'bg-gradient-to-r from-orange-50/70 via-white to-orange-50/40 border-orange-500 hover:border-orange-600 shadow-lg'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform border ${
                isDark
                  ? 'bg-orange-500/20 border-orange-400/40 text-orange-400'
                  : 'bg-orange-100 border-orange-400 text-orange-700 shadow-xs'
              }`}>
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex flex-col gap-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2.5">
                  <h2 className={`text-sm sm:text-base font-black truncate flex items-center gap-1 transition-colors ${
                    isDark ? 'text-white group-hover:text-orange-300' : 'text-slate-950 group-hover:text-orange-700'
                  }`}>
                    3. Kalite Kontrol Formu
                  </h2>
                  <span className={`text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded shrink-0 flex items-center gap-1 w-fit border ${
                    isDark
                      ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                      : 'bg-orange-100 text-orange-950 border-orange-400 font-black'
                  }`}>
                    <Sparkles className="w-2.5 h-2.5" />
                    v2.0 Aktif
                  </span>
                </div>

                {/* Devam Eden Taslak Göstergesi */}
                {activeDraftInfo.exists && (
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded w-fit">
                    <PlayCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 animate-pulse" />
                    <span className="truncate">
                      Kaldığı Yerden Devam Et: <strong>{activeDraftInfo.projectName}</strong> ({activeDraftInfo.step})
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors border ${
              isDark
                ? 'bg-slate-800 group-hover:bg-orange-500 text-slate-400 group-hover:text-slate-950 border-slate-700'
                : 'bg-orange-100 group-hover:bg-orange-500 text-orange-800 group-hover:text-white border-orange-300'
            }`}>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          {/* 4. YEŞİL ETİKET ÖNCESİ MÜŞTERİ İŞLERİ */}
          <div
            onClick={() => onSelectModule('customerPreInspection')}
            className={`group rounded-xl p-3.5 sm:p-4 transition-all duration-150 flex items-center justify-between gap-3 cursor-pointer select-none border ${
              isDark
                ? 'bg-slate-900 hover:bg-slate-850 border-slate-800 hover:border-emerald-500/60 shadow-md'
                : 'bg-white hover:bg-emerald-50/40 border-slate-300 hover:border-emerald-500 shadow-md'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform border ${
                isDark
                  ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-400'
                  : 'bg-emerald-100 border-emerald-300 text-emerald-800 shadow-xs'
              }`}>
                <Building2 className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2.5">
                <h2 className={`text-sm sm:text-base font-black truncate transition-colors ${
                  isDark ? 'text-white group-hover:text-emerald-300' : 'text-slate-900 group-hover:text-emerald-800'
                }`}>
                  4. Yeşil Etiket Öncesi Müşteri İşleri
                </h2>
                <span className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded shrink-0 w-fit border ${
                  isDark
                    ? 'bg-slate-800 text-emerald-300 border-slate-700'
                    : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                }`}>
                  Bina & Yüklenici
                </span>
              </div>
            </div>

            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors border ${
              isDark
                ? 'bg-slate-800 group-hover:bg-emerald-600 text-slate-400 group-hover:text-white border-slate-700'
                : 'bg-slate-100 group-hover:bg-emerald-600 text-slate-700 group-hover:text-white border-slate-300'
            }`}>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </main>

      {/* Kompakt Footer */}
      <footer className={`py-2.5 text-center text-[11px] font-medium border-t transition-colors ${
        isDark ? 'text-slate-400 border-slate-900 bg-slate-950' : 'text-slate-600 border-slate-200 bg-slate-200/60'
      }`}>
        <p>© Beta Asansör Mühendislik & Kalite Güvence Sistemi</p>
      </footer>

      {/* HUB PORTALI AYARLAR & PUNTO MODALI */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
          <div className={`rounded-xl max-w-md w-full p-4 sm:p-5 shadow-2xl border max-h-[90vh] flex flex-col ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
          }`}>
            {/* Header */}
            <div className={`flex items-center justify-between pb-3 border-b mb-3 ${
              isDark ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                  isDark ? 'bg-orange-600/20 text-orange-400' : 'bg-orange-100 text-orange-600'
                }`}>
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <h3 className={`font-black text-sm ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                    SAHA PORTALI AYARLARI
                  </h3>
                  <p className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Yazı Puntosu & Ekran Görünüm Seçenekleri
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isDark
                    ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 overflow-y-auto pr-0.5">
              {/* Tema Seçimi */}
              <div className={`p-3.5 rounded-lg border ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                    isDark ? 'text-slate-300' : 'text-slate-800'
                  }`}>
                    {isDark ? <Moon className="w-3.5 h-3.5 text-blue-400" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
                    Ekran Teması
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-800'
                  }`}>
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

              {/* Yazı Boyutu & Punto Kontrolü */}
              <FontSizeControl />

              {/* Android 8.1 Tablet Teşhisi & Çevrimdışı Aktarım */}
              <div className={`p-3.5 rounded-lg border ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-emerald-50/70 border-emerald-200'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                    isDark ? 'text-emerald-400' : 'text-emerald-900'
                  }`}>
                    <Cpu className="w-3.5 h-3.5" />
                    Android 8.1.0 Tablet Doktoru & Konsol
                  </span>
                </div>
                <p className={`text-[11px] mb-2.5 ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>
                  Tablet donanım/tarayıcı uyumluluk kontrolü, canlı hata günlüğü ve çevrimdışı JSON dosya aktarımı.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowSettings(false);
                    setShowDiagnostic(true);
                  }}
                  className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                >
                  <Cpu className="w-4 h-4" />
                  <span>Teşhis Paneli ve Hata Konsolunu Aç</span>
                </button>
              </div>
            </div>

            <div className={`mt-4 pt-3 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="w-full py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-black transition cursor-pointer"
              >
                Tamam / Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Android 8.1 Diagnostic Modal */}
      {showDiagnostic && (
        <AndroidDiagnosticModal
          isOpen={showDiagnostic}
          onClose={() => setShowDiagnostic(false)}
        />
      )}
    </div>
  );
};
