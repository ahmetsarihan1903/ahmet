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
    <header className="sticky top-0 z-40 bg-slate-900 text-white shadow-md border-b-2 border-slate-800">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between">
        {/* Brand & Logo */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <BetaLogo size="sm" className="shadow-xs" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold leading-none tracking-tight text-white">
                BETA ASANSÖR
              </h1>
              <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-orange-500/20 text-orange-300 rounded border border-orange-500/40">
                QC v2.0
              </span>
            </div>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 mt-0.5">
              Kalite Kontrol Denetim Sistemi
            </p>
          </div>
        </div>

        {/* Live Status Indicators */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Active Timer (during audit) */}
          {startTimestamp && currentStep === 'audit' && (
            <div className="text-right">
              <p className="font-mono text-orange-400 font-bold text-xs sm:text-sm leading-tight flex items-center gap-1 justify-end">
                <Clock className="w-3 h-3 text-orange-400 animate-pulse" />
                {formatTimerDisplay(elapsedSeconds)}
              </p>
              <p className="text-[9px] text-slate-300 font-mono tracking-tight">Canlı Süre</p>
            </div>
          )}

          {/* UD Count Badge (if in audit) */}
          {currentStep === 'audit' && (
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold border transition-all ${
                nonCompliantCount > 0
                  ? 'bg-red-500/20 text-red-200 border-red-500'
                  : 'bg-emerald-500/20 text-emerald-200 border-emerald-500'
              }`}
              title={`${nonCompliantCount} adet Uygun Değil (UD) kaydı tespit edildi`}
            >
              {nonCompliantCount > 0 ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                  <span>{nonCompliantCount} UD</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden xs:inline">Hatasız</span>
                </>
              )}
            </div>
          )}

          {/* Offline Badge */}
          <div
            className="flex items-center gap-1.5 bg-green-500/20 px-2.5 py-1 rounded-full border border-green-500 text-white"
            title="Kuyu dibinde %100 çevrimdışı çalışır"
          >
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider hidden xs:inline">
              Cihaz Çevrimdışı (Offline)
            </span>
          </div>

          {/* History Button */}
          {onOpenHistory && (
            <button
              type="button"
              id="btn-open-history"
              onClick={onOpenHistory}
              title="Geçmiş Raporlar ve Taslaklar"
              className="p-1.5 sm:p-2 text-slate-200 hover:text-white bg-white/10 hover:bg-white/20 rounded border border-white/20 transition-colors"
            >
              <History className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
