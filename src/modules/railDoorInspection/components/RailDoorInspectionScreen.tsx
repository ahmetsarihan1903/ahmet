import React, { useState } from 'react';
import {
  RailDoorInspectionFullData,
  InspectionActiveTab,
  SingleMeasurementValue,
} from '../types';
import {
  getMeasurementDefsForLayout,
  MEASUREMENTS_MACHINE_CHASSIS,
} from '../constants';
import { RailDoorBlueprintSvg } from './RailDoorBlueprintSvg';
import { MachineChassisSvg } from './MachineChassisSvg';
import { RailDoorMatrixTable } from './RailDoorMatrixTable';
import { RailDoorReferenceModal } from './RailDoorReferenceModal';
import { RailDoorNonConformitiesScreen } from './RailDoorNonConformitiesScreen';
import {
  Sliders,
  Wrench,
  AlertTriangle,
  Info,
  BookOpen,
  CheckCircle2,
  FileCheck2,
} from 'lucide-react';

interface RailDoorInspectionScreenProps {
  data: RailDoorInspectionFullData;
  onChange: (updater: (prev: RailDoorInspectionFullData) => RailDoorInspectionFullData) => void;
  onBackToSetup: () => void;
  onViewReport: () => void;
  onSaveDraft: () => void;
  isSaved: boolean;
}

export const RailDoorInspectionScreen: React.FC<RailDoorInspectionScreenProps> = ({
  data,
  onChange,
  onBackToSetup,
  onViewReport,
  onSaveDraft,
  isSaved,
}) => {
  const [activeTab, setActiveTab] = useState<InspectionActiveTab>('RAIL_DOOR');
  const [selectedMeasureCode, setSelectedMeasureCode] = useState<string | undefined>('1');
  const [isReferenceModalOpen, setIsReferenceModalOpen] = useState(false);

  // Aktif sekmeye göre ölçü tanımları
  const railDoorDefs = getMeasurementDefsForLayout(data.layoutPosition);
  const machineChassisDefs = MEASUREMENTS_MACHINE_CHASSIS;

  // Matris Hücre Değer Değişikliği
  const handleMatrixCellChange = (stopIndex: number, colCode: string, value: string) => {
    onChange((prev) => {
      const currentMatrix = { ...(prev.floorMatrixMeasurements || {}) };
      const row = { ...(currentMatrix[String(stopIndex)] || {}) };
      row[colCode] = value;
      currentMatrix[String(stopIndex)] = row;

      return {
        ...prev,
        floorMatrixMeasurements: currentMatrix,
      };
    });
  };

  // Kat Rumuzu Değişikliği
  const handleAliasChange = (stopIndex: number, alias: string) => {
    onChange((prev) => {
      const aliases = { ...(prev.floorAliases || {}) };
      aliases[stopIndex] = alias;
      return {
        ...prev,
        floorAliases: aliases,
      };
    });
  };

  // Proje Nominal Ölçü Değişikliği
  const handleNominalChange = (colCode: string, value: string) => {
    onChange((prev) => {
      const nominals = { ...(prev.projectNominalValues || {}) };
      nominals[colCode] = value;
      return {
        ...prev,
        projectNominalValues: nominals,
      };
    });
  };

  // Nominal Değeri Tüm Katlara Uygula
  const handleApplyNominalToAll = (colCode: string) => {
    const nominalVal = data.projectNominalValues?.[colCode];
    if (!nominalVal) return;

    onChange((prev) => {
      const currentMatrix = { ...(prev.floorMatrixMeasurements || {}) };
      for (let s = 1; s <= (prev.stopCount || 1); s++) {
        const row = { ...(currentMatrix[String(s)] || {}) };
        row[colCode] = nominalVal;
        currentMatrix[String(s)] = row;
      }
      return {
        ...prev,
        floorMatrixMeasurements: currentMatrix,
      };
    });
  };

  // Sütundaki Değerleri Temizle
  const handleClearColumn = (colCode: string) => {
    onChange((prev) => {
      const currentMatrix = { ...(prev.floorMatrixMeasurements || {}) };
      for (let s = 1; s <= (prev.stopCount || 1); s++) {
        const row = { ...(currentMatrix[String(s)] || {}) };
        delete row[colCode];
        currentMatrix[String(s)] = row;
      }
      return {
        ...prev,
        floorMatrixMeasurements: currentMatrix,
      };
    });
  };

  // Makine Şase Ölçü Girişleri
  const handleChassisMeasureChange = (code: string, field: 'projectValueMm' | 'actualValueMm', val: string) => {
    const cleanVal = val.replace(/[^0-9.-]/g, '');
    onChange((prev) => {
      const currentMap = { ...(prev.machineChassisMeasurements || {}) };
      const existing: SingleMeasurementValue = currentMap[code] || {
        code,
        projectValueMm: '',
        actualValueMm: '',
      };
      currentMap[code] = {
        ...existing,
        [field]: cleanVal,
      };
      return {
        ...prev,
        machineChassisMeasurements: currentMap,
      };
    });
  };

  // Ölçüm sapma hesabı
  const calculateDeviation = (projectMm: string, actualMm: string) => {
    if (!projectMm || !actualMm) return null;
    const proj = parseFloat(projectMm);
    const act = parseFloat(actualMm);
    if (isNaN(proj) || isNaN(act)) return null;
    return act - proj;
  };

  // Sekme bazlı doluluk oranları
  let railFilledCount = 0;
  for (let s = 1; s <= (data.stopCount || 1); s++) {
    const row = data.floorMatrixMeasurements?.[String(s)] || {};
    for (let c = 1; c <= 15; c++) {
      if (row[String(c)] && row[String(c)].trim() !== '') railFilledCount++;
    }
  }
  const totalRailExpected = (data.stopCount || 1) * 15;

  const chassisFilledCount = (Object.values(data.machineChassisMeasurements || {}) as SingleMeasurementValue[]).filter(
    (m) => m.actualValueMm && m.actualValueMm.trim() !== ''
  ).length;

  return (
    <div className="max-w-7xl mx-auto space-y-3 sm:space-y-4 animate-fadeIn pb-16">
      {/* 3 ADET ANA KONTROL SEKMESİ: 1. RAY - KAPI | 2. MAKİNE ŞASE | UYGUNSUZLUKLAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-1.5 sm:p-2 shadow-sm">
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          {/* 1. SEKME: 1. RAY - KAPI */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('RAIL_DOOR');
              setSelectedMeasureCode('1');
            }}
            className={`py-2 sm:py-2.5 px-2 sm:px-3 rounded-xl font-black text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 transition-all cursor-pointer border ${
              activeTab === 'RAIL_DOOR'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 border-amber-400 shadow-md scale-101'
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Sliders className={`w-4 h-4 ${activeTab === 'RAIL_DOOR' ? 'text-slate-950' : 'text-amber-400'}`} />
              <span className="uppercase tracking-wide">1. RAY - KAPI</span>
            </div>
            <span
              className={`text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full ${
                activeTab === 'RAIL_DOOR'
                  ? 'bg-slate-950/20 text-slate-950'
                  : 'bg-slate-800 text-amber-300 border border-slate-700'
              }`}
            >
              {railFilledCount}/{totalRailExpected}
            </span>
          </button>

          {/* 2. SEKME: 2. MAKİNE ŞASE */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('MACHINE_CHASSIS');
              setSelectedMeasureCode(undefined);
            }}
            className={`py-2 sm:py-2.5 px-2 sm:px-3 rounded-xl font-black text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 transition-all cursor-pointer border ${
              activeTab === 'MACHINE_CHASSIS'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 border-amber-400 shadow-md scale-101'
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Wrench className={`w-4 h-4 ${activeTab === 'MACHINE_CHASSIS' ? 'text-slate-950' : 'text-amber-400'}`} />
              <span className="uppercase tracking-wide">2. MAKİNE ŞASE</span>
            </div>
            <span
              className={`text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full ${
                activeTab === 'MACHINE_CHASSIS'
                  ? 'bg-slate-950/20 text-slate-950'
                  : 'bg-slate-800 text-amber-300 border border-slate-700'
              }`}
            >
              {chassisFilledCount}/{machineChassisDefs.length}
            </span>
          </button>

          {/* 3. SEKME: UYGUNSUZLUKLAR */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('NON_CONFORMITIES');
              setSelectedMeasureCode(undefined);
            }}
            className={`py-2 sm:py-2.5 px-2 sm:px-3 rounded-xl font-black text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 transition-all cursor-pointer border ${
              activeTab === 'NON_CONFORMITIES'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 border-amber-400 shadow-md scale-101'
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <AlertTriangle className={`w-4 h-4 ${activeTab === 'NON_CONFORMITIES' ? 'text-slate-950' : 'text-amber-400'}`} />
              <span className="uppercase tracking-wide">UYGUNSUZLUKLAR</span>
            </div>
            <span
              className={`text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full ${
                activeTab === 'NON_CONFORMITIES'
                  ? 'bg-slate-950/20 text-slate-950'
                  : 'bg-slate-800 text-amber-300 border border-slate-700'
              }`}
            >
              {(data.nonConformities || []).length} Kayıt
            </span>
          </button>
        </div>
      </div>

      {/* 1. SEKME: 1. RAY - KAPI MATRİS GÖRÜNÜMÜ */}
      {activeTab === 'RAIL_DOOR' ? (
        <div className="space-y-3 sm:space-y-4">
          {/* Matris Tablo (Resimdeki Birebir Görünüm) */}
          <RailDoorMatrixTable
            stopCount={data.stopCount || 1}
            startFloor={data.startFloor ?? 0}
            measurementDefs={railDoorDefs}
            floorMatrixMeasurements={data.floorMatrixMeasurements || {}}
            floorAliases={data.floorAliases || {}}
            projectNominalValues={data.projectNominalValues || {}}
            activeCode={selectedMeasureCode}
            onSelectCode={(code) => setSelectedMeasureCode(code)}
            onCellChange={handleMatrixCellChange}
            onAliasChange={handleAliasChange}
            onNominalChange={handleNominalChange}
            onApplyNominalToAll={handleApplyNominalToAll}
            onClearColumn={handleClearColumn}
            onOpenReferenceGuide={() => setIsReferenceModalOpen(true)}
          />

          {/* En Alt Satır: SADECE RAPOR BUTONU */}
          <div className="pt-2">
            <button
              type="button"
              id="btn-view-report-bottom"
              onClick={onViewReport}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-sm font-black rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer tracking-wide uppercase"
            >
              <FileCheck2 className="w-5 h-5 text-slate-950" />
              <span>Raporu Önizle ve Yazdır</span>
            </button>
          </div>
        </div>
      ) : activeTab === 'MACHINE_CHASSIS' ? (
        /* 2. SEKME: 2. MAKİNE ŞASE ÖLÇÜLERİ GÖRÜNÜMÜ */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
          {/* Sol: Makine Şase Şeması */}
          <div className="lg:col-span-5 space-y-3">
            <MachineChassisSvg
              activeCode={selectedMeasureCode}
              onSelectCode={(code) => setSelectedMeasureCode(code)}
            />

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center gap-2.5 text-xs text-slate-300">
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Makine dairesi / kuyu tavanı şase ve tahrik kasnağı kaçıklıklarını giriniz.
              </span>
            </div>
          </div>

          {/* Sağ: Makine Şase Ölçü Giriş Listesi */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-xs font-black bg-amber-500 text-slate-950 rounded uppercase">
                    Makine Şase
                  </span>
                  <h3 className="text-sm font-black text-white">
                    Makine Şase Ölçü Karşılaştırma ve Sapma
                  </h3>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Proje ölçüsü ile gerçekleşen saha ölçüsünü giriniz. Sapmalar otomatik renklenir.
                </p>
              </div>
            </div>

            {/* Şase Ölçüm Satırları */}
            <div className="space-y-2.5">
              {machineChassisDefs.map((mDef) => {
                const currentMeasure = data.machineChassisMeasurements?.[mDef.code] || {
                  code: mDef.code,
                  projectValueMm: '',
                  actualValueMm: '',
                };

                const deviation = calculateDeviation(
                  currentMeasure.projectValueMm,
                  currentMeasure.actualValueMm
                );

                const hasDeviation = deviation !== null && deviation !== 0;
                const isExactMatch = deviation !== null && deviation === 0;
                const isSelectedRow = selectedMeasureCode === mDef.code;

                return (
                  <div
                    key={mDef.code}
                    onFocus={() => setSelectedMeasureCode(mDef.code)}
                    onClick={() => setSelectedMeasureCode(mDef.code)}
                    className={`p-2.5 sm:p-3 rounded-xl border transition-all ${
                      hasDeviation
                        ? 'bg-amber-950/20 border-amber-500/50 shadow-xs'
                        : isExactMatch
                        ? 'bg-emerald-950/20 border-emerald-600/40'
                        : isSelectedRow
                        ? 'bg-slate-850 border-sky-500/60'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-8 h-8 rounded-lg bg-slate-800 text-amber-400 border border-slate-700 flex items-center justify-center text-xs font-black shrink-0">
                          {mDef.code}
                        </span>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-200 truncate">
                            {mDef.title}
                          </div>
                          {mDef.hint && (
                            <div className="text-[10px] text-slate-400 truncate">
                              {mDef.hint}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="w-24 sm:w-28">
                          <span className="text-[9px] font-bold text-slate-400 block mb-0.5">
                            Proje (mm)
                          </span>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={currentMeasure.projectValueMm}
                            onChange={(e) => handleChassisMeasureChange(mDef.code, 'projectValueMm', e.target.value)}
                            placeholder="Örn: 1200"
                            className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono text-center font-bold outline-none"
                          />
                        </div>

                        <div className="w-24 sm:w-28">
                          <span className="text-[9px] font-bold text-amber-400 block mb-0.5">
                            Saha (mm)
                          </span>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={currentMeasure.actualValueMm}
                            onChange={(e) => handleChassisMeasureChange(mDef.code, 'actualValueMm', e.target.value)}
                            placeholder="Örn: 1202"
                            className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono text-center font-bold outline-none"
                          />
                        </div>

                        <div className="w-20 sm:w-24 text-center">
                          <span className="text-[9px] font-bold text-slate-400 block mb-0.5">
                            Sapma
                          </span>
                          {deviation !== null ? (
                            <span
                              className={`inline-block px-2 py-1 rounded text-xs font-mono font-black ${
                                hasDeviation
                                  ? Math.abs(deviation) > 2
                                    ? 'bg-rose-950 text-rose-300 border border-rose-600/50'
                                    : 'bg-amber-950 text-amber-300 border border-amber-600/50'
                                  : 'bg-emerald-950 text-emerald-300 border border-emerald-600/50'
                              }`}
                            >
                              {deviation > 0 ? `+${deviation}` : deviation} mm
                            </span>
                          ) : (
                            <span className="text-xs text-slate-600 font-mono">-</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Alt Tek Satır: SADECE RAPOR BUTONU */}
            <div className="pt-3 border-t border-slate-800">
              <button
                type="button"
                id="btn-view-report-chassis"
                onClick={onViewReport}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-sm font-black rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer tracking-wide uppercase"
              >
                <FileCheck2 className="w-5 h-5 text-slate-950" />
                <span>Raporu Önizle ve Yazdır</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* 3. SEKME: 3. UYGUNSUZLUKLAR GÖRÜNÜMÜ */
        <RailDoorNonConformitiesScreen
          data={data}
          onUpdateData={onChange}
          onViewReport={onViewReport}
        />
      )}

      {/* Sabit Ölçüleri Gör Referans Kılavuzu & Şema Modalı */}
      <RailDoorReferenceModal
        isOpen={isReferenceModalOpen}
        onClose={() => setIsReferenceModalOpen(false)}
        measurementDefs={railDoorDefs}
        layoutPosition={data.layoutPosition}
        activeCode={selectedMeasureCode}
        onSelectCode={(code) => setSelectedMeasureCode(code)}
      />
    </div>
  );
};
