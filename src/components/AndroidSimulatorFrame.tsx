import React, { useState, useEffect } from 'react';
import {
  Tablet,
  Smartphone,
  Maximize2,
  Minimize2,
  Cpu,
  RotateCw,
  X,
  Sparkles,
  Wifi,
  BatteryCharging,
  Circle,
  Square,
  ChevronLeft,
  Bug,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { subscribeToLogs, AppLogEntry } from '../polyfills';
import { AndroidDiagnosticModal } from './AndroidDiagnosticModal';
import { AuditFormData } from '../types';

interface AndroidSimulatorFrameProps {
  children: React.ReactNode;
  onLoadAudit?: (data: AuditFormData) => void;
}

export const AndroidSimulatorFrame: React.FC<AndroidSimulatorFrameProps> = ({
  children,
  onLoadAudit,
}) => {
  const { isDark } = useTheme();
  const [isSimActive, setIsSimActive] = useState(false);
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [scale, setScale] = useState<number>(1);
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const [currentTime, setCurrentTime] = useState('12:00');

  useEffect(() => {
    // Check if saved simulation state exists
    const saved = localStorage.getItem('__beta_android8_sim_active__');
    if (saved === 'true') {
      setIsSimActive(true);
    }

    const unsub = subscribeToLogs((logs) => {
      const errs = logs.filter((l) => l.type === 'error').length;
      setErrorCount(errs);
    });

    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 30000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  const toggleSimMode = (val: boolean) => {
    setIsSimActive(val);
    localStorage.setItem('__beta_android8_sim_active__', val ? 'true' : 'false');
  };

  // Dimensions for Samsung Galaxy Tab A (Android 8.1.0 Oreo standard)
  const tabletWidth = orientation === 'landscape' ? 1280 : 800;
  const tabletHeight = orientation === 'landscape' ? 800 : 1280;

  return (
    <>
      {/* Floating Global Android 8.1 Quick Access Trigger Button */}
      <div className="fixed bottom-3 right-3 z-40 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsDiagnosticOpen(true)}
          title="Android 8.1.0 Tablet Hata Konsolu & Uyumluluk Testi"
          className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xl border cursor-pointer transition-all active:scale-95 ${
            errorCount > 0
              ? 'bg-rose-600 text-white border-rose-400 animate-pulse'
              : isDark
              ? 'bg-slate-900/90 hover:bg-slate-800 text-emerald-400 border-slate-700 backdrop-blur-xs'
              : 'bg-white/90 hover:bg-slate-50 text-slate-800 border-slate-300 backdrop-blur-xs shadow-md'
          }`}
        >
          <Cpu className="w-3.5 h-3.5 text-emerald-400" />
          <span>Android 8.1 Teşhis</span>
          {errorCount > 0 ? (
            <span className="px-1.5 py-0.2 rounded-full bg-white text-rose-600 text-[10px] font-black">
              {errorCount} Hata
            </span>
          ) : (
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
          )}
        </button>

        <button
          type="button"
          onClick={() => toggleSimMode(!isSimActive)}
          title="Android 8.1 Tablet Simülasyon Çerçevesini Aç/Kapat"
          className={`p-2 rounded-full shadow-xl border cursor-pointer transition-all active:scale-95 ${
            isSimActive
              ? 'bg-orange-600 text-white border-orange-400'
              : isDark
              ? 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border-slate-700 backdrop-blur-xs'
              : 'bg-white/90 hover:bg-slate-50 text-slate-700 border-slate-300 backdrop-blur-xs'
          }`}
        >
          <Tablet className="w-4 h-4" />
        </button>
      </div>

      {/* When Simulation is OFF: Render children naturally full viewport */}
      {!isSimActive ? (
        children
      ) : (
        /* When Simulation is ON: Render realistic Android 8.1.0 Tablet Bezel & Viewport */
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start p-2 sm:p-4 overflow-auto font-sans">
          {/* Top Simulation Toolbar */}
          <div className="w-full max-w-6xl mb-3 py-2 px-3 bg-slate-900/95 border border-slate-800 rounded-xl shadow-lg flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold">
                <Tablet className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="font-black text-white uppercase text-xs tracking-tight">
                  Android 8.1.0 (Oreo) Tablet Simülatörü
                </span>
                <span className="ml-2 text-[10px] text-slate-400 font-mono">
                  {orientation === 'landscape' ? '1280x800 Yatay' : '800x1280 Dikey'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Orientation toggle */}
              <button
                type="button"
                onClick={() => setOrientation(orientation === 'landscape' ? 'portrait' : 'landscape')}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 border border-slate-700 cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5 text-orange-400" />
                <span>{orientation === 'landscape' ? 'Yatay Mod' : 'Dikey Mod'}</span>
              </button>

              {/* Diagnostic Button */}
              <button
                type="button"
                onClick={() => setIsDiagnosticOpen(true)}
                className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 cursor-pointer transition ${
                  errorCount > 0
                    ? 'bg-rose-600 text-white'
                    : 'bg-emerald-700 hover:bg-emerald-600 text-white'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Hata & Uyumluluk ({errorCount})</span>
              </button>

              {/* Exit Sim button */}
              <button
                type="button"
                onClick={() => toggleSimMode(false)}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1 border border-slate-700 cursor-pointer"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Tam Ekrana Dön</span>
              </button>
            </div>
          </div>

          {/* Tablet Device Frame */}
          <div
            className="relative bg-slate-900 rounded-[28px] p-3 sm:p-4 border-4 border-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] flex flex-col transition-all duration-200"
            style={{
              width: orientation === 'landscape' ? 'min(100%, 1280px)' : 'min(100%, 800px)',
              minHeight: orientation === 'landscape' ? '780px' : '1000px',
            }}
          >
            {/* Tablet Camera dot */}
            <div className="w-2.5 h-2.5 rounded-full bg-slate-950 border border-slate-800 mx-auto mb-2" />

            {/* Android 8.1 Status Bar */}
            <div className="bg-slate-950 text-slate-300 px-3 py-1 rounded-t-lg flex items-center justify-between text-[11px] font-mono border-b border-slate-800 select-none">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">Beta S.Y.S</span>
                <span className="text-slate-500">•</span>
                <span className="text-[10px] text-emerald-400">Android 8.1.0 API 27</span>
              </div>
              <div className="flex items-center gap-3">
                <Wifi className="w-3.5 h-3.5 text-slate-300" />
                <div className="flex items-center gap-1">
                  <span>85%</span>
                  <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <span className="font-bold text-white">{currentTime}</span>
              </div>
            </div>

            {/* Tablet Screen Content Viewport */}
            <div className="flex-1 bg-slate-950 rounded-b-none overflow-y-auto max-h-[75vh] relative border-x border-slate-800 shadow-inner">
              {children}
            </div>

            {/* Android 8.1 Soft Navigation Bar (Back, Home, Recents) */}
            <div className="bg-slate-950 text-slate-400 py-2 rounded-b-lg flex items-center justify-around border-t border-slate-800 select-none">
              <button
                type="button"
                onClick={() => window.history.back()}
                title="Geri"
                className="p-2 hover:text-white active:scale-90 transition cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                title="Ana Sayfa / Yenile"
                className="p-2 hover:text-white active:scale-90 transition cursor-pointer"
              >
                <Circle className="w-4 h-4 stroke-[2.5]" />
              </button>
              <button
                type="button"
                onClick={() => setIsDiagnosticOpen(true)}
                title="Son Uygulamalar / Teşhis"
                className="p-2 hover:text-white active:scale-90 transition cursor-pointer"
              >
                <Square className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Android 8.1 Compatibility Doctor & Error Console Modal */}
      {isDiagnosticOpen && (
        <AndroidDiagnosticModal
          isOpen={isDiagnosticOpen}
          onClose={() => setIsDiagnosticOpen(false)}
          onLoadAudit={onLoadAudit}
        />
      )}
    </>
  );
};
