import React, { useState } from 'react';
import { RailLayoutPosition } from '../types';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Upload, FileCode } from 'lucide-react';

interface RailDoorBlueprintSvgProps {
  layout: RailLayoutPosition;
  activeCode?: string;
  onSelectCode?: (code: string) => void;
}

export const RailDoorBlueprintSvg: React.FC<RailDoorBlueprintSvgProps> = ({
  layout,
  activeCode,
  onSelectCode,
}) => {
  const [zoom, setZoom] = useState(1);
  const [showFullModal, setShowFullModal] = useState(false);
  const [customDxfName, setCustomDxfName] = useState<string | null>(null);
  const [customDxfSvg, setCustomDxfSvg] = useState<string | null>(null);

  // Basit DXF Parselayıcı (LINE, LWPOLYLINE, TEXT, CIRCLE okur ve doğrudan SVG üretir)
  const handleDxfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCustomDxfName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      try {
        const svgContent = parseDxfToSvg(text);
        setCustomDxfSvg(svgContent);
      } catch (err) {
        console.error('DXF ayrıştırma hatası:', err);
      }
    };

    reader.readAsText(file);
  };

  // DXF -> SVG Dönüştürücü Fonksiyon
  const parseDxfToSvg = (dxfText: string): string => {
    const lines = dxfText.split(/\r\n|\r|\n/);
    const elements: string[] = [];

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    const updateBounds = (x: number, y: number) => {
      if (!isNaN(x) && !isNaN(y)) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    };

    let i = 0;
    while (i < lines.length) {
      const code = lines[i]?.trim();
      const val = lines[i + 1]?.trim();

      if (code === '0' && val === 'LINE') {
        let x1 = 0, y1 = 0, x2 = 0, y2 = 0;
        let layer = '0';
        let color = '#0f172a';

        i += 2;
        while (i < lines.length && lines[i]?.trim() !== '0') {
          const c = lines[i]?.trim();
          const v = lines[i + 1]?.trim();
          if (c === '8') layer = v;
          if (c === '10') x1 = parseFloat(v);
          if (c === '20') y1 = parseFloat(v);
          if (c === '11') x2 = parseFloat(v);
          if (c === '21') y2 = parseFloat(v);
          i += 2;
        }

        updateBounds(x1, y1);
        updateBounds(x2, y2);

        // Katmana göre veya kırmızı ölçü çizgisi
        if (layer.toLowerCase().includes('olcu') || layer.toLowerCase().includes('dim')) {
          color = '#ef4444';
        } else if (layer.toLowerCase().includes('aks') || layer.toLowerCase().includes('axis')) {
          color = '#ec4899';
        } else if (layer.toLowerCase().includes('ray') || layer.toLowerCase().includes('rail')) {
          color = '#0284c7';
        }

        elements.push(`<line x1="${x1}" y1="${-y1}" x2="${x2}" y2="${-y2}" stroke="${color}" stroke-width="1.5" />`);
        continue;
      } else if (code === '0' && (val === 'TEXT' || val === 'MTEXT')) {
        let textVal = '';
        let x = 0, y = 0, height = 12;

        i += 2;
        while (i < lines.length && lines[i]?.trim() !== '0') {
          const c = lines[i]?.trim();
          const v = lines[i + 1]?.trim();
          if (c === '1') textVal = v;
          if (c === '10') x = parseFloat(v);
          if (c === '20') y = parseFloat(v);
          if (c === '40') height = parseFloat(v) || 12;
          i += 2;
        }

        updateBounds(x, y);
        elements.push(`<text x="${x}" y="${-y}" font-size="${height * 1.2}" fill="#dc2626" font-weight="bold" text-anchor="middle">${textVal}</text>`);
        continue;
      } else if (code === '0' && val === 'CIRCLE') {
        let cx = 0, cy = 0, r = 5;
        i += 2;
        while (i < lines.length && lines[i]?.trim() !== '0') {
          const c = lines[i]?.trim();
          const v = lines[i + 1]?.trim();
          if (c === '10') cx = parseFloat(v);
          if (c === '20') cy = parseFloat(v);
          if (c === '40') r = parseFloat(v);
          i += 2;
        }

        updateBounds(cx - r, cy - r);
        updateBounds(cx + r, cy + r);
        elements.push(`<circle cx="${cx}" cy="${-cy}" r="${r}" stroke="#0f172a" fill="none" stroke-width="1.2" />`);
        continue;
      }

      i++;
    }

    if (minX === Infinity) {
      minX = 0; minY = 0; maxX = 500; maxY = 500;
    }

    const width = Math.max(100, maxX - minX);
    const height = Math.max(100, maxY - minY);
    const padding = 20;

    const viewBox = `${minX - padding} ${-maxY - padding} ${width + padding * 2} ${height + padding * 2}`;

    return `
      <svg viewBox="${viewBox}" className="w-full max-h-[440px] mx-auto bg-white rounded-lg shadow-inner">
        ${elements.join('\n')}
      </svg>
    `;
  };

  // AĞIRLIK ARKADA
  const renderRearSvg = () => (
    <svg
      viewBox="0 0 600 530"
      className="w-full max-h-[420px] sm:max-h-[460px] mx-auto select-none bg-white rounded-lg shadow-inner"
      style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', transition: 'transform 0.2s ease-out' }}
    >
      <defs>
        <pattern id="concreteHatch" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45 0 0)">
          <path d="M 0,0 L 0,12 M 6,0 L 6,12" stroke="#94a3b8" strokeWidth="1" />
          <circle cx="3" cy="3" r="0.75" fill="#64748b" />
          <circle cx="9" cy="9" r="0.75" fill="#64748b" />
        </pattern>
        <marker id="arrowhead-red" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
        </marker>
      </defs>

      <rect x="20" y="40" width="560" height="470" fill="url(#concreteHatch)" stroke="#334155" strokeWidth="2" />
      <rect x="80" y="80" width="440" height="380" fill="#ffffff" stroke="#000000" strokeWidth="2.5" />

      <text x="300" y="28" fill="#0f172a" fontSize="18" fontWeight="900" textAnchor="middle" letterSpacing="2">
        AĞIRLIK ARKADA
      </text>

      {/* Center Axes */}
      <line x1="300" y1="70" x2="300" y2="475" stroke="#ec4899" strokeWidth="1.5" strokeDasharray="8 4 2 4" />
      <line x1="140" y1="140" x2="460" y2="140" stroke="#ec4899" strokeWidth="1.2" strokeDasharray="8 4 2 4" />
      <line x1="70" y1="280" x2="530" y2="280" stroke="#ec4899" strokeWidth="1.2" strokeDasharray="8 4 2 4" />

      {/* REAR COUNTERWEIGHT RAILS */}
      <path d="M 125,110 L 145,110 L 145,133 L 205,133 L 205,147 L 145,147 L 145,170 L 125,170 Z" fill="#22d3ee" stroke="#0891b2" strokeWidth="2" />
      <path d="M 475,110 L 455,110 L 455,133 L 395,133 L 395,147 L 455,147 L 455,170 L 475,170 Z" fill="#22d3ee" stroke="#0891b2" strokeWidth="2" />

      {/* CABIN RAILS */}
      <path d="M 90,250 L 110,250 L 110,273 L 170,273 L 170,287 L 110,287 L 110,310 L 90,310 Z" fill="#22d3ee" stroke="#0891b2" strokeWidth="2" />
      <path d="M 510,250 L 490,250 L 490,273 L 430,273 L 430,287 L 490,287 L 490,310 L 510,310 Z" fill="#22d3ee" stroke="#0891b2" strokeWidth="2" />

      {/* DOOR AT BOTTOM */}
      <rect x="125" y="415" width="350" height="20" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />
      <rect x="165" y="420" width="30" height="26" fill="#f1f5f9" stroke="#0f172a" strokeWidth="1.5" />
      <rect x="405" y="420" width="30" height="26" fill="#f1f5f9" stroke="#0f172a" strokeWidth="1.5" />
      <line x1="165" y1="446" x2="435" y2="446" stroke="#0f172a" strokeWidth="2" />

      {/* 1 to 15 Dimensions */}
      <g className="cursor-pointer" onClick={() => onSelectCode?.('1')}>
        <line x1="120" y1="287" x2="120" y2="415" stroke="#ef4444" strokeWidth="1.5" markerStart="url(#arrowhead-red)" markerEnd="url(#arrowhead-red)" />
        <rect x="110" y="340" width="20" height="18" rx="4" fill={activeCode === '1' ? '#f59e0b' : '#2563eb'} />
        <text x="120" y="353" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">1</text>
      </g>
      <g className="cursor-pointer" onClick={() => onSelectCode?.('2')}>
        <line x1="470" y1="287" x2="470" y2="415" stroke="#ef4444" strokeWidth="1.5" markerStart="url(#arrowhead-red)" markerEnd="url(#arrowhead-red)" />
        <rect x="460" y="340" width="20" height="18" rx="4" fill={activeCode === '2' ? '#f59e0b' : '#2563eb'} />
        <text x="470" y="353" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">2</text>
      </g>
      <g className="cursor-pointer" onClick={() => onSelectCode?.('3')}>
        <line x1="155" y1="170" x2="155" y2="273" stroke="#ef4444" strokeWidth="1.5" markerStart="url(#arrowhead-red)" markerEnd="url(#arrowhead-red)" />
        <rect x="145" y="210" width="20" height="18" rx="4" fill={activeCode === '3' ? '#f59e0b' : '#2563eb'} />
        <text x="155" y="223" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">3</text>
      </g>
      <g className="cursor-pointer" onClick={() => onSelectCode?.('4')}>
        <line x1="445" y1="170" x2="445" y2="273" stroke="#ef4444" strokeWidth="1.5" markerStart="url(#arrowhead-red)" markerEnd="url(#arrowhead-red)" />
        <rect x="435" y="210" width="20" height="18" rx="4" fill={activeCode === '4' ? '#f59e0b' : '#2563eb'} />
        <text x="445" y="223" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">4</text>
      </g>
      <g className="cursor-pointer" onClick={() => onSelectCode?.('5')}>
        <line x1="430" y1="280" x2="165" y2="446" stroke="#ef4444" strokeWidth="1.2" markerStart="url(#arrowhead-red)" markerEnd="url(#arrowhead-red)" />
        <rect x="345" y="360" width="20" height="18" rx="4" fill={activeCode === '5' ? '#f59e0b' : '#2563eb'} />
        <text x="355" y="373" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">5</text>
      </g>
      <g className="cursor-pointer" onClick={() => onSelectCode?.('6')}>
        <line x1="170" y1="280" x2="405" y2="446" stroke="#ef4444" strokeWidth="1.2" markerStart="url(#arrowhead-red)" markerEnd="url(#arrowhead-red)" />
        <rect x="235" y="360" width="20" height="18" rx="4" fill={activeCode === '6' ? '#f59e0b' : '#2563eb'} />
        <text x="245" y="373" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">6</text>
      </g>
      <g className="cursor-pointer" onClick={() => onSelectCode?.('7')}>
        <line x1="170" y1="260" x2="430" y2="260" stroke="#ef4444" strokeWidth="1.5" markerStart="url(#arrowhead-red)" markerEnd="url(#arrowhead-red)" />
        <rect x="290" y="250" width="20" height="20" rx="4" fill={activeCode === '7' ? '#f59e0b' : '#2563eb'} />
        <text x="300" y="264" fill="#ffffff" fontSize="12" fontWeight="bold" textAnchor="middle">7</text>
      </g>
      <g className="cursor-pointer" onClick={() => onSelectCode?.('8')}>
        <line x1="205" y1="120" x2="395" y2="120" stroke="#ef4444" strokeWidth="1.5" markerStart="url(#arrowhead-red)" markerEnd="url(#arrowhead-red)" />
        <rect x="290" y="110" width="20" height="20" rx="4" fill={activeCode === '8' ? '#f59e0b' : '#2563eb'} />
        <text x="300" y="124" fill="#ffffff" fontSize="12" fontWeight="bold" textAnchor="middle">8</text>
      </g>
      <g className="cursor-pointer" onClick={() => onSelectCode?.('9')}>
        <line x1="285" y1="490" x2="315" y2="490" stroke="#ef4444" strokeWidth="1.5" markerStart="url(#arrowhead-red)" markerEnd="url(#arrowhead-red)" />
        <rect x="290" y="495" width="20" height="18" rx="4" fill={activeCode === '9' ? '#f59e0b' : '#2563eb'} />
        <text x="300" y="508" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">9</text>
      </g>
      <g className="cursor-pointer" onClick={() => onSelectCode?.('10')}>
        <line x1="180" y1="80" x2="180" y2="133" stroke="#ef4444" strokeWidth="1.5" markerStart="url(#arrowhead-red)" markerEnd="url(#arrowhead-red)" />
        <line x1="420" y1="80" x2="420" y2="133" stroke="#ef4444" strokeWidth="1.5" markerStart="url(#arrowhead-red)" markerEnd="url(#arrowhead-red)" />
        <rect x="170" y="95" width="22" height="18" rx="4" fill={activeCode === '10' ? '#f59e0b' : '#2563eb'} />
        <text x="181" y="108" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">10</text>
        <rect x="410" y="95" width="22" height="18" rx="4" fill={activeCode === '10' ? '#f59e0b' : '#2563eb'} />
        <text x="421" y="108" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">10</text>
      </g>
      <g className="cursor-pointer" onClick={() => onSelectCode?.('11')}>
        <line x1="170" y1="280" x2="395" y2="140" stroke="#ef4444" strokeWidth="1.2" markerStart="url(#arrowhead-red)" markerEnd="url(#arrowhead-red)" />
        <rect x="305" y="180" width="22" height="18" rx="4" fill={activeCode === '11' ? '#f59e0b' : '#2563eb'} />
        <text x="316" y="193" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">11</text>
      </g>
      <g className="cursor-pointer" onClick={() => onSelectCode?.('12')}>
        <line x1="430" y1="280" x2="205" y2="140" stroke="#ef4444" strokeWidth="1.2" markerStart="url(#arrowhead-red)" markerEnd="url(#arrowhead-red)" />
        <rect x="255" y="180" width="22" height="18" rx="4" fill={activeCode === '12' ? '#f59e0b' : '#2563eb'} />
        <text x="266" y="193" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">12</text>
      </g>
      <g className="cursor-pointer" onClick={() => onSelectCode?.('13')}>
        <line x1="80" y1="465" x2="165" y2="465" stroke="#ef4444" strokeWidth="1.5" markerStart="url(#arrowhead-red)" markerEnd="url(#arrowhead-red)" />
        <rect x="110" y="470" width="22" height="18" rx="4" fill={activeCode === '13' ? '#f59e0b' : '#2563eb'} />
        <text x="121" y="483" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">13</text>
      </g>
      <g className="cursor-pointer" onClick={() => onSelectCode?.('14')}>
        <line x1="435" y1="465" x2="520" y2="465" stroke="#ef4444" strokeWidth="1.5" markerStart="url(#arrowhead-red)" markerEnd="url(#arrowhead-red)" />
        <rect x="465" y="470" width="22" height="18" rx="4" fill={activeCode === '14' ? '#f59e0b' : '#2563eb'} />
        <text x="476" y="483" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">14</text>
      </g>
      <g className="cursor-pointer" onClick={() => onSelectCode?.('15')}>
        <line x1="260" y1="415" x2="260" y2="435" stroke="#ef4444" strokeWidth="1.5" markerStart="url(#arrowhead-red)" markerEnd="url(#arrowhead-red)" />
        <rect x="250" y="415" width="20" height="16" rx="4" fill={activeCode === '15' ? '#f59e0b' : '#2563eb'} />
        <text x="260" y="427" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">15</text>
      </g>
    </svg>
  );

  // AĞIRLIK YANDA (SAĞDA)
  const renderRightSvg = () => (
    <svg
      viewBox="0 0 600 530"
      className="w-full max-h-[420px] sm:max-h-[460px] mx-auto select-none bg-white rounded-lg shadow-inner"
      style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', transition: 'transform 0.2s ease-out' }}
    >
      <defs>
        <pattern id="concreteHatchR" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45 0 0)">
          <path d="M 0,0 L 0,12 M 6,0 L 6,12" stroke="#94a3b8" strokeWidth="1" />
          <circle cx="3" cy="3" r="0.75" fill="#64748b" />
        </pattern>
        <marker id="arrowhead-red-r" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
        </marker>
      </defs>

      <rect x="20" y="40" width="560" height="470" fill="url(#concreteHatchR)" stroke="#334155" strokeWidth="2" />
      <rect x="80" y="80" width="440" height="380" fill="#ffffff" stroke="#000000" strokeWidth="2.5" />

      <text x="300" y="28" fill="#0f172a" fontSize="18" fontWeight="900" textAnchor="middle" letterSpacing="2">
        AĞIRLIK YANDA ( SAĞDA )
      </text>

      {/* Center Axes */}
      <line x1="225" y1="70" x2="225" y2="475" stroke="#ec4899" strokeWidth="1.5" strokeDasharray="8 4 2 4" />
      <line x1="70" y1="245" x2="400" y2="245" stroke="#ec4899" strokeWidth="1.2" strokeDasharray="8 4 2 4" />
      <line x1="455" y1="100" x2="455" y2="390" stroke="#ec4899" strokeWidth="1.2" strokeDasharray="8 4 2 4" />

      {/* CABIN RAILS */}
      <path d="M 90,220 L 110,220 L 110,240 L 150,240 L 150,254 L 110,254 L 110,274 L 90,274 Z" fill="#22d3ee" stroke="#0891b2" strokeWidth="2" />
      <path d="M 390,220 L 370,220 L 370,240 L 330,240 L 330,254 L 370,254 L 370,274 L 390,274 Z" fill="#22d3ee" stroke="#0891b2" strokeWidth="2" />

      {/* RIGHT CWT RAILS */}
      <path d="M 430,110 L 485,110 L 485,130 L 460,130 L 460,160 L 448,160 L 448,130 L 430,130 Z" fill="#22d3ee" stroke="#0891b2" strokeWidth="2" />
      <path d="M 430,360 L 485,360 L 485,340 L 460,340 L 460,310 L 448,310 L 448,340 L 430,340 Z" fill="#22d3ee" stroke="#0891b2" strokeWidth="2" />

      {/* DOOR AT BOTTOM */}
      <rect x="110" y="415" width="240" height="20" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />
      <rect x="135" y="420" width="25" height="26" fill="#f1f5f9" stroke="#0f172a" strokeWidth="1.5" />
      <rect x="300" y="420" width="25" height="26" fill="#f1f5f9" stroke="#0f172a" strokeWidth="1.5" />

      {/* Red Measurements 1-15 */}
      <g className="cursor-pointer" onClick={() => onSelectCode?.('1')}>
        <line x1="110" y1="254" x2="110" y2="415" stroke="#ef4444" strokeWidth="1.5" markerStart="url(#arrowhead-red-r)" markerEnd="url(#arrowhead-red-r)" />
        <rect x="100" y="325" width="20" height="18" rx="4" fill={activeCode === '1' ? '#f59e0b' : '#2563eb'} />
        <text x="110" y="338" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">1</text>
      </g>
      <g className="cursor-pointer" onClick={() => onSelectCode?.('2')}>
        <line x1="365" y1="254" x2="365" y2="415" stroke="#ef4444" strokeWidth="1.5" markerStart="url(#arrowhead-red-r)" markerEnd="url(#arrowhead-red-r)" />
        <rect x="355" y="325" width="20" height="18" rx="4" fill={activeCode === '2' ? '#f59e0b' : '#2563eb'} />
        <text x="365" y="338" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">2</text>
      </g>
      <g className="cursor-pointer" onClick={() => onSelectCode?.('3')}>
        <line x1="440" y1="360" x2="440" y2="415" stroke="#ef4444" strokeWidth="1.5" markerStart="url(#arrowhead-red-r)" markerEnd="url(#arrowhead-red-r)" />
        <rect x="430" y="380" width="20" height="18" rx="4" fill={activeCode === '3' ? '#f59e0b' : '#2563eb'} />
        <text x="440" y="393" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">3</text>
      </g>
      <g className="cursor-pointer" onClick={() => onSelectCode?.('4')}>
        <line x1="455" y1="95" x2="520" y2="95" stroke="#ef4444" strokeWidth="1.5" markerStart="url(#arrowhead-red-r)" markerEnd="url(#arrowhead-red-r)" />
        <line x1="455" y1="380" x2="520" y2="380" stroke="#ef4444" strokeWidth="1.5" markerStart="url(#arrowhead-red-r)" markerEnd="url(#arrowhead-red-r)" />
        <rect x="475" y="85" width="20" height="18" rx="4" fill={activeCode === '4' ? '#f59e0b' : '#2563eb'} />
        <text x="485" y="98" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">4</text>
      </g>
      <g className="cursor-pointer" onClick={() => onSelectCode?.('5')}>
        <line x1="330" y1="245" x2="135" y2="446" stroke="#ef4444" strokeWidth="1.2" markerStart="url(#arrowhead-red-r)" markerEnd="url(#arrowhead-red-r)" />
        <rect x="230" y="335" width="20" height="18" rx="4" fill={activeCode === '5' ? '#f59e0b' : '#2563eb'} />
        <text x="240" y="348" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">5</text>
      </g>
      <g className="cursor-pointer" onClick={() => onSelectCode?.('6')}>
        <line x1="150" y1="245" x2="300" y2="446" stroke="#ef4444" strokeWidth="1.2" markerStart="url(#arrowhead-red-r)" markerEnd="url(#arrowhead-red-r)" />
        <rect x="180" y="325" width="20" height="18" rx="4" fill={activeCode === '6' ? '#f59e0b' : '#2563eb'} />
        <text x="190" y="338" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">6</text>
      </g>
      <g className="cursor-pointer" onClick={() => onSelectCode?.('7')}>
        <line x1="150" y1="225" x2="330" y2="225" stroke="#ef4444" strokeWidth="1.5" markerStart="url(#arrowhead-red-r)" markerEnd="url(#arrowhead-red-r)" />
        <rect x="230" y="215" width="20" height="20" rx="4" fill={activeCode === '7' ? '#f59e0b' : '#2563eb'} />
        <text x="240" y="229" fill="#ffffff" fontSize="12" fontWeight="bold" textAnchor="middle">7</text>
      </g>
      <g className="cursor-pointer" onClick={() => onSelectCode?.('8')}>
        <line x1="485" y1="160" x2="485" y2="310" stroke="#ef4444" strokeWidth="1.5" markerStart="url(#arrowhead-red-r)" markerEnd="url(#arrowhead-red-r)" />
        <rect x="475" y="225" width="20" height="20" rx="4" fill={activeCode === '8' ? '#f59e0b' : '#2563eb'} />
        <text x="485" y="239" fill="#ffffff" fontSize="12" fontWeight="bold" textAnchor="middle">8</text>
      </g>
      <g className="cursor-pointer" onClick={() => onSelectCode?.('9')}>
        <line x1="210" y1="490" x2="240" y2="490" stroke="#ef4444" strokeWidth="1.5" markerStart="url(#arrowhead-red-r)" markerEnd="url(#arrowhead-red-r)" />
        <rect x="215" y="495" width="20" height="18" rx="4" fill={activeCode === '9' ? '#f59e0b' : '#2563eb'} />
        <text x="225" y="508" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">9</text>
      </g>
      <g className="cursor-pointer" onClick={() => onSelectCode?.('10')}>
        <line x1="390" y1="245" x2="455" y2="245" stroke="#ef4444" strokeWidth="1.5" markerStart="url(#arrowhead-red-r)" markerEnd="url(#arrowhead-red-r)" />
        <rect x="410" y="235" width="22" height="18" rx="4" fill={activeCode === '10' ? '#f59e0b' : '#2563eb'} />
        <text x="421" y="248" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">10</text>
      </g>
      <g className="cursor-pointer" onClick={() => onSelectCode?.('11')}>
        <line x1="440" y1="80" x2="440" y2="130" stroke="#ef4444" strokeWidth="1.5" markerStart="url(#arrowhead-red-r)" markerEnd="url(#arrowhead-red-r)" />
        <rect x="430" y="140" width="22" height="18" rx="4" fill={activeCode === '11' ? '#f59e0b' : '#2563eb'} />
        <text x="441" y="153" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">11</text>
      </g>
      <g className="cursor-pointer" onClick={() => onSelectCode?.('12')}>
        <line x1="125" y1="80" x2="125" y2="220" stroke="#ef4444" strokeWidth="1.5" markerStart="url(#arrowhead-red-r)" markerEnd="url(#arrowhead-red-r)" />
        <line x1="355" y1="80" x2="355" y2="220" stroke="#ef4444" strokeWidth="1.5" markerStart="url(#arrowhead-red-r)" markerEnd="url(#arrowhead-red-r)" />
        <rect x="115" y="140" width="22" height="18" rx="4" fill={activeCode === '12' ? '#f59e0b' : '#2563eb'} />
        <text x="126" y="153" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">12</text>
      </g>
      <g className="cursor-pointer" onClick={() => onSelectCode?.('13')}>
        <line x1="80" y1="465" x2="135" y2="465" stroke="#ef4444" strokeWidth="1.5" markerStart="url(#arrowhead-red-r)" markerEnd="url(#arrowhead-red-r)" />
        <rect x="95" y="470" width="22" height="18" rx="4" fill={activeCode === '13' ? '#f59e0b' : '#2563eb'} />
        <text x="106" y="483" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">13</text>
      </g>
      <g className="cursor-pointer" onClick={() => onSelectCode?.('14')}>
        <line x1="300" y1="465" x2="520" y2="465" stroke="#ef4444" strokeWidth="1.5" markerStart="url(#arrowhead-red-r)" markerEnd="url(#arrowhead-red-r)" />
        <rect x="390" y="470" width="22" height="18" rx="4" fill={activeCode === '14' ? '#f59e0b' : '#2563eb'} />
        <text x="401" y="483" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">14</text>
      </g>
      <g className="cursor-pointer" onClick={() => onSelectCode?.('15')}>
        <line x1="180" y1="415" x2="180" y2="435" stroke="#ef4444" strokeWidth="1.5" markerStart="url(#arrowhead-red-r)" markerEnd="url(#arrowhead-red-r)" />
        <rect x="170" y="415" width="20" height="16" rx="4" fill={activeCode === '15' ? '#f59e0b' : '#2563eb'} />
        <text x="180" y="427" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">15</text>
      </g>
    </svg>
  );

  // AĞIRLIK YANDA (SOLDA) - YÜKLENEN PDF ÇİZİMİ BİREBİR VEKTÖREL ŞABLON
  const renderLeftSvg = () => (
    <svg
      viewBox="0 0 600 700"
      className="w-full max-h-[460px] sm:max-h-[520px] mx-auto select-none bg-white rounded-lg shadow-inner"
      style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', transition: 'transform 0.2s ease-out' }}
    >
      <defs>
        <pattern id="concreteHatchLeft" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45 0 0)">
          <path d="M 0,0 L 0,12 M 6,0 L 6,12" stroke="#cbd5e1" strokeWidth="1" />
          <circle cx="3" cy="3" r="0.7" fill="#94a3b8" />
          <circle cx="9" cy="9" r="0.7" fill="#94a3b8" />
        </pattern>
        <marker id="arrow-red-l" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
        </marker>
        <marker id="arrow-red-rev-l" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M 10 0 L 0 5 L 10 10 z" fill="#ef4444" />
        </marker>
      </defs>

      {/* Dış Beton Kuyu Duvarı */}
      <rect x="25" y="30" width="550" height="640" fill="url(#concreteHatchLeft)" stroke="#334155" strokeWidth="2.5" />
      {/* İç Kuyu Boşluğu */}
      <rect x="70" y="75" width="460" height="550" fill="#ffffff" stroke="#000000" strokeWidth="2.5" />

      {/* Eksen Çizgileri (Magenta / Pembe Kesikli Çizgiler) */}
      {/* Kabin DBG Yatay Ekseni */}
      <line x1="180" y1="330" x2="490" y2="330" stroke="#d946ef" strokeWidth="1.2" strokeDasharray="6 3 2 3" />
      {/* Kapı/Kuyu Dikey Merkezi Ekseni */}
      <line x1="365" y1="200" x2="365" y2="620" stroke="#d946ef" strokeWidth="1.2" strokeDasharray="6 3 2 3" />
      {/* Sol Ağırlık Rayları Dikey Ekseni */}
      <line x1="135" y1="90" x2="135" y2="440" stroke="#d946ef" strokeWidth="1.2" strokeDasharray="6 3 2 3" />

      {/* SOL DUVARDAKI 2 ADET AĞIRLIK RAYI (T-Profil Açık Mavi / Cyan) */}
      {/* 1. Arka Ağırlık Rayı (Üst Sol) */}
      <path d="M 105,110 L 165,110 L 165,120 L 140,120 L 140,160 L 130,160 L 130,120 L 105,120 Z" fill="#22d3ee" stroke="#0891b2" strokeWidth="2" />
      {/* 2. Ön Ağırlık Rayı (Alt Sol) */}
      <path d="M 105,370 L 165,370 L 165,380 L 140,380 L 140,420 L 130,420 L 130,380 L 105,380 Z" fill="#22d3ee" stroke="#0891b2" strokeWidth="2" />
      {/* Ağırlık Karkası Kesikli Çizgileri */}
      <line x1="110" y1="120" x2="110" y2="370" stroke="#0ea5e9" strokeWidth="1.2" strokeDasharray="4 3" />
      <line x1="140" y1="120" x2="140" y2="370" stroke="#0ea5e9" strokeWidth="1.2" strokeDasharray="4 3" />

      {/* KABİN RAYLARI (Sol ve Sağ Karşılıklı T-Profiller) */}
      {/* Sol Kabin Rayı */}
      <path d="M 205,305 L 205,355 L 217,355 L 217,335 L 255,335 L 255,325 L 217,325 L 217,305 Z" fill="#22d3ee" stroke="#0891b2" strokeWidth="2" />
      {/* Sağ Kabin Rayı */}
      <path d="M 495,305 L 495,355 L 483,355 L 483,335 L 445,335 L 445,325 L 483,325 L 483,305 Z" fill="#22d3ee" stroke="#0891b2" strokeWidth="2" />

      {/* ÖN KAPI KASASI / EŞİK VE SÖVELERİ (Alt Duvar) */}
      <rect x="270" y="585" width="220" height="40" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />
      {/* Sol Kapı Sövesi */}
      <rect x="268" y="595" width="30" height="30" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1.8" />
      {/* Sağ Kapı Sövesi */}
      <rect x="460" y="595" width="30" height="30" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1.8" />
      {/* Kapı Kanadı */}
      <line x1="298" y1="635" x2="245" y2="635" stroke="#334155" strokeWidth="3" />

      {/* ========================================================================= */}
      {/* 1 - 15 NUMARALI ÖLÇÜ OKLARI VE KUTUCUKLARI (PDF BİREBİR) */}
      {/* ========================================================================= */}

      {/* 1. ÖLÇÜ: Sol Kabin Rayı - Kapı Ön Mesafesi (Dikey) */}
      <g className="cursor-pointer" onClick={() => onSelectCode?.('1')}>
        <line x1="247" y1="335" x2="247" y2="585" stroke="#ef4444" strokeWidth="1.5" markerStart="url(#arrow-red-l)" markerEnd="url(#arrow-red-l)" />
        <line x1="150" y1="585" x2="260" y2="585" stroke="#ef4444" strokeWidth="0.8" />
        <rect x="236" y="445" width="22" height="20" rx="4" fill={activeCode === '1' ? '#f59e0b' : '#2563eb'} />
        <text x="247" y="460" fill="#ffffff" fontSize="12" fontWeight="bold" textAnchor="middle">1</text>
      </g>

      {/* 2. ÖLÇÜ: Sağ Kabin Rayı - Kapı Ön Mesafesi (Dikey) */}
      <g className="cursor-pointer" onClick={() => onSelectCode?.('2')}>
        <line x1="475" y1="335" x2="475" y2="585" stroke="#ef4444" strokeWidth="1.5" markerStart="url(#arrow-red-l)" markerEnd="url(#arrow-red-l)" />
        <rect x="464" y="445" width="22" height="20" rx="4" fill={activeCode === '2' ? '#f59e0b' : '#2563eb'} />
        <text x="475" y="460" fill="#ffffff" fontSize="12" fontWeight="bold" textAnchor="middle">2</text>
      </g>

      {/* 3. ÖLÇÜ: Ön Ağırlık Rayı - Ön Kuyu Duvarı Mesafesi (Dikey) */}
      <g className="cursor-pointer" onClick={() => onSelectCode?.('3')}>
        <line x1="150" y1="420" x2="150" y2="585" stroke="#ef4444" strokeWidth="1.5" markerStart="url(#arrow-red-l)" markerEnd="url(#arrow-red-l)" />
        <rect x="139" y="490" width="22" height="20" rx="4" fill={activeCode === '3' ? '#f59e0b' : '#2563eb'} />
        <text x="150" y="505" fill="#ffffff" fontSize="12" fontWeight="bold" textAnchor="middle">3</text>
      </g>

      {/* 4. ÖLÇÜ: Ağırlık Rayları - Sol Kuyu Duvarı (Yatay 2 adet) */}
      <g className="cursor-pointer" onClick={() => onSelectCode?.('4')}>
        <line x1="70" y1="100" x2="135" y2="100" stroke="#ef4444" strokeWidth="1.5" markerStart="url(#arrow-red-l)" markerEnd="url(#arrow-red-l)" />
        <rect x="92" y="85" width="22" height="18" rx="4" fill={activeCode === '4' ? '#f59e0b' : '#2563eb'} />
        <text x="103" y="99" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">4</text>
        <line x1="70" y1="430" x2="135" y2="430" stroke="#ef4444" strokeWidth="1.5" markerStart="url(#arrow-red-l)" markerEnd="url(#arrow-red-l)" />
        <rect x="92" y="435" width="22" height="18" rx="4" fill={activeCode === '4' ? '#f59e0b' : '#2563eb'} />
        <text x="103" y="449" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">4</text>
      </g>

      {/* 5. ÖLÇÜ: Sol Kapı Kasası - Sağ Kabin Rayı Çaprazı */}
      <g className="cursor-pointer" onClick={() => onSelectCode?.('5')}>
        <line x1="295" y1="595" x2="445" y2="335" stroke="#ef4444" strokeWidth="1.3" markerStart="url(#arrow-red-l)" markerEnd="url(#arrow-red-l)" />
        <rect x="330" y="470" width="22" height="20" rx="4" fill={activeCode === '5' ? '#f59e0b' : '#2563eb'} />
        <text x="341" y="485" fill="#ffffff" fontSize="12" fontWeight="bold" textAnchor="middle">5</text>
      </g>

      {/* 6. ÖLÇÜ: Sağ Kapı Kasası - Sol Kabin Rayı Çaprazı */}
      <g className="cursor-pointer" onClick={() => onSelectCode?.('6')}>
        <line x1="465" y1="595" x2="255" y2="335" stroke="#ef4444" strokeWidth="1.3" markerStart="url(#arrow-red-l)" markerEnd="url(#arrow-red-l)" />
        <rect x="385" y="450" width="22" height="20" rx="4" fill={activeCode === '6' ? '#f59e0b' : '#2563eb'} />
        <text x="396" y="465" fill="#ffffff" fontSize="12" fontWeight="bold" textAnchor="middle">6</text>
      </g>

      {/* 7. ÖLÇÜ: Kabin Ray Arası (DBG / Açıklık) (Yatay) */}
      <g className="cursor-pointer" onClick={() => onSelectCode?.('7')}>
        <line x1="255" y1="310" x2="445" y2="310" stroke="#ef4444" strokeWidth="1.5" markerStart="url(#arrow-red-l)" markerEnd="url(#arrow-red-l)" />
        <rect x="340" y="295" width="24" height="20" rx="4" fill={activeCode === '7' ? '#f59e0b' : '#2563eb'} />
        <text x="352" y="310" fill="#ffffff" fontSize="12" fontWeight="bold" textAnchor="middle">7</text>
      </g>

      {/* 8. ÖLÇÜ: Ağırlık Ray Arası DBG (Dikey) */}
      <g className="cursor-pointer" onClick={() => onSelectCode?.('8')}>
        <line x1="95" y1="160" x2="95" y2="370" stroke="#ef4444" strokeWidth="1.5" markerStart="url(#arrow-red-l)" markerEnd="url(#arrow-red-l)" />
        <rect x="84" y="255" width="22" height="20" rx="4" fill={activeCode === '8' ? '#f59e0b' : '#2563eb'} />
        <text x="95" y="270" fill="#ffffff" fontSize="12" fontWeight="bold" textAnchor="middle">8</text>
      </g>

      {/* 9. ÖLÇÜ: Kuyu / Kapı Eksen Kaçıklığı (Aks) (Yatay) */}
      <g className="cursor-pointer" onClick={() => onSelectCode?.('9')}>
        <line x1="365" y1="610" x2="385" y2="610" stroke="#ef4444" strokeWidth="1.5" markerStart="url(#arrow-red-l)" markerEnd="url(#arrow-red-l)" />
        <rect x="365" y="615" width="22" height="18" rx="4" fill={activeCode === '9' ? '#f59e0b' : '#2563eb'} />
        <text x="376" y="628" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">9</text>
      </g>

      {/* 10. ÖLÇÜ: Sol Kabin Ray Sırtı - Ağırlık Ray Ekseni Mesafesi (Yatay) */}
      <g className="cursor-pointer" onClick={() => onSelectCode?.('10')}>
        <line x1="135" y1="320" x2="205" y2="320" stroke="#ef4444" strokeWidth="1.5" markerStart="url(#arrow-red-l)" markerEnd="url(#arrow-red-l)" />
        <rect x="158" y="308" width="24" height="18" rx="4" fill={activeCode === '10' ? '#f59e0b' : '#2563eb'} />
        <text x="170" y="321" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">10</text>
      </g>

      {/* 11. ÖLÇÜ: Ön Ağırlık Rayı - Sol Kabin Rayı Mesafesi (Dikey) */}
      <g className="cursor-pointer" onClick={() => onSelectCode?.('11')}>
        <line x1="220" y1="335" x2="220" y2="420" stroke="#ef4444" strokeWidth="1.5" markerStart="url(#arrow-red-l)" markerEnd="url(#arrow-red-l)" />
        <line x1="165" y1="420" x2="235" y2="420" stroke="#ef4444" strokeWidth="0.8" strokeDasharray="3 3" />
        <rect x="208" y="365" width="24" height="18" rx="4" fill={activeCode === '11' ? '#f59e0b' : '#2563eb'} />
        <text x="220" y="378" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">11</text>
      </g>

      {/* 12. ÖLÇÜ: Kabin Rayları - Arka Kuyu Duvarı Mesafesi (Dikey 2 adet) */}
      <g className="cursor-pointer" onClick={() => onSelectCode?.('12')}>
        {/* Sol Kabin Rayı - Arka Duvar */}
        <line x1="237" y1="75" x2="237" y2="325" stroke="#ef4444" strokeWidth="1.5" markerStart="url(#arrow-red-l)" markerEnd="url(#arrow-red-l)" />
        <rect x="226" y="180" width="24" height="18" rx="4" fill={activeCode === '12' ? '#f59e0b' : '#2563eb'} />
        <text x="238" y="193" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">12</text>
        {/* Sağ Kabin Rayı - Arka Duvar */}
        <line x1="465" y1="75" x2="465" y2="325" stroke="#ef4444" strokeWidth="1.5" markerStart="url(#arrow-red-l)" markerEnd="url(#arrow-red-l)" />
        <rect x="454" y="220" width="24" height="18" rx="4" fill={activeCode === '12' ? '#f59e0b' : '#2563eb'} />
        <text x="466" y="233" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">12</text>
      </g>

      {/* 13. ÖLÇÜ: Sağ Kapı Kasası - Sağ Kuyu Duvarı Yan Boşluğu (Yatay) */}
      <g className="cursor-pointer" onClick={() => onSelectCode?.('13')}>
        <line x1="470" y1="650" x2="530" y2="650" stroke="#ef4444" strokeWidth="1.5" markerStart="url(#arrow-red-l)" markerEnd="url(#arrow-red-l)" />
        <line x1="470" y1="620" x2="470" y2="660" stroke="#ef4444" strokeWidth="0.8" />
        <line x1="530" y1="620" x2="530" y2="660" stroke="#ef4444" strokeWidth="0.8" />
        <rect x="488" y="640" width="24" height="18" rx="4" fill={activeCode === '13' ? '#f59e0b' : '#2563eb'} />
        <text x="500" y="653" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">13</text>
      </g>

      {/* 14. ÖLÇÜ: Sol Kuyu Duvarı - Kapı Eksen/Giriş Boşluğu (Yatay) */}
      <g className="cursor-pointer" onClick={() => onSelectCode?.('14')}>
        <line x1="70" y1="655" x2="295" y2="655" stroke="#ef4444" strokeWidth="1.5" markerStart="url(#arrow-red-l)" markerEnd="url(#arrow-red-l)" />
        <line x1="70" y1="620" x2="70" y2="665" stroke="#ef4444" strokeWidth="0.8" />
        <line x1="295" y1="620" x2="295" y2="665" stroke="#ef4444" strokeWidth="0.8" />
        <rect x="170" y="643" width="24" height="20" rx="4" fill={activeCode === '14' ? '#f59e0b' : '#2563eb'} />
        <text x="182" y="658" fill="#ffffff" fontSize="12" fontWeight="bold" textAnchor="middle">14</text>
      </g>

      {/* 15. ÖLÇÜ: Kapı Eşik Genişliği / Derinliği (Dikey) */}
      <g className="cursor-pointer" onClick={() => onSelectCode?.('15')}>
        <line x1="420" y1="585" x2="420" y2="625" stroke="#ef4444" strokeWidth="1.5" markerStart="url(#arrow-red-l)" markerEnd="url(#arrow-red-l)" />
        <rect x="409" y="593" width="22" height="18" rx="4" fill={activeCode === '15' ? '#f59e0b' : '#2563eb'} />
        <text x="420" y="606" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">15</text>
      </g>
    </svg>
  );

  let schemaTitle = 'AĞIRLIK ARKADA';
  if (layout === 'CWT_SIDE_RIGHT') schemaTitle = 'AĞIRLIK YANDA (SAĞDA)';
  if (layout === 'CWT_SIDE_LEFT') schemaTitle = 'AĞIRLIK YANDA (SOLDA)';
  if (layout === 'PISTON_SINGLE' || layout === 'PISTON_DOUBLE') schemaTitle = 'HİDROLİK ASANSÖR';

  return (
    <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-3 sm:p-4 text-center shadow-2xl relative overflow-hidden backdrop-blur-md">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2 text-left">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shrink-0" />
          <div>
            <span className="text-xs sm:text-sm font-black text-amber-400 tracking-wide uppercase block">
              {customDxfName ? `ÖZEL DXF ÇİZİMİ: ${customDxfName}` : schemaTitle}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              Resmi Teknik Kuyu Planı (1 - 15 Numaralı Ölçü Noktaları)
            </span>
          </div>
        </div>

        {/* Controls: DXF Yükle + Zoom & View */}
        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
          {/* DXF Dosyası Yükleme Butonu */}
          <label className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-xs font-bold transition cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">AutoCAD (.DXF) Yükle</span>
            <input
              type="file"
              accept=".dxf"
              className="hidden"
              onChange={handleDxfUpload}
            />
          </label>

          {customDxfSvg && (
            <button
              type="button"
              onClick={() => { setCustomDxfSvg(null); setCustomDxfName(null); }}
              className="p-1.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs transition"
              title="Varsayılana Dön"
            >
              Varsayılan
            </button>
          )}

          <button
            type="button"
            onClick={() => setZoom(prev => Math.min(prev + 0.15, 1.8))}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            title="Yakınlaştır"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoom(prev => Math.max(prev - 0.15, 0.7))}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            title="Uzaklaştır"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoom(1)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            title="Sıfırla"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setShowFullModal(true)}
            className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition"
            title="Büyük Ekran"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div className="w-full overflow-auto p-1 rounded-xl bg-slate-950/60 border border-slate-800">
        {customDxfSvg ? (
          <div
            dangerouslySetInnerHTML={{ __html: customDxfSvg }}
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', transition: 'transform 0.2s ease-out' }}
          />
        ) : (
          <>
            {layout === 'CWT_REAR' && renderRearSvg()}
            {layout === 'CWT_SIDE_RIGHT' && renderRightSvg()}
            {layout === 'CWT_SIDE_LEFT' && renderLeftSvg()}
            {(layout === 'PISTON_SINGLE' || layout === 'PISTON_DOUBLE') && renderRearSvg()}
          </>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-blue-600 inline-block text-[8px] text-white font-bold text-center leading-3">#</span>
          Numaralı ölçü kutucuklarına tıklayarak formdaki ilgili alana odaklanabilirsiniz.
        </span>
        <span className="text-amber-400/90 font-mono text-[10px]">Tolerans: ±1 mm</span>
      </div>

      {/* Fullscreen Zoom Modal */}
      {showFullModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col p-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-white">
            <h3 className="text-base font-black text-amber-400">{customDxfName || schemaTitle} - BÜYÜTÜLMÜŞ TEKNİK RESİM</h3>
            <button
              onClick={() => setShowFullModal(false)}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold"
            >
              Kapat ✕
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center p-2 overflow-auto">
            <div className="max-w-4xl w-full">
              {customDxfSvg ? (
                <div dangerouslySetInnerHTML={{ __html: customDxfSvg }} />
              ) : (
                <>
                  {layout === 'CWT_REAR' && renderRearSvg()}
                  {layout === 'CWT_SIDE_RIGHT' && renderRightSvg()}
                  {layout === 'CWT_SIDE_LEFT' && renderLeftSvg()}
                  {(layout === 'PISTON_SINGLE' || layout === 'PISTON_DOUBLE') && renderRearSvg()}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
