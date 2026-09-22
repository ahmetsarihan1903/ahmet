import React, { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface MachineChassisSvgProps {
  activeCode?: string;
  onSelectCode?: (code: string) => void;
}

export const MachineChassisSvg: React.FC<MachineChassisSvgProps> = () => {
  const [viewMode, setViewMode] = useState<'SASE_SAG' | 'SASE_SOL'>('SASE_SAG');
  const [zoom, setZoom] = useState(1);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-sm flex flex-col items-center w-full">
      {/* Şase Modu Seçici Butonları */}
      <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setViewMode('SASE_SAG');
              setZoom(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
              viewMode === 'SASE_SAG'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Makine Şasesi (Sağ)
          </button>
          <button
            type="button"
            onClick={() => {
              setViewMode('SASE_SOL');
              setZoom(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
              viewMode === 'SASE_SOL'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Makine Şasesi (Sol)
          </button>
        </div>

        {/* Zoom Kontrolleri */}
        <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setZoom((prev) => Math.min(prev + 0.2, 3))}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
            title="Yakınlaştır"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((prev) => Math.max(prev - 0.2, 0.6))}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
            title="Uzaklaştır"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoom(1)}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
            title="Sıfırla"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Görsel Alanı - %100 Orijinal Teknik Resim */}
      <div className="w-full min-h-[380px] max-h-[550px] bg-slate-950 rounded-xl border border-slate-800 p-2 flex items-center justify-center relative overflow-auto">
        {viewMode === 'SASE_SAG' ? (
          <div className="flex items-center justify-center p-2 w-full h-full">
            <img
              src="/teknik-cizimler/makine-sase-sag.png"
              alt="Makine Şasesi Sağ"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'center center',
                transition: 'transform 0.15s ease-out',
              }}
              className="max-h-[500px] w-auto object-contain rounded-lg shadow-xl bg-white"
            />
          </div>
        ) : (
          <div className="flex items-center justify-center p-2 w-full h-full">
            <img
              src="/teknik-cizimler/makine-sase-sol.png"
              alt="Makine Şasesi Sol"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'center center',
                transition: 'transform 0.15s ease-out',
              }}
              className="max-h-[500px] w-auto object-contain rounded-lg shadow-xl bg-white"
            />
          </div>
        )}
      </div>
    </div>
  );
};
