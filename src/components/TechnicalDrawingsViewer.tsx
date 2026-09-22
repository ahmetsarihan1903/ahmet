import React, { useState } from 'react';
import { technicalDrawings, TechnicalDrawing } from '../data/technicalDrawings';
import { Layers, ZoomIn, ZoomOut, RotateCw, X, AlertTriangle, CheckCircle, FileImage } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface TechnicalDrawingsViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TechnicalDrawingsViewer: React.FC<TechnicalDrawingsViewerProps> = ({
  isOpen,
  onClose,
}) => {
  const { isDark } = useTheme();
  const [selectedDrawing, setSelectedDrawing] = useState<TechnicalDrawing>(technicalDrawings[0]);
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const handleSelect = (drawing: TechnicalDrawing) => {
    setSelectedDrawing(drawing);
    setZoom(1);
    setRotation(0);
  };

  const handleImageError = (id: string) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

  const resetTransform = () => {
    setZoom(1);
    setRotation(0);
  };

  return (
    <div
      id="technical-drawings-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-sm animate-fadeIn cursor-pointer overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="technical-drawings-modal-card"
        className={`relative rounded-2xl p-4 sm:p-5 max-w-6xl w-full shadow-2xl cursor-default my-auto max-h-[96vh] flex flex-col border ${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between pb-3 mb-3 border-b shrink-0 ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-black border border-amber-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black tracking-tight">
                Teknik Çizim Dosyaları Kataloğu
              </h2>
              <p className="text-[11px] font-medium text-slate-400">
                /public/teknik-cizimler/ dizinindeki 5 adet orijinal teknik çizim
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 sm:p-2 rounded-xl border transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold px-3 ${
              isDark
                ? 'bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white border-slate-700'
                : 'bg-slate-100 hover:bg-rose-600 text-slate-700 hover:text-white border-slate-300'
            }`}
          >
            <X className="w-4 h-4" />
            <span>Kapat</span>
          </button>
        </div>

        {/* Seçim Butonları / Sekmeler */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3 shrink-0">
          {technicalDrawings.map((drawing, index) => {
            const isSelected = selectedDrawing.id === drawing.id;
            const hasError = imageErrors[drawing.id];
            return (
              <button
                key={drawing.id}
                type="button"
                onClick={() => handleSelect(drawing)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                  isSelected
                    ? isDark
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md ring-2 ring-amber-400/40'
                      : 'bg-amber-50 border-amber-500 text-amber-900 shadow-md ring-2 ring-amber-400/40'
                    : isDark
                    ? 'bg-slate-800/70 hover:bg-slate-800 border-slate-700 text-slate-300'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-300">
                    {index + 1}
                  </span>
                  {hasError ? (
                    <span className="text-[10px] text-rose-400 font-bold flex items-center gap-0.5">
                      <AlertTriangle className="w-3 h-3" /> Hata
                    </span>
                  ) : (
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5">
                      <CheckCircle className="w-3 h-3" /> Hazır
                    </span>
                  )}
                </div>
                <div>
                  <div className="text-xs font-black truncate">{drawing.title}</div>
                  <div className="text-[9px] text-slate-400 font-mono truncate">{drawing.src}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Görsel Görüntüleme & Kontrol Alanı */}
        <div className={`flex-1 rounded-xl border overflow-hidden flex flex-col min-h-[380px] sm:min-h-[460px] relative ${
          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-300'
        }`}>
          {/* Üst Araç Çubuğu */}
          <div className={`px-3 py-2 border-b flex items-center justify-between text-xs font-bold ${
            isDark ? 'bg-slate-900/90 border-slate-800 text-slate-200' : 'bg-white/90 border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-center gap-2">
              <FileImage className="w-4 h-4 text-amber-500" />
              <span className="font-black text-amber-400">{selectedDrawing.title}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {selectedDrawing.src}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white cursor-pointer border border-slate-700"
                title="Küçült"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 text-[11px] font-mono">{Math.round(zoom * 100)}%</span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white cursor-pointer border border-slate-700"
                title="Büyüt"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white cursor-pointer border border-slate-700 ml-1"
                title="Döndür (90°)"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
              {(zoom !== 1 || rotation !== 0) && (
                <button
                  type="button"
                  onClick={resetTransform}
                  className="px-2 py-1 rounded bg-amber-500 text-slate-950 text-[10px] font-black cursor-pointer ml-1"
                >
                  Sıfırla
                </button>
              )}
            </div>
          </div>

          {/* Görsel Sahnesi: Doğrudan <img> etiketi ve object-contain */}
          <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-white select-none">
            {imageErrors[selectedDrawing.id] ? (
              <div className="text-center p-8 max-w-md bg-rose-50 border border-rose-200 rounded-xl">
                <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
                <h4 className="text-sm font-black text-rose-800 mb-1">Görsel Dosyası Bulunamadı</h4>
                <p className="text-xs text-rose-600 font-mono mb-2">{selectedDrawing.src}</p>
                <p className="text-[11px] text-slate-600">
                  Lütfen dosyanın <span className="font-mono font-bold">/public/teknik-cizimler/</span> klasöründe bulunduğundan emin olun.
                </p>
              </div>
            ) : (
              <div
                className="transition-transform duration-150 flex items-center justify-center max-w-full max-h-full"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center',
                }}
              >
                <img
                  src={selectedDrawing.src}
                  alt={selectedDrawing.title}
                  onError={() => handleImageError(selectedDrawing.id)}
                  className="max-w-full max-h-[60vh] object-contain rounded shadow-xs"
                  referrerPolicy="no-referrer"
                  style={{ objectFit: 'contain' }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Alt Açıklama / Not */}
        <div className="mt-3 text-[11px] text-slate-400 flex items-center justify-between shrink-0">
          <span>
            * Görseller fiziksel dosyalardan <code className="text-amber-400 font-mono">object-fit: contain</code> ile kırpılmadan yüklenmektedir.
          </span>
          <span className="font-mono text-[10px]">
            ID: {selectedDrawing.id}
          </span>
        </div>
      </div>
    </div>
  );
};
