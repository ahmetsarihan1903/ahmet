import React from 'react';
import { Type, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface FontSizeControlProps {
  className?: string;
}

export const FontSizeControl: React.FC<FontSizeControlProps> = ({ className = '' }) => {
  const { fontScale, setFontScale, increaseFontSize, decreaseFontSize, resetFontSize } = useTheme();

  const presets = [
    { label: 'Standart', sub: 'Mevcut Punto', value: 100 },
    { label: 'Büyük', sub: '%110', value: 110 },
    { label: 'Çok Büyük', sub: '%120', value: 120 },
    { label: 'Ekstra Büyük', sub: '%130', value: 130 },
  ];

  return (
    <div
      className={`p-3.5 bg-slate-950 light:bg-slate-50 rounded-lg border border-slate-800 light:border-slate-200 ${className}`}
    >
      {/* Başlık & Mevcut Durum */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-black uppercase tracking-wider text-slate-300 light:text-slate-700 flex items-center gap-1.5">
          <Type className="w-3.5 h-3.5 text-orange-400 light:text-orange-600" />
          Yazı Boyutu (Punto Büyütme)
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 light:bg-slate-200 text-slate-300 light:text-slate-700 font-mono">
            %{fontScale} {fontScale === 100 ? '(Mevcut)' : ''}
          </span>
          {fontScale > 100 && (
            <button
              type="button"
              onClick={resetFontSize}
              title="Varsayılan puntoya dön"
              className="p-1 rounded bg-slate-800 light:bg-slate-200 hover:bg-slate-700 light:hover:bg-slate-300 text-slate-400 hover:text-slate-200 transition cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Hızlı Seçim Butonları (4 Kademe) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-2.5">
        {presets.map((preset) => {
          const isSelected = fontScale === preset.value;
          return (
            <button
              key={preset.value}
              type="button"
              onClick={() => setFontScale(preset.value)}
              className={`py-2 px-2 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                isSelected
                  ? 'bg-orange-600 text-white border-orange-500 shadow-md font-black scale-[1.02]'
                  : 'bg-slate-900 light:bg-white text-slate-300 light:text-slate-700 border-slate-800 light:border-slate-300 hover:border-slate-600 hover:bg-slate-850'
              }`}
            >
              <span className="text-xs font-bold leading-tight">{preset.label}</span>
              <span
                className={`text-[9px] mt-0.5 ${
                  isSelected ? 'text-orange-100 font-semibold' : 'text-slate-400 light:text-slate-500'
                }`}
              >
                {preset.sub}
              </span>
            </button>
          );
        })}
      </div>

      {/* İnce Ayar Kademeli Büyüt / Küçült Çubuğu */}
      <div className="flex items-center gap-2 p-2 bg-slate-900 light:bg-white rounded-lg border border-slate-800 light:border-slate-300">
        <button
          type="button"
          onClick={decreaseFontSize}
          disabled={fontScale <= 100}
          title="Yazı boyutunu küçült (Min %100)"
          className={`p-1.5 rounded-md flex items-center justify-center gap-1 text-xs font-bold transition-all ${
            fontScale <= 100
              ? 'opacity-30 cursor-not-allowed text-slate-400'
              : 'bg-slate-800 light:bg-slate-100 hover:bg-slate-700 text-slate-200 light:text-slate-800 cursor-pointer active:scale-95'
          }`}
        >
          <ZoomOut className="w-3.5 h-3.5" />
          <span className="text-[11px]">A-</span>
        </button>

        {/* Görsel Seviye Çubuğu */}
        <div className="flex-1 px-2 flex items-center gap-1.5">
          {[100, 110, 120, 130].map((level) => (
            <div
              key={level}
              onClick={() => setFontScale(level)}
              title={`%${level}`}
              className={`h-2 flex-1 rounded-full cursor-pointer transition-all ${
                fontScale >= level
                  ? 'bg-orange-500 shadow-xs'
                  : 'bg-slate-800 light:bg-slate-200 hover:bg-slate-700'
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={increaseFontSize}
          disabled={fontScale >= 130}
          title="Yazı boyutunu büyüt (Maks %130)"
          className={`p-1.5 rounded-md flex items-center justify-center gap-1 text-xs font-bold transition-all ${
            fontScale >= 130
              ? 'opacity-30 cursor-not-allowed text-slate-400'
              : 'bg-orange-600 hover:bg-orange-500 text-white cursor-pointer active:scale-95 shadow-xs'
          }`}
        >
          <span className="text-[11px]">A+</span>
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Canlı Önizleme Kutucuğu */}
      <div className="mt-2 p-2 bg-slate-900/60 light:bg-slate-100/80 rounded border border-slate-800/80 light:border-slate-300/80">
        <p className="text-[11px] text-slate-300 light:text-slate-700 leading-snug">
          👁️ <span className="font-bold">Canlı Önizleme:</span> Ray, kapı ve denetim ölçü maddeleri bu boyutta görüntülenecektir.
        </p>
      </div>
    </div>
  );
};
