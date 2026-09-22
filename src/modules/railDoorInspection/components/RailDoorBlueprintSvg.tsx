import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { RailLayoutPosition } from '../types';
import { LAYOUT_TITLES } from '../constants';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Upload,
  Trash2,
  X,
  ArrowLeft,
  Loader2,
  Image as ImageIcon,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { compressAndProcessImage } from '../../../utils/imageProcessor';
import { technicalDrawings } from '../../../data/technicalDrawings';

interface RailDoorBlueprintSvgProps {
  layout?: RailLayoutPosition;
  activeCode?: string;
  onSelectCode?: (code: string) => void;
  attachedPdfName?: string;
  attachedPdfDataUrl?: string;
  onPdfChange?: (name?: string, dataUrl?: string) => void;
  attachedImageName?: string;
  attachedImageUrl?: string;
  onImageChange?: (name?: string, url?: string) => void;
}

export const RailDoorBlueprintSvg: React.FC<RailDoorBlueprintSvgProps> = ({
  layout = 'CWT_SIDE_RIGHT',
  activeCode,
  onSelectCode,
  attachedPdfName,
  attachedPdfDataUrl,
  onPdfChange,
  attachedImageName,
  attachedImageUrl,
  onImageChange,
}) => {
  const [zoom, setZoom] = useState(1);
  const [fullZoom, setFullZoom] = useState(1);
  const [showFullModal, setShowFullModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDrawingMenu, setShowDrawingMenu] = useState(false);

  // ESC ile tam ekrandan çıkış
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowFullModal(false);
      }
    };
    if (showFullModal) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [showFullModal]);

  const defaultLayoutImageMap: Record<string, string> = {
    CWT_SIDE_RIGHT: '/teknik-cizimler/ag-yan-sag.jpg',
    CWT_SIDE_LEFT: '/teknik-cizimler/ag-yan-sol.png',
    CWT_REAR: '/teknik-cizimler/ag-arka.png',
    PISTON_SINGLE: '/teknik-cizimler/ag-yan-sag.jpg',
    PISTON_DOUBLE: '/teknik-cizimler/ag-arka.png',
  };

  const isCustomUploaded = Boolean(attachedImageUrl || attachedPdfDataUrl);
  const layoutTitle = LAYOUT_TITLES[layout] || 'Kuyu Yerleşimi';
  const currentImageName = attachedImageName || attachedPdfName || `${layoutTitle} Teknik Çizimi`;
  const currentImageUrl = attachedImageUrl || attachedPdfDataUrl || defaultLayoutImageMap[layout] || '/teknik-cizimler/ag-arka.png';

  const handleSelectBuiltInDrawing = (drawing: typeof technicalDrawings[0]) => {
    if (onImageChange) {
      onImageChange(drawing.title, drawing.src);
    }
    setShowDrawingMenu(false);
  };

  const handleFileProcess = async (file: File | Blob, customName?: string) => {
    setIsProcessing(true);
    try {
      const fileName = customName || (file instanceof File ? file.name : `${layoutTitle}_Cizimi.jpg`);
      // Arka planda güvenli sıkıştırma motoru
      const result = await compressAndProcessImage(file);

      if (onImageChange) onImageChange(fileName, result.dataUrl);
      if (onPdfChange) onPdfChange(fileName, result.dataUrl);
    } catch (err) {
      console.error('Görsel işleme hatası:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileProcess(file);
    e.target.value = '';
  };

  const handleClearImage = () => {
    if (onImageChange) onImageChange(undefined, undefined);
    if (onPdfChange) onPdfChange(undefined, undefined);
    setZoom(1);
    setFullZoom(1);
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-3 sm:p-4 text-center shadow-2xl relative overflow-hidden">
      {/* Basit ve Net Üst Başlık Çubuğu */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 mb-3 pb-2.5 border-b border-slate-800">
        <div className="flex items-center gap-2 text-left">
          <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-black text-white tracking-wide uppercase">
                {layoutTitle} Şeması
              </span>
              {isCustomUploaded ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  📁 Özel Proje Resmi Yüklü
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  📐 Orijinal Teknik Çizim (APK)
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {isCustomUploaded
                ? `Dosya: ${currentImageName}`
                : `${currentImageName} doğrudan APK hafızasından yüklenmiştir.`}
            </span>
          </div>
        </div>

        {/* Sade ve Karışıklıktan Uzak Butonlar */}
        <div className="flex items-center gap-2 shrink-0 self-stretch sm:self-auto justify-end relative">
          {/* Dahili APK Teknik Resimleri Seçme Butonu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDrawingMenu((prev) => !prev)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-bold transition cursor-pointer shadow-xs"
              title="APK İçindeki 5 Orijinal Teknik Çizimden Birini Seç"
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Dahili Çizimler</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showDrawingMenu ? 'rotate-180' : ''}`} />
            </button>

            {showDrawingMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 z-30 space-y-1 animate-fadeIn">
                <div className="px-2 py-1 text-[10px] font-black text-amber-400 uppercase tracking-wider border-b border-slate-800">
                  Dahili Çizim Seç (APK)
                </div>
                {technicalDrawings.map((drw) => (
                  <button
                    key={drw.id}
                    type="button"
                    onClick={() => handleSelectBuiltInDrawing(drw)}
                    className="w-full text-left px-2.5 py-1.5 text-xs text-slate-200 hover:text-white hover:bg-amber-500/20 rounded-lg transition flex items-center justify-between cursor-pointer"
                  >
                    <span className="font-bold truncate">{drw.title}</span>
                    <span className="text-[10px] text-slate-500 font-mono">1-Tık</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tekil Basit Dosya/Fotoğraf Yükleme Butonu */}
          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 text-xs font-black transition cursor-pointer shadow-md">
            <Upload className="w-3.5 h-3.5 text-slate-950" />
            <span>{isCustomUploaded ? 'Resmi Değiştir' : '📁 Özel Resim Ekle'}</span>
            <input
              type="file"
              accept="image/*,.svg,image/svg+xml,.pdf"
              className="hidden"
              onChange={handleImageUpload}
            />
          </label>

          {isCustomUploaded && (
            <button
              type="button"
              onClick={handleClearImage}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 text-xs font-bold transition cursor-pointer"
              title="Özel resmi kaldırıp standart teknik çizime dön"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Sıfırla</span>
            </button>
          )}

          {/* Zoom Araçları */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5">
            <button
              type="button"
              onClick={() => setZoom((prev) => Math.min(prev + 0.15, 2.5))}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
              title="Yakınlaştır"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setZoom((prev) => Math.max(prev - 0.15, 0.5))}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
              title="Uzaklaştır"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setZoom(1)}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
              title="Sıfırla"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Tam Ekran Butonu */}
          <button
            type="button"
            onClick={() => setShowFullModal(true)}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition cursor-pointer"
            title="Tam Ekran İncele"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Ana Görsel Alanı: Doğrudan Orijinal Dosya */}
      <div className="w-full overflow-auto p-2 sm:p-3 rounded-2xl border border-slate-800 bg-slate-950 flex items-center justify-center min-h-[340px] relative">
        {isProcessing && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center z-20 space-y-2">
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
            <span className="text-xs font-black text-white">Görsel işleniyor...</span>
          </div>
        )}

        <div className="relative w-full flex items-center justify-center p-2">
          <img
            src={currentImageUrl}
            alt={currentImageName || 'Teknik Çizim'}
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
              transition: 'transform 0.2s ease-out',
            }}
            className="max-h-[460px] w-auto object-contain rounded-xl bg-white shadow-2xl"
          />
        </div>
      </div>

      {/* Tam Ekran Modal (Portal ile) */}
      {showFullModal && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-md flex flex-col p-2 sm:p-4 animate-fadeIn select-none"
          onClick={() => setShowFullModal(false)}
        >
          {/* Üst Çubuk */}
          <div
            className="flex items-center justify-between gap-2 pb-2.5 mb-2 border-b border-slate-800 text-white bg-slate-900/90 p-3 rounded-2xl shadow-xl shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => {
                setShowFullModal(false);
                setFullZoom(1);
              }}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5 shadow-lg active:scale-95 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>← Geri Dön (Kapat)</span>
            </button>

            <div className="text-center hidden md:block">
              <h3 className="text-xs sm:text-sm font-black text-amber-400 uppercase tracking-wide">
                {layoutTitle} Çizimi - {currentImageName || 'Proje Resmi'}
              </h3>
            </div>

            <div className="flex items-center gap-1.5">
              <div className="flex items-center bg-slate-950 border border-slate-700 rounded-xl p-0.5">
                <button
                  type="button"
                  onClick={() => setFullZoom((prev) => Math.min(prev + 0.25, 3.5))}
                  className="p-1.5 text-slate-200 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
                  title="Yakınlaştır"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setFullZoom((prev) => Math.max(prev - 0.25, 0.4))}
                  className="p-1.5 text-slate-200 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
                  title="Uzaklaştır"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setFullZoom(1)}
                  className="p-1.5 text-slate-200 hover:text-white hover:bg-slate-800 rounded-lg transition text-[10px] font-bold px-2 cursor-pointer"
                  title="Sıfırla"
                >
                  100%
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowFullModal(false);
                  setFullZoom(1);
                }}
                className="p-1.5 bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition cursor-pointer"
                title="Kapat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Görsel Alanı */}
          <div className="flex-1 flex items-center justify-center p-2 overflow-auto relative">
            <div
              className="w-full h-full flex items-center justify-center cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={currentImageUrl}
                alt={currentImageName || 'Proje Görseli'}
                style={{
                  transform: `scale(${fullZoom})`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.15s ease-out',
                }}
                className="max-h-[82vh] max-w-full object-contain rounded-xl bg-white shadow-2xl"
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
