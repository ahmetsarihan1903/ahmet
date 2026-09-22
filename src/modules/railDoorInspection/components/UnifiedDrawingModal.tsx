import React, { useState, useEffect, useRef } from 'react';
import {
  Eye,
  X,
  Upload,
  Trash2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Loader2,
  FileImage,
} from 'lucide-react';
import { compressAndProcessImage } from '../../../utils/imageProcessor';
import { syncDrawingsToServer } from '../utils/drawingSync';

export interface DrawingSubView {
  id: string;
  label: string;
}

export interface UnifiedDrawingModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  badge?: string;
  subViews?: DrawingSubView[];
  activeSubView?: string;
  onSubViewChange?: (subViewId: string) => void;
  imageName?: string;
  imageUrl?: string;
  defaultImageName?: string;
  defaultImageUrl?: string;
  syncKey?: string;
  onImageChange?: (name?: string, url?: string) => void;
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

export const UnifiedDrawingModal: React.FC<UnifiedDrawingModalProps> = ({
  isOpen,
  onClose,
  title,
  badge,
  subViews,
  activeSubView,
  onSubViewChange,
  imageName,
  imageUrl,
  defaultImageName,
  defaultImageUrl,
  syncKey,
  onImageChange,
}) => {
  const [zoom, setZoom] = useState<number>(getStoredDrawingZoom);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal her açıldığında kullanıcının en son belirlediği kalıcı zoom seviyesini tazele
  useEffect(() => {
    if (isOpen) {
      setZoom(getStoredDrawingZoom());
    }
  }, [isOpen]);

  const changeZoom = (updater: number | ((prev: number) => number)) => {
    setZoom((prev) => {
      const nextVal = typeof updater === 'function' ? updater(prev) : updater;
      const clamped = Math.round(Math.min(Math.max(nextVal, 0.4), 3.5) * 100) / 100;
      persistDrawingZoom(clamped);
      return clamped;
    });
  };

  // ESC tuşu ile kapatma
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleProcessFile = async (file: File) => {
    setIsProcessing(true);
    try {
      if (file.type.includes('pdf')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          if (onImageChange) onImageChange(file.name, dataUrl);
          setIsProcessing(false);
        };
        reader.readAsDataURL(file);
        return;
      }

      const result = await compressAndProcessImage(file);
      if (onImageChange) {
        onImageChange(file.name, result.dataUrl);
      }
      if (syncKey) {
        syncDrawingsToServer({ [syncKey]: { dataUrl: result.dataUrl, name: file.name } });
      }
    } catch (err) {
      console.error('Dosya işleme hatası:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleProcessFile(file);
    if (e.target) e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleProcessFile(file);
  };

  const handleClear = () => {
    if (onImageChange) onImageChange(undefined, undefined);
  };

  const isCustom = Boolean(imageUrl && imageUrl !== defaultImageUrl);
  const effectiveUrl = imageUrl || defaultImageUrl;
  const effectiveName = (isCustom ? imageName : defaultImageName) || imageName || defaultImageName || title;
  const hasImage = Boolean(effectiveUrl);

  return (
    <div
      id="unified-drawing-modal-backdrop"
      className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-14 p-2 sm:p-3 bg-slate-950/80 backdrop-blur-sm animate-fadeIn cursor-pointer overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="unified-drawing-modal-card"
        className="relative bg-slate-900 border border-slate-700/80 rounded-2xl p-3 sm:p-4 max-w-4xl w-full shadow-2xl cursor-default flex flex-col max-h-[calc(100vh-3.8rem)]"
        onClick={(e) => e.stopPropagation()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        {/* MODAL BAŞLIK ALANI */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xs sm:text-sm font-black text-white tracking-wide uppercase">
                  {title}
                </h3>
                {badge && (
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                    {badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {effectiveName}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 sm:p-2 bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors cursor-pointer shadow-xs flex items-center gap-1.5 text-xs font-bold px-3 shrink-0"
            title="Kapat"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Kapat</span>
          </button>
        </div>

        {/* EĞER ALT GÖRÜNÜM SEÇENEKLERİ VARSA (Örn: Makine Şase Sağ / Sol) */}
        {subViews && subViews.length > 1 && (
          <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl mb-3 shrink-0 self-start">
            {subViews.map((sv) => {
              const isSelected = activeSubView === sv.id;
              return (
                <button
                  key={sv.id}
                  type="button"
                  onClick={() => onSubViewChange && onSubViewChange(sv.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {sv.label}
                </button>
              );
            })}
          </div>
        )}

        {/* KONTROL ARAÇ ÇUBUĞU (YÜKLE - SIFIRLA - ZOOM) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 mb-3 pb-2.5 border-b border-slate-800/80 shrink-0">
          {/* Sol: Durum Bildirimi */}
          <div className="flex items-center gap-2">
            {isCustom ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Özel Çizim Yüklü</span>
              </span>
            ) : hasImage ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Sabit Teknik Çizim</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 border border-slate-700">
                <span className="w-2 h-2 rounded-full bg-slate-500" />
                <span>Çizim Yüklenmedi</span>
              </span>
            )}
          </div>

          {/* Sağ: Butonlar */}
          <div className="flex items-center gap-2 justify-end">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={handleFileInputChange}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 text-xs font-black rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5 text-slate-950" />
              )}
              <span>{hasImage ? 'Resmi Değiştir' : 'Resim Yükle'}</span>
            </button>

            {isCustom && (
              <button
                type="button"
                onClick={handleClear}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                title="Sabit orijinal çizime dön"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>Varsayılana Dön</span>
              </button>
            )}

            {!isCustom && hasImage && !defaultImageUrl && (
              <button
                type="button"
                onClick={handleClear}
                className="px-2.5 py-1.5 bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                title="Yüklü resmi kaldır"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Kaldır</span>
              </button>
            )}

            {/* Kalıcı Zoom / Büyütme-Küçültme Kontrolleri */}
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
                title="Tıklayarak Varsayılan Boyuta Sıfırla (%100)"
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

        {/* GÖRÜNTÜLEME ALANI / ÇİZİM GÖRÜNÜMÜ */}
        <div
          className={`flex-1 min-h-[380px] max-h-[62vh] bg-slate-950 rounded-xl border p-2 sm:p-4 flex items-center justify-center relative overflow-auto transition-colors ${
            isDragging
              ? 'border-amber-500 bg-amber-500/5'
              : 'border-slate-800'
          }`}
        >
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center text-center p-6 space-y-3">
              <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
              <p className="text-xs font-bold text-slate-300">
                Görsel işleniyor ve optimize ediliyor...
              </p>
            </div>
          ) : hasImage ? (
            <div className="flex items-center justify-center w-full h-full p-2">
              <img
                src={effectiveUrl}
                alt={effectiveName}
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.15s ease-out',
                }}
                className="max-h-[520px] max-w-full w-auto object-contain rounded-lg shadow-xl bg-white select-none"
              />
            </div>
          ) : (
            /* RESİM OLMADIĞINDA ÇOK TEMİZ VE ŞIK YÜKLEME ALANI */
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-full min-h-[320px] border-2 border-dashed border-slate-800 hover:border-amber-500/60 rounded-xl flex flex-col items-center justify-center text-center p-6 sm:p-10 cursor-pointer transition-all hover:bg-slate-900/40 group select-none"
            >
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-105 group-hover:bg-amber-500/20 transition-all">
                <FileImage className="w-8 h-8" />
              </div>

              <h4 className="text-sm sm:text-base font-black text-white mb-1.5 group-hover:text-amber-300 transition-colors">
                Teknik Çizim / Şema Resmi Yükleyin
              </h4>

              <p className="text-xs text-slate-400 max-w-md mb-4 leading-relaxed">
                PNG, JPG veya PDF formatında kendi orijinal teknik resminizi buraya yükleyebilir veya dosyayı doğrudan buraya sürükleyip bırakabilirsiniz.
              </p>

              <button
                type="button"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl flex items-center gap-1.5 transition-all shadow-md group-hover:shadow-amber-500/20"
              >
                <Upload className="w-4 h-4 text-slate-950" />
                <span>Dosya Seç / Resim Yükle</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
