import React, { useState, useEffect, useRef } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Upload, Trash2 } from 'lucide-react';
import { RailLayoutPosition } from '../types';

interface MachineChassisSvgProps {
  activeCode?: string;
  onSelectCode?: (code: string) => void;
  layoutPosition?: RailLayoutPosition;
}

const STORAGE_KEY_DRAWING_ZOOM = 'beta_drawing_modal_zoom_level';

function getStoredDrawingZoom(): number {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_DRAWING_ZOOM);
    if (saved) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed) && parsed >= 0.4 && parsed <= 3.5) {
        return Math.round(parsed * 100) / 100;
      }
    }
  } catch (e) {
    // ignore
  }
  return 1;
}

function persistDrawingZoom(val: number) {
  try {
    localStorage.setItem(STORAGE_KEY_DRAWING_ZOOM, val.toString());
  } catch (e) {
    // ignore
  }
}

export const MachineChassisSvg: React.FC<MachineChassisSvgProps> = ({
  layoutPosition,
}) => {
  const initialMode = layoutPosition === 'CWT_SIDE_LEFT' ? 'SASE_SOL' : 'SASE_SAG';
  const [viewMode, setViewMode] = useState<'SASE_SAG' | 'SASE_SOL'>(initialMode);
  const [zoom, setZoom] = useState<number>(getStoredDrawingZoom);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const changeZoom = (updater: number | ((prev: number) => number)) => {
    setZoom((prev) => {
      const nextVal = typeof updater === 'function' ? updater(prev) : updater;
      const clamped = Math.round(Math.min(Math.max(nextVal, 0.4), 3.5) * 100) / 100;
      persistDrawingZoom(clamped);
      return clamped;
    });
  };

  // Özel yüklenen şase çizimleri (localStorage destekli)
  const [customImages, setCustomImages] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('asansor_custom_chassis_images');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Kuyu yerleşimi değiştiğinde veya modal açıldığında otomatik olarak ilgili şaseyi göster
  useEffect(() => {
    if (layoutPosition === 'CWT_SIDE_LEFT') {
      setViewMode('SASE_SOL');
    } else if (layoutPosition === 'CWT_SIDE_RIGHT') {
      setViewMode('SASE_SAG');
    }
  }, [layoutPosition]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setCustomImages((prev) => {
          const updated = { ...prev, [viewMode]: dataUrl };
          try {
            localStorage.setItem('asansor_custom_chassis_images', JSON.stringify(updated));
          } catch (err) {
            console.warn('Storage limit reached:', err);
          }
          return updated;
        });
      }
    };
    reader.readAsDataURL(file);
    if (e.target) e.target.value = '';
  };

  const handleClearCustomImage = () => {
    setCustomImages((prev) => {
      const updated = { ...prev };
      delete updated[viewMode];
      try {
        localStorage.setItem('asansor_custom_chassis_images', JSON.stringify(updated));
      } catch (err) {
        console.warn('Storage error:', err);
      }
      return updated;
    });
  };

  const currentCustomImage = customImages[viewMode];
  const effectiveImageSrc = currentCustomImage;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-sm flex flex-col items-center w-full">
      {/* Şase Modu Seçici Butonları */}
      <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setViewMode('SASE_SAG')}
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
            onClick={() => setViewMode('SASE_SOL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
              viewMode === 'SASE_SOL'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Makine Şasesi (Sol)
          </button>
        </div>

        {/* Aksiyonlar: Yükle & Zoom */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Özel Resim Yükle Butonu */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer"
            title="Kendi Çiziminizi Yükleyin"
          >
            <Upload className="w-3.5 h-3.5 text-amber-400" />
            <span>Resim Yükle</span>
          </button>

          {currentCustomImage && (
            <button
              type="button"
              onClick={handleClearCustomImage}
              className="p-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-xl text-xs transition cursor-pointer"
              title="Varsayılan Çizime Dön"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            </button>
          )}

          {/* Kalıcı Zoom Kontrolleri */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5 shadow-sm">
            <button
              type="button"
              onClick={() => changeZoom((prev) => prev - 0.15)}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
              title="Uzaklaştır (Küçült)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => changeZoom(1)}
              className="px-2 py-1 text-[11px] font-mono font-bold text-amber-300 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer flex items-center gap-1"
              title="Varsayılan Boyuta Sıfırla (%100)"
            >
              <span>%{Math.round(zoom * 100)}</span>
              <RotateCcw className="w-3 h-3 text-slate-400" />
            </button>
            <button
              type="button"
              onClick={() => changeZoom((prev) => prev + 0.15)}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
              title="Yakınlaştır (Büyüt)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Görsel Alanı */}
      <div className="w-full min-h-[380px] max-h-[550px] bg-slate-950 rounded-xl border border-slate-800 p-2 flex items-center justify-center relative overflow-auto">
        <div className="flex items-center justify-center p-2 w-full h-full">
          <img
            src={effectiveImageSrc}
            alt={viewMode === 'SASE_SAG' ? 'Makine Şasesi Sağ' : 'Makine Şasesi Sol'}
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
              transition: 'transform 0.15s ease-out',
            }}
            className="max-h-[500px] w-auto object-contain rounded-lg shadow-xl bg-white"
          />
        </div>
      </div>
    </div>
  );
};
