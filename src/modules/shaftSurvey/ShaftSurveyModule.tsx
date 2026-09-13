import React, { useState, useEffect } from 'react';
import { ShaftSurveyData, ShaftSurveyFloorDoor } from '../../types';
import { BetaLogo } from '../../components/BetaLogo';
import { VoiceInputButton } from '../../components/VoiceInputButton';
import {
  Compass,
  ArrowLeft,
  Save,
  Check,
  FileText,
  Building,
  Ruler,
  Layers,
  Zap,
  Info,
  Printer,
  RotateCcw,
} from 'lucide-react';
import { getCurrentDateFormatted } from '../../utils/textUtils';

interface ShaftSurveyModuleProps {
  onBackToMainMenu: () => void;
}

const STORAGE_KEY = 'beta_asansor_shaft_survey_draft_v1';

export const ShaftSurveyModule: React.FC<ShaftSurveyModuleProps> = ({ onBackToMainMenu }) => {
  const [surveyData, setSurveyData] = useState<ShaftSurveyData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }

    const defaultStops = 8;
    const defaultFloorStart = -1;
    const initialDoors: ShaftSurveyFloorDoor[] = [];
    for (let i = 0; i < defaultStops; i++) {
      const fVal = defaultFloorStart + i;
      const fLabel = fVal === 0 ? 'Zemin / 0' : `${fVal}. Kat`;
      initialDoors.push({
        floorIndex: i + 1,
        floorLabel: fLabel,
        doorWidthMm: '800',
        doorHeightMm: '2000',
        roughOpeningWidthMm: '1000',
        roughOpeningHeightMm: '2100',
        wallThicknessMm: '200',
        sillFloorDifferenceMm: '0',
        notes: '',
      });
    }

    return {
      id: `survey_${Date.now()}`,
      date: new Date().toISOString(),
      dateDisplay: getCurrentDateFormatted(),
      surveyorName: '',
      projectName: '',
      buildingBlock: '',
      address: '',
      clientContact: '',
      stopCount: defaultStops,
      floorStart: defaultFloorStart,
      shaftWidthA: '1800',
      shaftDepthB: '2000',
      pitDepthS: '1400',
      headroomHeightK: '3700',
      travelHeightH: '24000',
      machineRoomType: 'MR',
      shaftWallType: 'BETONARME',
      counterweightPosition: 'ARKA',
      targetCapacityKg: '800',
      targetSpeedMs: '1.0',
      doorType: 'OTOMATIK_TELESKOPIK',
      floorDoors: initialDoors,
      isElectricityAvailable: true,
      isShaftDry: true,
      isScaffoldingRequired: false,
      isHookInstalled: true,
      hookCapacityKg: '2000',
      generalNotes: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  });

  const [isSaved, setIsSaved] = useState(false);
  const [showReport, setShowReport] = useState(false);

  // Auto-save
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(surveyData));
    } catch (e) {
      console.error(e);
    }
  }, [surveyData]);

  const handleSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(surveyData));
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleStopCountChange = (newCount: number) => {
    setSurveyData((prev) => {
      const doors: ShaftSurveyFloorDoor[] = [];
      for (let i = 0; i < newCount; i++) {
        const fVal = prev.floorStart + i;
        const fLabel = fVal === 0 ? 'Zemin / 0' : `${fVal}. Kat`;
        const existing = prev.floorDoors?.[i];
        doors.push(
          existing
            ? { ...existing, floorIndex: i + 1, floorLabel: fLabel }
            : {
                floorIndex: i + 1,
                floorLabel: fLabel,
                doorWidthMm: '800',
                doorHeightMm: '2000',
                roughOpeningWidthMm: '1000',
                roughOpeningHeightMm: '2100',
                wallThicknessMm: '200',
                sillFloorDifferenceMm: '0',
                notes: '',
              }
        );
      }
      return { ...prev, stopCount: newCount, floorDoors: doors };
    });
  };

  const handleFloorDoorChange = (index: number, field: keyof ShaftSurveyFloorDoor, value: string) => {
    setSurveyData((prev) => {
      const updated = [...prev.floorDoors];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, floorDoors: updated };
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0A2647] text-white shadow-md border-b-4 border-sky-500 pt-safe-or-4 print:hidden">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onBackToMainMenu}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded border border-slate-600 text-xs font-bold flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-sky-400" />
              Menü
            </button>
            <BetaLogo size="sm" className="shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-black leading-none text-white">
                  KUYU RÖLEVE FORMU
                </h1>
                <span className="px-1.5 py-0.5 text-[9px] font-black uppercase bg-sky-500 text-slate-950 rounded">
                  KEŞİF & ÖLÇÜM
                </span>
              </div>
              <p className="text-[10px] text-slate-300 font-medium">Şantiye Kuyu & Mimari Keşif</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              className={`px-3 py-1.5 rounded border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                isSaved
                  ? 'bg-emerald-600 border-emerald-400 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-sky-400 border-slate-600'
              }`}
            >
              {isSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              <span>{isSaved ? 'Kaydedildi' : 'Kaydet'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowReport(!showReport)}
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <FileText className="w-4 h-4" />
              <span>{showReport ? 'Forma Dön' : 'Röleve Raporu'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 space-y-6">
        {!showReport ? (
          <div className="space-y-6">
            {/* Section 1: Proje & Şantiye Bilgileri */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
              <h2 className="text-sm font-black text-sky-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                <Building className="w-4 h-4" />
                1. Proje & Şantiye Bilgileri
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block font-bold mb-1">Şantiye / Proje Adı *</label>
                  <input
                    type="text"
                    value={surveyData.projectName}
                    onChange={(e) => setSurveyData({ ...surveyData, projectName: e.target.value })}
                    placeholder="Örn: Vadi Konakları"
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-sky-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block font-bold mb-1">Blok / Asansör No *</label>
                  <input
                    type="text"
                    value={surveyData.buildingBlock}
                    onChange={(e) => setSurveyData({ ...surveyData, buildingBlock: e.target.value })}
                    placeholder="Örn: A Blok - Yolcu Asansörü 1"
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-sky-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block font-bold mb-1">Keşfi Yapan Teknisyen / Mühendis</label>
                  <input
                    type="text"
                    value={surveyData.surveyorName}
                    onChange={(e) => setSurveyData({ ...surveyData, surveyorName: e.target.value })}
                    placeholder="Ad Soyad"
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-sky-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block font-bold mb-1">Şantiye Yetkilisi / Telefon</label>
                  <input
                    type="text"
                    value={surveyData.clientContact || ''}
                    onChange={(e) => setSurveyData({ ...surveyData, clientContact: e.target.value })}
                    placeholder="Yetkili Kişi & İletişim"
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-sky-500 outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs text-slate-400 block font-bold mb-1">Şantiye Adresi / Lokasyon</label>
                  <input
                    type="text"
                    value={surveyData.address || ''}
                    onChange={(e) => setSurveyData({ ...surveyData, address: e.target.value })}
                    placeholder="İlçe, Şehir, Mahalle"
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-sky-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Kuyu Ana Boyutları (A, B, S, K) */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
              <h2 className="text-sm font-black text-sky-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                <Ruler className="w-4 h-4" />
                2. Kuyu Ana Kesit ve Boyutları (Net Ölçüler mm)
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                  <span className="text-[11px] text-sky-400 font-bold block">Kuyu Genişliği (A)</span>
                  <div className="flex items-center gap-1 mt-1">
                    <input
                      type="number"
                      value={surveyData.shaftWidthA}
                      onChange={(e) => setSurveyData({ ...surveyData, shaftWidthA: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-sm font-bold text-white outline-none focus:border-sky-500"
                    />
                    <span className="text-xs text-slate-400">mm</span>
                  </div>
                </div>

                <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                  <span className="text-[11px] text-sky-400 font-bold block">Kuyu Derinliği (B)</span>
                  <div className="flex items-center gap-1 mt-1">
                    <input
                      type="number"
                      value={surveyData.shaftDepthB}
                      onChange={(e) => setSurveyData({ ...surveyData, shaftDepthB: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-sm font-bold text-white outline-none focus:border-sky-500"
                    />
                    <span className="text-xs text-slate-400">mm</span>
                  </div>
                </div>

                <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                  <span className="text-[11px] text-sky-400 font-bold block">Kuyu Dibi (S)</span>
                  <div className="flex items-center gap-1 mt-1">
                    <input
                      type="number"
                      value={surveyData.pitDepthS}
                      onChange={(e) => setSurveyData({ ...surveyData, pitDepthS: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-sm font-bold text-white outline-none focus:border-sky-500"
                    />
                    <span className="text-xs text-slate-400">mm</span>
                  </div>
                </div>

                <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                  <span className="text-[11px] text-sky-400 font-bold block">Son Kat Tavanı (K)</span>
                  <div className="flex items-center gap-1 mt-1">
                    <input
                      type="number"
                      value={surveyData.headroomHeightK}
                      onChange={(e) => setSurveyData({ ...surveyData, headroomHeightK: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-sm font-bold text-white outline-none focus:border-sky-500"
                    />
                    <span className="text-xs text-slate-400">mm</span>
                  </div>
                </div>

                <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700 col-span-2 sm:col-span-1">
                  <span className="text-[11px] text-sky-400 font-bold block">Seyir Mesafesi (H)</span>
                  <div className="flex items-center gap-1 mt-1">
                    <input
                      type="number"
                      value={surveyData.travelHeightH}
                      onChange={(e) => setSurveyData({ ...surveyData, travelHeightH: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-sm font-bold text-white outline-none focus:border-sky-500"
                    />
                    <span className="text-xs text-slate-400">mm</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Yapısal & Teknik Seçimler */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
              <h2 className="text-sm font-black text-sky-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                <Layers className="w-4 h-4" />
                3. Yapısal & Tasarım Tercihleri
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block font-bold mb-1">Makine Dairesi Tipi</label>
                  <select
                    value={surveyData.machineRoomType}
                    onChange={(e) =>
                      setSurveyData({ ...surveyData, machineRoomType: e.target.value as any })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white outline-none"
                  >
                    <option value="MR">MR (Üst Makine Dairesi)</option>
                    <option value="MRL_TOP">MRL (Makine Dairesiz - Kuyu İçi Üst)</option>
                    <option value="MRL_BOTTOM">MRL (Makine Dairesiz - Kuyu Dibi)</option>
                    <option value="HYDRAULIC">Hidrolik Asansör</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block font-bold mb-1">Kuyu Duvar Yapısı</label>
                  <select
                    value={surveyData.shaftWallType}
                    onChange={(e) =>
                      setSurveyData({ ...surveyData, shaftWallType: e.target.value as any })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white outline-none"
                  >
                    <option value="BETONARME">Tam Betonarme Kuyu</option>
                    <option value="TUGLA">Tuğla Duvar (Kuşaklama Gerekir)</option>
                    <option value="CELIK_KONSTRUKSIYON">Çelik Konstrüksiyon Karkas</option>
                    <option value="CAM">Panoramik Cam Kuyu</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block font-bold mb-1">Ağırlık Konumu</label>
                  <select
                    value={surveyData.counterweightPosition}
                    onChange={(e) =>
                      setSurveyData({ ...surveyData, counterweightPosition: e.target.value as any })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white outline-none"
                  >
                    <option value="ARKA">Arka Duvar</option>
                    <option value="YAN_SOL">Yan Duvar (Sol)</option>
                    <option value="YAN_SAG">Yan Duvar (Sağ)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block font-bold mb-1">Kapı Tipi</label>
                  <select
                    value={surveyData.doorType}
                    onChange={(e) => setSurveyData({ ...surveyData, doorType: e.target.value as any })}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white outline-none"
                  >
                    <option value="OTOMATIK_TELESKOPIK">Otomatik Teleskopik (Yana Açılır)</option>
                    <option value="OTOMATIK_MERKEZI">Otomatik Merkezi Açılır</option>
                    <option value="YARI_OTOMATIK_CARPMA">Yarı Otomatik Çarpma Kapı</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block font-bold mb-1">Hedef Kapasite</label>
                  <select
                    value={surveyData.targetCapacityKg}
                    onChange={(e) => setSurveyData({ ...surveyData, targetCapacityKg: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white outline-none"
                  >
                    <option value="320">320 kg (4 Kişi)</option>
                    <option value="450">450 kg (6 Kişi)</option>
                    <option value="630">630 kg (8 Kişi)</option>
                    <option value="800">800 kg (10 Kişi)</option>
                    <option value="1000">1000 kg (13 Kişi)</option>
                    <option value="1250">1250 kg (16 Kişi)</option>
                    <option value="1600">1600 kg (Sedye)</option>
                    <option value="2000">2000 kg (Yük)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block font-bold mb-1">Durak Sayısı</label>
                  <input
                    type="number"
                    min={1}
                    max={32}
                    value={surveyData.stopCount}
                    onChange={(e) => handleStopCountChange(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Kat Kapı Boşlukları Tablosu */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
              <h2 className="text-sm font-black text-sky-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                <Ruler className="w-4 h-4" />
                4. Kat Kapı Boşlukları & Duvar Ölçüleri Tablosu
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border border-slate-800">
                  <thead className="bg-slate-800 text-slate-300 font-bold border-b border-slate-700">
                    <tr>
                      <th className="p-2.5">Kat</th>
                      <th className="p-2.5">Kapı Net En (mm)</th>
                      <th className="p-2.5">Kapı Net Boy (mm)</th>
                      <th className="p-2.5">Kaba Boşluk En (mm)</th>
                      <th className="p-2.5">Kaba Boşluk Boy (mm)</th>
                      <th className="p-2.5">Duvar/Lento (mm)</th>
                      <th className="p-2.5">Eşik Kot Farkı (mm)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-white">
                    {surveyData.floorDoors.map((door, idx) => (
                      <tr key={door.floorIndex} className="hover:bg-slate-800/40">
                        <td className="p-2.5 font-bold text-sky-400 whitespace-nowrap">
                          {door.floorLabel}
                        </td>
                        <td className="p-1.5">
                          <input
                            type="text"
                            value={door.doorWidthMm}
                            onChange={(e) => handleFloorDoorChange(idx, 'doorWidthMm', e.target.value)}
                            className="w-20 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-center"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="text"
                            value={door.doorHeightMm}
                            onChange={(e) => handleFloorDoorChange(idx, 'doorHeightMm', e.target.value)}
                            className="w-20 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-center"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="text"
                            value={door.roughOpeningWidthMm}
                            onChange={(e) => handleFloorDoorChange(idx, 'roughOpeningWidthMm', e.target.value)}
                            className="w-20 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-center"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="text"
                            value={door.roughOpeningHeightMm}
                            onChange={(e) => handleFloorDoorChange(idx, 'roughOpeningHeightMm', e.target.value)}
                            className="w-20 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-center"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="text"
                            value={door.wallThicknessMm}
                            onChange={(e) => handleFloorDoorChange(idx, 'wallThicknessMm', e.target.value)}
                            className="w-20 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-center"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="text"
                            value={door.sillFloorDifferenceMm}
                            onChange={(e) => handleFloorDoorChange(idx, 'sillFloorDifferenceMm', e.target.value)}
                            className="w-20 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-center"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 5: Şantiye & Altyapı Durumu */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
              <h2 className="text-sm font-black text-sky-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                <Zap className="w-4 h-4" />
                5. Şantiye Altyapı & Montaja Hazırlık Kontrolleri
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/80 border border-slate-700 cursor-pointer hover:bg-slate-800">
                  <input
                    type="checkbox"
                    checked={surveyData.isElectricityAvailable}
                    onChange={(e) =>
                      setSurveyData({ ...surveyData, isElectricityAvailable: e.target.checked })
                    }
                    className="w-4 h-4 accent-sky-500 rounded"
                  />
                  <span className="text-xs font-bold text-slate-200">
                    Şantiye Elektriği Mevcut (3 Faz / 380V)
                  </span>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/80 border border-slate-700 cursor-pointer hover:bg-slate-800">
                  <input
                    type="checkbox"
                    checked={surveyData.isShaftDry}
                    onChange={(e) => setSurveyData({ ...surveyData, isShaftDry: e.target.checked })}
                    className="w-4 h-4 accent-sky-500 rounded"
                  />
                  <span className="text-xs font-bold text-slate-200">
                    Kuyu Dibi Kuru ve Su Yalıtımı Yapılmış
                  </span>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/80 border border-slate-700 cursor-pointer hover:bg-slate-800">
                  <input
                    type="checkbox"
                    checked={surveyData.isHookInstalled}
                    onChange={(e) => setSurveyData({ ...surveyData, isHookInstalled: e.target.checked })}
                    className="w-4 h-4 accent-sky-500 rounded"
                  />
                  <span className="text-xs font-bold text-slate-200">
                    Kuyu Tavanında Mapa / Montaj Kancası Takılı
                  </span>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/80 border border-slate-700 cursor-pointer hover:bg-slate-800">
                  <input
                    type="checkbox"
                    checked={surveyData.isScaffoldingRequired}
                    onChange={(e) =>
                      setSurveyData({ ...surveyData, isScaffoldingRequired: e.target.checked })
                    }
                    className="w-4 h-4 accent-sky-500 rounded"
                  />
                  <span className="text-xs font-bold text-slate-200">
                    Montaj İskelesi Kurulması Gerekiyor
                  </span>
                </label>
              </div>
            </div>

            {/* Section 6: Genel Notlar ve Sesli Giriş */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black text-sky-400 uppercase tracking-wider flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  6. Keşif & Röleve Özel Notları
                </h2>
                <VoiceInputButton
                  onTranscript={(text) =>
                    setSurveyData((prev) => ({
                      ...prev,
                      generalNotes: prev.generalNotes ? `${prev.generalNotes} ${text}` : text,
                    }))
                  }
                />
              </div>

              <textarea
                rows={4}
                value={surveyData.generalNotes}
                onChange={(e) => setSurveyData({ ...surveyData, generalNotes: e.target.value })}
                placeholder="Şantiye kuyu kirişleri, özel mimari kısıtlamalar veya imalata iletilecek kuyu notlarını buraya yazabilir veya mikrofonla dikte edebilirsiniz..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500"
              />
            </div>
          </div>
        ) : (
          /* Röleve Çıktı Görünümü */
          <div className="bg-white text-slate-900 rounded-xl p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
              <div>
                <h2 className="text-xl font-black tracking-tight text-slate-900">
                  BETA ASANSÖR - KUYU RÖLEVE VE KEŞİF RAPORU
                </h2>
                <p className="text-xs text-slate-600 font-bold mt-0.5">
                  Proje: {surveyData.projectName || 'Belirtilmedi'} | Blok: {surveyData.buildingBlock || '-'}
                </p>
              </div>
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 bg-slate-900 text-white rounded font-bold text-xs flex items-center gap-2 hover:bg-slate-800 print:hidden"
              >
                <Printer className="w-4 h-4" />
                Yazdır / PDF
              </button>
            </div>

            {/* Bilgi Tablosu */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs">
              <div>
                <span className="text-slate-500 block font-bold">Tarih</span>
                <span className="font-bold text-slate-900">{surveyData.dateDisplay}</span>
              </div>
              <div>
                <span className="text-slate-500 block font-bold">Keşif Sorumlusu</span>
                <span className="font-bold text-slate-900">{surveyData.surveyorName || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 block font-bold">Durak Sayısı</span>
                <span className="font-bold text-slate-900">{surveyData.stopCount} Durak</span>
              </div>
              <div>
                <span className="text-slate-500 block font-bold">Hedef Kapasite</span>
                <span className="font-bold text-slate-900">{surveyData.targetCapacityKg} kg</span>
              </div>
            </div>

            {/* Kuyu Ölçüleri */}
            <div>
              <h3 className="text-xs font-black uppercase text-slate-900 border-b border-slate-300 pb-1 mb-3">
                Kuyu Kesit Ölçüleri (mm)
              </h3>
              <div className="grid grid-cols-5 gap-2 text-center text-xs">
                <div className="p-2 border border-slate-200 rounded">
                  <span className="text-slate-500 block text-[10px]">Genişlik (A)</span>
                  <span className="font-black text-sm">{surveyData.shaftWidthA} mm</span>
                </div>
                <div className="p-2 border border-slate-200 rounded">
                  <span className="text-slate-500 block text-[10px]">Derinlik (B)</span>
                  <span className="font-black text-sm">{surveyData.shaftDepthB} mm</span>
                </div>
                <div className="p-2 border border-slate-200 rounded">
                  <span className="text-slate-500 block text-[10px]">Kuyu Dibi (S)</span>
                  <span className="font-black text-sm">{surveyData.pitDepthS} mm</span>
                </div>
                <div className="p-2 border border-slate-200 rounded">
                  <span className="text-slate-500 block text-[10px]">Son Kat (K)</span>
                  <span className="font-black text-sm">{surveyData.headroomHeightK} mm</span>
                </div>
                <div className="p-2 border border-slate-200 rounded">
                  <span className="text-slate-500 block text-[10px]">Seyir (H)</span>
                  <span className="font-black text-sm">{surveyData.travelHeightH} mm</span>
                </div>
              </div>
            </div>

            {/* Kat Kapı Tablosu */}
            <div>
              <h3 className="text-xs font-black uppercase text-slate-900 border-b border-slate-300 pb-1 mb-2">
                Kat Kapı ve Duvar Detayları
              </h3>
              <table className="w-full text-xs text-left border border-slate-300">
                <thead className="bg-slate-100 font-bold border-b border-slate-300">
                  <tr>
                    <th className="p-2">Kat</th>
                    <th className="p-2">Kapı En x Boy (mm)</th>
                    <th className="p-2">Kaba Kuyu Boşluğu</th>
                    <th className="p-2">Duvar Kalınlığı</th>
                    <th className="p-2">Kot Farkı</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {surveyData.floorDoors.map((door) => (
                    <tr key={door.floorIndex}>
                      <td className="p-2 font-bold">{door.floorLabel}</td>
                      <td className="p-2">
                        {door.doorWidthMm} x {door.doorHeightMm} mm
                      </td>
                      <td className="p-2">
                        {door.roughOpeningWidthMm} x {door.roughOpeningHeightMm} mm
                      </td>
                      <td className="p-2">{door.wallThicknessMm} mm</td>
                      <td className="p-2">{door.sillFloorDifferenceMm} mm</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Genel Notlar */}
            {surveyData.generalNotes && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs">
                <span className="font-bold block text-slate-700 mb-1">Röleve & Keşif Notları:</span>
                <p className="text-slate-900 whitespace-pre-wrap">{surveyData.generalNotes}</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
