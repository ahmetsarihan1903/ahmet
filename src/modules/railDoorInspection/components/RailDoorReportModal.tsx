import React from 'react';
import { RailDoorInspectionFullData } from '../types';
import {
  ELEVATOR_TYPE_CONFIGS,
  getMeasurementDefsForLayout,
  MEASUREMENTS_MACHINE_CHASSIS,
  getDefaultFloorAlias,
} from '../constants';
import { BetaLogo } from '../../../components/BetaLogo';
import {
  Share2,
  X,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Sliders,
  Wrench,
} from 'lucide-react';

interface RailDoorReportModalProps {
  data: RailDoorInspectionFullData;
  onClose: () => void;
}

export const RailDoorReportModal: React.FC<RailDoorReportModalProps> = ({
  data,
  onClose,
}) => {
  const railDefs = getMeasurementDefsForLayout(data.layoutPosition);
  const chassisDefs = MEASUREMENTS_MACHINE_CHASSIS;
  const typeConfig = ELEVATOR_TYPE_CONFIGS.find((c) => c.type === data.mainType);
  const layoutObj = typeConfig?.allowedLayouts.find((l) => l.layout === data.layoutPosition);

  const stopCount = data.stopCount || 1;
  const startFloor = data.startFloor ?? 0;
  const stopIndices = Array.from({ length: stopCount }, (_, i) => i + 1);
  const columnCodes = Array.from({ length: 15 }, (_, i) => String(i + 1));

  // Sapmaları topla
  const matrixDeviations: {
    stopLabel: string;
    colCode: string;
    project: string;
    actual: string;
    diff: number;
  }[] = [];

  stopIndices.forEach((sIdx) => {
    const floorNum = startFloor + (sIdx - 1);
    const alias = data.floorAliases?.[sIdx] ?? getDefaultFloorAlias(floorNum);
    const stopLabel = `${sIdx}.DR (${alias})`;
    const row = data.floorMatrixMeasurements?.[String(sIdx)] || {};

    columnCodes.forEach((cCode) => {
      const act = row[cCode];
      const nom = data.projectNominalValues?.[cCode];
      if (act && nom && act.trim() !== '' && nom.trim() !== '') {
        const numAct = parseFloat(act);
        const numNom = parseFloat(nom);
        if (!isNaN(numAct) && !isNaN(numNom) && numAct - numNom !== 0) {
          matrixDeviations.push({
            stopLabel,
            colCode: cCode,
            project: nom,
            actual: act,
            diff: numAct - numNom,
          });
        }
      }
    });
  });

  const chassisDeviations: {
    code: string;
    title: string;
    project: string;
    actual: string;
    diff: number;
  }[] = [];

  chassisDefs.forEach((mDef) => {
    const val = data.machineChassisMeasurements?.[mDef.code];
    if (val && val.projectValueMm && val.actualValueMm) {
      const p = parseFloat(val.projectValueMm);
      const a = parseFloat(val.actualValueMm);
      if (!isNaN(p) && !isNaN(a) && a - p !== 0) {
        chassisDeviations.push({
          code: mDef.code,
          title: mDef.title,
          project: val.projectValueMm,
          actual: val.actualValueMm,
          diff: a - p,
        });
      }
    }
  });

  const totalDeviationsCount = matrixDeviations.length + chassisDeviations.length;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const title = `*BETA ASANSÖR - RAY KAPI VE MAKİNE ŞASE KONTROL RAPORU*`;
    const details = [
      title,
      `*Seri No:* ${data.identity.serialNumber || '-'}`,
      `*Referans:* ${data.identity.reference || '-'}`,
      `*Tesis Yeri:* ${data.identity.location || '-'}`,
      `*Durak Sayısı:* ${data.stopCount || 1} Durak`,
      `*Montaj Ustası:* ${data.identity.installerMaster || '-'}`,
      `*Proje Sorumlusu:* ${data.identity.projectManager || '-'}`,
      `*Kontrol Eden:* ${data.identity.inspector || '-'}`,
      `*Tarih:* ${data.inspectionDateDisplay}`,
      `*Asansör Tipi:* ${typeConfig?.label} (${layoutObj?.label})`,
      `*Tespit Edilen Toplam Sapma:* ${totalDeviationsCount} adet`,
    ].join('\n');

    const encoded = encodeURIComponent(details);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex flex-col justify-start items-center p-2 sm:p-4 overflow-y-auto">
      {/* Üst İşlem Çubuğu (Modal Bar) */}
      <div className="w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-2xl p-3 sm:p-4 mb-4 flex items-center justify-between shadow-xl shrink-0 print:hidden">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-xs sm:text-sm font-black text-white">
            Ray, Kapı ve Makine Şase Kontrol Raporu Önizleme
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>PDF İndir / Yazdır</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* RESMİ A4 PDF ÇIKTI ALANI */}
      <div
        id="official-pdf-report"
        className="w-full max-w-5xl bg-white text-slate-900 rounded-xl shadow-2xl p-6 sm:p-8 space-y-6 print:p-0 print:shadow-none print:w-full print:max-w-none text-xs"
      >
        {/* Rapor Başlığı */}
        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
          <div className="flex items-center gap-3">
            <BetaLogo size="md" />
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-950 uppercase">
                BETA ASANSÖR MÜHENDİSLİK
              </h1>
              <h2 className="text-xs sm:text-sm font-black text-amber-700 tracking-wide uppercase">
                RAY, KAPI VE MAKİNE ŞASE KONTROL RAPORU
              </h2>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] font-mono text-slate-500">DOKÜMAN NO: BT-RK-2026</div>
            <div className="text-xs font-bold text-slate-900 mt-1">
              Rapor Tarihi: {data.inspectionDateDisplay}
            </div>
          </div>
        </div>

        {/* Proje Kimlik Bilgileri Tablosu */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
          <div>
            <span className="text-[10px] font-bold text-slate-500 block uppercase">Asansör Seri No</span>
            <span className="text-xs font-black text-slate-900">{data.identity.serialNumber || '-'}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 block uppercase">Referans / Şantiye</span>
            <span className="text-xs font-black text-slate-900">{data.identity.reference || '-'}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 block uppercase">Tesis Yeri</span>
            <span className="text-xs font-black text-slate-900">{data.identity.location || '-'}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 block uppercase">Durak Sayısı</span>
            <span className="text-xs font-black text-slate-900">{data.stopCount || 1} Durak</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 block uppercase">Montajı Yapan Usta</span>
            <span className="text-xs font-black text-slate-900">{data.identity.installerMaster || '-'}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 block uppercase">Proje Sorumlusu</span>
            <span className="text-xs font-black text-slate-900">{data.identity.projectManager || '-'}</span>
          </div>
          <div className="sm:col-span-2">
            <span className="text-[10px] font-bold text-slate-500 block uppercase">Kontrolü Yapan</span>
            <span className="text-xs font-black text-slate-900">{data.identity.inspector || '-'}</span>
          </div>
        </div>

        {/* Teknik Özellikler ve Yerleşim Özeti */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-slate-900">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-amber-600 text-white font-black rounded text-[10px]">
              TİP & YERLEŞİM:
            </span>
            <span className="font-bold text-xs">
              {typeConfig?.label} — {layoutObj?.label}
            </span>
          </div>
          <div className="text-xs font-bold text-amber-900">
            Kontrol Modeli: 15 Sütun Ray & Kapı Matrisi + Makine Şase
          </div>
        </div>

        {/* 1. BÖLÜM: 15 SÜTUN RAY & KAPI MATRİS TABLOSU (SİLL 1 FORMATI) */}
        <div className="space-y-2">
          <h3 className="text-xs font-black uppercase text-slate-900 border-b-2 border-slate-900 pb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-amber-600" />
              1. BÖLÜM: RAY & KAPI KAT ÖLÇÜ MATRİSİ (mm)
            </span>
            <span className="text-[10px] font-normal text-slate-600 lowercase">
              (1-15 nolu sütun ölçüleri)
            </span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse border border-slate-400 text-[9px]">
              <thead>
                <tr className="bg-slate-200 text-slate-950 font-black">
                  <th className="border border-slate-400 p-1 w-10">DURAK</th>
                  <th className="border border-slate-400 p-1 w-14">KAT RUMUZ</th>
                  {columnCodes.map((c) => (
                    <th key={c} className="border border-slate-400 p-1 min-w-[28px]">
                      {c}
                    </th>
                  ))}
                </tr>
                {/* Proje Nominal Satırı */}
                <tr className="bg-amber-100/70 text-amber-950 font-black">
                  <th className="border border-slate-400 p-1">PROJE</th>
                  <th className="border border-slate-400 p-1">NOMİNAL</th>
                  {columnCodes.map((c) => (
                    <td key={`nom-${c}`} className="border border-slate-400 p-1 font-mono">
                      {data.projectNominalValues?.[c] || '-'}
                    </td>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stopIndices.map((sIdx, rowIdx) => {
                  const floorNum = startFloor + (sIdx - 1);
                  const alias = data.floorAliases?.[sIdx] ?? getDefaultFloorAlias(floorNum);
                  const row = data.floorMatrixMeasurements?.[String(sIdx)] || {};

                  return (
                    <tr key={`rep-stop-${sIdx}`} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="border border-slate-400 p-1 font-black bg-slate-100 text-slate-800">
                        {sIdx}.DR
                      </td>
                      <td className="border border-slate-400 p-1 font-black text-amber-900 bg-amber-50/50">
                        {alias}
                      </td>
                      {columnCodes.map((cCode) => {
                        const cellVal = row[cCode] || '';
                        const nomVal = data.projectNominalValues?.[cCode] || '';
                        let cellDiff: number | null = null;
                        if (cellVal && nomVal) {
                          const nC = parseFloat(cellVal);
                          const nN = parseFloat(nomVal);
                          if (!isNaN(nC) && !isNaN(nN)) cellDiff = nC - nN;
                        }

                        let textClass = 'text-slate-900';
                        if (cellDiff !== null && cellDiff !== 0) {
                          textClass = Math.abs(cellDiff) > 2 ? 'text-red-700 font-black bg-red-50' : 'text-amber-800 font-bold bg-amber-50';
                        }

                        return (
                          <td key={`rep-cell-${sIdx}-${cCode}`} className={`border border-slate-400 p-1 font-mono ${textClass}`}>
                            {cellVal || '---'}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. BÖLÜM: MAKİNE ŞASE ÖLÇÜLERİ TABLOSU */}
        <div className="space-y-2 pt-2">
          <h3 className="text-xs font-black uppercase text-slate-900 border-b-2 border-slate-900 pb-1 flex items-center gap-1.5">
            <Wrench className="w-3.5 h-3.5 text-amber-600" />
            2. BÖLÜM: MAKİNE ŞASE VE ASKI ÖLÇÜ TABLOSU (mm)
          </h3>

          <table className="w-full text-left border-collapse border border-slate-300 text-[10px]">
            <thead>
              <tr className="bg-slate-100 text-slate-800">
                <th className="border border-slate-300 p-1.5 font-black w-12 text-center">Kod</th>
                <th className="border border-slate-300 p-1.5 font-black">Şase ve Eksen Ölçüm Noktası</th>
                <th className="border border-slate-300 p-1.5 font-black w-24 text-center">Proje (mm)</th>
                <th className="border border-slate-300 p-1.5 font-black w-24 text-center">Saha (mm)</th>
                <th className="border border-slate-300 p-1.5 font-black w-24 text-center">Sapma / Fark</th>
              </tr>
            </thead>
            <tbody>
              {chassisDefs.map((mDef, idx) => {
                const val = data.machineChassisMeasurements?.[mDef.code];
                const proj = val?.projectValueMm || '';
                const act = val?.actualValueMm || '';
                const hasValues = proj !== '' && act !== '';
                const diff = hasValues ? parseFloat(act) - parseFloat(proj) : null;

                return (
                  <tr key={mDef.code} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="border border-slate-300 p-1.5 font-black text-center text-sky-800 bg-sky-50/50">
                      {mDef.code}
                    </td>
                    <td className="border border-slate-300 p-1.5 font-bold text-slate-900">
                      {mDef.title}
                    </td>
                    <td className="border border-slate-300 p-1.5 text-center font-mono font-bold text-slate-700">
                      {proj || '-'}
                    </td>
                    <td className="border border-slate-300 p-1.5 text-center font-mono font-bold text-slate-900">
                      {act || '-'}
                    </td>
                    <td className="border border-slate-300 p-1.5 text-center font-mono font-black">
                      {diff !== null ? (
                        diff === 0 ? (
                          <span className="text-emerald-700">0 mm (Tam)</span>
                        ) : (
                          <span className={Math.abs(diff) > 2 ? 'text-red-600' : 'text-amber-600'}>
                            {diff > 0 ? `+${diff}` : diff} mm
                          </span>
                        )
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Tespit Edilen Sapmalar Özeti */}
        {totalDeviationsCount > 0 ? (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg space-y-1.5">
            <h4 className="text-xs font-black text-red-900 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
              Saha ve Proje Arasında Tespit Edilen Sapmalar ({totalDeviationsCount} Adet):
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto text-[10px]">
              {matrixDeviations.map((d, i) => (
                <div key={`m-dev-${i}`} className="flex items-center justify-between p-1 bg-white border border-red-100 rounded">
                  <span className="font-bold text-slate-900 truncate pr-2">
                    {d.stopLabel} / Sütun {d.colCode}:
                  </span>
                  <span className="font-mono font-black text-red-700 shrink-0">
                    P: {d.project} / S: {d.actual} ({d.diff > 0 ? `+${d.diff}` : d.diff} mm)
                  </span>
                </div>
              ))}
              {chassisDeviations.map((d, i) => (
                <div key={`c-dev-${i}`} className="flex items-center justify-between p-1 bg-white border border-red-100 rounded">
                  <span className="font-bold text-slate-900 truncate pr-2">
                    {d.code} - {d.title}:
                  </span>
                  <span className="font-mono font-black text-red-700 shrink-0">
                    P: {d.project} / S: {d.actual} ({d.diff > 0 ? `+${d.diff}` : d.diff} mm)
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-emerald-900 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Tüm ray, kapı ve makine şase ölçüleri proje kriterlerine tam uyumludur. Sapma tespit edilmemiştir.</span>
          </div>
        )}

        {/* Resmi İmza & Onay Alanı */}
        <div className="grid grid-cols-3 gap-4 pt-6 border-t-2 border-slate-900 text-center">
          <div className="space-y-8">
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase">Montajı Yapan Usta</div>
              <div className="text-xs font-black text-slate-900 mt-1">{data.identity.installerMaster || '........................'}</div>
            </div>
            <div className="text-[10px] text-slate-400 italic">İmza</div>
          </div>

          <div className="space-y-8">
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase">Proje Sorumlusu</div>
              <div className="text-xs font-black text-slate-900 mt-1">{data.identity.projectManager || '........................'}</div>
            </div>
            <div className="text-[10px] text-slate-400 italic">İmza</div>
          </div>

          <div className="space-y-8">
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase">Kontrolü Yapan (Denetçi)</div>
              <div className="text-xs font-black text-slate-900 mt-1">{data.identity.inspector || '........................'}</div>
            </div>
            <div className="text-[10px] text-slate-400 italic">İmza & Kaşe</div>
          </div>
        </div>
      </div>
    </div>
  );
};
