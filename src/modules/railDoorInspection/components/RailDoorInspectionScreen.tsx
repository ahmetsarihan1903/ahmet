import React, { useState, useEffect } from 'react';
import {
  RailDoorInspectionFullData,
  InspectionActiveTab,
  SingleMeasurementValue,
} from '../types';
import {
  getMeasurementDefsForLayout,
  MEASUREMENTS_MACHINE_CHASSIS,
  LAYOUT_TITLES,
  FIXED_LAYOUT_DRAWINGS,
  FIXED_CHASSIS_DRAWINGS,
} from '../constants';
import { RailDoorMatrixTable } from './RailDoorMatrixTable';
import { UnifiedDrawingModal } from './UnifiedDrawingModal';
import { RailDoorNonConformitiesScreen } from './RailDoorNonConformitiesScreen';
import {
  Sliders,
  Wrench,
  AlertTriangle,
  Info,
  BookOpen,
  Eye,
  CheckCircle2,
  FileCheck2,
  Trash2,
  X,
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
  const [activeTab, setActiveTab] = useState<InspectionActiveTab>(() => {
    try {
      const saved = localStorage.getItem('beta_asansor_rail_door_active_tab') as InspectionActiveTab;
      if (saved === 'RAIL_DOOR' || saved === 'MACHINE_CHASSIS' || saved === 'NON_CONFORMITIES') {
        return saved;
      }
    } catch (e) {}
    return 'RAIL_DOOR';
  });

  const handleTabChange = (tab: InspectionActiveTab) => {
    setActiveTab(tab);
    try {
      localStorage.setItem('beta_asansor_rail_door_active_tab', tab);
    } catch (e) {}
  };

  const [selectedMeasureCode, setSelectedMeasureCode] = useState<string | undefined>('1');
  const [isReferenceModalOpen, setIsReferenceModalOpen] = useState(false);
  const [isChassisModalOpen, setIsChassisModalOpen] = useState(false);
  const [activeChassisView, setActiveChassisView] = useState<'SASE_SAG' | 'SASE_SOL'>(
    data.layoutPosition === 'CWT_SIDE_LEFT' ? 'SASE_SOL' : 'SASE_SAG'
  );

  useEffect(() => {
    if (data.layoutPosition === 'CWT_SIDE_LEFT') {
      setActiveChassisView('SASE_SOL');
    } else if (data.layoutPosition === 'CWT_SIDE_RIGHT') {
      setActiveChassisView('SASE_SAG');
    }
  }, [data.layoutPosition]);

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

  // Anormal Hücre İşaretleme (2 saniye basılı tutma ile tetiklenir)
  const handleToggleFlaggedCell = (cellKey: string) => {
    onChange((prev) => {
      const current = { ...(prev.flaggedAbnormalCells || {}) };
      if (current[cellKey]) {
        delete current[cellKey];
      } else {
        current[cellKey] = true;
      }
      return {
        ...prev,
        flaggedAbnormalCells: current,
      };
    });
  };

  // Özel Sütun Ekle (15'ten sonra kullanıcının kendi belirlediği rakam veya kod)
  const handleAddColumn = (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;
    onChange((prev) => {
      const existing = prev.customColumnCodes || [];
      if (existing.includes(trimmed)) return prev;
      return {
        ...prev,
        customColumnCodes: [...existing, trimmed],
      };
    });
  };

  // Özel Sütun Kaldır
  const handleRemoveColumn = (codeToRemove: string) => {
    onChange((prev) => {
      const existing = prev.customColumnCodes || [];
      const updated = existing.filter((c) => c !== codeToRemove);

      // İlgili sütundaki matris ve nominal kayıtlarını da temizle
      const updatedNominals = { ...(prev.projectNominalValues || {}) };
      delete updatedNominals[codeToRemove];

      const currentMatrix = { ...(prev.floorMatrixMeasurements || {}) };
      for (let s = 1; s <= (prev.stopCount || 1); s++) {
        if (currentMatrix[String(s)]) {
          const row = { ...currentMatrix[String(s)] };
          delete row[codeToRemove];
          currentMatrix[String(s)] = row;
        }
      }

      return {
        ...prev,
        customColumnCodes: updated,
        projectNominalValues: updatedNominals,
        floorMatrixMeasurements: currentMatrix,
      };
    });
  };

  // 9 Nolu Sütun İbaresi Değişikliği (SAĞ, SOL, MRK - Eksen Kaçıklığı)
  const handleColumn9DirectionChange = (direction: string) => {
    onChange((prev) => ({
      ...prev,
      column9Direction: direction,
      columnSubOptions: {
        ...(prev.columnSubOptions || {}),
        '9': direction,
      },
    }));
  };

  // 7 Nolu Sütun İbaresi Değişikliği (SAĞ, SOL, MRK)
  const handleColumn7DirectionChange = (direction: string) => {
    onChange((prev) => ({
      ...prev,
      column7Direction: direction,
      columnSubOptions: {
        ...(prev.columnSubOptions || {}),
        '7': direction,
      },
    }));
  };

  // Makine Şase Ölçü Girişleri
  const handleChassisMeasureChange = (code: string, field: 'projectValueMm' | 'actualValueMm', val: string) => {
    const cleanVal = val.replace(/[^0-9.,-]/g, '');
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

  // Makine Şase Tablosu 1 (A, B, C, D, E, F(11), 10, G, H, I) Sütunları
  const chaseCols = ['A', 'B', 'C', 'D', 'E', 'F(11)', '10', 'G', 'H', 'I'];

  const handleChaseTableChange = (col: string, val: string) => {
    const cleanVal = val.replace(/[^0-9.,-]/g, '');
    onChange((prev) => {
      const t1 = { ...(prev.chaseMeasurementsTable1 || {}) };
      t1[col] = cleanVal;
      return {
        ...prev,
        chaseMeasurementsTable1: t1,
      };
    });
  };

  // Konsol Mesafeleri Değişiklik İşleyicisi
  const handleConsoleCellChange = (section: 'uBolmeSide' | 'tekRaySide', col: string, val: string) => {
    const cleanVal = val.replace(/[^0-9.,-]/g, '');
    onChange((prev) => {
      const current = prev.consoleMeasurementsTable2 || { uBolmeSide: {}, tekRaySide: {} };
      const updatedSection = { ...current[section] };
      updatedSection[col] = cleanVal;
      return {
        ...prev,
        consoleMeasurementsTable2: {
          ...current,
          [section]: updatedSection,
        },
      };
    });
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

  const chassisFilledCount = Object.values(data.chaseMeasurementsTable1 || {}).filter(
    (v) => typeof v === 'string' && v.trim() !== ''
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
              handleTabChange('RAIL_DOOR');
              setSelectedMeasureCode('1');
            }}
            className={`min-h-[44px] py-2 sm:py-2.5 px-2 sm:px-3 rounded-xl font-black text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 transition-all cursor-pointer border select-none ${
              activeTab === 'RAIL_DOOR'
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-400 shadow-md font-black'
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-1.5 shrink-0">
              <Sliders className={`w-4 h-4 shrink-0 ${activeTab === 'RAIL_DOOR' ? 'text-slate-950' : 'text-amber-400'}`} />
              <span className="uppercase tracking-wide whitespace-nowrap">1. RAY - KAPI</span>
            </div>
            <span
              className={`text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full shrink-0 ${
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
              handleTabChange('MACHINE_CHASSIS');
              setSelectedMeasureCode(undefined);
            }}
            className={`min-h-[44px] py-2 sm:py-2.5 px-2 sm:px-3 rounded-xl font-black text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 transition-all cursor-pointer border select-none ${
              activeTab === 'MACHINE_CHASSIS'
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-400 shadow-md font-black'
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-1.5 shrink-0">
              <Wrench className={`w-4 h-4 shrink-0 ${activeTab === 'MACHINE_CHASSIS' ? 'text-slate-950' : 'text-amber-400'}`} />
              <span className="uppercase tracking-wide whitespace-nowrap">2. MAKİNE ŞASE</span>
            </div>
            <span
              className={`text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full shrink-0 ${
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
              handleTabChange('NON_CONFORMITIES');
              setSelectedMeasureCode(undefined);
            }}
            className={`min-h-[44px] py-2 sm:py-2.5 px-2 sm:px-3 rounded-xl font-black text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 transition-all cursor-pointer border select-none ${
              activeTab === 'NON_CONFORMITIES'
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-400 shadow-md font-black'
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-1.5 shrink-0">
              <AlertTriangle className={`w-4 h-4 shrink-0 ${activeTab === 'NON_CONFORMITIES' ? 'text-slate-950' : 'text-amber-400'}`} />
              <span className="uppercase tracking-wide whitespace-nowrap">UYGUNSUZLUKLAR</span>
            </div>
            <span
              className={`text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full shrink-0 ${
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
            customColumnCodes={data.customColumnCodes || []}
            column9Direction={data.column9Direction}
            onColumn9DirectionChange={handleColumn9DirectionChange}
            layoutPosition={data.layoutPosition}
            activeCode={selectedMeasureCode}
            flaggedAbnormalCells={data.flaggedAbnormalCells || {}}
            onToggleFlaggedCell={handleToggleFlaggedCell}
            onSelectCode={(code) => setSelectedMeasureCode(code)}
            onCellChange={handleMatrixCellChange}
            onAliasChange={handleAliasChange}
            onNominalChange={handleNominalChange}
            onApplyNominalToAll={handleApplyNominalToAll}
            onClearColumn={handleClearColumn}
            onAddColumn={handleAddColumn}
            onRemoveColumn={handleRemoveColumn}
            onOpenReferenceGuide={() => setIsReferenceModalOpen(true)}
          />

          {/* En Alt Satır: SADECE RAPOR BUTONU */}
          <div className="pt-3">
            <button
              type="button"
              id="btn-view-report-bottom"
              onClick={onViewReport}
              className="btn-amber-action w-full py-4 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 text-sm sm:text-base font-black rounded-2xl flex items-center justify-center gap-2.5 transition-all shadow-xl shadow-amber-500/25 cursor-pointer tracking-wide uppercase border-2 border-amber-600"
            >
              <FileCheck2 className="w-6 h-6 text-slate-950" />
              <span>Raporu Önizle ve Yazdır</span>
            </button>
          </div>
        </div>
      ) : activeTab === 'MACHINE_CHASSIS' ? (
        /* 2. SEKME: 2. MAKİNE ŞASE & KONSOL MESAFELERİ */
        <div className="space-y-5 animate-fadeIn">
          {/* Üst Bilgi & RESMİ GÖR Butonu */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Wrench className="w-4 h-4 text-amber-400" />
                <span>Makine Şase ve Konsol Mesafeleri Kontrolü</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Şase eksen ölçülerini ve konsol mesafelerini aşağıdan giriniz.
              </p>
            </div>
            <button
              type="button"
              id="btn-open-chassis-modal"
              onClick={() => setIsChassisModalOpen(true)}
              className="min-h-[40px] px-3.5 sm:px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer shadow-md shrink-0 select-none whitespace-nowrap"
              title="Makine Şase Şemasını Görüntüle"
            >
              <Eye className="w-4 h-4 text-slate-950 shrink-0" />
              <span>Resmi Gör</span>
            </button>
          </div>

          {/* Kuyudibi ve Son Kat Ölçüleri */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Kuyudibi Ölçüsü (cm)</span>
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={data.pitDepth || ''}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.,-]/g, '');
                  onChange((prev) => ({ ...prev, pitDepth: val }));
                }}
                placeholder="---"
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3 py-2.5 text-white font-mono font-bold text-xs outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Son Kat Ölçüsü (cm)</span>
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={data.headroom || ''}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.,-]/g, '');
                  onChange((prev) => ({ ...prev, headroom: val }));
                }}
                placeholder="---"
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3 py-2.5 text-white font-mono font-bold text-xs outline-none"
              />
            </div>
          </div>

          {/* 1. TABLO: ŞASE ÖLÇÜLERİ KONTROLÜ (A, B, C, D, E, F(11), G, H, I Yanyana, Tek Satır) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
            <h4 className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>1. Şase Ölçüleri Kontrolü (mm)</span>
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse border border-slate-700 text-xs">
                <thead>
                  <tr className="bg-slate-950 text-amber-400 font-black">
                    {chaseCols.map((col) => (
                      <th key={col} className="border border-slate-700 p-2.5 font-mono">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-slate-950/60">
                    {chaseCols.map((col) => {
                      const val = data.chaseMeasurementsTable1?.[col] || '';
                      return (
                        <td key={`chase-input-${col}`} className="border border-slate-700 p-1.5">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={val}
                            onChange={(e) => handleChaseTableChange(col, e.target.value)}
                            placeholder="---"
                            className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-lg py-2 text-center text-white font-mono font-bold text-xs outline-none"
                          />
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. TABLO: KONSOL MESAFELERİ (K, L, M, N sütunları x 2 satır: U Bölme Tarafı, Tek Ray Tarafı) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
            <h4 className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>2. Konsol Mesafeleri Kontrolü (cm cinsinden giriniz)</span>
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse border border-slate-700 text-xs">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 font-black">
                    <th className="border border-slate-700 p-2.5 text-left w-36">BÖLGE / TARAF</th>
                    {['K', 'L', 'M', 'N'].map((col) => (
                      <th key={`console-col-${col}`} className="border border-slate-700 p-2.5 font-mono text-amber-400">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Satır 1: U Bölme Tarafı */}
                  <tr className="bg-slate-950/60">
                    <td className="border border-slate-700 p-2.5 text-left font-black text-slate-200 bg-slate-900/80">
                      1. U Bölme Tarafı
                    </td>
                    {['K', 'L', 'M', 'N'].map((col) => {
                      const val = data.consoleMeasurementsTable2?.uBolmeSide?.[col] || '';
                      return (
                        <td key={`ubolme-${col}`} className="border border-slate-700 p-1.5">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={val}
                            onChange={(e) => handleConsoleCellChange('uBolmeSide', col, e.target.value)}
                            placeholder="---"
                            className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-lg py-2 text-center text-white font-mono font-bold text-xs outline-none"
                          />
                        </td>
                      );
                    })}
                  </tr>

                  {/* Satır 2: Tek Ray Tarafı */}
                  <tr className="bg-slate-950/40">
                    <td className="border border-slate-700 p-2.5 text-left font-black text-slate-200 bg-slate-900/80">
                      2. Tek Ray Tarafı
                    </td>
                    {['K', 'L', 'M', 'N'].map((col) => {
                      const val = data.consoleMeasurementsTable2?.tekRaySide?.[col] || '';
                      return (
                        <td key={`tekray-${col}`} className="border border-slate-700 p-1.5">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={val}
                            onChange={(e) => handleConsoleCellChange('tekRaySide', col, e.target.value)}
                            placeholder="---"
                            className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-lg py-2 text-center text-white font-mono font-bold text-xs outline-none"
                          />
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* RAPOR BUTONU */}
          <div className="pt-3">
            <button
              type="button"
              id="btn-view-report-chassis"
              onClick={onViewReport}
              className="btn-amber-action w-full py-4 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 text-sm sm:text-base font-black rounded-2xl flex items-center justify-center gap-2.5 transition-all shadow-xl shadow-amber-500/25 cursor-pointer tracking-wide uppercase border-2 border-amber-600"
            >
              <FileCheck2 className="w-6 h-6 text-slate-950" />
              <span>Raporu Önizle ve Yazdır</span>
            </button>
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

      {/* 1. Kuyu Ölçü Referans Şeması Modalı (Resmi Gör) */}
      {(() => {
        const fixedLayout = FIXED_LAYOUT_DRAWINGS[data.layoutPosition];
        const rawLayoutImgUrl = data.layoutImages?.[data.layoutPosition]?.imageUrl || data.attachedImageUrl;
        const isCustomLayout = Boolean(rawLayoutImgUrl && !rawLayoutImgUrl.startsWith('/teknik-cizimler/'));
        const customLayoutImgUrl = isCustomLayout ? rawLayoutImgUrl : undefined;
        const customLayoutImgName = isCustomLayout
          ? (data.layoutImages?.[data.layoutPosition]?.imageName || data.attachedImageName)
          : undefined;

        const fixedChassis = FIXED_CHASSIS_DRAWINGS[activeChassisView];
        const rawChassisImgUrl = data.chassisImages?.[activeChassisView]?.imageUrl;
        const isCustomChassis = Boolean(rawChassisImgUrl && !rawChassisImgUrl.startsWith('/teknik-cizimler/'));
        const customChassisImgUrl = isCustomChassis ? rawChassisImgUrl : undefined;
        const customChassisImgName = isCustomChassis
          ? data.chassisImages?.[activeChassisView]?.imageName
          : undefined;

        return (
          <>
            <UnifiedDrawingModal
              isOpen={isReferenceModalOpen}
              onClose={() => setIsReferenceModalOpen(false)}
              title="Kuyu Ölçü Referans Şeması"
              badge={LAYOUT_TITLES[data.layoutPosition] || data.layoutPosition}
              imageName={customLayoutImgName}
              imageUrl={customLayoutImgUrl}
              defaultImageName={fixedLayout?.title}
              defaultImageUrl={fixedLayout?.url}
              syncKey={data.layoutPosition}
              onImageChange={(name, url) => {
                const currentLayout = data.layoutPosition;
                onChange((prev) => {
                  const updatedLayoutImages = {
                    ...(prev.layoutImages || {}),
                  };
                  if (url) {
                    updatedLayoutImages[currentLayout] = { imageName: name, imageUrl: url };
                  } else {
                    delete updatedLayoutImages[currentLayout];
                  }
                  return {
                    ...prev,
                    layoutImages: updatedLayoutImages,
                    attachedImageName: name,
                    attachedImageUrl: url,
                  };
                });
              }}
            />

            {/* 2. Makine Şase ve Askı Şeması Referans Modalı (Resmi Gör) */}
            <UnifiedDrawingModal
              isOpen={isChassisModalOpen}
              onClose={() => setIsChassisModalOpen(false)}
              title="Makine Şase Referans Şeması"
              badge={activeChassisView === 'SASE_SOL' ? 'Şase (Sol)' : 'Şase (Sağ)'}
              subViews={[
                { id: 'SASE_SAG', label: 'Makine Şasesi (Sağ)' },
                { id: 'SASE_SOL', label: 'Makine Şasesi (Sol)' },
              ]}
              activeSubView={activeChassisView}
              onSubViewChange={(id) => setActiveChassisView(id as 'SASE_SAG' | 'SASE_SOL')}
              imageName={customChassisImgName}
              imageUrl={customChassisImgUrl}
              defaultImageName={fixedChassis?.title}
              defaultImageUrl={fixedChassis?.url}
              syncKey={activeChassisView}
              onImageChange={(name, url) => {
                onChange((prev) => {
                  const updatedChassis = {
                    ...(prev.chassisImages || {}),
                  };
                  if (url) {
                    updatedChassis[activeChassisView] = { imageName: name, imageUrl: url };
                  } else {
                    delete updatedChassis[activeChassisView];
                  }
                  return {
                    ...prev,
                    chassisImages: updatedChassis,
                  };
                });
              }}
            />
          </>
        );
      })()}
    </div>
  );
};
