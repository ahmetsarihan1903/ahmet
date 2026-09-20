import React from 'react';
import { ArrowLeft, Construction, Clock, Sparkles } from 'lucide-react';
import { BetaLogo } from '../components/BetaLogo';
import { useTheme } from '../context/ThemeContext';

interface UnderConstructionModuleProps {
  title: string;
  moduleNumber: string;
  badge: string;
  description: string;
  accentColor: 'sky' | 'amber' | 'orange' | 'emerald';
  onBackToMainMenu: () => void;
}

export const UnderConstructionModule: React.FC<UnderConstructionModuleProps> = ({
  title,
  moduleNumber,
  badge,
  description,
  accentColor,
  onBackToMainMenu,
}) => {
  const colorMap = {
    sky: {
      border: 'border-sky-500',
      text: 'text-sky-400',
      badgeBg: 'bg-sky-500',
      glowBg: 'bg-sky-500/10',
      btnBg: 'bg-sky-600 hover:bg-sky-500',
    },
    amber: {
      border: 'border-amber-500',
      text: 'text-amber-400',
      badgeBg: 'bg-amber-500',
      glowBg: 'bg-amber-500/10',
      btnBg: 'bg-amber-600 hover:bg-amber-500',
    },
    orange: {
      border: 'border-orange-500',
      text: 'text-orange-400',
      badgeBg: 'bg-orange-500',
      glowBg: 'bg-orange-500/10',
      btnBg: 'bg-orange-600 hover:bg-orange-500',
    },
    emerald: {
      border: 'border-emerald-500',
      text: 'text-emerald-400',
      badgeBg: 'bg-emerald-500',
      glowBg: 'bg-emerald-500/10',
      btnBg: 'bg-emerald-600 hover:bg-emerald-500',
    },
  };

  const currentTheme = colorMap[accentColor];
  const { isDark } = useTheme();

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-150 app-root ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
      }`}
    >
      {/* Header */}
      <header className={`sticky top-0 z-40 bg-[#0A2647] text-white shadow-md border-b-4 ${currentTheme.border} pt-safe-or-4`}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onBackToMainMenu}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded border border-slate-600 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <ArrowLeft className={`w-3.5 h-3.5 ${currentTheme.text}`} />
              Menü
            </button>
            <BetaLogo size="sm" className="shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-black leading-none text-white uppercase">
                  {title}
                </h1>
                <span className={`px-1.5 py-0.5 text-[9px] font-black uppercase ${currentTheme.badgeBg} text-slate-950 rounded`}>
                  {badge}
                </span>
              </div>
              <p className="text-[10px] text-slate-300 font-medium">{moduleNumber}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Construction Card */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-12 flex flex-col items-center justify-center text-center">
        <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl p-8 sm:p-12 shadow-2xl relative overflow-hidden w-full max-w-xl">
          <div className={`absolute -right-12 -top-12 w-48 h-48 ${currentTheme.glowBg} rounded-full blur-2xl pointer-events-none`} />
          <div className={`absolute -left-12 -bottom-12 w-48 h-48 ${currentTheme.glowBg} rounded-full blur-2xl pointer-events-none`} />

          {/* Construction Icon */}
          <div className="relative mx-auto w-20 h-20 rounded-2xl bg-slate-800 border-2 border-slate-700 flex items-center justify-center mb-6 shadow-inner">
            <Construction className={`w-10 h-10 ${currentTheme.text} animate-bounce`} />
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
              <Clock className="w-3 h-3 text-slate-950" />
            </div>
          </div>

          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${currentTheme.text} bg-slate-800 border border-slate-700 mb-3`}>
            <Sparkles className="w-3.5 h-3.5" />
            Yapım Aşamasında
          </span>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
            {title}
          </h2>

          <p className="text-sm text-slate-300 leading-relaxed mb-6">
            {description}
          </p>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-xs text-slate-400 mb-8 space-y-1">
            <p className="font-bold text-slate-300">📌 Geliştirme Notu:</p>
            <p>Bu form için belirleyeceğiniz özel ölçüm adımları ve kurallar hazır olduğunda yeni promptlar ile aktifleştirilecektir.</p>
          </div>

          <button
            type="button"
            onClick={onBackToMainMenu}
            className="w-full sm:w-auto px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs sm:text-sm font-bold border border-slate-600 transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4 text-orange-400" />
            <span>Ana Menüye / Modül Seçimine Dön</span>
          </button>
        </div>
      </main>
    </div>
  );
};
