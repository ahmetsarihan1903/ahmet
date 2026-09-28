import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import {
  Share2,
  Check,
  RotateCcw,
  Ruler,
  CheckCircle2,
  ShieldAlert,
  Loader2,
  Download,
  Printer,
  FolderCheck,
  FileText,
  Smartphone,
  ShieldCheck,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { AuditFormData, InspectionItem } from '../types';
import { BetaLogo } from './BetaLogo';
import { getBetaLogoDataUrl } from '../utils/logoUtils';
import { ReAuditModal } from './ReAuditModal';
import { uploadAuditJsonToDrive } from '../services/googleDriveService';
import { DriveSyncModal } from './DriveSyncModal';

interface ReportViewProps {
  data: AuditFormData;
  onEditAudit: () => void;
  onNewInspection?: () => void;
  onUpdateData?: (updated: AuditFormData) => void;
}

// Convert special Turkish characters for standard jsPDF Latin fonts to prevent corrupted glyphs
const cleanTr = (val: string | number | undefined | null): string => {
  if (val === undefined || val === null || val === '') return '';
  const str = String(val);
  return str
    .replace(/İ/g, 'I')
    .replace(/ı/g, 'i')
    .replace(/Ğ/g, 'G')
    .replace(/ğ/g, 'g')
    .replace(/Ş/g, 'S')
    .replace(/ş/g, 's')
    .replace(/Ç/g, 'C')
    .replace(/ç/g, 'c')
    .replace(/Ö/g, 'O')
    .replace(/ö/g, 'o')
    .replace(/Ü/g, 'U')
    .replace(/ü/g, 'u');
};

export interface CategorySummaryStat {
  id: string;
  name: string;
  shortName: string;
  totalItems: number;
  udCount: number;
  resolvedCount: number;
  issues: {
    id: string;
    title: string;
    isResolved?: boolean;
    note?: string;
    floor?: string;
    description?: string;
  }[];
}

export const ReportView: React.FC<ReportViewProps> = ({
  data,
  onEditAudit,
  onNewInspection,
  onUpdateData,
}) => {
  const { deviceProfile } = useUser();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [downloadedFilePath, setDownloadedFilePath] = useState<string | null>(null);
  const [isReAuditModalOpen, setIsReAuditModalOpen] = useState(false);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [isDriveUploading, setIsDriveUploading] = useState(false);
  const [driveUploadSuccess, setDriveUploadSuccess] = useState(false);

  // Collect all UD items across all pages
  const allUDItems: { category: string; item: InspectionItem }[] = [];

  const collectUD = (categoryName: string, items: InspectionItem[]) => {
    items?.forEach((it) => {
      if (it.isNonCompliant) {
        allUDItems.push({ category: categoryName, item: it });
      }
    });
  };

  collectUD('Kumanda Panosu', data.controlPanelItems);
  collectUD(`Motor / Şase (${data.elevatorType})`, data.motorChassisItems);
  collectUD('Kabin Üstü Kontrolleri', data.cabinTopItems);
  collectUD('Ağırlık Karkası Kontrolleri', data.counterweightItems);
  collectUD('Kuyu İçerisi ve Kuyu Dibi', data.shaftAndPitItems);
  collectUD('Kabin İçi ve Kat Butonları', data.cabinAndFloorButtonsItems);
  collectUD('Kabin ve Kat Kapısı Montajları', data.doorsItems);

  if (data.rideComfortNonCompliant) {
    allUDItems.push({
      category: 'Seyir ve Konfor',
      item: {
        id: 'ride_comfort_report',
        title: 'Asansör Seyir ve Konfor Uygunsuzluğu',
        isNonCompliant: true,
        description: data.rideComfortNotes || 'Konfor problemi tespit edildi.',
        category: 'Seyir ve Konfor',
        isResolved: data.rideComfortResolved,
        resolutionNote: data.rideComfortResolutionNote,
      },
    });
  }

  const totalUDCount = allUDItems.length;
  const resolvedUDCount = allUDItems.filter((entry) => entry.item.isResolved).length;
  const remainingUDCount = totalUDCount - resolvedUDCount;
  const isAllResolved = totalUDCount > 0 && resolvedUDCount === totalUDCount;
  const hasReAuditDone = totalUDCount > 0 && resolvedUDCount > 0;

  // 8 Bölüm Bazlı Özet Listesi (1. Sayfa Yönetici Özeti İçin)
  const getCategorySummaries = (): CategorySummaryStat[] => {
    const rawCategories: { id: string; name: string; shortName: string; items: InspectionItem[] }[] = [
      { id: 'panel', name: 'Kumanda Panosu', shortName: 'Panosu', items: data.controlPanelItems || [] },
      { id: 'motor', name: `Motor / Şase (${data.elevatorType})`, shortName: 'Motor / Şase', items: data.motorChassisItems || [] },
      { id: 'cabintop', name: 'Kabin Üstü Kontrolleri', shortName: 'Kabin Üstü', items: data.cabinTopItems || [] },
      { id: 'cwt', name: 'Ağırlık Karkası Kontrolleri', shortName: 'Ağırlık', items: data.counterweightItems || [] },
      { id: 'shaft', name: 'Kuyu İçerisi ve Kuyu Dibi', shortName: 'Kuyu & Dibi', items: data.shaftAndPitItems || [] },
      { id: 'cop', name: 'Kabin İçi ve Kat Butonları', shortName: 'Kabin & Butonlar', items: data.cabinAndFloorButtonsItems || [] },
      { id: 'doors', name: 'Kabin ve Kat Kapısı Montajları', shortName: 'Kapılar', items: data.doorsItems || [] },
    ];

    const summaries: CategorySummaryStat[] = rawCategories.map((cat) => {
      const udItems = cat.items.filter((it) => it.isNonCompliant);
      const resolved = udItems.filter((it) => it.isResolved);
      return {
        id: cat.id,
        name: cat.name,
        shortName: cat.shortName,
        totalItems: cat.items.length,
        udCount: udItems.length,
        resolvedCount: resolved.length,
        issues: udItems.map((it) => ({
          id: it.id,
          title: it.title,
          isResolved: it.isResolved,
          note: it.resolutionNote || it.description,
          floor: it.floorLabel,
          description: it.description,
        })),
      };
    });

    // 8. Seyir ve Konfor Değerlendirmesi
    const comfortIssues: { id: string; title: string; isResolved?: boolean; note?: string; floor?: string; description?: string }[] = [];
    if (data.rideComfortNonCompliant) {
      comfortIssues.push({
        id: 'comfort_issue',
        title: 'Seyir ve Konfor Uygunsuzluğu',
        isResolved: data.rideComfortResolved,
        note: data.rideComfortResolutionNote || data.rideComfortNotes || 'Konfor şikayeti',
        description: data.rideComfortNotes,
      });
    }

    summaries.push({
      id: 'comfort',
      name: 'Seyir ve Konfor Kontrolü',
      shortName: 'Konfor',
      totalItems: 1,
      udCount: data.rideComfortNonCompliant ? 1 : 0,
      resolvedCount: data.rideComfortNonCompliant && data.rideComfortResolved ? 1 : 0,
      issues: comfortIssues,
    });

    return summaries;
  };

  const categorySummaries = getCategorySummaries();

  // Standardized filename using Serial Number
  const getStandardizedFileName = (): string => {
    const cleanSerial = cleanTr(data.serialNumber || '').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    if (cleanSerial) {
      return `${cleanSerial}.pdf`;
    }
    const cleanProject = cleanTr(data.clientProjectName || '').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    if (cleanProject) {
      return `${cleanProject}.pdf`;
    }
    return 'BETA_KK_Denetim_Raporu.pdf';
  };

  // =========================================================================
  // BİRLEŞİK PROFESYONEL PDF MOTORU (Sayfa 1: Özet, Sayfa 2+: Detay Dökümü)
  // =========================================================================
  const buildUnifiedJsPdfDocument = (): jsPDF => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
    const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
    const margin = 10;

    // -------------------------------------------------------------
    // SAYFA 1: YÖNETİCİ VE SAHA ÖZETİ (EXECUTIVE SUMMARY)
    // -------------------------------------------------------------

    // 1. TOP HEADER BANNER (Navy #0A2647) - 18mm
    const bannerHeight = 18;
    doc.setFillColor(10, 38, 71);
    doc.rect(margin, margin, pageWidth - margin * 2, bannerHeight, 'F');

    const logoDataUrl = getBetaLogoDataUrl();
    if (logoDataUrl) {
      try {
        doc.addImage(logoDataUrl, 'PNG', margin + 2.5, margin + 1.8, 12, 14.4);
      } catch {
        doc.setFillColor(0, 136, 206);
        doc.rect(margin + 2.5, margin + 1.8, 12, 14.4, 'F');
      }
    }

    doc.setFontSize(11.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('BETA ASANSOR - KALITE KONTROL DENETIM RAPORU', margin + 16, margin + 7);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225);
    doc.text(
      'Resmi Son Muayene ve Saha Uygunluk Belgesi | Kalite Guvence Birimi',
      margin + 16,
      margin + 13
    );

    // Top Right Info
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(`RAPOR NO: ${cleanTr(data.serialNumber || 'BETA-QC')}`, pageWidth - margin - 3, margin + 7, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225);
    doc.text(`Tarih: ${cleanTr(data.dateDisplay)}`, pageWidth - margin - 3, margin + 13, { align: 'right' });

    // 2. METADATA TABLE (Compact 4 rows x 4 cols)
    const metaRows = [
      [
        { content: 'KONTROLU YAPAN:', styles: { fontStyle: 'bold' as const, fillColor: [241, 245, 249] as [number, number, number] } },
        cleanTr(data.inspectorName) || '-',
        { content: 'MUSTERI / PROJE:', styles: { fontStyle: 'bold' as const, fillColor: [241, 245, 249] as [number, number, number] } },
        cleanTr(data.clientProjectName) || '-',
      ],
      [
        { content: 'ASANSOR TIPI:', styles: { fontStyle: 'bold' as const, fillColor: [241, 245, 249] as [number, number, number] } },
        cleanTr(data.elevatorType) || '-',
        { content: 'SERI / TAKIP NO:', styles: { fontStyle: 'bold' as const, fillColor: [241, 245, 249] as [number, number, number] } },
        cleanTr(data.serialNumber) || '-',
      ],
      [
        { content: 'KAPASITE / DURAK:', styles: { fontStyle: 'bold' as const, fillColor: [241, 245, 249] as [number, number, number] } },
        `${data.capacityKg || '-'} KG / ${data.stopCount || '-'} Durak`,
        { content: 'DENETIM SURESI:', styles: { fontStyle: 'bold' as const, fillColor: [241, 245, 249] as [number, number, number] } },
        `${data.startTime || '-'} - ${data.endTime || '-'} (${cleanTr(data.totalDurationFormatted) || '-'})`,
      ],
      [
        { content: 'CIHAZ DONANIM NO:', styles: { fontStyle: 'bold' as const, fillColor: [241, 245, 249] as [number, number, number] } },
        cleanTr(deviceProfile.hardwareId),
        { content: 'KURULUM GUVENLIK ID:', styles: { fontStyle: 'bold' as const, fillColor: [241, 245, 249] as [number, number, number] } },
        cleanTr(`#${deviceProfile.installationId}`),
      ],
    ];

    autoTable(doc, {
      startY: margin + bannerHeight,
      margin: { left: margin, right: margin },
      body: metaRows,
      theme: 'grid',
      styles: {
        fontSize: 7.5,
        cellPadding: 1.5,
        lineColor: [203, 213, 225],
        lineWidth: 0.2,
        textColor: [15, 23, 42],
      },
      columnStyles: {
        0: { cellWidth: 36, fontStyle: 'bold' as const },
        1: { cellWidth: 59 },
        2: { cellWidth: 36, fontStyle: 'bold' as const },
        3: { cellWidth: 59 },
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let lastY = (doc as any).lastAutoTable.finalY + 2.5;

    // 3. GENEL MUAYENE SONUCU ONAY ÇUBUĞU
    let statusBg: [number, number, number] = [16, 185, 129];
    let statusText = 'GENEL MUAYENE SONUCU: KUSURSUZ (0 UYGUNSUZLUK) - ASANSOR SARTNAMEYE TAM UYGUNDUR';
    if (totalUDCount > 0) {
      if (isAllResolved) {
        statusBg = [16, 185, 129];
        statusText = `GENEL MUAYENE SONUCU: TUM EKSIKLIKLER GIDERILMISTIR (%100 UYGUN - ${totalUDCount}/${totalUDCount})`;
      } else if (hasReAuditDone) {
        statusBg = [217, 119, 6];
        statusText = `GENEL MUAYENE SONUCU: ${totalUDCount} UYGUNSUZLUKTAN ${resolvedUDCount} ADEDI GIDERILDI (${remainingUDCount} ACIK EKSIK)`;
      } else {
        statusBg = [220, 38, 38];
        statusText = `GENEL MUAYENE SONUCU: TOPLAM ${totalUDCount} ADET UYGUNSUZLUK TESPIT EDILDI`;
      }
    }

    doc.setFillColor(...statusBg);
    doc.roundedRect(margin, lastY, pageWidth - margin * 2, 6.5, 1, 1, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(statusText, pageWidth / 2, lastY + 4.4, { align: 'center' });

    lastY += 8.5;

    // 4. BÖLÜM VE KATEGORİ BAZLI KONTROL ÖZET TABLOSU (SADECE SAYISAL DURUM & 2. KONTROL)
    const catTableRows = categorySummaries.map((cat, idx) => {
      let durText = '0 UYGUNSUZLUK (Kusursuz)';
      let durStyle: any = { textColor: [5, 150, 105], fontStyle: 'bold' as const };

      if (cat.udCount > 0) {
        if (cat.resolvedCount === cat.udCount) {
          durText = `${cat.udCount} UYGUNSUZLUK (2. Kontrolde Duzeltildi)`;
          durStyle = { textColor: [5, 150, 105], fontStyle: 'bold' as const };
        } else if (cat.resolvedCount === 0) {
          durText = `${cat.udCount} UYGUNSUZLUK (Acik Eksik)`;
          durStyle = { textColor: [185, 28, 28], fontStyle: 'bold' as const };
        } else {
          durText = `${cat.udCount} UYGUNSUZLUK (${cat.resolvedCount} Adedi 2. Kontrolde Duzeltildi, ${cat.udCount - cat.resolvedCount} Acik)`;
          durStyle = { textColor: [217, 119, 6], fontStyle: 'bold' as const };
        }
      }

      return [
        (idx + 1).toString(),
        cleanTr(cat.name),
        { content: durText, styles: durStyle },
      ];
    });

    autoTable(doc, {
      startY: lastY,
      margin: { left: margin, right: margin },
      head: [
        [
          {
            content: '1. SAYFA: BOLUM VE KATEGORI BAZLI KONTROL OZETI',
            colSpan: 3,
            styles: { fillColor: [10, 38, 71], textColor: [255, 255, 255], fontStyle: 'bold' as const, fontSize: 8.5, cellPadding: 2 },
          },
        ],
        [
          { content: '#', styles: { halign: 'center' as const, cellWidth: 8 } },
          { content: 'DENETIM BOLUMU / KATEGORI', styles: { cellWidth: 72 } },
          { content: 'UYGUNSUZLUK & SAHA DURUMU', styles: { cellWidth: 110 } },
        ],
      ],
      body: catTableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [51, 65, 85],
        textColor: [255, 255, 255],
        fontStyle: 'bold' as const,
        fontSize: 7.5,
        cellPadding: 1.8,
      },
      styles: {
        fontSize: 8,
        cellPadding: 2,
        lineColor: [203, 213, 225],
        lineWidth: 0.2,
        textColor: [15, 23, 42],
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { halign: 'center' as const, fontStyle: 'bold' as const },
        1: { fontStyle: 'bold' as const },
        2: { fontStyle: 'bold' as const },
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lastY = (doc as any).lastAutoTable.finalY + 3;

    // 5. SEYİR KONFORU VE SAHA ÖLÇÜLERİ BÖLÜMÜ (1. Sayfada)
    const hasComfortInfo = !!data.rideComfortNotes || data.rideComfortNonCompliant;
    const hasMeasures = data.measures && data.measures.length > 0;

    if (hasComfortInfo || hasMeasures) {
      const comfortAndMeasureRows: any[] = [];

      if (hasComfortInfo) {
        const isComfortResolved = data.rideComfortResolved;
        const comfortStatus = data.rideComfortNonCompliant
          ? (isComfortResolved ? 'GIDERILDI (100% Konforlu)' : 'UYGUNSUZ (Sarsinti/Sikayet Var)')
          : 'UYGUN (Sarsintisiz & Konforlu Seyir)';
        const comfortNote = cleanTr(data.rideComfortNotes) || 'Standartlara uygun sarsintisiz calisma saglandi.';
        const resNote = isComfortResolved && data.rideComfortResolutionNote ? ` - Kapatma Notu: ${cleanTr(data.rideComfortResolutionNote)}` : '';

        comfortAndMeasureRows.push([
          { content: 'SEYIR VE KONFOR DEGERLENDIRMESI:', styles: { fontStyle: 'bold' as const, fillColor: [241, 245, 249] as [number, number, number], cellWidth: 55 } },
          { content: `${comfortStatus} -> ${comfortNote}${resNote}`, colSpan: 3, styles: { fontStyle: 'bold' as const, textColor: data.rideComfortNonCompliant && !isComfortResolved ? [185, 28, 28] as [number, number, number] : [5, 150, 105] as [number, number, number] } },
        ]);
      }

      if (hasMeasures) {
        const measureSummaryStr = data.measures
          .map((m) => `${cleanTr(m.name)}: ${cleanTr(m.value || '-')}`)
          .join('   |   ');

        comfortAndMeasureRows.push([
          { content: 'TEMEL SAHA OLCU DEGERLERI:', styles: { fontStyle: 'bold' as const, fillColor: [241, 245, 249] as [number, number, number], cellWidth: 55 } },
          { content: measureSummaryStr, colSpan: 3 },
        ]);
      }

      autoTable(doc, {
        startY: lastY,
        margin: { left: margin, right: margin },
        head: [
          [
            {
              content: 'SEYIR KONFORU VE SAHA OLCUM DEGERLERI',
              colSpan: 4,
              styles: { fillColor: [14, 116, 144], textColor: [255, 255, 255], fontStyle: 'bold' as const, fontSize: 7.5, cellPadding: 1.4 },
            },
          ],
        ],
        body: comfortAndMeasureRows,
        theme: 'grid',
        styles: {
          fontSize: 7,
          cellPadding: 1.5,
          lineColor: [203, 213, 225],
          lineWidth: 0.2,
        },
      });
    }

    // -------------------------------------------------------------
    // SAYFA 2+: DETAYLI UYGUNSUZLUK VE EKSİK KAPATMA DÖKÜMÜ
    // -------------------------------------------------------------
    if (allUDItems.length > 0) {
      doc.addPage();
      let page2Y = margin + 5;

      // Page 2 Header Banner (Detay Dökümü)
      doc.setFillColor(10, 38, 71);
      doc.rect(margin, page2Y, pageWidth - margin * 2, 12, 'F');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('TESPIT EDILEN UYGUNSUZLUKLAR VE EKSIK KAPATMA DETAY DOKUMU', margin + 4, page2Y + 7.5);
      page2Y += 14;

      if (isAllResolved) {
        const udTableRows = allUDItems.map((entry, index) => [
          (index + 1).toString(),
          cleanTr(entry.category),
          cleanTr(entry.item.title),
          cleanTr(entry.item.floorLabel) || '-',
          `[GIDERILDI] ${cleanTr(entry.item.resolutionNote || 'Duzeltildi ve onaylandi')}`,
        ]);

        autoTable(doc, {
          startY: page2Y,
          margin: { left: margin, right: margin },
          head: [
            [
              { content: '#', styles: { halign: 'center' as const, cellWidth: 8 } },
              { content: 'BOLUM / KATEGORI', styles: { cellWidth: 36 } },
              { content: 'KONTROL MADDESI', styles: { cellWidth: 44 } },
              { content: 'DURAK', styles: { halign: 'center' as const, cellWidth: 16 } },
              { content: 'KAPATMA & DUZELTILME ACIKLAMASI (2. KONTROL)', styles: { cellWidth: 86 } },
            ],
          ],
          body: udTableRows,
          theme: 'striped',
          headStyles: {
            fillColor: [16, 185, 129],
            textColor: [255, 255, 255],
            fontStyle: 'bold' as const,
            fontSize: 9,
            cellPadding: 2.5,
          },
          styles: {
            fontSize: 8.5,
            cellPadding: 2.5,
            lineColor: [226, 232, 240],
            lineWidth: 0.25,
            textColor: [15, 23, 42],
            valign: 'middle' as const,
          },
          alternateRowStyles: {
            fillColor: [236, 253, 245],
          },
          columnStyles: {
            0: { halign: 'center' as const, fontStyle: 'bold' as const, textColor: [5, 150, 105] },
            1: { fontStyle: 'bold' as const },
            3: { halign: 'center' as const },
            4: { textColor: [4, 120, 87], fontStyle: 'bold' as const },
          },
        });
      } else {
        const udTableRows = allUDItems.map((entry, index) => {
          const isResolved = !!entry.item.isResolved;
          const statusText = isResolved ? '[GIDERILDI]' : '[KALDI / UD]';
          const noteText = isResolved
            ? cleanTr(entry.item.resolutionNote || 'Duzeltildi')
            : cleanTr(entry.item.description || 'Giderilmedi');

          return [
            (index + 1).toString(),
            cleanTr(entry.category),
            cleanTr(entry.item.title),
            cleanTr(entry.item.floorLabel) || '-',
            statusText,
            noteText,
          ];
        });

        autoTable(doc, {
          startY: page2Y,
          margin: { left: margin, right: margin },
          head: [
            [
              { content: '#', styles: { halign: 'center' as const, cellWidth: 8 } },
              { content: 'BOLUM / KATEGORI', styles: { cellWidth: 34 } },
              { content: 'KONTROL MADDESI', styles: { cellWidth: 42 } },
              { content: 'DURAK', styles: { halign: 'center' as const, cellWidth: 14 } },
              { content: 'DURUM', styles: { halign: 'center' as const, cellWidth: 26 } },
              { content: 'ACIKLAMA / KAPATMA NOTU (2. KONTROL)', styles: { cellWidth: 66 } },
            ],
          ],
          body: udTableRows,
          theme: 'striped',
          headStyles: {
            fillColor: [217, 119, 6],
            textColor: [255, 255, 255],
            fontStyle: 'bold' as const,
            fontSize: 9,
            cellPadding: 2.5,
          },
          styles: {
            fontSize: 8.5,
            cellPadding: 2.5,
            lineColor: [226, 232, 240],
            lineWidth: 0.25,
            textColor: [15, 23, 42],
          },
          alternateRowStyles: {
            fillColor: [254, 242, 242],
          },
          columnStyles: {
            0: { halign: 'center' as const, fontStyle: 'bold' as const, textColor: [185, 28, 28] },
            1: { fontStyle: 'bold' as const },
            3: { halign: 'center' as const },
            4: { textColor: [153, 27, 27], fontStyle: 'bold' as const },
          },
        });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let p2LastY = (doc as any).lastAutoTable.finalY + 6;

      // Detaylı Saha Ölçü Tablosu
      if (data.measures && data.measures.length > 0) {
        if (p2LastY > pageHeight - 40) {
          doc.addPage();
          p2LastY = margin + 5;
        }

        const measureTableRows = data.measures.map((m, index) => [
          (index + 1).toString(),
          cleanTr(m.name),
          cleanTr(m.value) || '-',
          cleanTr(m.notes) || '-',
        ]);

        autoTable(doc, {
          startY: p2LastY,
          margin: { left: margin, right: margin },
          head: [
            [
              { content: '#', styles: { halign: 'center' as const, cellWidth: 8 } },
              { content: 'OLCU ADI', styles: { cellWidth: 80 } },
              { content: 'OLCULEN DEGER', styles: { halign: 'center' as const, cellWidth: 40 } },
              { content: 'ACIKLAMA (ISTEGE BAGLI)', styles: { cellWidth: 62 } },
            ],
          ],
          body: measureTableRows,
          theme: 'striped',
          headStyles: {
            fillColor: [10, 38, 71],
            textColor: [255, 255, 255],
            fontStyle: 'bold' as const,
            fontSize: 9,
            cellPadding: 2.5,
          },
          styles: {
            fontSize: 8.5,
            cellPadding: 2.5,
            lineColor: [226, 232, 240],
            lineWidth: 0.25,
            textColor: [15, 23, 42],
            valign: 'middle' as const,
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252],
          },
          columnStyles: {
            0: { halign: 'center' as const, fontStyle: 'bold' as const },
            1: { fontStyle: 'bold' as const },
            2: { halign: 'center' as const, fontStyle: 'bold' as const, textColor: [10, 38, 71] },
          },
        });
      }
    }

    // Add page numbers and official footer to ALL pages
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.25);
      doc.line(margin, pageHeight - 8, pageWidth - margin, pageHeight - 8);

      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Beta Asansor Kalite Kontrol - Cihaz Donanim No: ${cleanTr(deviceProfile.hardwareId)} (#${cleanTr(deviceProfile.installationId)}) - Resmi Denetim Raporu`,
        margin,
        pageHeight - 4.5
      );
      doc.text(`Sayfa ${i} / ${totalPages}`, pageWidth - margin - 18, pageHeight - 4.5);
    }

    return doc;
  };

  // Direct PDF Download Handler
  const handleDownloadPDF = async () => {
    if (isDownloading) return;
    setIsDownloading(true);

    try {
      const doc = buildUnifiedJsPdfDocument();
      const fileName = getStandardizedFileName();
      const folderName = 'BETAKALİTE';
      let savedLocation = '';

      if (Capacitor.isNativePlatform()) {
        try {
          try {
            await Filesystem.requestPermissions();
          } catch {}

          const base64Data = doc.output('datauristring').split(',')[1];
          let savedFileUri = '';

          try {
            await Filesystem.mkdir({
              path: folderName,
              directory: Directory.Documents,
              recursive: true,
            });
            const res = await Filesystem.writeFile({
              path: `${folderName}/${fileName}`,
              data: base64Data,
              directory: Directory.Documents,
              recursive: true,
            });
            savedLocation = `Cihaz Hafızası / Belgeler / ${folderName} / ${fileName}`;
            savedFileUri = res.uri;
          } catch {
            const res2 = await Filesystem.writeFile({
              path: fileName,
              data: base64Data,
              directory: Directory.Documents,
            });
            savedLocation = `Cihaz Hafızası / Belgeler / ${fileName}`;
            savedFileUri = res2.uri;
          }

          setDownloadedFilePath(savedLocation);
          setDownloadSuccess(true);
          setTimeout(() => setDownloadSuccess(false), 8000);

          if (savedFileUri) {
            try {
              await Share.share({
                title: `Beta Asansör Kalite Raporu - ${data.serialNumber || 'QC'}`,
                url: savedFileUri,
                dialogTitle: 'PDF Raporunu Aç / Kaydet / Gönder',
              });
            } catch {}
          }
          return;
        } catch (nativeErr) {
          console.warn('Native save fallback', nativeErr);
        }
      }

      const pdfBlob = doc.output('blob');

      if ('showSaveFilePicker' in window) {
        try {
          const fileHandle = await (window as any).showSaveFilePicker({
            suggestedName: fileName,
            types: [
              {
                description: 'PDF Rapor Dosyası',
                accept: { 'application/pdf': ['.pdf'] },
              },
            ],
          });

          const writableStream = await fileHandle.createWritable();
          await writableStream.write(pdfBlob);
          await writableStream.close();

          savedLocation = fileHandle.name || fileName;
          setDownloadedFilePath(`Dosya kaydedildi: ${savedLocation}`);
          setDownloadSuccess(true);
          setTimeout(() => setDownloadSuccess(false), 8000);
          return;
        } catch (pickerErr: any) {
          if (pickerErr?.name === 'AbortError') return;
        }
      }

      const blobUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
        URL.revokeObjectURL(blobUrl);
      }, 3000);

      if (!savedLocation) {
        savedLocation = `İndirilenler (Download) / ${fileName}`;
      }

      setDownloadedFilePath(savedLocation);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 8000);
    } catch (error) {
      console.error('PDF indirme hatası:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  // Direct PDF Sharing Handler
  const handleSharePDF = async () => {
    if (isGeneratingPDF) return;
    setIsGeneratingPDF(true);

    try {
      const doc = buildUnifiedJsPdfDocument();
      const fileName = getStandardizedFileName();

      if (Capacitor.isNativePlatform()) {
        try {
          const base64Data = doc.output('datauristring').split(',')[1];
          const tempFile = await Filesystem.writeFile({
            path: fileName,
            data: base64Data,
            directory: Directory.Cache,
          });
          await Share.share({
            title: `Beta Asansör Kalite Raporu - ${data.serialNumber || 'QC'}`,
            url: tempFile.uri,
            dialogTitle: 'Raporu WhatsApp / Drive / Dosyalar ile Paylaş',
          });
          setShareSuccess(true);
          setTimeout(() => setShareSuccess(false), 4000);
          return;
        } catch (nativeShareErr) {
          console.warn('Capacitor native share error', nativeShareErr);
        }
      }

      const pdfBlob = doc.output('blob');
      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          files: [pdfFile],
          title: `Beta Asansör Kalite Raporu - ${data.serialNumber || 'QC'}`,
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 4000);
      } else {
        const blobUrl = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          if (document.body.contains(link)) {
            document.body.removeChild(link);
          }
          URL.revokeObjectURL(blobUrl);
        }, 1500);

        alert(
          `📄 PDF RAPORU İNDİRİLDİ!\n\n` +
          `Dosya Adı: ${fileName}\n\n` +
          `WhatsApp'ta belge olarak paylaşmak için sohbetteki (+) veya Ataş (Ek) butonuna basıp 'Belge' seçeneğinden bu PDF dosyasını seçebilirsiniz.`
        );

        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 4000);
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('PDF paylaşma hatası:', error);
      }
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDriveUpload = async () => {
    if (isDriveUploading) return;
    setIsDriveUploading(true);
    try {
      const result = await uploadAuditJsonToDrive(data);
      setDriveUploadSuccess(true);
      setTimeout(() => setDriveUploadSuccess(false), 5000);
      alert(
        `✅ GOOGLE DRİVE YEDEKLEMESİ BAŞARILI!\n\n` +
        `Proje JSON veri dosyası ("${result.fileName}") "KALITEKONTROL ARSIV" klasörüne yüklendi.\n` +
        `Diğer tabletler ve ofis ekibi bu projeyi ortak havuzdan anında görüntüleyebilir.`
      );
    } catch (err: any) {
      alert(`Google Drive yükleme hatası: ${err?.message || 'Bağlantı kurulamadı.'}`);
    } finally {
      setIsDriveUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-4 px-3 sm:px-4 pb-16">
      {/* Top Action Bar */}
      <div className="bg-[#0A2647] text-white rounded-2xl p-3 sm:p-4 mb-4 shadow-xl border-2 border-slate-700 flex flex-col gap-3 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-black bg-emerald-500 text-slate-950 rounded uppercase tracking-wider">
                Resmi Rapor Hazır
              </span>
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-white">
                Kalite Kontrol Denetim Raporu
              </h1>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              {data.clientProjectName || 'Proje'} &bull; Seri: <strong>{data.serialNumber || 'BETA-QC'}</strong> &bull; {data.dateDisplay}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* 2. KONTROL / EKSİK KAPATMA BUTONU */}
            {allUDItems.length > 0 && (
              <button
                type="button"
                id="btn-start-reaudit"
                onClick={() => setIsReAuditModalOpen(true)}
                className={`min-h-[42px] px-4 py-2 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 shadow-lg border-2 transition-all cursor-pointer ${
                  isAllResolved
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400'
                    : 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 border-amber-300 shadow-amber-500/20'
                }`}
                title="2. Kontrol (Eksik Kapatma & Yeniden Muayene) İşlemini Başlat"
              >
                <CheckCircle2 className={`w-4 h-4 ${isAllResolved ? 'text-white' : 'text-slate-950'}`} />
                <span>{isAllResolved ? '2. Kontrol Onayını Düzenle' : '⚡ 2. Kontrole Başla / Eksik Kapat'}</span>
              </button>
            )}

            {/* PDF İNDİR BUTONU */}
            <button
              type="button"
              id="btn-download-pdf"
              disabled={isDownloading}
              onClick={handleDownloadPDF}
              className={`min-h-[42px] px-4 py-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 shadow-md border border-blue-400 transition-all cursor-pointer ${
                isDownloading ? 'opacity-80 cursor-wait' : ''
              }`}
              title="Birleşik Resmi PDF Raporunu İndir"
            >
              {isDownloading ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Download className="w-4 h-4 text-white" />
              )}
              <span>{isDownloading ? 'Oluşturuluyor...' : 'PDF İndir'}</span>
            </button>

            {/* PDF PAYLAŞ BUTONU */}
            <button
              type="button"
              id="btn-share-pdf"
              disabled={isGeneratingPDF}
              onClick={handleSharePDF}
              className={`min-h-[42px] px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 shadow-md border border-emerald-400 transition-all cursor-pointer ${
                isGeneratingPDF ? 'opacity-80 cursor-wait' : ''
              }`}
              title="PDF Belgesini WhatsApp / Drive ile Paylaş"
            >
              {isGeneratingPDF ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Share2 className="w-4 h-4 text-white" />
              )}
              <span>{isGeneratingPDF ? 'Hazırlanıyor...' : 'PDF Paylaş'}</span>
            </button>

            {/* YAZDIR BUTONU */}
            <button
              type="button"
              id="btn-print-report"
              onClick={handlePrint}
              className="min-h-[42px] px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border border-slate-600 cursor-pointer"
              title="Yazdır veya Tarayıcıdan Kaydet"
            >
              <Printer className="w-4 h-4 text-slate-300" />
              <span>Yazdır</span>
            </button>

            {/* GOOGLE DRIVE YEDEKLEME BUTONU */}
            <button
              type="button"
              id="btn-drive-upload"
              disabled={isDriveUploading}
              onClick={handleDriveUpload}
              className="min-h-[42px] px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border border-amber-400 cursor-pointer"
              title="Proje Verilerini Ortak Havuz Google Drive Klasörüne Yedekle"
            >
              {isDriveUploading ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Sparkles className="w-4 h-4 text-amber-200" />
              )}
              <span>{isDriveUploading ? 'Aktarılıyor...' : 'Drive Yedek'}</span>
            </button>

            {/* DÜZENLE BUTONU */}
            <button
              type="button"
              onClick={onEditAudit}
              className="min-h-[42px] px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border border-slate-600 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Düzenle</span>
            </button>
          </div>
        </div>

        {/* İndirme Başarı Bilgilendirme Notu */}
        {downloadSuccess && downloadedFilePath && (
          <div className="bg-emerald-900 border-2 border-emerald-400 rounded-xl p-3 text-xs flex items-start gap-2.5 text-white animate-fadeIn">
            <FolderCheck className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" />
            <div>
              <span className="font-black text-sm text-emerald-200 block">PDF Cihaza Kaydedildi:</span>
              <span className="font-mono text-white text-xs font-bold">{downloadedFilePath}</span>
              <span className="text-[11px] text-emerald-100 block mt-0.5">
                Android tablet ve telefonunuzda <strong>Dosyalarım &gt; İndirilenler</strong> veya <strong>Documents/BETAKALİTE</strong> klasöründen PDF dosyanıza anında ulaşabilirsiniz.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* BİRLEŞİK TEK RAPOR KAĞIDI (1. Sayfa: Özet | 2. Sayfa+: Detaylı Döküm)      */}
      {/* ========================================================================= */}
      <div
        id="official-report-sheet"
        className="bg-white rounded-2xl shadow-xl border-2 border-slate-300 p-4 sm:p-6 text-slate-900 animate-fadeIn space-y-6"
      >
        {/* ================= 1. BÖLÜM: 1. SAYFA YÖNETİCİ & SAHA ÖZETİ ================= */}
        <div className="space-y-4">
          {/* Corporate Header Banner */}
          <div className="bg-[#0A2647] rounded-t-xl p-3 sm:p-4 mb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white border-2 border-b-0 border-[#0A2647] header-box">
            <div className="flex items-center gap-3">
              <BetaLogo size="lg" className="shadow-xs shrink-0 ring-1 ring-white/30" />
              <div>
                <h1 className="text-sm sm:text-base md:text-lg font-black text-white tracking-tight uppercase leading-tight">
                  BETA ASANSOR - KALITE KONTROL DENETIM RAPORU
                </h1>
                <p className="text-[11px] sm:text-xs font-normal text-slate-300">
                  Resmi Son Muayene ve Saha Uygunluk Belgesi | Kalite Guvence Birimi
                </p>
              </div>
            </div>
            <div className="text-left sm:text-right shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-white/20">
              <span className="inline-block px-2.5 py-1 bg-white/10 text-white text-xs font-mono font-bold rounded border border-white/25">
                RAPOR NO: {data.serialNumber || 'BETA-QC'}
              </span>
              <p className="text-[11px] text-slate-300 mt-1 font-medium">Tarih: {data.dateDisplay}</p>
            </div>
          </div>

          {/* Technical & Audit Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 bg-slate-50 rounded-b-xl border-2 border-slate-300 text-xs grid-meta">
            <div>
              <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider block">Kontrolü Yapan:</span>
              <span className="text-xs font-black text-slate-950">{data.inspectorName || '-'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider block">Müşteri / Proje:</span>
              <span className="text-xs font-black text-slate-950">{data.clientProjectName || '-'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider block">Asansör Tipi:</span>
              <span className="text-xs font-black text-slate-950">{data.elevatorType || '-'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider block">Seri / Takip No:</span>
              <span className="text-xs font-black text-slate-950">{data.serialNumber || '-'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider block">Kapasite / Durak:</span>
              <span className="text-xs font-black text-slate-950">{data.capacityKg || '-'} KG / {data.stopCount || '-'} DR</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider block">Denetim Süresi:</span>
              <span className="text-xs font-black text-slate-950">{data.startTime || '-'} - {data.endTime || '-'} ({data.totalDurationFormatted || '-'})</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider block">Cihaz Donanım No:</span>
              <span className="text-xs font-black text-slate-950 font-mono">{deviceProfile.hardwareId}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider block">Güvenlik ID:</span>
              <span className="text-xs font-black text-emerald-800 font-mono">#{deviceProfile.installationId}</span>
            </div>
          </div>

          {/* GENEL MUAYENE SONUCU ONAY ÇUBUĞU */}
          <div
            className={`p-3 rounded-xl border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-black text-white shadow-sm ${
              totalUDCount === 0
                ? 'bg-emerald-600 border-emerald-500'
                : isAllResolved
                ? 'bg-emerald-600 border-emerald-500'
                : hasReAuditDone
                ? 'bg-amber-600 border-amber-500'
                : 'bg-red-600 border-red-500'
            }`}
          >
            <div className="flex items-center gap-2">
              {totalUDCount === 0 || isAllResolved ? (
                <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-white shrink-0" />
              )}
              <span className="text-xs sm:text-sm uppercase tracking-wide">
                {totalUDCount === 0
                  ? 'GENEL MUAYENE SONUCU: KUSURSUZ (0 UYGUNSUZLUK) — ASANSÖR ŞARTNAMEYE UYGUNDUR'
                  : isAllResolved
                  ? `GENEL MUAYENE SONUCU: TÜM EKSİKLİKLER GİDERİLMİŞTİR (%100 UYGUN - ${totalUDCount}/${totalUDCount})`
                  : hasReAuditDone
                  ? `GENEL MUAYENE SONUCU: ${totalUDCount} UYGUNSUZLUKTAN ${resolvedUDCount} ADEDİ GİDERİLDİ (${remainingUDCount} AÇIK EKSİK)`
                  : `GENEL MUAYENE SONUCU: TOPLAM ${totalUDCount} ADET UYGUNSUZLUK TESPİT EDİLDİ`}
              </span>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center">
              {totalUDCount > 0 && (
                <button
                  type="button"
                  onClick={() => setIsReAuditModalOpen(true)}
                  className="px-3 py-1 bg-white text-slate-950 hover:bg-slate-100 rounded-lg text-xs font-black uppercase shadow cursor-pointer flex items-center gap-1 border border-slate-200"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isAllResolved ? '2. Kontrolü Düzenle' : '⚡ 2. Kontrolü Başlat'}</span>
                </button>
              )}
              <span className="px-2 py-0.5 bg-black/25 text-white rounded text-[11px] font-black uppercase border border-white/20 shrink-0">
                {totalUDCount === 0 ? '0 Hata' : `${totalUDCount} UD`}
              </span>
            </div>
          </div>

          {/* 1. BÖLÜM VE KATEGORİ BAZLI KONTROL ÖZETİ TABLOSU */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-1">
              <h3 className="text-xs sm:text-sm font-black uppercase text-slate-900 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-amber-600" />
                1. SAYFA: BÖLÜM VE KATEGORİ BAZLI KONTROL ÖZETİ
              </h3>
              <span className="text-[11px] font-bold text-slate-500">
                8 Ana Bölüm Denetim Özeti
              </span>
            </div>

            <div className="border-2 border-slate-300 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-200 border-b-2 border-slate-300 text-slate-900 font-black uppercase text-[10px]">
                  <tr>
                    <th className="p-2.5 border-r border-slate-300 w-12 text-center">#</th>
                    <th className="p-2.5 border-r border-slate-300 w-64 sm:w-80">Denetim Bölümü / Kategori</th>
                    <th className="p-2.5">Uygunsuzluk & Saha Durumu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {categorySummaries.map((cat, idx) => {
                    const hasUD = cat.udCount > 0;
                    const isAllCatResolved = hasUD && cat.resolvedCount === cat.udCount;
                    const isPartialResolved = hasUD && cat.resolvedCount > 0 && cat.resolvedCount < cat.udCount;

                    return (
                      <tr
                        key={cat.id}
                        className={
                          !hasUD
                            ? 'bg-white hover:bg-slate-50'
                            : isAllCatResolved
                            ? 'bg-emerald-50/60 hover:bg-emerald-100/50'
                            : isPartialResolved
                            ? 'bg-amber-50/60 hover:bg-amber-100/50'
                            : 'bg-red-50/60 hover:bg-red-100/50'
                        }
                      >
                        <td className="p-2.5 border-r border-slate-300 text-center font-bold text-slate-700">
                          {idx + 1}
                        </td>
                        <td className="p-2.5 border-r border-slate-300 font-black text-slate-950 text-xs sm:text-sm">
                          {cat.name}
                        </td>
                        <td className="p-2.5">
                          {!hasUD ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 border border-emerald-400 text-emerald-950 rounded-lg font-black text-xs">
                              <Check className="w-4 h-4 text-emerald-700" /> 0 Uygunsuzluk (Kusursuz)
                            </span>
                          ) : isAllCatResolved ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 border border-emerald-500 text-emerald-950 rounded-lg font-black text-xs">
                              <CheckCircle2 className="w-4 h-4 text-emerald-700" /> {cat.udCount} Uygunsuzluk (2. Kontrolde Düzeltildi)
                            </span>
                          ) : isPartialResolved ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 border border-amber-500 text-amber-950 rounded-lg font-black text-xs">
                              <ShieldAlert className="w-4 h-4 text-amber-700" /> {cat.udCount} Uygunsuzluk ({cat.resolvedCount} Adedi 2. Kontrolde Düzeltildi, {cat.udCount - cat.resolvedCount} Açık)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 border border-red-500 text-red-950 rounded-lg font-black text-xs">
                              <ShieldAlert className="w-4 h-4 text-red-700" /> {cat.udCount} Uygunsuzluk (Açık Eksik)
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Seyir Konforu & Temel Ölçümler Kartı */}
          {(!!data.rideComfortNotes || data.rideComfortNonCompliant || (data.measures && data.measures.length > 0)) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {/* Konfor Kartı */}
              {(!!data.rideComfortNotes || data.rideComfortNonCompliant) && (
                <div className="p-3 bg-cyan-50/70 border-2 border-cyan-300 rounded-xl space-y-1 text-xs">
                  <div className="flex items-center justify-between font-black text-slate-900">
                    <span className="flex items-center gap-1">
                      <Activity className="w-3.5 h-3.5 text-cyan-700" />
                      Seyir ve Konfor Değerlendirmesi
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-black ${
                      !data.rideComfortNonCompliant || data.rideComfortResolved
                        ? 'bg-emerald-200 text-emerald-950 border border-emerald-400'
                        : 'bg-red-200 text-red-950 border border-red-400'
                    }`}>
                      {data.rideComfortNonCompliant
                        ? (data.rideComfortResolved ? 'Giderildi (100% Konforlu)' : 'Uygunsuzluk Var')
                        : 'Sarsıntısız / Uygun'}
                    </span>
                  </div>
                  <p className="text-slate-800 font-medium">
                    {data.rideComfortNotes || 'Kabin seyri esnasında titreşim veya sarsıntı tespit edilmedi.'}
                  </p>
                  {data.rideComfortResolved && data.rideComfortResolutionNote && (
                    <div className="text-[11px] font-bold text-emerald-800 pt-0.5">
                      ✓ Kapatma Notu: {data.rideComfortResolutionNote}
                    </div>
                  )}
                </div>
              )}

              {/* Saha Ölçüleri Kompakt Kartı */}
              {data.measures && data.measures.length > 0 && (
                <div className="p-3 bg-slate-50 border-2 border-slate-300 rounded-xl space-y-1 text-xs">
                  <div className="font-black text-slate-900 flex items-center gap-1">
                    <Ruler className="w-3.5 h-3.5 text-blue-700" />
                    Temel Saha Ölçüleri
                  </div>
                  <div className="flex flex-wrap gap-2 pt-0.5">
                    {data.measures.map((m, mIdx) => (
                      <span
                        key={mIdx}
                        className="px-2 py-0.5 bg-white rounded border border-slate-300 font-bold text-slate-800 text-[11px]"
                      >
                        {m.name}: <strong className="text-blue-900 font-mono">{m.value || '-'}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ================= 2. BÖLÜM: 2. SAYFA+ DETAYLI UYGUNSUZLUK VE EKSİK KAPATMA DÖKÜMÜ ================= */}
        {allUDItems.length > 0 && (
          <div className="pt-6 border-t-4 border-slate-300 space-y-3">
            <div className="flex items-center justify-between pb-1.5 border-b-2 border-slate-900">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-700" />
                <h2 className="text-sm sm:text-base font-black uppercase text-slate-900 tracking-tight">
                  2. SAYFA: TESPİT EDİLEN UYGUNSUZLUKLAR VE EKSİK KAPATMA DETAY DÖKÜMÜ
                </h2>
              </div>
              <span className="text-xs font-black px-2.5 py-1 rounded bg-slate-100 text-slate-800 border border-slate-300">
                Toplam {allUDItems.length} Madde
              </span>
            </div>

            {/* 2. Kontrol Bilgi Şeridi */}
            {isAllResolved ? (
              <div className="p-3 bg-emerald-100/80 border-2 border-emerald-500 rounded-xl flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                  <div>
                    <span className="font-black text-emerald-950 block text-xs sm:text-sm">
                      Yeniden Muayene Onayı: Tüm Eksiklikler 2. Kontrolde Başarıyla Giderilmiştir.
                    </span>
                    {data.reAuditInspector && (
                      <span className="text-[11px] font-bold text-emerald-800 block">
                        Eksik Kapatma Denetçisi: {data.reAuditInspector} &bull; Tarih: {data.reAuditDate || data.dateDisplay}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsReAuditModalOpen(true)}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-black text-xs uppercase cursor-pointer shadow shrink-0"
                >
                  2. Kontrolü Düzenle
                </button>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 border-2 border-amber-400 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <span className="font-black text-amber-950 block text-xs sm:text-sm">
                      {hasReAuditDone
                        ? `2. Kontrol Devam Ediyor: ${resolvedUDCount} Eksik Giderildi, ${remainingUDCount} Açık Kaldı.`
                        : `Bu asansörde ${allUDItems.length} adet uygunsuzluk tespit edildi.`}
                    </span>
                    <span className="text-[11px] font-medium text-amber-800 block">
                      Sahadaki düzeltmeleri onaylamak ve eksikleri kapatmak için 2. kontrolü başlatabilirsiniz.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsReAuditModalOpen(true)}
                  className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white rounded-xl font-black text-xs uppercase cursor-pointer shadow-md shrink-0 flex items-center justify-center gap-1.5 border border-amber-400"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>{hasReAuditDone ? '2. Kontrole Devam Et' : '⚡ 2. Kontrolü Başlat'}</span>
                </button>
              </div>
            )}

            {/* Detaylı UD Tablosu */}
            <div className="border-2 border-slate-300 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-200 border-b-2 border-slate-300 text-slate-900 font-black uppercase text-[10px]">
                  <tr>
                    <th className="p-2 border-r border-slate-300 w-10 text-center">#</th>
                    <th className="p-2 border-r border-slate-300 w-36">Bölüm / Kategori</th>
                    <th className="p-2 border-r border-slate-300">Kontrol Maddesi</th>
                    <th className="p-2 border-r border-slate-300 w-16 text-center">Durak</th>
                    <th className="p-2 border-r border-slate-300 w-24 text-center">Durum</th>
                    <th className="p-2">Hata & Kapatma Notu (2. Kontrol)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {allUDItems.map((entry, index) => {
                    const isResolved = !!entry.item.isResolved;
                    return (
                      <tr
                        key={index}
                        className={
                          isResolved
                            ? 'bg-emerald-50/70 hover:bg-emerald-100/60'
                            : 'bg-red-50/70 hover:bg-red-100/60'
                        }
                      >
                        <td
                          className={`p-2 border-r border-slate-300 text-center font-black ${
                            isResolved ? 'text-emerald-700' : 'text-red-600'
                          }`}
                        >
                          {index + 1}
                        </td>
                        <td className="p-2 border-r border-slate-300 font-black text-slate-950 text-[11px]">
                          {entry.category}
                        </td>
                        <td className="p-2 border-r border-slate-300 font-bold text-slate-950">
                          {entry.item.title}
                        </td>
                        <td className="p-2 border-r border-slate-300 text-center font-black text-slate-800 text-[11px]">
                          {entry.item.floorLabel || '-'}
                        </td>
                        <td className="p-2 border-r border-slate-300 text-center">
                          {isResolved ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-200 border border-emerald-500 text-emerald-950 rounded font-black text-[10px] uppercase">
                              <Check className="w-3 h-3 text-emerald-700" /> Giderildi
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-200 border border-red-500 text-red-950 rounded font-black text-[10px] uppercase">
                              <ShieldAlert className="w-3 h-3 text-red-700" /> Kaldı / UD
                            </span>
                          )}
                        </td>
                        <td className="p-2 text-xs">
                          <div className="font-bold text-slate-900">
                            {entry.item.description || (
                              <span className="italic text-slate-500">İlk tespit girilmedi</span>
                            )}
                          </div>
                          {isResolved && entry.item.resolutionNote && (
                            <div className="text-[11px] font-bold text-emerald-800 mt-1 flex items-center gap-1 bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-300 w-fit">
                              <CheckCircle2 className="w-3 h-3 text-emerald-700 shrink-0" />
                              <span>2. Kontrol Notu: {entry.item.resolutionNote}</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Section: SAHA ÖLÇÜ KONTROLLERİ */}
        {data.measures && data.measures.length > 0 && (
          <div className="pt-4 border-t-2 border-slate-300 space-y-2">
            <div className="flex items-center gap-1.5 pb-1 border-b-2 border-blue-700 section-title section-title-blue">
              <Ruler className="w-4 h-4 text-blue-700" />
              <h3 className="text-xs sm:text-sm font-bold uppercase text-slate-900 tracking-wider">
                DETAYLI SAHA ÖLÇÜ KONTROLLERİ
              </h3>
            </div>
            <div className="border-2 border-slate-300 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-200 border-b-2 border-slate-300 text-slate-900 font-black uppercase text-[10px]">
                  <tr>
                    <th className="p-2 border-r border-slate-300 w-10 text-center">#</th>
                    <th className="p-2 border-r border-slate-300">Ölçü Adı</th>
                    <th className="p-2 border-r border-slate-300 w-44 text-center">Ölçülen Değer</th>
                    <th className="p-2">Açıklama (İsteğe Bağlı)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {data.measures.map((measure, index) => (
                    <tr key={index} className="hover:bg-slate-100">
                      <td className="p-2 border-r border-slate-300 text-center font-bold text-slate-700">
                        {index + 1}
                      </td>
                      <td className="p-2 border-r border-slate-300 font-bold text-slate-950">
                        {measure.name}
                      </td>
                      <td className="p-2 border-r border-slate-300 text-center font-black text-blue-900">
                        {measure.value || '-'}
                      </td>
                      <td className="p-2 text-slate-800 text-xs font-medium">
                        {measure.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer Note */}
        <div className="mt-6 pt-3 border-t-2 border-slate-300 text-center text-[11px] font-bold text-slate-600 footer-text">
          Beta Asansör Kalite Kontrol Sistemi • Cihaz Donanım No: {deviceProfile.hardwareId} (Kurulum ID: #{deviceProfile.installationId}) • Bu belge resmi denetim kaydıdır.
        </div>
      </div>

      {/* Re-Audit / Punch List Modal */}
      {isReAuditModalOpen && (
        <ReAuditModal
          isOpen={isReAuditModalOpen}
          onClose={() => setIsReAuditModalOpen(false)}
          data={data}
          onSaveReAudit={(updated) => {
            onUpdateData?.(updated);
          }}
        />
      )}

      {/* Google Drive Bulut Senkronizasyon Penceresi */}
      {isDriveModalOpen && (
        <DriveSyncModal
          isOpen={isDriveModalOpen}
          onClose={() => setIsDriveModalOpen(false)}
          currentAuditData={data}
          onLoadAuditFromDrive={(loadedAudit) => {
            onUpdateData?.(loadedAudit);
            alert(`"${loadedAudit.serialNumber || loadedAudit.clientProjectName}" projesi Drive üzerinden başarıyla yüklendi!`);
          }}
        />
      )}
    </div>
  );
};
