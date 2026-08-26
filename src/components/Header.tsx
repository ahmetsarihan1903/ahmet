import React, { useEffect, useState } from 'react';
import { ShieldCheck, Clock, AlertTriangle, History } from 'lucide-react';
import { formatTimerDisplay } from '../utils/textUtils';
import { BetaLogo } from './BetaLogo';

interface HeaderProps {
  currentStep: 'welcome' | 'specs' | 'audit' | 'report';
  startTimestamp: number | null;
  nonCompliantCount: number;
  onOpenHistory?: () => void;
  onNewInspection?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentStep,
  startTimestamp,
  nonCompliantCount,
  onOpenHistory,
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
    <header className="sticky top-0 z-40 bg-[#0A2647] text-white shadow-md border-b-4 border-orange-500">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between">
        {/* Brand & Logo */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <BetaLogo size="sm" className="shadow-xs" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black leading-none tracking-tight text-white">
                BETA ASANSÖR
              </h1>
              <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-orange-500 text-slate-950 rounded">
                QC v2.0
              </span>
            </div>
            <p className="text-[10px] uppercase tracking-wider text-slate-300 font-bold mt-0.5">
              Kalite Kontrol Denetim Sistemi
            </p>
          </div>
        </div>

        {/* Live Status Indicators */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Active Timer (during audit) */}
          {startTimestamp && currentStep === 'audit' && (
            <div className="text-right bg-slate-900/80 px-2.5 py-1 rounded border border-slate-700">
              <p className="font-mono text-orange-400 font-black text-xs sm:text-sm leading-tight flex items-center gap-1 justify-end">
                <Clock className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
                {formatTimerDisplay(elapsedSeconds)}
              </p>
              <p className="text-[9px] text-slate-300 font-mono font-bold tracking-tight">Geçen Süre</p>
            </div>
          )}

          {/* UD Count Badge (if in audit) */}
          {currentStep === 'audit' && (
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-black border-2 transition-all ${
                nonCompliantCount > 0
                  ? 'bg-red-600 text-white border-red-400 shadow-md'
                  : 'bg-emerald-600 text-white border-emerald-400'
              }`}
              title={`${nonCompliantCount} adet Uygun Değil (UD) kaydı tespit edildi`}
            >
              {nonCompliantCount > 0 ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-white fill-red-800" />
                  <span>{nonCompliantCount} UD</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-white" />
                  <span className="hidden xs:inline">Hatasız</span>
                </>
              )}
            </div>
          )}

          {/* Offline Badge */}
          <div
            className="flex items-center gap-1.5 bg-emerald-700 px-2.5 py-1.5 rounded text-white border border-emerald-400 font-bold"
            title="Kuyu dibinde %100 çevrimdışı çalışır"
          >
            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
            <span className="text-[10px] sm:text-xs uppercase tracking-wider hidden xs:inline">
              Çevrimdışı (Offline)
            </span>
          </div>

          {/* History Button */}
          {onOpenHistory && (
            <button
              type="button"
              id="btn-open-history"
              onClick={onOpenHistory}
              title="Geçmiş Raporlar ve Taslaklar"
              className="p-2 text-white bg-slate-800 hover:bg-slate-700 rounded border-2 border-slate-600 transition-colors cursor-pointer"
            >
              <History className="w-4 h-4 text-blue-300" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
