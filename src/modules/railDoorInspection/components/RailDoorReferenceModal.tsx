import React from 'react';
import { RailLayoutPosition } from '../types';
import { UnifiedDrawingModal } from './UnifiedDrawingModal';
import { LAYOUT_TITLES, FIXED_LAYOUT_DRAWINGS } from '../constants';

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
  attachedImageName,
  attachedImageUrl,
  onImageChange,
}) => {
  const fixed = FIXED_LAYOUT_DRAWINGS[layoutPosition];
  const isCustom = Boolean(attachedImageUrl && !attachedImageUrl.startsWith('/teknik-cizimler/'));

  return (
    <UnifiedDrawingModal
      isOpen={isOpen}
      onClose={onClose}
      title="Kuyu Ölçü Referans Şeması"
      badge={LAYOUT_TITLES[layoutPosition] || layoutPosition}
      imageName={isCustom ? attachedImageName : undefined}
      imageUrl={isCustom ? attachedImageUrl : undefined}
      defaultImageName={fixed?.title}
      defaultImageUrl={fixed?.url}
      onImageChange={onImageChange}
    />
  );
};


