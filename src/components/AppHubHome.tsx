import React, { useState } from 'react';
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
} from 'lucide-react';
import { FontSizeControl } from './FontSizeControl';
import { useTheme } from '../context/ThemeContext';

interface AppHubHomeProps {
  onSelectModule: (module: ActiveAppModule) => void;
}

export const AppHubHome: React.FC<AppHubHomeProps> = ({ onSelectModule }) => {
  const [showSettings, setShowSettings] = useState(false);
  const { theme, setTheme, isDark } = useTheme();

  return (
    <div className="min-h-screen bg-slate-950 light:bg-slate-100 text-slate-100 light:text-slate-900 flex flex-col font-sans justify-between">
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
              <p className="text-[9px] sm:text-[10px] text-slate-300 font-medium">
                Saha Operasyon & Denetim Yönetim Merkezi
              </p>
            </div>
          </div>

          {/* Sağ Kısım: Genel Ayarlar & Punto Büyütme Butonu */}
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            title="Genel Ayarlar, Yazı Boyutu & Tema"
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-lg text-xs font-bold transition-all border border-white/20 cursor-pointer shadow-xs"
          >
            <Settings className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">Görünüm & Punto</span>
          </button>
        </div>
      </header>

      {/* Ana Liste Alanı - Tek Ekrana Sığacak Şekilde Kompakt */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-3 sm:px-4 py-3 sm:py-4 flex flex-col justify-center">
        <div className="space-y-2.5 sm:space-y-3">
          {/* 1. KUYU RÖLEVE FORMU */}
          <div
            onClick={() => onSelectModule('shaftSurvey')}
            className="group bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-sky-500/60 rounded-lg p-3.5 sm:p-4 transition-all duration-150 flex items-center justify-between gap-3 shadow-sm cursor-pointer select-none"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 shrink-0 group-hover:scale-105 transition-transform">
                <Compass className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0 flex items-center gap-2">
                <h2 className="text-xs sm:text-sm font-black text-white truncate group-hover:text-sky-300 transition-colors">
                  1. Kuyu Röleve Formu
                </h2>
                <span className="text-[8px] sm:text-[9px] font-bold px-1.5 py-0.2 bg-slate-800 text-sky-300 border border-slate-700 rounded shrink-0">
                  Keşif & Ön İnceleme
                </span>
              </div>
            </div>

            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-800 group-hover:bg-sky-600 text-slate-400 group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          {/* 2. RAY KAPI KONTROL FORMU */}
          <div
            onClick={() => onSelectModule('railDoorInspection')}
            className="group bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/60 rounded-lg p-3.5 sm:p-4 transition-all duration-150 flex items-center justify-between gap-3 shadow-sm cursor-pointer select-none"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-105 transition-transform">
                <GitPullRequest className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0 flex items-center gap-2">
                <h2 className="text-xs sm:text-sm font-black text-white truncate group-hover:text-amber-300 transition-colors">
                  2. Ray & Kapı Kontrol Formu
                </h2>
                <span className="text-[8px] sm:text-[9px] font-black px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded shrink-0 flex items-center gap-0.5">
                  <Sparkles className="w-2.5 h-2.5" />
                  Aktif
                </span>
              </div>
            </div>

            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-800 group-hover:bg-amber-600 text-slate-400 group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          {/* 3. KALİTE KONTROL FORMU (Öne Çıkan Aktif Modül) */}
          <div
            onClick={() => onSelectModule('qualityControl')}
            className="group bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-2 border-orange-500/60 hover:border-orange-500 rounded-lg p-3.5 sm:p-4 transition-all duration-150 flex items-center justify-between gap-3 shadow-md cursor-pointer select-none"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-orange-500/20 border border-orange-400/40 flex items-center justify-center text-orange-400 shrink-0 group-hover:scale-105 transition-transform">
                <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0 flex items-center gap-2">
                <h2 className="text-xs sm:text-sm font-black text-white truncate flex items-center gap-1 group-hover:text-orange-300 transition-colors">
                  3. Kalite Kontrol Formu
                </h2>
                <span className="text-[8px] sm:text-[9px] font-black px-1.5 py-0.2 bg-orange-500/20 text-orange-300 border border-orange-500/40 rounded shrink-0 flex items-center gap-0.5">
                  <Sparkles className="w-2.5 h-2.5" />
                  v2.0 Aktif
                </span>
              </div>
            </div>

            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-800 group-hover:bg-orange-500 text-slate-400 group-hover:text-slate-950 flex items-center justify-center shrink-0 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          {/* 4. YEŞİL ETİKET ÖNCESİ MÜŞTERİ İŞLERİ */}
          <div
            onClick={() => onSelectModule('customerPreInspection')}
            className="group bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/60 rounded-lg p-3.5 sm:p-4 transition-all duration-150 flex items-center justify-between gap-3 shadow-sm cursor-pointer select-none"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
                <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0 flex items-center gap-2">
                <h2 className="text-xs sm:text-sm font-black text-white truncate group-hover:text-emerald-300 transition-colors">
                  4. Yeşil Etiket Öncesi Müşteri İşleri
                </h2>
                <span className="text-[8px] sm:text-[9px] font-bold px-1.5 py-0.2 bg-slate-800 text-emerald-300 border border-slate-700 rounded shrink-0">
                  Bina & Yüklenici
                </span>
              </div>
            </div>

            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-800 group-hover:bg-emerald-600 text-slate-400 group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </main>

      {/* Kompakt Footer */}
      <footer className="py-2 text-center text-[10px] text-slate-400 light:text-slate-500 border-t border-slate-900 light:border-slate-300">
        <p>© Beta Asansör Mühendislik & Kalite Güvence Sistemi</p>
      </footer>

      {/* HUB PORTALI AYARLAR & PUNTO MODALI */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
          <div className="bg-slate-900 light:bg-white rounded-xl max-w-md w-full p-4 sm:p-5 shadow-2xl border border-slate-800 light:border-slate-300 text-slate-100 light:text-slate-900 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 light:border-slate-200 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-600/20 light:bg-orange-100 text-orange-400 light:text-orange-600 flex items-center justify-center font-bold">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-100 light:text-slate-900">
                    SAHA PORTALI AYARLARI
                  </h3>
                  <p className="text-[11px] text-slate-400 light:text-slate-500 font-medium">
                    Yazı Puntosu & Ekran Görünüm Seçenekleri
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="p-1.5 text-slate-400 hover:text-slate-200 light:hover:text-slate-700 rounded-lg hover:bg-slate-800 light:hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 overflow-y-auto pr-0.5">
              {/* Tema Seçimi */}
              <div className="p-3.5 bg-slate-950 light:bg-slate-50 rounded-lg border border-slate-800 light:border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-300 light:text-slate-700 flex items-center gap-1.5">
                    {isDark ? <Moon className="w-3.5 h-3.5 text-blue-400" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
                    Ekran Teması
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 light:bg-slate-200 text-slate-300 light:text-slate-700">
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
                        : 'bg-slate-900 light:bg-white text-slate-400 light:text-slate-600 border-slate-700 light:border-slate-300 hover:border-slate-500'
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
                        : 'bg-slate-900 light:bg-white text-slate-400 light:text-slate-600 border-slate-700 light:border-slate-300 hover:border-slate-500'
                    }`}
                  >
                    <Sun className="w-4 h-4" />
                    <span>Gündüz Modu</span>
                  </button>
                </div>
              </div>

              {/* Yazı Boyutu & Punto Kontrolü */}
              <FontSizeControl />
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 light:border-slate-200">
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
    </div>
  );
};
