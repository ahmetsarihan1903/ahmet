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
  Edit3,
  Clock,
  X,
  MessageCircle,
  Copy,
  Link2,
  ExternalLink,
  AlertTriangle,
  History,
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { AuditFormData, InspectionItem } from '../types';
import { BetaLogo } from './BetaLogo';
import { getBetaLogoDataUrl } from '../utils/logoUtils';
import { ReAuditModal } from './ReAuditModal';
import {
  uploadAuditJsonToDrive,
  buildContractorPortalLink,
  buildContractorSlug,
} from '../services/googleDriveService';
import { DriveSyncModal } from './DriveSyncModal';
import { sanitizePdfFileNamePart } from '../utils/pdfGenerator';
import { appendWindowsChangeLog } from '../utils/windowsAuth';

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
  const {
    deviceProfile,
    isWindowsDesktop,
    windowsUser,
    isReadOnlyMonitoringMode,
    openWindowsAuthModal,
  } = useUser();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [downloadedFilePath, setDownloadedFilePath] = useState<string | null>(null);
  const [isReAuditModalOpen, setIsReAuditModalOpen] = useState(false);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [isDriveUploading, setIsDriveUploading] = useState(false);
  const [driveUploadSuccess, setDriveUploadSuccess] = useState(false);

  // Taşeron (Usta) Linki Hazırlama ve Paylaşım Modalı
  const [isPreparingContractorLink, setIsPreparingContractorLink] = useState(false);
  const [contractorError, setContractorError] = useState<string | null>(null);
  const [contractorShareData, setContractorShareData] = useState<{
    url: string;
    fileName: string;
    whatsAppText: string;
    needsScriptV21Upgrade?: boolean;
  } | null>(null);
  const [copiedContractorLink, setCopiedContractorLink] = useState(false);

  // Denetim Süresini Düzenleme Modalı (Bulut / Gün aşımı süresini anında düzeltme)
  const [isEditDurationOpen, setIsEditDurationOpen] = useState(false);
  const [tempStartTime, setTempStartTime] = useState('');
  const [tempEndTime, setTempEndTime] = useState('');
  const [tempDuration, setTempDuration] = useState('');

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
        resolutionType: data.rideComfortResolutionType,
        resolutionNote: data.rideComfortResolutionNote,
      },
    });
  }

  const totalUDCount = allUDItems.length;
  const resolvedUDCount = allUDItems.filter((entry) => entry.item.isResolved).length;
  const remainingUDCount = totalUDCount - resolvedUDCount;
  const isAllResolved = totalUDCount > 0 && resolvedUDCount === totalUDCount;
  const hasReAuditDone = totalUDCount > 0 && resolvedUDCount > 0;

  // 2. Sayfa Detay Dökümü: "YAPILDI" olarak işaretlenenler gösterilmez;
  // yalnızca BETA işaretli olanlar ve açık uygunsuzluklar (UD / KALDI) listelenir.
  const page2DetailItems = allUDItems.filter((entry) => {
    const isMarkedDone = !!entry.item.isResolved && entry.item.resolutionType !== 'BETA';
    return !isMarkedDone;
  });

  // 8 Bölüm Bazlı Özet Listesi (1. Sayfa Yönetici Özeti İçin)
  const getCategorySummaries = (): CategorySummaryStat[] => {
    const rawCategories: { id: string; name: string; shortName: string; items: InspectionItem[] }[] = [
      { id: 'panel', name: 'Kumanda Panosu', shortName: 'Kumanda Panosu', items: data.controlPanelItems || [] },
      { id: 'motor', name: `Motor / Şase (${data.elevatorType})`, shortName: 'Motor / Şase', items: data.motorChassisItems || [] },
      { id: 'cabintop', name: 'Kabin Üstü Kontrolleri', shortName: 'Kabin Üstü', items: data.cabinTopItems || [] },
      { id: 'cwt', name: 'Ağırlık Karkası Kontrolleri', shortName: 'Ağırlık Karkası', items: data.counterweightItems || [] },
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

  // Standardized filename using Serial Number (preserving Turkish characters)
  const getStandardizedFileName = (): string => {
    const safeSerial = sanitizePdfFileNamePart(data.serialNumber);
    if (safeSerial) {
      return `${safeSerial}.pdf`;
    }
    const safeProject = sanitizePdfFileNamePart(data.clientProjectName);
    if (safeProject) {
      return `${safeProject}.pdf`;
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

    // 1. TOP HEADER BANNER (Navy #0A2647) - Compact 15mm
    const bannerHeight = 15;
    doc.setFillColor(10, 38, 71);
    doc.rect(margin, margin, pageWidth - margin * 2, bannerHeight, 'F');

    const logoDataUrl = getBetaLogoDataUrl();
    if (logoDataUrl) {
      try {
        doc.addImage(logoDataUrl, 'PNG', margin + 2, margin + 1.5, 10, 12);
      } catch {
        doc.setFillColor(0, 136, 206);
        doc.rect(margin + 2, margin + 1.5, 10, 12, 'F');
      }
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('BETA ASANSOR - KALITE KONTROL DENETIM RAPORU', margin + 14, margin + 6);

    doc.setFontSize(7.2);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225);
    doc.text(
      'Resmi Son Muayene ve Saha Uygunluk Belgesi | Kalite Guvence Birimi',
      margin + 14,
      margin + 11.2
    );

    // Top Right Info
    doc.setFontSize(7.8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(`RAPOR NO: ${cleanTr(data.serialNumber || 'BETA-QC')}`, pageWidth - margin - 3, margin + 6, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225);
    doc.text(`Tarih: ${cleanTr(data.dateDisplay)}`, pageWidth - margin - 3, margin + 11.2, { align: 'right' });

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
        { content: 'BAKIM GUNU TARIHI:', styles: { fontStyle: 'bold' as const, fillColor: [241, 245, 249] as [number, number, number] } },
        cleanTr(data.maintenanceDate) || '-',
        { content: 'DONANIM & SAAT:', styles: { fontStyle: 'bold' as const, fillColor: [241, 245, 249] as [number, number, number] } },
        'Donanim Esl.: YAPILDI | Sistem Saati: YAPILDI',
      ],
    ];

    autoTable(doc, {
      startY: margin + bannerHeight,
      margin: { left: margin, right: margin },
      body: metaRows,
      theme: 'grid',
      styles: {
        fontSize: 7.2,
        cellPadding: 1.15,
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
    let lastY = (doc as any).lastAutoTable.finalY + 2;

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
    doc.roundedRect(margin, lastY, pageWidth - margin * 2, 5.5, 1, 1, 'F');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(statusText, pageWidth / 2, lastY + 3.8, { align: 'center' });

    lastY += 7.2;

    // 4. BÖLÜM VE KATEGORİ BAZLI KONTROL ÖZET TABLOSU (ORİJİNAL 8 SATIRLIK DÜZEN)
    const catTableRows = categorySummaries.map((cat, idx) => {
      let durText = '0 UYGUNSUZLUK (Kusursuz)';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
            styles: { fillColor: [10, 38, 71], textColor: [255, 255, 255], fontStyle: 'bold' as const, fontSize: 8.2, cellPadding: 1.7 },
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
        fontSize: 7.3,
        cellPadding: 1.5,
      },
      styles: {
        fontSize: 7.8,
        cellPadding: 1.6,
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
    lastY = (doc as any).lastAutoTable.finalY + 2.5;

    // 2. Kontrolde BETA işaretli veya 2. kontrol açıklaması yazılmış maddeler
    const secondControlHighlightItems = allUDItems.filter((entry) => {
      const isBeta = !!entry.item.isResolved && entry.item.resolutionType === 'BETA';
      const hasResNote = Boolean(entry.item.resolutionNote && entry.item.resolutionNote.trim() !== '');
      return isBeta || hasResNote;
    });

    const isSecondControlReport =
      Boolean(data.reAuditDate) ||
      Boolean(data.reAuditInspector) ||
      Boolean(data.reAuditCompleted) ||
      hasReAuditDone ||
      secondControlHighlightItems.length > 0;

    if (isSecondControlReport) {
      // 2. Kontrolde oluşturulan PDF raporunun 1. sayfasında
      // SEYIR KONFORU VE SAHA OLCUM DEGERLERI bölümü kaldırıldı;
      // yerine özetin altına 2. kontrolde BETA işaretli ve açıklama yazılan maddeler gösterilir.
      // İlk sayfadan taşmaması için madde sayısına ve kalan alan yüksekliğine göre dinamik listeleme uygulanır.
      if (secondControlHighlightItems.length > 0) {
        const remainingHeight = pageHeight - 12 - lastY;
        const estimatedStdHeight =
          12 +
          secondControlHighlightItems.reduce((acc, entry) => {
            const titleLen = (entry.item.title || '').length;
            const descLen = (entry.item.description || '').length;
            const noteLen = (entry.item.resolutionNote || '').length;
            const lines = Math.max(2, Math.ceil((titleLen + descLen) / 42), Math.ceil((noteLen + 15) / 40));
            return acc + lines * 3.1 + 2.6;
          }, 0);

        const useTwoColumnCardMode =
          secondControlHighlightItems.length > 9 || estimatedStdHeight > remainingHeight;

        const formatHighlightStatus = (entry: { category: string; item: InspectionItem }) => {
          const isResolved = !!entry.item.isResolved;
          const resType = entry.item.resolutionType || (isResolved ? 'YAPILDI' : 'KALDI');
          const resNote = cleanTr(entry.item.resolutionNote || '').trim();
          let statusLabel = '';
          if (resType === 'BETA') {
            statusLabel = 'BETA';
          } else if (isResolved) {
            statusLabel = 'GIDERILDI';
          } else {
            statusLabel = 'KALDI (UD)';
          }
          return { isResolved, resType, resNote, statusLabel };
        };

        if (!useTwoColumnCardMode) {
          // 4 Sütunlu Kompakt Tablo (Az/orta madde sayısında maksimum okunabilirlik)
          const isDense = secondControlHighlightItems.length > 6;
          const highlightRows = secondControlHighlightItems.map((entry, idx) => {
            const { isResolved, resType, resNote, statusLabel } = formatHighlightStatus(entry);
            const rawDesc = cleanTr(entry.item.description) || '';
            const clippedDesc =
              isDense && rawDesc.length > 95 ? `${rawDesc.slice(0, 92)}...` : rawDesc;
            const itemTitle = cleanTr(entry.item.title);
            const itemCellText = clippedDesc ? `${itemTitle}\nTespit: ${clippedDesc}` : itemTitle;
            const floorText = cleanTr(entry.item.floorLabel) || '';
            const catText = floorText ? `${cleanTr(entry.category)}\n(${floorText})` : cleanTr(entry.category);
            const secondControlText = resNote ? `${statusLabel}\nNot: ${resNote}` : statusLabel;

            return [
              (idx + 1).toString(),
              catText,
              itemCellText,
              {
                content: secondControlText,
                styles: {
                  textColor:
                    resType === 'BETA'
                      ? ([10, 38, 71] as [number, number, number])
                      : isResolved
                      ? ([5, 150, 105] as [number, number, number])
                      : ([185, 28, 28] as [number, number, number]),
                  fillColor:
                    resType === 'BETA'
                      ? ([239, 246, 255] as [number, number, number])
                      : undefined,
                  fontStyle: 'bold' as const,
                },
              },
            ];
          });

          autoTable(doc, {
            startY: lastY,
            margin: { left: margin, right: margin },
            head: [
              [
                {
                  content: `2. KONTROL OZEL OZETI: BETA ISARETLI VE ACIKLAMALI MADDELER (${secondControlHighlightItems.length} Madde)`,
                  colSpan: 4,
                  styles: {
                    fillColor: [10, 38, 71],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold' as const,
                    fontSize: 7.6,
                    cellPadding: 1.4,
                  },
                },
              ],
              [
                { content: '#', styles: { halign: 'center' as const, cellWidth: 7 } },
                { content: 'BOLUM / DURAK', styles: { cellWidth: 32 } },
                { content: 'KONTROL MADDESI & ILK TESPIT', styles: { cellWidth: 78 } },
                { content: '2. KONTROL DURUMU & NOTU', styles: { cellWidth: 73 } },
              ],
            ],
            body: highlightRows,
            theme: 'grid',
            headStyles: {
              fillColor: [51, 65, 85],
              textColor: [255, 255, 255],
              fontStyle: 'bold' as const,
              fontSize: 6.8,
              cellPadding: 1.2,
            },
            styles: {
              fontSize: isDense ? 6.5 : 7,
              cellPadding: isDense ? 1.0 : 1.3,
              lineColor: [203, 213, 225],
              lineWidth: 0.2,
              textColor: [15, 23, 42],
              valign: 'middle' as const,
            },
            alternateRowStyles: {
              fillColor: [248, 250, 252],
            },
            columnStyles: {
              0: { halign: 'center' as const, fontStyle: 'bold' as const },
              1: { fontStyle: 'bold' as const },
              2: { fontStyle: 'normal' as const },
            },
          });
        } else {
          // 2 Sütunlu (Yan Yana Çiftli) Kompakt Liste Düzeni: Çok fazla madde olduğunda 1. sayfadan taşmayı önler
          const isUltraDense = secondControlHighlightItems.length > 22;
          const pairCount = Math.ceil(secondControlHighlightItems.length / 2);

          const formatCompactPairCell = (entry: { category: string; item: InspectionItem } | undefined) => {
            if (!entry) return '';
            const { isResolved, resType, resNote, statusLabel } = formatHighlightStatus(entry);
            const floorText = cleanTr(entry.item.floorLabel) || '';
            const headerTag = floorText
              ? `${cleanTr(entry.category)} (${floorText})`
              : cleanTr(entry.category);
            const titleText = cleanTr(entry.item.title);
            const clippedNote =
              isUltraDense && resNote.length > 65 ? `${resNote.slice(0, 62)}...` : resNote;
            const bodyLines = [
              `${headerTag}: ${titleText}`,
              clippedNote ? `[${statusLabel}] Not: ${clippedNote}` : `[${statusLabel}]`,
            ];
            return {
              content: bodyLines.join('\n'),
              styles: {
                textColor:
                  resType === 'BETA'
                    ? ([10, 38, 71] as [number, number, number])
                    : isResolved
                    ? ([5, 150, 105] as [number, number, number])
                    : ([185, 28, 28] as [number, number, number]),
                fillColor:
                  resType === 'BETA'
                    ? ([239, 246, 255] as [number, number, number])
                    : undefined,
                fontStyle: 'bold' as const,
              },
            };
          };

          const pairRows = Array.from({ length: pairCount }, (_, rowIdx) => {
            const leftIdx = rowIdx;
            const rightIdx = rowIdx + pairCount;
            const leftEntry = secondControlHighlightItems[leftIdx];
            const rightEntry = secondControlHighlightItems[rightIdx];

            return [
              (leftIdx + 1).toString(),
              formatCompactPairCell(leftEntry),
              rightEntry ? (rightIdx + 1).toString() : '',
              formatCompactPairCell(rightEntry),
            ];
          });

          autoTable(doc, {
            startY: lastY,
            margin: { left: margin, right: margin },
            head: [
              [
                {
                  content: `2. KONTROL OZEL OZETI: BETA ISARETLI VE ACIKLAMALI MADDELER (${secondControlHighlightItems.length} Madde - Kompakt Liste)`,
                  colSpan: 4,
                  styles: {
                    fillColor: [10, 38, 71],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold' as const,
                    fontSize: 7.4,
                    cellPadding: 1.2,
                  },
                },
              ],
              [
                { content: '#', styles: { halign: 'center' as const, cellWidth: 6 } },
                { content: 'MADDE / BOLUM / 2. KONTROL DURUMU', styles: { cellWidth: 89 } },
                { content: '#', styles: { halign: 'center' as const, cellWidth: 6 } },
                { content: 'MADDE / BOLUM / 2. KONTROL DURUMU', styles: { cellWidth: 89 } },
              ],
            ],
            body: pairRows,
            theme: 'grid',
            headStyles: {
              fillColor: [51, 65, 85],
              textColor: [255, 255, 255],
              fontStyle: 'bold' as const,
              fontSize: 6.4,
              cellPadding: 1.0,
            },
            styles: {
              fontSize: isUltraDense ? 5.9 : 6.3,
              cellPadding: isUltraDense ? 0.75 : 0.95,
              lineColor: [203, 213, 225],
              lineWidth: 0.2,
              textColor: [15, 23, 42],
              valign: 'middle' as const,
            },
            columnStyles: {
              0: { halign: 'center' as const, fontStyle: 'bold' as const, fillColor: [248, 250, 252] },
              2: { halign: 'center' as const, fontStyle: 'bold' as const, fillColor: [248, 250, 252] },
            },
          });
        }
      }
    } else {
      // 5. SEYİR KONFORU VE SAHA ÖLÇÜLERİ BÖLÜMÜ (1. Sayfada - Yalnızca 1. Kontrol Raporunda)
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
    }

    // -------------------------------------------------------------
    // SAYFA 2+: DETAYLI UYGUNSUZLUK VE EKSİK KAPATMA DÖKÜMÜ
    // ("YAPILDI" olarak işaretlenenler gösterilmez; yalnızca BETA ve açık uygunsuzluklar listelenir)
    // -------------------------------------------------------------
    const hasChangeLogs = Boolean(data.changeLogs && data.changeLogs.length > 0);
    if (page2DetailItems.length > 0 || (data.measures && data.measures.length > 0) || hasChangeLogs) {
      doc.addPage();
      let page2Y = margin + 5;

      if (page2DetailItems.length > 0) {
        // Page 2 Header Banner (Detay Dökümü)
        doc.setFillColor(10, 38, 71);
        doc.rect(margin, page2Y, pageWidth - margin * 2, 12, 'F');
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('TESPIT EDILEN UYGUNSUZLUKLAR VE EKSIK KAPATMA DETAY DOKUMU', margin + 4, page2Y + 7.5);
        page2Y += 14;

        // DETAYLI UYGUNSUZLUK VE BETA TABLOSU (YAPILDI hariç)
        const udTableRows = page2DetailItems.map((entry, index) => {
          const isResolved = !!entry.item.isResolved;
          const resType = entry.item.resolutionType || (isResolved ? 'YAPILDI' : 'KALDI');
          const descText = cleanTr(entry.item.description) || '-';
          const resNote = cleanTr(entry.item.resolutionNote || '').trim();

          const statusLabel = resType === 'BETA' ? 'BETA' : 'KALDI (UD)';
          const secondControlText = resNote ? `${statusLabel}\nNot: ${resNote}` : statusLabel;

          return [
            (index + 1).toString(),
            cleanTr(entry.category),
            cleanTr(entry.item.title),
            descText,
            cleanTr(entry.item.floorLabel) || '-',
            {
              content: secondControlText,
              styles: {
                textColor:
                  resType === 'BETA'
                    ? ([10, 38, 71] as [number, number, number])
                    : ([185, 28, 28] as [number, number, number]),
                fillColor:
                  resType === 'BETA'
                    ? ([239, 246, 255] as [number, number, number])
                    : undefined,
                fontStyle: 'bold' as const,
              },
            },
          ];
        });

        autoTable(doc, {
          startY: page2Y,
          margin: { left: margin, right: margin },
          head: [
            [
              { content: '#', styles: { halign: 'center' as const, cellWidth: 7 } },
              { content: 'BOLUM / KATEGORI', styles: { cellWidth: 28 } },
              { content: 'KONTROL MADDESI', styles: { cellWidth: 37 } },
              { content: 'KONTROL MADDESI ACIKLAMASI (ILK TESPIT)', styles: { cellWidth: 48 } },
              { content: 'DURAK', styles: { halign: 'center' as const, cellWidth: 13 } },
              { content: '2. KONTROL DURUMU & NOTU', styles: { cellWidth: 57 } },
            ],
          ],
          body: udTableRows,
          theme: 'striped',
          headStyles: {
            fillColor: hasReAuditDone ? [217, 119, 6] : [220, 38, 38],
            textColor: [255, 255, 255],
            fontStyle: 'bold' as const,
            fontSize: 7.8,
            cellPadding: 1.8,
          },
          styles: {
            fontSize: 7.5,
            cellPadding: 1.8,
            lineColor: [226, 232, 240],
            lineWidth: 0.2,
            textColor: [15, 23, 42],
            valign: 'middle' as const,
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252],
          },
          columnStyles: {
            0: { halign: 'center' as const, fontStyle: 'bold' as const },
            1: { fontStyle: 'bold' as const },
            2: { fontStyle: 'bold' as const },
            3: { textColor: [185, 28, 28], fontStyle: 'normal' as const },
            4: { halign: 'center' as const, fontStyle: 'bold' as const },
          },
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        page2Y = (doc as any).lastAutoTable.finalY + 6;
      }

      // Detaylı Saha Ölçü Tablosu
      if (data.measures && data.measures.length > 0) {
        if (page2Y > pageHeight - 40) {
          doc.addPage();
          page2Y = margin + 5;
        }

        const measureTableRows = data.measures.map((m, index) => [
          (index + 1).toString(),
          cleanTr(m.name),
          cleanTr(m.value) || '-',
          cleanTr(m.notes) || '-',
        ]);

        autoTable(doc, {
          startY: page2Y,
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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        page2Y = (doc as any).lastAutoTable.finalY + 6;
      }

      // Windows Kullanıcı Değişiklik ve İşlem Kaydı Tablosu
      if (data.changeLogs && data.changeLogs.length > 0) {
        if (page2Y > pageHeight - 40) {
          doc.addPage();
          page2Y = margin + 5;
        }

        const changeLogRows = data.changeLogs.map((log, index) => [
          (index + 1).toString(),
          cleanTr(log.timestamp),
          cleanTr(log.userName),
          cleanTr(log.userId),
          cleanTr(log.actionSummary),
        ]);

        autoTable(doc, {
          startY: page2Y,
          margin: { left: margin, right: margin },
          head: [
            [
              {
                content: 'WINDOWS DEGISIKLIK VE ISLEM KAYDI',
                colSpan: 5,
                styles: {
                  fillColor: [10, 38, 71],
                  textColor: [255, 255, 255],
                  fontStyle: 'bold' as const,
                  fontSize: 8.5,
                  cellPadding: 2,
                },
              },
            ],
            [
              { content: '#', styles: { halign: 'center' as const, cellWidth: 8 } },
              { content: 'TARIH / SAAT', styles: { cellWidth: 32 } },
              { content: 'PERSONEL ADI', styles: { cellWidth: 42 } },
              { content: 'KULLANICI ID', styles: { halign: 'center' as const, cellWidth: 26 } },
              { content: 'YAPILAN ISLEM', styles: { cellWidth: 82 } },
            ],
          ],
          body: changeLogRows,
          theme: 'grid',
          headStyles: {
            fillColor: [51, 65, 85],
            textColor: [255, 255, 255],
            fontStyle: 'bold' as const,
            fontSize: 7.4,
            cellPadding: 1.6,
          },
          styles: {
            fontSize: 7.4,
            cellPadding: 1.6,
            lineColor: [203, 213, 225],
            lineWidth: 0.2,
            textColor: [15, 23, 42],
            valign: 'middle' as const,
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252],
          },
          columnStyles: {
            0: { halign: 'center' as const, fontStyle: 'bold' as const },
            1: { fontStyle: 'normal' as const },
            2: { fontStyle: 'bold' as const },
            3: { halign: 'center' as const, fontStyle: 'bold' as const, textColor: [10, 38, 71] },
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
    if (isReadOnlyMonitoringMode) {
      openWindowsAuthModal('login', 'Google Drive bulutuna kayıt/yedekleme yapmak için giriş yapmalısınız.');
      return;
    }
    if (isDriveUploading) return;
    setIsDriveUploading(true);
    try {
      const dataToUpload =
        isWindowsDesktop && windowsUser
          ? appendWindowsChangeLog(data, windowsUser, 'Drive bulutuna yedeklendi')
          : data;
      const result = await uploadAuditJsonToDrive(dataToUpload);
      if (dataToUpload !== data) {
        onUpdateData?.(dataToUpload);
      }
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

  const handlePrepareContractorLink = async () => {
    if (isReadOnlyMonitoringMode) {
      openWindowsAuthModal('login', 'Taşeron eksik linki oluşturmak için adınız ve şifrenizle giriş yapın.');
      return;
    }
    if (isPreparingContractorLink) return;
    setIsPreparingContractorLink(true);
    setContractorError(null);
    setCopiedContractorLink(false);

    try {
      const ensuredAuditId =
        data.auditId && data.auditId.trim()
          ? data.auditId.trim()
          : `BETA-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

      const ensuredSlug =
        data.contractorSlug && data.contractorSlug.trim()
          ? data.contractorSlug.trim()
          : buildContractorSlug(data.serialNumber, data.clientProjectName);

      let auditToUpload: AuditFormData = {
        ...data,
        auditId: ensuredAuditId,
        contractorSlug: ensuredSlug,
      };
      if (isWindowsDesktop && windowsUser) {
        auditToUpload = appendWindowsChangeLog(auditToUpload, windowsUser, 'Taşeron eksik linki hazırlandı');
      }

      const uploadRes = await uploadAuditJsonToDrive(auditToUpload);
      if (!uploadRes.fileId || uploadRes.fileId === 'webhook-file') {
        throw new Error('Drive dosya kimliği (fileId) alınamadı. Lütfen Drive Köprüsü bağlantısını kontrol edin.');
      }

      const confirmedSlug = uploadRes.contractorSlug;

      onUpdateData?.({
        ...auditToUpload,
        driveFileId: uploadRes.fileId,
        contractorSlug: confirmedSlug || ensuredSlug,
      });

      const portalUrl = buildContractorPortalLink({
        slug: confirmedSlug,
        fileId: uploadRes.fileId,
        auditId: ensuredAuditId,
      });
      const projectLabel = data.clientProjectName || 'Asansör Projesi';
      const serialLabel = data.serialNumber || '-';
      const whatsAppText =
        `🔧 *BETA ASANSÖR - EKSİK LİSTESİ*\n` +
        `📌 Proje: ${projectLabel}\n` +
        `🔢 Seri No: ${serialLabel}\n` +
        `⚠️ Açık Eksik Sayısı: ${remainingUDCount} madde\n\n` +
        `Kurulum gerekmeden telefonunuzdan açmak için aşağıdaki linke dokunun. Yaptığınız maddeleri işaretleyip not ekleyebilir, en alttan kaydedebilirsiniz. İşiniz bitince telefonla bilgi vermeniz yeterlidir.\n\n` +
        `👉 ${portalUrl}`;

      setContractorShareData({
        url: portalUrl,
        fileName: uploadRes.fileName,
        whatsAppText,
        needsScriptV21Upgrade: !confirmedSlug,
      });
    } catch (err: any) {
      setContractorError(
        err?.message || 'Taşeron linki hazırlanırken Google Drive bağlantısında hata oluştu.'
      );
    } finally {
      setIsPreparingContractorLink(false);
    }
  };

  const handleCopyContractorLink = async (textToCopy: string) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedContractorLink(true);
      setTimeout(() => setCopiedContractorLink(false), 3000);
    } catch {
      const el = document.createElement('textarea');
      el.value = textToCopy;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopiedContractorLink(true);
      setTimeout(() => setCopiedContractorLink(false), 3000);
    }
  };

  const handleNativeShareContractorLink = async () => {
    if (!contractorShareData) return;
    try {
      await Share.share({
        title: `Eksik Listesi - ${data.serialNumber || data.clientProjectName || 'Asansör'}`,
        text: contractorShareData.whatsAppText,
        dialogTitle: 'Taşeron Eksik Linkini WhatsApp ile Gönder',
      });
    } catch {
      // Kullanıcı iptal ettiyse sessiz geç
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
            {/* TAŞERONA GÖNDER (WEB LİNKİ) BUTONU */}
            {remainingUDCount > 0 && (
              <button
                type="button"
                id="btn-share-contractor"
                disabled={isPreparingContractorLink}
                onClick={handlePrepareContractorLink}
                className={`min-h-[42px] px-4 py-2 bg-orange-500 hover:bg-orange-400 active:scale-95 text-slate-950 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 shadow-lg border-2 border-orange-300 transition-all cursor-pointer ${
                  isPreparingContractorLink ? 'opacity-80 cursor-wait' : ''
                }`}
                title="Yalnızca açık eksikleri içeren kurulumsuz web linki oluştur ve WhatsApp ile paylaş"
              >
                {isPreparingContractorLink ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                ) : (
                  <MessageCircle className="w-4 h-4 text-slate-950" />
                )}
                <span>
                  {isPreparingContractorLink ? 'Link Hazırlanıyor...' : 'Taşerona Gönder'}
                </span>
              </button>
            )}

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

        {/* Taşeron Linki Hata Bilgilendirmesi */}
        {contractorError && (
          <div className="bg-rose-950 border-2 border-rose-400 rounded-xl p-3 text-xs flex items-start justify-between gap-2.5 text-rose-100 animate-fadeIn">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-300 shrink-0 mt-0.5" />
              <div>
                <span className="font-black text-rose-200 block">Taşeron Linki Hazırlanamadı</span>
                <span>{contractorError}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setContractorError(null)}
              className="p-1 text-rose-300 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
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
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider block">Denetim Süresi:</span>
                {onUpdateData && (
                  <button
                    type="button"
                    onClick={() => {
                      if (isReadOnlyMonitoringMode) {
                        openWindowsAuthModal('login', 'Denetim süresini düzenlemek için giriş yapmalısınız.');
                        return;
                      }
                      setTempStartTime(data.startTime || '');
                      setTempEndTime(data.endTime || '');
                      setTempDuration(data.totalDurationFormatted || '');
                      setIsEditDurationOpen(true);
                    }}
                    className="no-print text-[10px] text-blue-700 hover:text-blue-900 font-bold flex items-center gap-0.5 cursor-pointer underline hover:no-underline active:scale-95"
                    title="1. Denetim saatlerini veya toplam süresini manuel düzenle"
                  >
                    <Edit3 className="w-2.5 h-2.5" />
                    <span>Düzenle</span>
                  </button>
                )}
              </div>
              <span className="text-xs font-black text-slate-950">{data.startTime || '-'} - {data.endTime || '-'} ({data.totalDurationFormatted || '-'})</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider block">Bakım Günü Tarihi:</span>
              <span className="text-xs font-black text-blue-900 font-mono">{data.maintenanceDate || '-'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider block">Başlangıç Onayları:</span>
              <span className="text-xs font-black text-emerald-800">
                Donanım: YAPILDI • Saat: YAPILDI
              </span>
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
                {page2DetailItems.length} Madde (BETA &amp; Açık UD)
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

            {/* Detaylı UD Tablosu (YAPILDI hariç; yalnızca BETA ve açık uygunsuzluklar) */}
            {page2DetailItems.length === 0 ? (
              <div className="p-4 bg-emerald-50 border-2 border-emerald-400 rounded-xl text-xs font-bold text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>
                  YAPILDI olarak işaretlenen maddeler bu dökümde gizlenmiştir; açık uygunsuzluk veya BETA maddesi bulunmamaktadır.
                </span>
              </div>
            ) : (
              <div className="border-2 border-slate-300 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-200 border-b-2 border-slate-300 text-slate-900 font-black uppercase text-[10px]">
                    <tr>
                      <th className="p-2 border-r border-slate-300 w-10 text-center">#</th>
                      <th className="p-2 border-r border-slate-300 w-32">Bölüm / Kategori</th>
                      <th className="p-2 border-r border-slate-300 w-48">Kontrol Maddesi</th>
                      <th className="p-2 border-r border-slate-300">Kontrol Maddesi Açıklama</th>
                      <th className="p-2 border-r border-slate-300 w-16 text-center">Durak</th>
                      <th className="p-2 w-52">2. Kontrol Durumu &amp; Notu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    {page2DetailItems.map((entry, index) => {
                      const isResolved = !!entry.item.isResolved;
                      const isBeta = isResolved && entry.item.resolutionType === 'BETA';
                      return (
                        <tr
                          key={index}
                          className={
                            isBeta
                              ? 'bg-blue-50/70 hover:bg-blue-100/60'
                              : 'bg-red-50/70 hover:bg-red-100/60'
                          }
                        >
                          <td
                            className={`p-2 border-r border-slate-300 text-center font-black ${
                              isBeta ? 'text-blue-900' : 'text-red-600'
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
                          <td className="p-2 border-r border-slate-300 text-xs font-semibold text-rose-900">
                            {entry.item.description || (
                              <span className="italic text-slate-400 font-normal">-</span>
                            )}
                          </td>
                          <td className="p-2 border-r border-slate-300 text-center font-black text-slate-800 text-[11px]">
                            {entry.item.floorLabel || '-'}
                          </td>
                          <td className="p-2 text-xs">
                            <div>
                              {isBeta ? (
                                <span className="inline-flex items-center justify-center px-2.5 py-0.5 bg-[#0A2647] border border-amber-400 text-amber-300 rounded font-black text-xs uppercase shadow-xs">
                                  BETA
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-200 border border-red-500 text-red-950 rounded font-black text-[10px] uppercase">
                                  <ShieldAlert className="w-3 h-3 text-red-700" /> Kaldı / UD
                                </span>
                              )}
                            </div>
                            {entry.item.resolutionNote && entry.item.resolutionNote.trim() !== '' && (
                              <div
                                className={`text-[11px] font-bold mt-1 flex items-center gap-1 px-2 py-0.5 rounded border w-fit ${
                                  isBeta
                                    ? 'bg-blue-100/90 text-blue-950 border-blue-300'
                                    : 'bg-rose-100/80 text-rose-900 border-rose-300'
                                }`}
                              >
                                <CheckCircle2
                                  className={`w-3 h-3 shrink-0 ${
                                    isBeta ? 'text-blue-700' : 'text-rose-700'
                                  }`}
                                />
                                <span>
                                  Not: {entry.item.resolutionNote}
                                </span>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
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

        {/* Section: WINDOWS DEĞİŞİKLİK & İŞLEM KAYDI */}
        {data.changeLogs && data.changeLogs.length > 0 && (
          <div className="pt-4 border-t-2 border-slate-300 space-y-2">
            <div className="flex items-center justify-between pb-1 border-b-2 border-[#0A2647]">
              <div className="flex items-center gap-1.5">
                <History className="w-4 h-4 text-[#0A2647]" />
                <h3 className="text-xs sm:text-sm font-black uppercase text-slate-900 tracking-wider">
                  WINDOWS DEĞİŞİKLİK &amp; İŞLEM KAYDI
                </h3>
              </div>
              <span className="text-[11px] font-bold text-slate-500">
                {data.changeLogs.length} Kayıt
              </span>
            </div>
            <div className="border-2 border-slate-300 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-200 border-b-2 border-slate-300 text-slate-900 font-black uppercase text-[10px]">
                  <tr>
                    <th className="p-2 border-r border-slate-300 w-10 text-center">#</th>
                    <th className="p-2 border-r border-slate-300 w-32">Tarih / Saat</th>
                    <th className="p-2 border-r border-slate-300 w-44">Personel Adı</th>
                    <th className="p-2 border-r border-slate-300 w-28 text-center">Kullanıcı ID</th>
                    <th className="p-2">Yapılan İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {data.changeLogs.map((log, index) => (
                    <tr key={log.id || index} className="hover:bg-slate-50">
                      <td className="p-2 border-r border-slate-300 text-center font-bold text-slate-700">
                        {index + 1}
                      </td>
                      <td className="p-2 border-r border-slate-300 font-mono text-[11px] text-slate-700">
                        {log.timestamp}
                      </td>
                      <td className="p-2 border-r border-slate-300 font-black text-slate-950">
                        {log.userName}
                      </td>
                      <td className="p-2 border-r border-slate-300 text-center">
                        <span className="inline-block px-2 py-0.5 bg-blue-100 border border-blue-300 text-blue-950 font-mono font-black text-[11px] rounded">
                          {log.userId}
                        </span>
                      </td>
                      <td className="p-2 text-slate-800 font-medium">
                        {log.actionSummary}
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
            const finalUpdated =
              isWindowsDesktop && windowsUser
                ? appendWindowsChangeLog(updated, windowsUser, '2. Kontrol / Eksik kapatma güncellendi')
                : updated;
            onUpdateData?.(finalUpdated);
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
          }}
        />
      )}

      {/* Denetim Süresi Düzenleme Modalı */}
      {isEditDurationOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 no-print">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-300 dark:border-slate-800 p-4 text-slate-900 dark:text-white animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold">1. Denetim Süresini Düzenle</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditDurationOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Başlangıç Saati:
                </label>
                <input
                  type="text"
                  value={tempStartTime}
                  onChange={(e) => setTempStartTime(e.target.value)}
                  placeholder="Örn: 10:15:00 veya 10:15"
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Bitiş Saati:
                </label>
                <input
                  type="text"
                  value={tempEndTime}
                  onChange={(e) => setTempEndTime(e.target.value)}
                  placeholder="Örn: 11:00:00 veya 11:00"
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Toplam Süre Gösterimi:
                </label>
                <input
                  type="text"
                  value={tempDuration}
                  onChange={(e) => setTempDuration(e.target.value)}
                  placeholder="Örn: 45 dk veya 1 sa 10 dk"
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                />
              </div>

              <div className="p-2 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 text-[11px] text-amber-900 dark:text-amber-200">
                Buluttan veya geçmişten çağrılan denetimlerde aradan geçen günler bu sayede sıfırlanır ve raporda dondurulmuş gerçek süre görünür.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsEditDurationOpen(false)}
                className="px-3 py-1.5 rounded text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={() => {
                  if (isReadOnlyMonitoringMode) {
                    openWindowsAuthModal('login', 'Denetim süresini kaydetmek için giriş yapmalısınız.');
                    return;
                  }
                  let nextAudit: AuditFormData = {
                    ...data,
                    startTime: tempStartTime.trim() || data.startTime,
                    endTime: tempEndTime.trim() || data.endTime,
                    totalDurationFormatted: tempDuration.trim() || data.totalDurationFormatted,
                  };
                  if (isWindowsDesktop && windowsUser) {
                    nextAudit = appendWindowsChangeLog(nextAudit, windowsUser, 'Denetim süresi düzenlendi');
                  }
                  onUpdateData?.(nextAudit);
                  setIsEditDurationOpen(false);
                }}
                className="px-4 py-1.5 rounded text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Süreyi Kaydet</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Taşerona Gönder (Kurulumsuz Web Linki) Paylaşım Modalı */}
      {contractorShareData && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 print:hidden">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border-2 border-slate-300 dark:border-slate-700 p-4 sm:p-5 text-slate-900 dark:text-white space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-500 text-slate-950 flex items-center justify-center shadow">
                  <Link2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black uppercase tracking-tight">
                    Taşeron Eksik Linki Hazır
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Drive dosyası güncellendi: <span className="font-mono">{contractorShareData.fileName}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setContractorShareData(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/60 text-xs text-emerald-950 dark:text-emerald-200 space-y-1">
              <p className="font-bold">
                Bu link yalnızca bu asansöre ait {remainingUDCount} açık eksiği gösterir.
              </p>
              <p className="text-[11px] opacity-90">
                Usta iOS veya Android telefonundan linke tıklayarak kurulumsuz açar, yaptıklarını işaretleyip not yazar ve doğrudan Drive dosyasına kaydeder.
              </p>
            </div>

            {contractorShareData.needsScriptV21Upgrade && (
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 text-[11px] text-amber-900 dark:text-amber-200">
                <strong>Not:</strong> Seri No + Referanslı kısa link için Google Apps Script kodunuzu <strong>v2.1</strong> sürümüne güncelleyin (şu an çalışan standart link üretildi).
              </div>
            )}

            {/* Link Kutusu */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300 block">
                Taşeron Web Bağlantısı:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={contractorShareData.url}
                  onFocus={(e) => e.target.select()}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-950 text-xs font-mono text-slate-800 dark:text-slate-200 select-all"
                />
                <button
                  type="button"
                  onClick={() => handleCopyContractorLink(contractorShareData.url)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-black uppercase flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  {copiedContractorLink ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  <span>{copiedContractorLink ? 'Kopyalandı' : 'Linki Kopyala'}</span>
                </button>
              </div>
            </div>

            {/* Hazır WhatsApp Mesaj Önizlemesi */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300 block">
                WhatsApp Mesaj Önizlemesi:
              </span>
              <pre className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] font-sans whitespace-pre-wrap break-words text-slate-700 dark:text-slate-300 max-h-36 overflow-y-auto">
                {contractorShareData.whatsAppText}
              </pre>
            </div>

            {/* Aksiyon Butonları */}
            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setContractorShareData(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Kapat
              </button>

              {Capacitor.isNativePlatform() ? (
                <button
                  type="button"
                  onClick={handleNativeShareContractorLink}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp ile Gönder</span>
                </button>
              ) : (
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(contractorShareData.whatsAppText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider inline-flex items-center gap-2 shadow-md"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp ile Gönder</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
