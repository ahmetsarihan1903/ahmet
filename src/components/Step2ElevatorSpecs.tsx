import React, { useMemo, useState } from 'react';
import { Lock, Unlock, Play, ChevronDown, CheckSquare, Square, Layers, Hash, Weight, ArrowLeft, Info } from 'lucide-react';
import { ElevatorType } from '../types';
import { SmartTextInput } from './SmartTextInput';
import { calculateFloorMatrix } from '../utils/floorMatrix';

interface Step2ElevatorSpecsProps {
  elevatorType: ElevatorType;
  serialNumber: string;
  capacityKg: string;
  stopCount: number;
  floorStart: number;
  isDateTimeConfirmed: boolean;
  isHardwareMatched: boolean;
  onTypeChange: (type: ElevatorType) => void;
  onSerialChange: (val: string) => void;
  onCapacityChange: (val: string) => void;
  onStopCountChange: (count: number) => void;
  onFloorStartChange: (start: number) => void;
  onDateTimeConfirmToggle: () => void;
  onHardwareMatchToggle: () => void;
  onBack: () => void;
  onStartAudit: () => void;
}

export const Step2ElevatorSpecs: React.FC<Step2ElevatorSpecsProps> = ({
  elevatorType,
  serialNumber,
  capacityKg,
  stopCount,
  floorStart,
  isDateTimeConfirmed,
  isHardwareMatched,
  onTypeChange,
  onSerialChange,
  onCapacityChange,
  onStopCountChange,
  onFloorStartChange,
  onDateTimeConfirmToggle,
  onHardwareMatchToggle,
  onBack,
  onStartAudit,
}) => {
  const [showMatrixPreview, setShowMatrixPreview] = useState(false);

  // Stop dropdown array: 1 to 32
  const stopOptions = Array.from({ length: 32 }, (_, i) => i + 1);

  // Floor start dropdown options: -6 to 10
  const floorStartOptions = Array.from({ length: 17 }, (_, i) => i - 6);

  // Calculate live floor matrix preview
  const floorMatrix = useMemo(() => {
    return calculateFloorMatrix(stopCount, floorStart);
  }, [stopCount, floorStart]);

  // Validation rules for unlocking
  const isSerialValid = serialNumber.trim().length > 0;
  const isCapacityValid = capacityKg.trim().length > 0;
  const isTypeValid = elevatorType === 'MR' || elevatorType === 'MRL';
  const isStopCountValid = stopCount >= 1 && stopCount <= 32;
  const isCheckboxesValid = isDateTimeConfirmed && isHardwareMatched;

  const isUnlocked = isSerialValid && isCapacityValid && isTypeValid && isStopCountValid && isCheckboxesValid;

  return (
    <div className="max-w-2xl mx-auto py-5 px-3 sm:px-4">
      <div className="bg-slate-900 rounded-lg p-5 sm:p-6 shadow-2xl border border-slate-800">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between mb-5 pb-3.5 border-b border-slate-800">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Geri Dön (Adım 1)</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400">
              ADIM 2 / 4
            </span>
            <span className="text-slate-600">•</span>
            <div className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded border ${
              isUnlocked ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40' : 'bg-amber-500/20 text-amber-300 border-amber-400/40'
            }`}>
              {isUnlocked ? <Unlock className="w-3 h-3 text-emerald-400" /> : <Lock className="w-3 h-3 text-amber-400" />}
              <span className="uppercase tracking-wider">{isUnlocked ? 'Kilit Açıldı' : 'Kilitli'}</span>
            </div>
          </div>
        </div>

        <div className="mb-5">
          <h1 className="text-lg sm:text-xl font-bold text-slate-100 tracking-tight">
            Asansör Özellikleri ve Kilit Doğrulama
          </h1>
          <p className="text-[11px] text-slate-400 mt-1">
            Denetimi başlatmak için aşağıdaki tüm alanları eksiksiz doldurunuz ve zorunlu onay kutularını işaretleyiniz.
          </p>
        </div>

        <div className="space-y-4">
          {/* 1. Asansör Tipi: [ MR ] / [ MRL ] */}
          <div className="bg-slate-950 p-3.5 rounded border border-slate-800">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              1. Asansör Tipi Seçimi (Motor & Şase Kontrollerini Belirler)
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                id="btn-type-mr"
                onClick={() => onTypeChange('MR')}
                className={`py-3 px-3 rounded font-bold text-xs sm:text-sm transition-all flex flex-col items-center justify-center gap-0.5 border cursor-pointer ${
                  elevatorType === 'MR'
                    ? 'bg-blue-600 text-white border-blue-400 shadow-md ring-2 ring-blue-500/40'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500 hover:bg-slate-850'
                }`}
              >
                <span className="text-sm sm:text-base font-black tracking-wider">[ MR ]</span>
                <span className="text-[10px] font-medium opacity-90">Makine Daireli</span>
              </button>

              <button
                type="button"
                id="btn-type-mrl"
                onClick={() => onTypeChange('MRL')}
                className={`py-3 px-3 rounded font-bold text-xs sm:text-sm transition-all flex flex-col items-center justify-center gap-0.5 border cursor-pointer ${
                  elevatorType === 'MRL'
                    ? 'bg-blue-600 text-white border-blue-400 shadow-md ring-2 ring-blue-500/40'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500 hover:bg-slate-850'
                }`}
              >
                <span className="text-sm sm:text-base font-black tracking-wider">[ MRL ]</span>
                <span className="text-[10px] font-medium opacity-90">Makine Dairesiz</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5">
              * Seçtiğiniz tipe göre Sayfa 3&apos;teki Motor / Şase denetim listesi otomatik filtrelenir.
            </p>
          </div>

          {/* 2. Seri Numarası */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-300 uppercase tracking-wider">
              <Hash className="w-3.5 h-3.5 text-blue-400" />
              <span>2. Asansör Seri Numarası</span>
              <span className="text-orange-400 font-bold">*</span>
            </div>
            <SmartTextInput
              id="input-serial-number"
              value={serialNumber}
              onChange={onSerialChange}
              placeholder="Örn: BA-2026-8492"
              required
            />
          </div>

          {/* 3. Kapasite (KG) */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-300 uppercase tracking-wider">
              <Weight className="w-3.5 h-3.5 text-blue-400" />
              <span>3. Taşıma Kapasitesi (KG)</span>
              <span className="text-orange-400 font-bold">*</span>
            </div>
            <div className="flex gap-2 items-center">
              <div className="flex-1">
                <SmartTextInput
                  id="input-capacity-kg"
                  value={capacityKg}
                  onChange={onCapacityChange}
                  placeholder="Örn: 630 veya 800"
                  required
                />
              </div>
            </div>
            {/* Quick capacity tags */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Hızlı Seçim:</span>
              {['320', '450', '630', '800', '1000', '1275', '1600'].map((kg) => (
                <button
                  key={kg}
                  type="button"
                  onClick={() => onCapacityChange(kg)}
                  className={`text-xs px-2.5 py-1 rounded border transition-colors cursor-pointer ${
                    capacityKg === kg
                      ? 'bg-blue-600 text-white border-blue-400 font-bold shadow-xs'
                      : 'bg-slate-950 text-slate-300 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  {kg} kg
                </button>
              ))}
            </div>
          </div>

          {/* 4 & 5. Durak Sayısı & Kat Rumuz Başlangıcı */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950 p-3.5 rounded border border-slate-800">
            {/* 4. Durak Sayısı */}
            <div className="space-y-1">
              <label htmlFor="select-stop-count" className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                4. Durak Sayısı (1 - 32)
              </label>
              <div className="relative">
                <select
                  id="select-stop-count"
                  value={stopCount}
                  onChange={(e) => onStopCountChange(Number(e.target.value))}
                  className="w-full appearance-none bg-slate-900 border border-slate-700 rounded p-2.5 text-sm font-bold text-slate-100 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  {stopOptions.map((num) => (
                    <option key={num} value={num} className="bg-slate-900 text-white">
                      {num} Durak
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* 5. Kat Rumuz Başlangıcı */}
            <div className="space-y-1">
              <label htmlFor="select-floor-start" className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                5. Kat Rumuz Başlangıcı (-6&apos;dan)
              </label>
              <div className="relative">
                <select
                  id="select-floor-start"
                  value={floorStart}
                  onChange={(e) => onFloorStartChange(Number(e.target.value))}
                  className="w-full appearance-none bg-slate-900 border border-slate-700 rounded p-2.5 text-sm font-bold text-slate-100 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  {floorStartOptions.map((val) => (
                    <option key={val} value={val} className="bg-slate-900 text-white">
                      {val < 0 ? `${val}. Kat (Bodrum ${Math.abs(val)})` : val === 0 ? '0 (Zemin Kat)' : `${val}. Kat`}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Dynamic Kat Matrisi Algoritması Info & Preview */}
            <div className="sm:col-span-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold">
                  <Layers className="w-3.5 h-3.5 text-blue-400" />
                  <span>Kat Matrisi: 1.Durak = <strong className="text-white">{floorMatrix[0]?.floorLabel}</strong> ... {stopCount}.Durak = <strong className="text-white">{floorMatrix[floorMatrix.length - 1]?.floorLabel}</strong></span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMatrixPreview(!showMatrixPreview)}
                  className="text-xs text-blue-400 hover:text-blue-300 font-bold underline cursor-pointer"
                >
                  {showMatrixPreview ? 'Gizle' : 'Tüm Kat Listesini Gör'}
                </button>
              </div>

              {showMatrixPreview && (
                <div className="mt-2.5 max-h-44 overflow-y-auto rounded border border-slate-800 bg-slate-900 p-2 text-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {floorMatrix.map((item) => (
                      <div key={item.stopIndex} className="p-1.5 bg-slate-950 rounded border border-slate-800 flex justify-between items-center">
                        <span className="font-bold text-slate-400">{item.stopIndex}. Durak:</span>
                        <span className="text-blue-400 font-bold">{item.floorLabel}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mandatory Checkboxes 6 & 7 */}
          <div className="bg-amber-950/30 p-3.5 rounded border border-amber-500/40 space-y-2.5">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-amber-400" />
              <span>Zorunlu Başlangıç Onayları (Kilit Şartları)</span>
            </h3>

            {/* 6. Sistem Tarih/Saat Güncellemesi */}
            <button
              type="button"
              id="chk-datetime-update"
              onClick={onDateTimeConfirmToggle}
              className={`w-full flex items-start gap-2.5 p-2.5 rounded text-left transition-all border cursor-pointer ${
                isDateTimeConfirmed
                  ? 'bg-emerald-950/60 text-emerald-200 border-emerald-500'
                  : 'bg-slate-900 text-slate-200 border-slate-700 hover:border-slate-500'
              }`}
            >
              {isDateTimeConfirmed ? (
                <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <Square className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              )}
              <div>
                <span className="text-xs font-bold block">
                  6. Sistem Tarih/Saat Güncellemesi Yapıldı
                </span>
                <span className="text-[10px] text-slate-400 leading-tight block mt-0.5">
                  Kumanda kartı ve dijital göstergelerdeki tarih/saat senkronizasyonunun doğruluğunu onaylıyorum.
                </span>
              </div>
            </button>

            {/* 7. Donanım Eşleştirme */}
            <button
              type="button"
              id="chk-hardware-match"
              onClick={onHardwareMatchToggle}
              className={`w-full flex items-start gap-2.5 p-2.5 rounded text-left transition-all border cursor-pointer ${
                isHardwareMatched
                  ? 'bg-emerald-950/60 text-emerald-200 border-emerald-500'
                  : 'bg-slate-900 text-slate-200 border-slate-700 hover:border-slate-500'
              }`}
            >
              {isHardwareMatched ? (
                <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <Square className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              )}
              <div>
                <span className="text-xs font-bold block">
                  7. Donanım Eşleştirme ve Pano Uyumu Doğrulandı
                </span>
                <span className="text-[10px] text-slate-400 leading-tight block mt-0.5">
                  Asansör tipi, motor etiket değerleri ve pano yazılım parametrelerinin fiziksel eşleşmesini onaylıyorum.
                </span>
              </div>
            </button>
          </div>

          {/* DENETİMİ BAŞLAT Action Button */}
          <div className="pt-2">
            <button
              type="button"
              id="btn-start-audit"
              disabled={!isUnlocked}
              onClick={onStartAudit}
              className={`w-full py-3.5 px-5 rounded font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg ${
                isUnlocked
                  ? 'bg-orange-500 hover:bg-orange-400 text-white shadow-orange-500/20 active:scale-[0.99] cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700 shadow-none'
              }`}
            >
              {isUnlocked ? (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>DENETİMİ BAŞLAT (Süreyi Başlat)</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>DENETİMİ BAŞLAT (Kilitli)</span>
                </>
              )}
            </button>

            {/* Unlocking status checklist helper */}
            {!isUnlocked && (
              <div className="mt-2.5 p-2.5 bg-slate-950 rounded border border-slate-800 text-xs text-slate-400 space-y-1">
                <span className="font-bold text-slate-300 text-[10px] uppercase tracking-wider block">Kilidin açılması için gerekenler:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px]">
                  <span className={isSerialValid ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>
                    {isSerialValid ? '✓' : '•'} Seri Numarası girilmeli
                  </span>
                  <span className={isCapacityValid ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>
                    {isCapacityValid ? '✓' : '•'} Kapasite (KG) girilmeli
                  </span>
                  <span className={isDateTimeConfirmed ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>
                    {isDateTimeConfirmed ? '✓' : '•'} 6. Madde Onayı (Tarih/Saat)
                  </span>
                  <span className={isHardwareMatched ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>
                    {isHardwareMatched ? '✓' : '•'} 7. Madde Onayı (Donanım)
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
