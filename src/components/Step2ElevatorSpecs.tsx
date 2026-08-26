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
    <div className="max-w-2xl mx-auto py-6 px-3 sm:px-4">
      <div className="bg-white rounded-xl p-5 sm:p-7 shadow-md border-2 border-slate-300">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between mb-5 pb-4 border-b-2 border-slate-200">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-black text-slate-800 hover:text-slate-950 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 border-2 border-slate-300 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Geri Dön (Adım 1)</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-orange-600 bg-orange-100 px-2 py-0.5 rounded border border-orange-300">
              ADIM 2 / 4
            </span>
            <span className="text-slate-400">•</span>
            <div className={`flex items-center gap-1.5 text-xs font-black px-2.5 py-1 rounded-lg border-2 ${
              isUnlocked ? 'bg-emerald-100 text-emerald-900 border-emerald-500' : 'bg-amber-100 text-amber-900 border-amber-500'
            }`}>
              {isUnlocked ? <Unlock className="w-3.5 h-3.5 text-emerald-700" /> : <Lock className="w-3.5 h-3.5 text-amber-700" />}
              <span className="uppercase tracking-wider">{isUnlocked ? 'Kilit Açıldı' : 'Kilitli'}</span>
            </div>
          </div>
        </div>

        <div className="mb-5">
          <h1 className="text-lg sm:text-xl font-black text-slate-950 tracking-tight">
            Asansör Özellikleri ve Kilit Doğrulama
          </h1>
          <p className="text-xs font-medium text-slate-600 mt-1">
            Denetimi başlatmak için aşağıdaki tüm alanları eksiksiz doldurunuz ve zorunlu onay kutularını işaretleyiniz.
          </p>
        </div>

        <div className="space-y-4">
          {/* 1. Asansör Tipi: [ MR ] / [ MRL ] */}
          <div className="bg-slate-50 p-4 rounded-xl border-2 border-slate-300">
            <label className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-2.5">
              1. Asansör Tipi Seçimi (Motor &amp; Şase Kontrollerini Belirler)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                id="btn-type-mr"
                onClick={() => onTypeChange('MR')}
                className={`py-3.5 px-3 rounded-lg font-black text-xs sm:text-sm transition-all flex flex-col items-center justify-center gap-0.5 border-2 cursor-pointer ${
                  elevatorType === 'MR'
                    ? 'bg-blue-600 text-white border-blue-800 shadow-md ring-2 ring-blue-300'
                    : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <span className="text-sm sm:text-base font-black tracking-wider">[ MR ]</span>
                <span className="text-[11px] font-bold opacity-90">Makine Daireli</span>
              </button>

              <button
                type="button"
                id="btn-type-mrl"
                onClick={() => onTypeChange('MRL')}
                className={`py-3.5 px-3 rounded-lg font-black text-xs sm:text-sm transition-all flex flex-col items-center justify-center gap-0.5 border-2 cursor-pointer ${
                  elevatorType === 'MRL'
                    ? 'bg-blue-600 text-white border-blue-800 shadow-md ring-2 ring-blue-300'
                    : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <span className="text-sm sm:text-base font-black tracking-wider">[ MRL ]</span>
                <span className="text-[11px] font-bold opacity-90">Makine Dairesiz</span>
              </button>
            </div>
            <p className="text-[11px] font-medium text-slate-600 mt-2">
              * Seçtiğiniz tipe göre Sayfa 3&apos;teki Motor / Şase denetim listesi otomatik filtrelenir.
            </p>
          </div>

          {/* 2. Seri Numarası */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 uppercase tracking-wider">
              <Hash className="w-4 h-4 text-blue-600" />
              <span>2. Asansör Seri Numarası</span>
              <span className="text-red-600 font-black">*</span>
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
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 uppercase tracking-wider">
              <Weight className="w-4 h-4 text-blue-600" />
              <span>3. Taşıma Kapasitesi (KG)</span>
              <span className="text-red-600 font-black">*</span>
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
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] text-slate-600 font-black uppercase tracking-wider">Hızlı Seçim:</span>
              {['320', '450', '630', '800', '1000', '1275', '1600'].map((kg) => (
                <button
                  key={kg}
                  type="button"
                  onClick={() => onCapacityChange(kg)}
                  className={`text-xs px-3 py-1 rounded-md border-2 transition-colors cursor-pointer font-black ${
                    capacityKg === kg
                      ? 'bg-blue-600 text-white border-blue-800 shadow-xs'
                      : 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {kg} kg
                </button>
              ))}
            </div>
          </div>

          {/* 4 & 5. Durak Sayısı & Kat Rumuz Başlangıcı */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border-2 border-slate-300">
            {/* 4. Durak Sayısı */}
            <div className="space-y-1">
              <label htmlFor="select-stop-count" className="block text-xs font-black text-slate-900 uppercase tracking-wider">
                4. Durak Sayısı (1 - 32)
              </label>
              <div className="relative">
                <select
                  id="select-stop-count"
                  value={stopCount}
                  onChange={(e) => onStopCountChange(Number(e.target.value))}
                  className="w-full appearance-none bg-white border-2 border-slate-300 rounded-lg p-2.5 text-sm font-bold text-slate-950 focus:outline-none focus:border-blue-600 cursor-pointer"
                >
                  {stopOptions.map((num) => (
                    <option key={num} value={num} className="bg-white text-slate-900">
                      {num} Durak
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-600 absolute right-3 top-3.5 pointer-events-none" />
              </div>
            </div>

            {/* 5. Kat Rumuz Başlangıcı */}
            <div className="space-y-1">
              <label htmlFor="select-floor-start" className="block text-xs font-black text-slate-900 uppercase tracking-wider">
                5. Kat Rumuz Başlangıcı (-6&apos;dan)
              </label>
              <div className="relative">
                <select
                  id="select-floor-start"
                  value={floorStart}
                  onChange={(e) => onFloorStartChange(Number(e.target.value))}
                  className="w-full appearance-none bg-white border-2 border-slate-300 rounded-lg p-2.5 text-sm font-bold text-slate-950 focus:outline-none focus:border-blue-600 cursor-pointer"
                >
                  {floorStartOptions.map((val) => (
                    <option key={val} value={val} className="bg-white text-slate-900">
                      {val < 0 ? `${val}. Kat (Bodrum ${Math.abs(val)})` : val === 0 ? '0 (Zemin Kat)' : `${val}. Kat`}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-600 absolute right-3 top-3.5 pointer-events-none" />
              </div>
            </div>

            {/* Dynamic Kat Matrisi Algoritması Info & Preview */}
            <div className="sm:col-span-2 pt-2.5 border-t-2 border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-slate-800 font-bold">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span>Kat Matrisi: 1.Durak = <strong className="text-blue-700">{floorMatrix[0]?.floorLabel}</strong> ... {stopCount}.Durak = <strong className="text-blue-700">{floorMatrix[floorMatrix.length - 1]?.floorLabel}</strong></span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMatrixPreview(!showMatrixPreview)}
                  className="text-xs text-blue-700 hover:text-blue-900 font-black underline cursor-pointer"
                >
                  {showMatrixPreview ? 'Gizle' : 'Tüm Kat Listesini Gör'}
                </button>
              </div>

              {showMatrixPreview && (
                <div className="mt-2.5 max-h-44 overflow-y-auto rounded-lg border-2 border-slate-300 bg-white p-2.5 text-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {floorMatrix.map((item) => (
                      <div key={item.stopIndex} className="p-2 bg-slate-50 rounded-md border border-slate-200 flex justify-between items-center">
                        <span className="font-bold text-slate-700">{item.stopIndex}. Durak:</span>
                        <span className="text-blue-700 font-black">{item.floorLabel}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mandatory Checkboxes 6 & 7 */}
          <div className="bg-amber-50 p-4 rounded-xl border-2 border-amber-400 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-amber-700" />
              <span>Zorunlu Başlangıç Onayları (Kilit Şartları)</span>
            </h3>

            {/* 6. Sistem Tarih/Saat Güncellemesi */}
            <button
              type="button"
              id="chk-datetime-update"
              onClick={onDateTimeConfirmToggle}
              className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all border-2 cursor-pointer ${
                isDateTimeConfirmed
                  ? 'bg-emerald-100 text-emerald-950 border-emerald-500 shadow-xs'
                  : 'bg-white text-slate-900 border-slate-300 hover:border-slate-400'
              }`}
            >
              {isDateTimeConfirmed ? (
                <CheckSquare className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <Square className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
              )}
              <div>
                <span className="text-xs sm:text-sm font-black block">
                  6. Sistem Tarih/Saat Güncellemesi Yapıldı
                </span>
                <span className="text-[11px] font-medium text-slate-700 leading-tight block mt-0.5">
                  Kumanda kartı ve dijital göstergelerdeki tarih/saat senkronizasyonunun doğruluğunu onaylıyorum.
                </span>
              </div>
            </button>

            {/* 7. Donanım Eşleştirme */}
            <button
              type="button"
              id="chk-hardware-match"
              onClick={onHardwareMatchToggle}
              className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all border-2 cursor-pointer ${
                isHardwareMatched
                  ? 'bg-emerald-100 text-emerald-950 border-emerald-500 shadow-xs'
                  : 'bg-white text-slate-900 border-slate-300 hover:border-slate-400'
              }`}
            >
              {isHardwareMatched ? (
                <CheckSquare className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <Square className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
              )}
              <div>
                <span className="text-xs sm:text-sm font-black block">
                  7. Donanım Eşleştirme ve Pano Uyumu Doğrulandı
                </span>
                <span className="text-[11px] font-medium text-slate-700 leading-tight block mt-0.5">
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
              className={`w-full py-4 px-5 rounded-lg font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md ${
                isUnlocked
                  ? 'bg-orange-500 hover:bg-orange-600 text-white border-2 border-orange-700 active:scale-[0.99] cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed border-2 border-slate-300 shadow-none'
              }`}
            >
              {isUnlocked ? (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  <span>DENETİMİ BAŞLAT (Süreyi Başlat)</span>
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  <span>DENETİMİ BAŞLAT (Kilitli)</span>
                </>
              )}
            </button>

            {/* Unlocking status checklist helper */}
            {!isUnlocked && (
              <div className="mt-3 p-3 bg-slate-50 rounded-lg border-2 border-slate-300 text-xs text-slate-700 space-y-1.5">
                <span className="font-black text-slate-900 text-[10px] uppercase tracking-wider block">Kilidin açılması için gerekenler:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs font-bold">
                  <span className={isSerialValid ? 'text-emerald-700' : 'text-amber-800'}>
                    {isSerialValid ? '✓' : '•'} Seri Numarası girilmeli
                  </span>
                  <span className={isCapacityValid ? 'text-emerald-700' : 'text-amber-800'}>
                    {isCapacityValid ? '✓' : '•'} Kapasite (KG) girilmeli
                  </span>
                  <span className={isDateTimeConfirmed ? 'text-emerald-700' : 'text-amber-800'}>
                    {isDateTimeConfirmed ? '✓' : '•'} 6. Madde Onayı (Tarih/Saat)
                  </span>
                  <span className={isHardwareMatched ? 'text-emerald-700' : 'text-amber-800'}>
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
