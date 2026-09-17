import React, { useEffect, useState } from 'react';
import { ShieldCheck, Clock, AlertTriangle, Save, Check, Settings } from 'lucide-react';
import { formatTimerDisplay } from '../utils/textUtils';
import { BetaLogo } from './BetaLogo';

interface HeaderProps {
  currentStep: 'welcome' | 'specs' | 'audit' | 'report';
  startTimestamp: number | null;
  nonCompliantCount: number;
  onOpenSettings: () => void;
  onManualSave: () => void;
  isSaveSuccess?: boolean;
  onBackToMainMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentStep,
  startTimestamp,
  nonCompliantCount,
  onOpenSettings,
  onManualSave,
  isSaveSuccess = false,
  onBackToMainMenu,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!startTimestamp || currentStep === 'report' || currentStep === 'welcome' || currentStep === 'specs') {
      return;
    }

    const updateTimer = () => {
      const diff = Math.max(0, Math.floor((Date.now() - startTimestamp) / 1000));
      setElapsedSeconds(diff);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [startTimestamp, currentStep]);

  return (
    <header className="sticky top-0 z-40 bg-[#0A2647] text-white shadow-md border-b-4 border-orange-500 pt-safe-or-4">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 pt-1 pb-2.5 sm:pb-3 flex items-center justify-between gap-2">
        {/* Brand & Logo */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          {onBackToMainMenu && (
            <button
              type="button"
              id="btn-back-to-hub"
              onClick={onBackToMainMenu}
              title="Ana Menü / Modül Seçimine Dön"
              className="px-2.5 py-1.5 bg-slate-800/95 hover:bg-slate-700 text-white rounded border border-slate-500 text-xs font-black flex items-center gap-1 shrink-0 transition-colors shadow-sm cursor-pointer"
            >
              <span className="text-orange-400 font-bold text-sm">‹</span>
              <span>Menü</span>
            </button>
          )}
          <BetaLogo size="sm" className="shadow-xs shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-sm sm:text-lg font-black leading-none tracking-tight text-white truncate">
                BETA ASANSÖR
              </h1>
              <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-orange-500 text-slate-950 rounded shrink-0">
                QC v2.0
              </span>
            </div>
            <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-300 font-bold mt-0.5 truncate hidden xs:block">
              Kalite Kontrol Denetim Sistemi
            </p>
          </div>
        </div>

        {/* Live Status Indicators & Controls: Süre, UD Kutusu, Kaydet Butonu, Ayarlar Butonu */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Active Timer (during audit) */}
          {startTimestamp && currentStep === 'audit' && (
            <div className="text-right bg-slate-900/90 px-2 sm:px-2.5 py-1 rounded border border-slate-700">
              <p className="font-mono text-orange-400 font-black text-xs sm:text-sm leading-tight flex items-center gap-1 justify-end">
                <Clock className="w-3.5 h-3.5 text-orange-400 animate-pulse shrink-0" />
                {formatTimerDisplay(elapsedSeconds)}
              </p>
              <p className="text-[8px] sm:text-[9px] text-slate-300 font-mono font-bold tracking-tight">Geçen Süre</p>
            </div>
          )}

          {/* UD Count Badge (if in audit) */}
          {currentStep === 'audit' && (
            <div
              className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded text-xs font-black border-2 transition-all shrink-0 ${
                nonCompliantCount > 0
                  ? 'bg-red-600 text-white border-red-400 shadow-md'
                  : 'bg-emerald-600 text-white border-emerald-400'
              }`}
              title={`${nonCompliantCount} adet Uygun Değil (UD) kaydı tespit edildi`}
            >
              {nonCompliantCount > 0 ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-white fill-red-800 shrink-0" />
                  <span>{nonCompliantCount} UD</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-white shrink-0" />
                  <span className="hidden xs:inline">Hatasız</span>
                </>
              )}
            </div>
          )}

          {/* 1. KAYDET BUTONU - SADECE İKON (Altında/yanında yazı yok) */}
          <button
            type="button"
            id="btn-header-save"
            onClick={onManualSave}
            title="Taslağı ve Denetimi Kaydet"
            aria-label="Kaydet"
            className={`p-2 rounded border transition-all cursor-pointer flex items-center justify-center ${
              isSaveSuccess
                ? 'bg-emerald-600 border-emerald-400 text-white shadow-md scale-105'
                : 'bg-slate-800/90 hover:bg-emerald-950/70 text-emerald-400 border-slate-600 hover:border-emerald-500'
            }`}
          >
            {isSaveSuccess ? (
              <Check className="w-4 h-4 text-white animate-bounce" />
            ) : (
              <Save className="w-4 h-4" />
            )}
          </button>

          {/* 2. AYARLAR BUTONU - SADECE İKON (Altında/yanında yazı yok) */}
          <button
            type="button"
            id="btn-header-settings"
            onClick={onOpenSettings}
            title="Ayarlar & Menü (Görünüm, Veri Güncelleme, Geçmiş)"
            aria-label="Ayarlar"
            className="p-2 bg-slate-800/95 hover:bg-slate-700 text-white rounded border border-slate-500 hover:border-slate-300 transition-colors cursor-pointer flex items-center justify-center shadow-sm"
          >
            <Settings className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </header>
  );
};
