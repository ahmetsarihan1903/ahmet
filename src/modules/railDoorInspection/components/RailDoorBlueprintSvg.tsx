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
} from 'lucide-react';
import { compressAndProcessImage } from '../../../utils/imageProcessor';

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

  const currentImageName = attachedImageName || attachedPdfName;
  const currentImageUrl = attachedImageUrl || attachedPdfDataUrl;
  const layoutTitle = LAYOUT_TITLES[layout] || 'Kuyu Yerleşimi';

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

  // Dinamik Dahili SVG Şeması (Kullanıcı özel resim yüklemediğinde şema tipine göre çizilir)
  const renderBuiltInShaftSvg = () => {
    const isCwtRear = layout === 'CWT_REAR';
    const isCwtLeft = layout === 'CWT_SIDE_LEFT';
    const isCwtRight = layout === 'CWT_SIDE_RIGHT';
    const isHydraulic = layout === 'PISTON_SINGLE' || layout === 'PISTON_DOUBLE';

    return (
      <svg
        viewBox="0 0 540 500"
        className="w-full h-full select-none max-h-[440px]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="shaftGridPattern" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.5" />
          </pattern>
          <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
          </marker>
        </defs>

        {/* Arka Plan Izgara */}
        <rect width="540" height="500" fill="url(#shaftGridPattern)" />

        {/* KUYU DIŞ DUVARLARI (Betonarme Kuyu Kesiti) */}
        <rect x="30" y="30" width="480" height="440" fill="#0b1329" stroke="#334155" strokeWidth="4" rx="12" />
        <rect x="40" y="40" width="460" height="420" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" />

        {/* Kuyu Yön Başlıkları */}
        <text x="270" y="24" fill="#94a3b8" fontSize="11" fontWeight="900" textAnchor="middle" letterSpacing="2">KUYU ARKA DUVARI</text>
        <text x="270" y="492" fill="#94a3b8" fontSize="11" fontWeight="900" textAnchor="middle" letterSpacing="2">ÖN DUVAR / DURAK KAPISI</text>
        <text x="18" y="250" fill="#64748b" fontSize="10" fontWeight="bold" textAnchor="middle" transform="rotate(-90 18 250)">SOL DUVAR</text>
        <text x="522" y="250" fill="#64748b" fontSize="10" fontWeight="bold" textAnchor="middle" transform="rotate(90 522 250)">SAĞ DUVAR</text>

        {/* KABİN GÖVDESİ (Ortada) */}
        <rect
          x={isCwtRight ? "80" : isCwtLeft ? "160" : "100"}
          y={isCwtRear ? "150" : "110"}
          width={isCwtRear ? "340" : "300"}
          height={isCwtRear ? "250" : "280"}
          fill="#0f172a"
          stroke="#0284c7"
          strokeWidth="3"
          rx="6"
        />
        <text
          x={isCwtRight ? "230" : isCwtLeft ? "310" : "270"}
          y={isCwtRear ? "280" : "250"}
          fill="#38bdf8"
          fontSize="14"
          fontWeight="900"
          textAnchor="middle"
        >
          KABİN KARKASI
        </text>

        {/* KABİN RAYLARI (DBG Aksı) */}
        {/* Sol Kabin Rayı */}
        <path
          d={isCwtRight ? "M 75 235 L 85 240 L 85 260 L 75 265 Z" : isCwtLeft ? "M 155 235 L 165 240 L 165 260 L 155 265 Z" : "M 95 260 L 105 265 L 105 285 L 95 290 Z"}
          fill="#38bdf8"
          stroke="#0284c7"
          strokeWidth="1.5"
        />
        {/* Sağ Kabin Rayı */}
        <path
          d={isCwtRight ? "M 385 235 L 375 240 L 375 260 L 385 265 Z" : isCwtLeft ? "M 465 235 L 455 240 L 455 260 L 465 265 Z" : "M 445 260 L 435 265 L 435 285 L 445 290 Z"}
          fill="#38bdf8"
          stroke="#0284c7"
          strokeWidth="1.5"
        />

        {/* AĞIRLIK YERLEŞİMİ (Layout Tipine Göre Konumlanır) */}
        {isCwtRear && (
          /* Arkadan Ağırlık */
          <g>
            <rect x="140" y="55" width="260" height="48" fill="#1e293b" stroke="#f59e0b" strokeWidth="2.5" rx="4" />
            {/* Ağırlık Rayları */}
            <rect x="180" y="45" width="12" height="15" fill="#f59e0b" />
            <rect x="348" y="45" width="12" height="15" fill="#f59e0b" />
            <text x="270" y="85" fill="#f59e0b" fontSize="12" fontWeight="900" textAnchor="middle">
              KARŞI AĞIRLIK (ARKADA)
            </text>
          </g>
        )}

        {isCwtRight && (
          /* Sağdan Ağırlık */
          <g>
            <rect x="405" y="140" width="50" height="220" fill="#1e293b" stroke="#f59e0b" strokeWidth="2.5" rx="4" />
            {/* Ağırlık Rayları */}
            <rect x="420" y="125" width="20" height="12" fill="#f59e0b" />
            <rect x="420" y="363" width="20" height="12" fill="#f59e0b" />
            <text x="430" y="255" fill="#f59e0b" fontSize="11" fontWeight="900" textAnchor="middle" transform="rotate(90 430 255)">
              AĞIRLIK (SAĞDA)
            </text>
          </g>
        )}

        {isCwtLeft && (
          /* Soldan Ağırlık */
          <g>
            <rect x="85" y="140" width="50" height="220" fill="#1e293b" stroke="#f59e0b" strokeWidth="2.5" rx="4" />
            {/* Ağırlık Rayları */}
            <rect x="100" y="125" width="20" height="12" fill="#f59e0b" />
            <rect x="100" y="363" width="20" height="12" fill="#f59e0b" />
            <text x="110" y="255" fill="#f59e0b" fontSize="11" fontWeight="900" textAnchor="middle" transform="rotate(-90 110 255)">
              AĞIRLIK (SOLDA)
            </text>
          </g>
        )}

        {isHydraulic && (
          /* Hidrolik Piston */
          <g>
            <circle cx="95" cy="250" r="28" fill="#1e293b" stroke="#10b981" strokeWidth="3" />
            <circle cx="95" cy="250" r="14" fill="#10b981" />
            <text x="95" y="295" fill="#10b981" fontSize="10" fontWeight="bold" textAnchor="middle">PİSTON</text>
          </g>
        )}

        {/* ÖN KAPI AÇIKLIĞI VE KAPI KANATLARI */}
        <rect
          x={isCwtRight ? "120" : isCwtLeft ? "200" : "150"}
          y="420"
          width="220"
          height="35"
          fill="#1e1b4b"
          stroke="#818cf8"
          strokeWidth="2.5"
          rx="4"
        />
        <text
          x={isCwtRight ? "230" : isCwtLeft ? "310" : "260"}
          y="442"
          fill="#c7d2fe"
          fontSize="11"
          fontWeight="bold"
          textAnchor="middle"
        >
          OTOMATİK KAT KAPISI
        </text>

        {/* Aktif Ölçü Seçimi Vurgusu (activeCode) */}
        {activeCode && (
          <g>
            <rect x="42" y="44" width="130" height="26" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.5" rx="6" />
            <text x="107" y="61" fill="#f59e0b" fontSize="11" fontWeight="bold" textAnchor="middle">
              Seçili Ölçü: No {activeCode}
            </text>
          </g>
        )}
      </svg>
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-3 sm:p-4 text-center shadow-2xl relative overflow-hidden">
      {/* Basit ve Net Üst Başlık Çubuğu */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 mb-3 pb-2.5 border-b border-slate-800">
        <div className="flex items-center gap-2 text-left">
          <span className={`w-3 h-3 rounded-full ${currentImageUrl ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-black text-white tracking-wide uppercase">
                {layoutTitle} Şeması
              </span>
              {currentImageUrl ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  📁 Bu Şemaya Özel Resim Yüklü
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  📐 Dahili Standart Şema
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {currentImageUrl
                ? `Dosya: ${currentImageName || 'Özel Proje Çizimi'} (Sadece bu seçimde gösterilir)`
                : 'İsterseniz bu yerleşim için kendi teknik resminizi yükleyebilirsiniz'}
            </span>
          </div>
        </div>

        {/* Sade ve Karışıklıktan Uzak Butonlar */}
        <div className="flex items-center gap-2 shrink-0 self-stretch sm:self-auto justify-end">
          {/* Tekil Basit Dosya/Fotoğraf Yükleme Butonu */}
          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 text-xs font-black transition cursor-pointer shadow-md">
            <Upload className="w-3.5 h-3.5 text-slate-950" />
            <span>{currentImageUrl ? 'Resmi Değiştir' : '📁 Resim / Fotoğraf Ekle'}</span>
            <input
              type="file"
              accept="image/*,.svg,image/svg+xml,.pdf"
              className="hidden"
              onChange={handleImageUpload}
            />
          </label>

          {currentImageUrl && (
            <>
              {/* Resmi Kaldır Butonu */}
              <button
                type="button"
                onClick={handleClearImage}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 text-xs font-bold transition cursor-pointer"
                title="Bu şemanın özel resmini kaldırıp standart şemaya dön"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Kaldır</span>
              </button>

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
            </>
          )}
        </div>
      </div>

      {/* Ana Görsel / SVG Çizim Alanı */}
      <div className="w-full overflow-auto p-2 sm:p-3 rounded-2xl border border-slate-800 bg-slate-950 flex items-center justify-center min-h-[340px] relative">
        {isProcessing && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center z-20 space-y-2">
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
            <span className="text-xs font-black text-white">Görsel işleniyor...</span>
          </div>
        )}

        {currentImageUrl ? (
          <div className="relative w-full flex items-center justify-center p-2">
            <img
              src={currentImageUrl}
              alt={currentImageName || 'Proje Görseli'}
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'center center',
                transition: 'transform 0.2s ease-out',
              }}
              className="max-h-[460px] w-auto object-contain rounded-xl bg-white shadow-2xl"
            />
          </div>
        ) : (
          <div className="w-full flex flex-col items-center justify-center">
            {renderBuiltInShaftSvg()}
          </div>
        )}
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
              {currentImageUrl ? (
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
              ) : (
                <div className="max-w-2xl w-full p-4 bg-slate-900 rounded-2xl border border-slate-800">
                  {renderBuiltInShaftSvg()}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
