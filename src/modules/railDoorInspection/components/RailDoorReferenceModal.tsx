import React from 'react';
import { RailLayoutPosition } from '../types';
import { RailDoorBlueprintSvg } from './RailDoorBlueprintSvg';
import { X, Eye } from 'lucide-react';

interface RailDoorReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  layoutPosition: RailLayoutPosition;
  activeCode?: string;
  onSelectCode?: (code: string) => void;
  measurementDefs?: any[];
  attachedPdfName?: string;
  attachedPdfDataUrl?: string;
  onPdfChange?: (name?: string, dataUrl?: string) => void;
  attachedImageName?: string;
  attachedImageUrl?: string;
  onImageChange?: (name?: string, url?: string) => void;
}

export const RailDoorReferenceModal: React.FC<RailDoorReferenceModalProps> = ({
  isOpen,
  onClose,
  layoutPosition,
  activeCode,
  onSelectCode,
  attachedPdfName,
  attachedPdfDataUrl,
  onPdfChange,
  attachedImageName,
  attachedImageUrl,
  onImageChange,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="rail-door-reference-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-sm animate-fadeIn cursor-pointer overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="rail-door-reference-modal-card"
        className="relative bg-slate-900 border border-slate-700/80 rounded-2xl p-2 sm:p-4 max-w-4xl w-full shadow-2xl cursor-default my-auto max-h-[96vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Üst Başlık & Kapat Butonu */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-amber-400" />
            <span className="text-xs sm:text-sm font-black text-white tracking-wide uppercase">
              Kuyu Ölçü ve Teknik Çizim Referansı
            </span>
          </div>
          <button
            type="button"
            id="btn-close-reference-modal"
            onClick={onClose}
            className="p-1 sm:p-1.5 bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors cursor-pointer shadow flex items-center gap-1 text-xs font-bold px-2.5"
            title="Kapat"
          >
            <X className="w-4 h-4" />
            <span>Kapat</span>
          </button>
        </div>

        {/* Kuyu Şeması / Çizim Alanı */}
        <div className="w-full flex-1 overflow-y-auto">
          <RailDoorBlueprintSvg
            layout={layoutPosition}
            activeCode={activeCode}
            onSelectCode={onSelectCode}
            attachedPdfName={attachedPdfName}
            attachedPdfDataUrl={attachedPdfDataUrl}
            onPdfChange={onPdfChange}
            attachedImageName={attachedImageName}
            attachedImageUrl={attachedImageUrl}
            onImageChange={onImageChange}
          />
        </div>
      </div>
    </div>
  );
};
