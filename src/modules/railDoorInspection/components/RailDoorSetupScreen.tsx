import React from 'react';
import {
  RailDoorInspectionFullData,
  RailElevatorMainType,
  RailLayoutPosition,
} from '../types';
import { calculateFloors, ELEVATOR_TYPE_CONFIGS } from '../constants';
import {
  Building2,
  Layers,
  ArrowRight,
  Hash,
  User,
  Wrench,
  MapPin,
  FileCheck2,
  Calendar,
  Sparkles,
  Info,
} from 'lucide-react';

interface RailDoorSetupScreenProps {
  data: RailDoorInspectionFullData;
  onChange: (updater: (prev: RailDoorInspectionFullData) => RailDoorInspectionFullData) => void;
  onStartInspection: () => void;
}

export const RailDoorSetupScreen: React.FC<RailDoorSetupScreenProps> = ({
  data,
  onChange,
  onStartInspection,
}) => {
  const currentFloors = calculateFloors(data.stopCount, data.startFloor);
  const selectedTypeConfig = ELEVATOR_TYPE_CONFIGS.find((c) => c.type === data.mainType) || ELEVATOR_TYPE_CONFIGS[0];

  const handleMainTypeChange = (newType: RailElevatorMainType) => {
    const config = ELEVATOR_TYPE_CONFIGS.find((c) => c.type === newType);
    const defaultLayout = config ? config.allowedLayouts[0].layout : 'CWT_REAR';

    onChange((prev) => {
      const activeImg = prev.layoutImages?.[defaultLayout];
      return {
        ...prev,
        mainType: newType,
        layoutPosition: defaultLayout,
        attachedImageName: activeImg?.imageName,
        attachedImageUrl: activeImg?.imageUrl,
      };
    });
  };

  const handleLayoutChange = (newLayout: RailLayoutPosition) => {
    onChange((prev) => {
      const activeImg = prev.layoutImages?.[newLayout];
      return {
        ...prev,
        layoutPosition: newLayout,
        attachedImageName: activeImg?.imageName,
        attachedImageUrl: activeImg?.imageUrl,
      };
    });
  };

  const handleIdentityChange = (field: keyof typeof data.identity, value: string) => {
    onChange((prev) => ({
      ...prev,
      identity: {
        ...prev.identity,
        [field]: value,
      },
    }));
  };

  const handleStopCountChange = (val: number) => {
    const count = Math.max(1, Math.min(32, val || 1));
    onChange((prev) => ({
      ...prev,
      stopCount: count,
    }));
  };

  const handleStartFloorChange = (val: number) => {
    onChange((prev) => ({
      ...prev,
      startFloor: val,
    }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Başlık ve Bilgilendirme Bannerı */}
      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border-l-4 border-amber-500 rounded-xl p-4 sm:p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 rounded">
                1. AŞAMA
              </span>
              <h2 className="text-base sm:text-lg font-black text-white">
                Giriş ve Proje Kimlik Tanımlama
              </h2>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Montajı yapılan asansörün kimlik bilgilerini giriniz, akıllı kat motoru ile durakları türetiniz ve teknik yerleşim tipini seçiniz.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-[11px] text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2.5 py-1 rounded-lg shrink-0">
            <Calendar className="w-3.5 h-3.5" />
            <span>Rapor Tarihi: {data.inspectionDateDisplay} (Otomatik)</span>
          </div>
        </div>
      </div>

      {/* A. PROJE KİMLİK BİLGİLERİ */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-400" />
            A. Proje Kimlik Bilgileri
          </h3>
          <span className="text-[11px] text-slate-400 font-medium">
            * Saha & montaj sorumlusu eşleşmesi
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {/* Asansör Seri Numarası */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-amber-400" />
              Asansör Seri Numarası *
            </label>
            <input
              type="text"
              id="input-serial-number"
              value={data.identity.serialNumber}
              onChange={(e) => handleIdentityChange('serialNumber', e.target.value)}
              placeholder="Örn: 05.01.25.206"
              className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium outline-none transition-all placeholder:text-slate-500"
            />
          </div>

          {/* Referans */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              Referans / Şantiye Adı *
            </label>
            <input
              type="text"
              id="input-reference"
              value={data.identity.reference}
              onChange={(e) => handleIdentityChange('reference', e.target.value)}
              placeholder="Örn: AHMET İNŞAAT"
              className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium outline-none transition-all placeholder:text-slate-500"
            />
          </div>

          {/* Tesis Yeri */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              Tesis Yeri (İlçe / Mahalle) *
            </label>
            <input
              type="text"
              id="input-location"
              value={data.identity.location}
              onChange={(e) => handleIdentityChange('location', e.target.value)}
              placeholder="Örn: KADIKÖY / İSTANBUL"
              className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium outline-none transition-all placeholder:text-slate-500"
            />
          </div>

          {/* Montajı Yapan Usta */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-amber-400" />
              Montajı Yapan Usta *
            </label>
            <input
              type="text"
              id="input-installer"
              value={data.identity.installerMaster}
              onChange={(e) => handleIdentityChange('installerMaster', e.target.value)}
              placeholder="Örn: NAZIM KÜÇÜK"
              className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium outline-none transition-all placeholder:text-slate-500"
            />
          </div>

          {/* Proje Sorumlusu */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-400" />
              Proje Sorumlusu *
            </label>
            <input
              type="text"
              id="input-project-manager"
              value={data.identity.projectManager}
              onChange={(e) => handleIdentityChange('projectManager', e.target.value)}
              placeholder="Örn: MÜFİT GÖNCE"
              className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium outline-none transition-all placeholder:text-slate-500"
            />
          </div>

          {/* Kontrolü Yapan */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center gap-1.5">
              <FileCheck2 className="w-3.5 h-3.5 text-amber-400" />
              Kontrolü Yapan (Denetçi) *
            </label>
            <input
              type="text"
              id="input-inspector"
              value={data.identity.inspector}
              onChange={(e) => handleIdentityChange('inspector', e.target.value)}
              placeholder="Örn: AHMET SARIHAN"
              className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium outline-none transition-all placeholder:text-slate-500"
            />
          </div>
        </div>
      </div>

      {/* B. AKILLI KAT / DURAK SEÇİM MOTORU */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            B. Akıllı Kat / Durak Seçim Motoru
          </h3>
          <span className="text-[11px] text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Otomatik Matris Türetici
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Toplam Durak Sayısı (1..32) */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">
              Toplam Durak Sayısı (1 - 32 Durak)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={1}
                max={32}
                value={data.stopCount}
                onChange={(e) => handleStopCountChange(parseInt(e.target.value))}
                className="flex-1 accent-amber-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
              <select
                id="select-stop-count"
                value={data.stopCount}
                onChange={(e) => handleStopCountChange(parseInt(e.target.value))}
                className="w-24 bg-slate-950 border border-slate-700 text-amber-400 font-black text-sm rounded-xl px-3 py-2 outline-none focus:border-amber-500"
              >
                {Array.from({ length: 32 }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num}>
                    {num} Durak
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* İlk Durak / Başlangıç Katı (-6'dan başlar) */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">
              İlk Durak (Başlangıç Katı)
            </label>
            <select
              id="select-start-floor"
              value={data.startFloor}
              onChange={(e) => handleStartFloorChange(parseInt(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 text-amber-400 font-bold text-sm rounded-xl px-3.5 py-2.5 outline-none focus:border-amber-500"
            >
              <option value={-6}>-6. Kat (Bodrum 6)</option>
              <option value={-5}>-5. Kat (Bodrum 5)</option>
              <option value={-4}>-4. Kat (Bodrum 4)</option>
              <option value={-3}>-3. Kat (Bodrum 3)</option>
              <option value={-2}>-2. Kat (Bodrum 2)</option>
              <option value={-1}>-1. Kat (Bodrum 1)</option>
              <option value={0}>0 / Zemin Kat</option>
              <option value={1}>1. Kat</option>
              <option value={2}>2. Kat</option>
              <option value={3}>3. Kat</option>
            </select>
          </div>
        </div>

        {/* Canlı Kat Matrisi Önizlemesi */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-bold text-slate-300">Türetilen Katlar ({currentFloors.length} Adet):</span>
            <span>Kontroller bu başlıklarla kat kat yapılacaktır</span>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            {currentFloors.map((f) => (
              <span
                key={f.stopIndex}
                className="px-2.5 py-1 text-xs font-bold bg-slate-800 text-amber-300 border border-slate-700 rounded-lg shrink-0"
              >
                {f.floorLabel}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* C. TEKNİK ÖZELLİK VE YERLEŞİM SEÇİMLERİ */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            C. Teknik Özellik ve Yerleşim Seçimleri
          </h3>
          <span className="text-[11px] text-slate-400 font-medium">
            Seçilen tipe göre kuyu şeması otomatik güncellenir
          </span>
        </div>

        {/* 1. Asansör Ana Tipi (Radio / Segmented Cards) */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 block">
            1. Asansör Tipi Seçiniz:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {ELEVATOR_TYPE_CONFIGS.map((cfg) => {
              const isSelected = data.mainType === cfg.type;
              return (
                <div
                  key={cfg.type}
                  onClick={() => handleMainTypeChange(cfg.type)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                    isSelected
                      ? 'bg-amber-950/40 border-amber-500 shadow-md ring-1 ring-amber-500/50'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-xs font-black ${
                        isSelected ? 'text-amber-400' : 'text-slate-300'
                      }`}
                    >
                      {cfg.label}
                    </span>
                    <span
                      className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500'
                          : 'border-slate-600 bg-transparent'
                      }`}
                    >
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-2">
                    {cfg.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Yerleşim / Ağırlık / Piston Konumu (Alt Seçim) */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <label className="text-xs font-bold text-slate-300 block flex items-center gap-1.5">
            <span>2. Ağırlık / Piston Yerleşim Konumu:</span>
            <span className="text-[10px] text-amber-400 font-bold">({selectedTypeConfig.label})</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {selectedTypeConfig.allowedLayouts.map((l) => {
              const isSelected = data.layoutPosition === l.layout;
              return (
                <div
                  key={l.layout}
                  onClick={() => handleLayoutChange(l.layout)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                    isSelected
                      ? 'bg-amber-950/40 border-amber-500 shadow-md ring-1 ring-amber-500/50'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-black ${
                        isSelected ? 'text-amber-400' : 'text-slate-300'
                      }`}
                    >
                      {l.label}
                    </span>
                    <span
                      className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500'
                          : 'border-slate-600 bg-transparent'
                      }`}
                    >
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-2">
                    {l.subLabel}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* "KONTROLE BAŞLA" AKSİYON BUTONU */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-2xl">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Info className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            Kontrole başladığınızda "1. Ray Kapı Ölçüleri" ve "2. Makine Şase Ölçüleri" sekmeleriyle ölçü karşılaştırmasına geçilecektir.
          </span>
        </div>

        <button
          type="button"
          id="btn-start-inspection"
          onClick={onStartInspection}
          className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer transform active:scale-98 shrink-0"
        >
          <span>KONTROLE BAŞLA</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
