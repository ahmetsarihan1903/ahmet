import React, { useState } from 'react';
import { RailDoorInspectionFullData } from '../types';
import {
  ELEVATOR_TYPE_CONFIGS,
  getMeasurementDefsForLayout,
  MEASUREMENTS_MACHINE_CHASSIS,
  getDefaultFloorAlias,
  formatCmToMm,
  calculateMmDeviation,
  getColumnInferredNominals,
  LAYOUT_TITLES,
} from '../constants';
import { BetaLogo } from '../../../components/BetaLogo';
import {
  Share2,
  X,
  AlertTriangle,
  Sliders,
  Wrench,
  Download,
  CheckCircle2,
  Loader2,
  FileText,
  Printer,
} from 'lucide-react';
import {
  downloadRailDoorPdf,
  shareRailDoorPdf,
  getRailDoorStandardizedFileName,
} from '../utils/railDoorPdfGenerator';

interface RailDoorReportModalProps {
  data: RailDoorInspectionFullData;
  onClose: () => void;
}

export const RailDoorReportModal: React.FC<RailDoorReportModalProps> = ({
  data,
  onClose,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const railDefs = getMeasurementDefsForLayout(data.layoutPosition);
  const chassisDefs = MEASUREMENTS_MACHINE_CHASSIS;
  const typeConfig = ELEVATOR_TYPE_CONFIGS.find((c) => c.type === data.mainType);
  const layoutObj = typeConfig?.allowedLayouts.find((l) => l.layout === data.layoutPosition);

  const stopCount = data.stopCount || 1;
  const startFloor = data.startFloor ?? 0;
  const stopIndices = Array.from({ length: stopCount }, (_, i) => i + 1);
  const baseColumnCodes = Array.from({ length: 15 }, (_, i) => String(i + 1));
  const columnCodes = [...baseColumnCodes, ...(data.customColumnCodes || [])];

  // Proje nominali girilmemiş sütunlar için katlar arası otomatik iç analiz
  const inferredNominals = getColumnInferredNominals(
    data.floorMatrixMeasurements || {},
    columnCodes
  );

  // Sapmaları topla (Tümü MM cinsinden hesaplanır)
  const matrixDeviations: {
    stopLabel: string;
    colCode: string;
    projectMm: number | null;
    actualMm: number;
    diffMm: number;
    badgeText: string;
    isCritical: boolean;
    isInferred?: boolean;
  }[] = [];

  stopIndices.forEach((sIdx) => {
    const floorNum = startFloor + (sIdx - 1);
    const alias = data.floorAliases?.[sIdx] ?? getDefaultFloorAlias(floorNum);
    const stopLabel = `${sIdx}.DR (${alias})`;
    const row = data.floorMatrixMeasurements?.[String(sIdx)] || {};

    columnCodes.forEach((cCode) => {
      const act = row[cCode];
      const nom = data.projectNominalValues?.[cCode];
      const dev = calculateMmDeviation(
        act,
        nom,
        cCode,
        inferredNominals[cCode],
        data.layoutPosition
      );
      if (dev && !dev.isMatch) {
        matrixDeviations.push({
          stopLabel,
          colCode: cCode,
          projectMm: dev.nomMm,
          actualMm: dev.cellMm,
          diffMm: dev.diffMm,
          badgeText: dev.badgeText,
          isCritical: dev.isCritical,
          isInferred: dev.isInferred,
        });
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
      const p = parseFloat(val.projectValueMm.replace(',', '.'));
      const a = parseFloat(val.actualValueMm.replace(',', '.'));
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

  const handleDownloadPDF = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    setStatusMessage(null);
    try {
      const res = await downloadRailDoorPdf(data);
      if (res.success) {
        setStatusMessage({ text: res.message, type: 'success' });
      } else {
        setStatusMessage({ text: res.message, type: 'error' });
      }
      setTimeout(() => setStatusMessage(null), 6000);
    } catch (err: any) {
      setStatusMessage({ text: 'PDF indirme hatası: ' + err.message, type: 'error' });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSharePDF = async () => {
    if (isSharing) return;
    setIsSharing(true);
    setStatusMessage(null);
    try {
      const res = await shareRailDoorPdf(data);
      if (res.success) {
        setStatusMessage({ text: res.message, type: 'success' });
      } else {
        setStatusMessage({ text: res.message, type: 'error' });
      }
      setTimeout(() => setStatusMessage(null), 6000);
    } catch (err: any) {
      setStatusMessage({ text: 'PDF paylaşma hatası: ' + err.message, type: 'error' });
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex flex-col justify-start items-center p-2 sm:p-4 overflow-y-auto">
      {/* Üst İşlem Çubuğu (Modal Bar) */}
      <div className="w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-2xl p-3 sm:p-4 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl shrink-0 print:hidden">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          <div>
            <div className="text-xs sm:text-sm font-black text-white">
              Ray, Kapı ve Makine Şase Kontrol Raporu
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              {getRailDoorStandardizedFileName(data)}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          {/* Direct Print Button (window.print) */}
          <button
            type="button"
            onClick={() => window.print()}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-98 text-white font-black text-xs sm:text-sm shadow-md transition-all cursor-pointer"
            title="Raporu Yazıcıdan veya PDF Olarak Yazdır"
          >
            <Printer className="w-4 h-4 text-white" />
            <span>Yazdır</span>
          </button>

          {/* Direct PDF Share Button (Sends actual PDF file) */}
          <button
            type="button"
            onClick={handleSharePDF}
            disabled={isSharing || isDownloading}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-black text-xs sm:text-sm shadow-md transition-all cursor-pointer disabled:bg-slate-700"
            title="PDF Dosyasını WhatsApp, Telegram veya Drive ile doğrudan belge olarak paylaş"
          >
            {isSharing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
            <span>PDF Paylaş</span>
          </button>

          {/* Direct PDF Download Button (Generates & saves PDF file) */}
          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={isDownloading || isSharing}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-98 text-slate-950 font-black text-xs sm:text-sm shadow-md transition-all cursor-pointer disabled:bg-slate-700"
            title="PDF dosyasını tablete veya bilgisayara indir ve kaydet"
          >
            {isDownloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>PDF İndir</span>
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

      {/* Status Feedback Toast */}
      {statusMessage && (
        <div
          className={`w-full max-w-5xl mb-4 p-3 rounded-xl border flex items-center gap-2.5 text-xs sm:text-sm font-bold shadow-lg animate-in fade-in duration-200 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500 text-emerald-100'
              : 'bg-red-950/90 border-red-500 text-red-100'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* RESMİ A4 PDF ÇIKTI ALANI (Minimum 11 punto / text-xs ve üzeri) */}
      <div
        id="official-pdf-report"
        className="w-full max-w-5xl bg-white text-slate-900 rounded-xl shadow-2xl p-6 sm:p-8 space-y-6 print:p-0 print:shadow-none print:w-full print:max-w-none text-xs sm:text-sm leading-relaxed"
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
            <div className="text-[11px] font-mono text-slate-600">DOKÜMAN NO: BT-RK-2026</div>
            <div className="text-xs sm:text-sm font-bold text-slate-900 mt-1">
              Rapor Tarihi: {data.inspectionDateDisplay}
            </div>
          </div>
        </div>

        {/* Proje Kimlik Bilgileri Tablosu */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs">
          <div>
            <span className="text-[11px] font-bold text-slate-600 block uppercase">Asansör Seri No</span>
            <span className="text-xs sm:text-sm font-black text-slate-900">{data.identity.serialNumber || '-'}</span>
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-600 block uppercase">Referans / Şantiye</span>
            <span className="text-xs sm:text-sm font-black text-slate-900">{data.identity.reference || '-'}</span>
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-600 block uppercase">Tesis Yeri</span>
            <span className="text-xs sm:text-sm font-black text-slate-900">{data.identity.location || '-'}</span>
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-600 block uppercase">Durak Sayısı</span>
            <span className="text-xs sm:text-sm font-black text-slate-900">{data.stopCount || 1} Durak</span>
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-600 block uppercase">Montajı Yapan Usta</span>
            <span className="text-xs sm:text-sm font-black text-slate-900">{data.identity.installerMaster || '-'}</span>
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-600 block uppercase">Proje Sorumlusu</span>
            <span className="text-xs sm:text-sm font-black text-slate-900">{data.identity.projectManager || '-'}</span>
          </div>
          <div className="sm:col-span-2">
            <span className="text-[11px] font-bold text-slate-600 block uppercase">Kontrolü Yapan</span>
            <span className="text-xs sm:text-sm font-black text-slate-900">{data.identity.inspector || '-'}</span>
          </div>
        </div>

        {/* Teknik Özellikler ve Yerleşim Özeti */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-slate-900 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-amber-600 text-white font-black rounded text-[11px]">
              TİP & YERLEŞİM:
            </span>
            <span className="font-bold">
              {typeConfig?.label} — {layoutObj?.label}
            </span>
          </div>
          <div className="font-bold text-amber-900 text-xs">
            Kontrol Modeli: 15 Sütun Ray & Kapı Matrisi + Makine Şase
          </div>
        </div>

        {/* 1. BÖLÜM: 15 SÜTUN RAY & KAPI MATRİS TABLOSU */}
        <div className="space-y-2">
          <h3 className="text-xs sm:text-sm font-black uppercase text-slate-900 border-b-2 border-slate-900 pb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-amber-600" />
              1. BÖLÜM: RAY & KAPI KAT ÖLÇÜ MATRİSİ (mm)
            </span>
            <span className="text-[11px] font-bold text-amber-700">
              *Tüm değerler milimetreye (mm) çevrilmiştir
            </span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse border border-slate-400 text-[11px] sm:text-xs">
              <thead>
                <tr className="bg-slate-200 text-slate-950 font-black">
                  <th className="border border-slate-400 p-1.5 w-12">DURAK</th>
                  <th className="border border-slate-400 p-1.5 w-16">KAT RUMUZ</th>
                  {columnCodes.map((c) => {
                    let headerText = c;
                    if (c === '9' && data.column9Direction) {
                      headerText = `9 - ${data.column9Direction}`;
                    }
                    return (
                      <th key={c} className="border border-slate-400 p-1 min-w-[30px] whitespace-nowrap">
                        {headerText}
                      </th>
                    );
                  })}
                </tr>
                {/* Proje Nominal Satırı */}
                <tr className="bg-amber-100/70 text-amber-950 font-black">
                  <th className="border border-slate-400 p-1.5">PROJE</th>
                  <th className="border border-slate-400 p-1.5">NOM (mm)</th>
                  {columnCodes.map((c) => (
                    <td key={`nom-${c}`} className="border border-slate-400 p-1 font-mono font-bold">
                      {formatCmToMm(data.projectNominalValues?.[c])}
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
                      <td className="border border-slate-400 p-1.5 font-black bg-slate-100 text-slate-800">
                        {sIdx}.DR
                      </td>
                      <td className="border border-slate-400 p-1.5 font-black text-amber-900 bg-amber-50/50">
                        {alias}
                      </td>
                      {columnCodes.map((cCode) => {
                        const cellVal = row[cCode] || '';
                        const nomVal = data.projectNominalValues?.[cCode] || '';
                        const dev = calculateMmDeviation(
                          cellVal,
                          nomVal,
                          cCode,
                          inferredNominals[cCode],
                          data.layoutPosition
                        );

                        let textClass = 'text-slate-900';
                        if (dev && !dev.isMatch) {
                          textClass = dev.isCritical ? 'text-red-700 font-black bg-red-50' : 'text-amber-800 font-bold bg-amber-50';
                        }

                        return (
                          <td key={`rep-cell-${sIdx}-${cCode}`} className={`border border-slate-400 p-1 font-mono ${textClass}`}>
                            {formatCmToMm(cellVal, '---')}
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

        {/* 2. BÖLÜM: ŞASE ÖLÇÜLERİ VE KONSOL MESAFELERİ */}
        <div className="space-y-4 pt-2">
          <h3 className="text-xs sm:text-sm font-black uppercase text-slate-900 border-b-2 border-slate-900 pb-1 flex items-center gap-1.5">
            <Wrench className="w-4 h-4 text-amber-600" />
            2. BÖLÜM: ŞASE ÖLÇÜLERİ, KUYUDİBİ, SON KAT VE KONSOL MESAFELERİ (mm)
          </h3>

          {/* Kuyudibi ve Son Kat Ölçüleri Özeti */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-300 text-xs">
            <div>
              <span className="font-bold text-slate-700 block uppercase">Kuyudibi Ölçüsü:</span>
              <span className="font-mono font-black text-slate-900 text-sm">
                {(() => {
                  const val = data.pitDepth;
                  if (!val || val.trim() === '') return '---';
                  const n = parseFloat(val.replace(',', '.'));
                  return isNaN(n) ? val : `${Math.round(n * 10)} mm (${val} cm)`;
                })()}
              </span>
            </div>
            <div>
              <span className="font-bold text-slate-700 block uppercase">Son Kat Ölçüsü:</span>
              <span className="font-mono font-black text-slate-900 text-sm">
                {(() => {
                  const val = data.headroom;
                  if (!val || val.trim() === '') return '---';
                  const n = parseFloat(val.replace(',', '.'));
                  return isNaN(n) ? val : `${Math.round(n * 10)} mm (${val} cm)`;
                })()}
              </span>
            </div>
          </div>

          {/* Tablo 1: Şase Ölçüleri Kontrolü */}
          <div className="space-y-1.5">
            <div className="text-xs font-bold text-slate-800">1. Şase Ölçüleri Kontrolü (mm)</div>
            <table className="w-full text-center border-collapse border border-slate-400 text-xs">
              <thead>
                <tr className="bg-slate-200 text-slate-950 font-black">
                  {['A', 'B', 'C', 'D', 'E', 'F(11)', '10', 'G', 'H', 'I'].map((col) => (
                    <th key={col} className="border border-slate-400 p-2 font-mono">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="bg-white">
                  {['A', 'B', 'C', 'D', 'E', 'F(11)', '10', 'G', 'H', 'I'].map((col) => {
                    const valCm = data.chaseMeasurementsTable1?.[col] || '';
                    let displayMm = '---';
                    if (valCm.trim() !== '') {
                      const num = parseFloat(valCm.replace(',', '.'));
                      if (!isNaN(num)) {
                        displayMm = Math.round(num * 10).toString();
                      } else {
                        displayMm = valCm;
                      }
                    }
                    return (
                      <td key={`rep-chase-${col}`} className="border border-slate-400 p-2 font-mono font-bold text-slate-900">
                        {displayMm}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Tablo 2: Konsol Mesafeleri (K, L, M, N sütunları x 2 satır: U Bölme Tarafı, Tek Ray Tarafı - cm girilir, mm gösterilir, boşsa ---) */}
          <div className="space-y-1.5 pt-1">
            <div className="text-xs font-bold text-slate-800">2. Konsol Mesafeleri (mm)</div>
            <table className="w-full text-center border-collapse border border-slate-400 text-xs">
              <thead>
                <tr className="bg-slate-200 text-slate-950 font-black">
                  <th className="border border-slate-400 p-2 text-left w-36">BÖLGE / TARAF</th>
                  {['K', 'L', 'M', 'N'].map((col) => (
                    <th key={`rep-console-col-${col}`} className="border border-slate-400 p-2 font-mono">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Satır 1: U Bölme Tarafı */}
                <tr className="bg-white">
                  <td className="border border-slate-400 p-2 text-left font-black text-slate-900 bg-slate-50">
                    1. U Bölme Tarafı
                  </td>
                  {['K', 'L', 'M', 'N'].map((col) => {
                    const valCm = data.consoleMeasurementsTable2?.uBolmeSide?.[col] || '';
                    let displayMm = '---';
                    if (valCm.trim() !== '') {
                      const num = parseFloat(valCm.replace(',', '.'));
                      if (!isNaN(num)) {
                        // cm cinsinden girilen değeri mm'ye çevir (1 cm = 10 mm)
                        displayMm = Math.round(num * 10).toString();
                      } else {
                        displayMm = valCm;
                      }
                    }
                    return (
                      <td key={`rep-ubolme-${col}`} className="border border-slate-400 p-2 font-mono font-bold text-slate-900">
                        {displayMm}
                      </td>
                    );
                  })}
                </tr>

                {/* Satır 2: Tek Ray Tarafı */}
                <tr className="bg-slate-50">
                  <td className="border border-slate-400 p-2 text-left font-black text-slate-900 bg-slate-100">
                    2. Tek Ray Tarafı
                  </td>
                  {['K', 'L', 'M', 'N'].map((col) => {
                    const valCm = data.consoleMeasurementsTable2?.tekRaySide?.[col] || '';
                    let displayMm = '---';
                    if (valCm.trim() !== '') {
                      const num = parseFloat(valCm.replace(',', '.'));
                      if (!isNaN(num)) {
                        displayMm = Math.round(num * 10).toString();
                      } else {
                        displayMm = valCm;
                      }
                    }
                    return (
                      <td key={`rep-tekray-${col}`} className="border border-slate-400 p-2 font-mono font-bold text-slate-900">
                        {displayMm}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. BÖLÜM: SAHA UYGUNSUZLUKLARI VE KUSURLAR */}
        {data.nonConformities && data.nonConformities.length > 0 && (
          <div className="space-y-2 pt-2">
            <h3 className="text-xs sm:text-sm font-black uppercase text-slate-900 border-b-2 border-slate-900 pb-1 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              3. BÖLÜM: SAHA UYGUNSUZLUKLARI VE KUSUR KAYITLARI ({data.nonConformities.length} Adet)
            </h3>
            <div className="space-y-1.5">
              {data.nonConformities.map((item, idx) => (
                <div key={item.id} className="p-2.5 bg-slate-50 border border-slate-300 rounded text-xs sm:text-sm">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 bg-slate-200 text-slate-800 rounded text-[11px]">{item.floor || 'Genel'}</span>
                      <span>{idx + 1}. {item.title}</span>
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      item.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                    }`}>
                      {item.status === 'resolved' ? 'Giderildi' : 'Açık / Bekliyor'}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-slate-700 mt-1 text-xs">{item.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
