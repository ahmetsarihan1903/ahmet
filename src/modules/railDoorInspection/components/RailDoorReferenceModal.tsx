import React from 'react';
import { RailLayoutPosition } from '../types';
import { RailDoorBlueprintSvg } from './RailDoorBlueprintSvg';
import { X } from 'lucide-react';

interface RailDoorReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  layoutPosition: RailLayoutPosition;
  activeCode?: string;
  onSelectCode?: (code: string) => void;
  measurementDefs?: any[];
}

export const RailDoorReferenceModal: React.FC<RailDoorReferenceModalProps> = ({
  isOpen,
  onClose,
  layoutPosition,
  activeCode,
  onSelectCode,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="rail-door-reference-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/40 backdrop-blur-[2px] animate-fadeIn cursor-pointer"
      onClick={onClose}
    >
      <div
        id="rail-door-reference-modal-card"
        className="relative bg-slate-900/90 border border-slate-700/80 backdrop-blur-md rounded-2xl p-2.5 sm:p-4 max-w-lg w-full shadow-2xl cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Kapat Butonu */}
        <button
          type="button"
          id="btn-close-reference-modal"
          onClick={onClose}
          className="absolute top-3 right-3 z-20 p-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-600 transition-colors cursor-pointer shadow-md"
          title="Kapat"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Sadece Kuyu Şeması Görseli */}
        <div className="w-full flex items-center justify-center">
          <RailDoorBlueprintSvg
            layout={layoutPosition}
            activeCode={activeCode}
            onSelectCode={onSelectCode}
          />
        </div>
      </div>
    </div>
  );
};
