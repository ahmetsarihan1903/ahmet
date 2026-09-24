import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { RailDoorInspectionFullData } from '../types';
import {
  ELEVATOR_TYPE_CONFIGS,
  getMeasurementDefsForLayout,
  getDefaultFloorAlias,
  formatCmToMm,
  calculateMmDeviation,
  getColumnInferredNominals,
} from '../constants';
import { getBetaLogoDataUrl } from '../../../utils/logoUtils';
import { getDeviceSecurityProfile } from '../../../utils/deviceSecurity';

// Clean Turkish special characters for standard jsPDF Latin fonts to prevent garbled text
export const cleanTr = (val: string | number | undefined | null): string => {
  if (val === undefined || val === null || val === '') return '';
  const str = String(val);
  return str
    .replace(/İ/g, 'I')
    .replace(/ı/g, 'i')
    .replace(/Ğ/g, 'G')
    .replace(/ğ/g, 'g')
    .replace(/Ü/g, 'U')
    .replace(/ü/g, 'u')
    .replace(/Ş/g, 'S')
    .replace(/ş/g, 's')
    .replace(/Ö/g, 'O')
    .replace(/ö/g, 'o')
    .replace(/Ç/g, 'C')
    .replace(/ç/g, 'c');
};

/**
 * Standardized filename for Ray, Kapi & Makine Sase Report PDF
 */
export function getRailDoorStandardizedFileName(data: RailDoorInspectionFullData): string {
  const cleanSerial = cleanTr(data.identity.serialNumber || '').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  if (cleanSerial) {
    return `Ray_Kapi_${cleanSerial}.pdf`;
  }
  const cleanRef = cleanTr(data.identity.reference || '').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  if (cleanRef) {
    return `Ray_Kapi_${cleanRef}.pdf`;
  }
  return 'Beta_Ray_Kapi_Kontrol_Raporu.pdf';
}

/**
 * Builds the complete jsPDF document for Ray, Kapi & Makine Sase Report
 */
export function buildRailDoorJsPdfDocument(data: RailDoorInspectionFullData): jsPDF {
  const doc = new jsPDF({
    orientation: 'landscape', // Landscape gives ample room for 15+ column matrix
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;

  const typeConfig = ELEVATOR_TYPE_CONFIGS.find((c) => c.type === data.mainType);
  const layoutObj = typeConfig?.allowedLayouts.find((l) => l.layout === data.layoutPosition);

  const stopCount = data.stopCount || 1;
  const startFloor = data.startFloor ?? 0;
  const stopIndices = Array.from({ length: stopCount }, (_, i) => i + 1);
  const baseColumnCodes = Array.from({ length: 15 }, (_, i) => String(i + 1));
  const columnCodes = [...baseColumnCodes, ...(data.customColumnCodes || [])];

  const inferredNominals = getColumnInferredNominals(
    data.floorMatrixMeasurements || {},
    columnCodes
  );

  // 1. TOP HEADER BANNER (Navy #0A2647)
  const bannerHeight = 18;
  doc.setFillColor(10, 38, 71); // Navy #0A2647
  doc.rect(margin, margin, pageWidth - margin * 2, bannerHeight, 'F');

  // Beta Asansor Logo inside banner
  const logoDataUrl = getBetaLogoDataUrl();
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', margin + 2.5, margin + 2, 12, 14);
    } catch {
      doc.setFillColor(217, 119, 6);
      doc.rect(margin + 2.5, margin + 2, 12, 14, 'F');
    }
  }

  // Header Title & Subtitle
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('BETA ASANSOR - RAY, KAPI VE MAKINE SASE KONTROL RAPORU', margin + 17, margin + 7.5);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225); // Slate 300
  doc.text(
    `Resmi Saha Olcu & Montaj Uygunluk Belgesi | Dokuman No: BT-RK-2026 | Rapor Tarihi: ${cleanTr(data.inspectionDateDisplay)}`,
    margin + 17,
    margin + 13.5
  );

  // 2. PROJECT METADATA TABLE (4 Columns Grid)
  let lastY = margin + bannerHeight + 3;
  const devSec = getDeviceSecurityProfile();

  const metaRows = [
    [
      { content: 'SERI NO:', styles: { fontStyle: 'bold' as const, fillColor: [241, 245, 249] as [number, number, number] } },
      cleanTr(data.identity.serialNumber) || '-',
      { content: 'REFERANS / SANTIYE:', styles: { fontStyle: 'bold' as const, fillColor: [241, 245, 249] as [number, number, number] } },
      cleanTr(data.identity.reference) || '-',
      { content: 'TESIS YERI:', styles: { fontStyle: 'bold' as const, fillColor: [241, 245, 249] as [number, number, number] } },
      cleanTr(data.identity.location) || '-',
      { content: 'DURAK SAYISI:', styles: { fontStyle: 'bold' as const, fillColor: [241, 245, 249] as [number, number, number] } },
      `${data.stopCount || 1} Durak`,
    ],
    [
      { content: 'MONTAJ USTASI:', styles: { fontStyle: 'bold' as const, fillColor: [241, 245, 249] as [number, number, number] } },
      cleanTr(data.identity.installerMaster) || '-',
      { content: 'PROJE SORUMLUSU:', styles: { fontStyle: 'bold' as const, fillColor: [241, 245, 249] as [number, number, number] } },
      cleanTr(data.identity.projectManager) || '-',
      { content: 'KONTROL EDEN:', styles: { fontStyle: 'bold' as const, fillColor: [241, 245, 249] as [number, number, number] } },
      cleanTr(data.identity.inspector) || '-',
      { content: 'TIP & YERLESIM:', styles: { fontStyle: 'bold' as const, fillColor: [241, 245, 249] as [number, number, number] } },
      `${cleanTr(typeConfig?.label || '')} (${cleanTr(layoutObj?.label || '')})`,
    ],
    [
      { content: 'CIHAZ DONANIM NO:', styles: { fontStyle: 'bold' as const, fillColor: [241, 245, 249] as [number, number, number] } },
      cleanTr(devSec.hardwareId),
      { content: 'KURULUM ID:', styles: { fontStyle: 'bold' as const, fillColor: [241, 245, 249] as [number, number, number] } },
      cleanTr(`#${devSec.installationId}`),
      { content: 'DENETIM TARIHI:', styles: { fontStyle: 'bold' as const, fillColor: [241, 245, 249] as [number, number, number] } },
      cleanTr(data.inspectionDateDisplay || '-'),
      { content: 'GUVENLIK DOGRULAMA:', styles: { fontStyle: 'bold' as const, fillColor: [241, 245, 249] as [number, number, number] } },
      'KILITLI RESMI KAYIT',
    ],
  ];

  autoTable(doc, {
    startY: lastY,
    margin: { left: margin, right: margin },
    body: metaRows,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 1.8,
      lineColor: [203, 213, 225],
      lineWidth: 0.2,
      textColor: [15, 23, 42],
    },
    columnStyles: {
      0: { cellWidth: 26 },
      1: { cellWidth: 42, fontStyle: 'bold' as const },
      2: { cellWidth: 32 },
      3: { cellWidth: 44, fontStyle: 'bold' as const },
      4: { cellWidth: 24 },
      5: { cellWidth: 44, fontStyle: 'bold' as const },
      6: { cellWidth: 26 },
      7: { fontStyle: 'bold' as const },
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lastY = (doc as any).lastAutoTable.finalY + 4;

  // 3. SECTION 1: 15-COLUMN RAIL & DOOR MATRIX TABLE
  const matrixHeaders = [
    { content: 'DURAK', styles: { halign: 'center' as const, cellWidth: 14 } },
    { content: 'RUMUZ', styles: { halign: 'center' as const, cellWidth: 16 } },
    ...columnCodes.map((c) => {
      let title = c;
      if (c === '9' && data.column9Direction) {
        title = `9(${cleanTr(data.column9Direction)})`;
      }
      return { content: title, styles: { halign: 'center' as const } };
    }),
  ];

  // Nominal Row
  const nominalRow = [
    { content: 'PROJE', styles: { fontStyle: 'bold' as const, halign: 'center' as const, fillColor: [254, 243, 199] as [number, number, number] } },
    { content: 'NOM(mm)', styles: { fontStyle: 'bold' as const, halign: 'center' as const, fillColor: [254, 243, 199] as [number, number, number] } },
    ...columnCodes.map((c) => ({
      content: formatCmToMm(data.projectNominalValues?.[c], '-'),
      styles: { fontStyle: 'bold' as const, halign: 'center' as const, fillColor: [254, 243, 199] as [number, number, number], textColor: [120, 53, 15] as [number, number, number] },
    })),
  ];

  // Stop Rows
  const matrixBodyRows: any[] = [nominalRow];

  stopIndices.forEach((sIdx, rowIdx) => {
    const floorNum = startFloor + (sIdx - 1);
    const alias = cleanTr(data.floorAliases?.[sIdx] ?? getDefaultFloorAlias(floorNum));
    const row = data.floorMatrixMeasurements?.[String(sIdx)] || {};

    const rowCells: any[] = [
      { content: `${sIdx}.DR`, styles: { fontStyle: 'bold' as const, halign: 'center' as const, fillColor: [241, 245, 249] as [number, number, number] } },
      { content: alias, styles: { fontStyle: 'bold' as const, halign: 'center' as const, fillColor: [254, 243, 199] as [number, number, number] } },
    ];

    columnCodes.forEach((cCode) => {
      const cellVal = row[cCode] || '';
      const nomVal = data.projectNominalValues?.[cCode] || '';
      const dev = calculateMmDeviation(
        cellVal,
        nomVal,
        cCode,
        inferredNominals[cCode],
        data.layoutPosition
      );

      const cellText = formatCmToMm(cellVal, '---');

      let cellStyles: any = { halign: 'center' as const, textColor: [15, 23, 42] };
      if (dev && !dev.isMatch) {
        if (dev.isCritical) {
          cellStyles = {
            halign: 'center' as const,
            fillColor: [254, 226, 226], // Light Red
            textColor: [185, 28, 28], // Dark Red
            fontStyle: 'bold' as const,
          };
        } else {
          cellStyles = {
            halign: 'center' as const,
            fillColor: [254, 243, 199], // Light Amber
            textColor: [180, 83, 9], // Dark Amber
            fontStyle: 'bold' as const,
          };
        }
      }

      rowCells.push({ content: cellText, styles: cellStyles });
    });

    matrixBodyRows.push(rowCells);
  });

  autoTable(doc, {
    startY: lastY,
    margin: { left: margin, right: margin },
    head: [
      [
        {
          content: '1. BOLUM: 15 SUTUN RAY & KAPI KAT OLCU MATRISI (Tum degerler mm cinsindendir)',
          colSpan: matrixHeaders.length,
          styles: {
            fillColor: [217, 119, 6], // Amber #D97706
            textColor: [255, 255, 255],
            fontStyle: 'bold' as const,
            fontSize: 8.5,
            cellPadding: 2,
          },
        },
      ],
      matrixHeaders,
    ],
    body: matrixBodyRows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59], // Slate 800
      textColor: [255, 255, 255],
      fontStyle: 'bold' as const,
      fontSize: 7,
      cellPadding: 1.5,
    },
    styles: {
      fontSize: 7,
      cellPadding: 1.5,
      lineColor: [203, 213, 225],
      lineWidth: 0.2,
      font: 'helvetica',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lastY = (doc as any).lastAutoTable.finalY + 4;

  // 4. SECTION 2: CHASSIS & CONSOLE MEASUREMENTS TABLE
  // Check if we need a new page
  if (lastY > pageHeight - 50) {
    doc.addPage();
    lastY = margin + 5;
  }

  // Format pit and headroom
  const pitVal = data.pitDepth || '';
  let pitMmStr = '---';
  if (pitVal.trim() !== '') {
    const n = parseFloat(pitVal.replace(',', '.'));
    pitMmStr = isNaN(n) ? pitVal : `${Math.round(n * 10)} mm (${pitVal} cm)`;
  }

  const headVal = data.headroom || '';
  let headMmStr = '---';
  if (headVal.trim() !== '') {
    const n = parseFloat(headVal.replace(',', '.'));
    headMmStr = isNaN(n) ? headVal : `${Math.round(n * 10)} mm (${headVal} cm)`;
  }

  // Chase Table 1 columns: A, B, C, D, E, F(11), 10, G, H, I
  const chaseCols = ['A', 'B', 'C', 'D', 'E', 'F(11)', '10', 'G', 'H', 'I'];
  const chaseValues = chaseCols.map((col) => {
    const valCm = data.chaseMeasurementsTable1?.[col] || '';
    if (valCm.trim() === '') return '---';
    const num = parseFloat(valCm.replace(',', '.'));
    return isNaN(num) ? valCm : Math.round(num * 10).toString();
  });

  // Console Table 2 columns: K, L, M, N (U Bölme & Tek Ray)
  const consoleCols = ['K', 'L', 'M', 'N'];
  const uBolmeValues = consoleCols.map((col) => {
    const valCm = data.consoleMeasurementsTable2?.uBolmeSide?.[col] || '';
    if (valCm.trim() === '') return '---';
    const num = parseFloat(valCm.replace(',', '.'));
    return isNaN(num) ? valCm : Math.round(num * 10).toString();
  });

  const tekRayValues = consoleCols.map((col) => {
    const valCm = data.consoleMeasurementsTable2?.tekRaySide?.[col] || '';
    if (valCm.trim() === '') return '---';
    const num = parseFloat(valCm.replace(',', '.'));
    return isNaN(num) ? valCm : Math.round(num * 10).toString();
  });

  const section2Rows = [
    // Pit & Headroom row
    [
      { content: 'KUYUDIBI OLCUSU:', styles: { fontStyle: 'bold' as const, fillColor: [241, 245, 249] as [number, number, number] } },
      { content: pitMmStr, styles: { fontStyle: 'bold' as const } },
      { content: 'SON KAT OLCUSU:', styles: { fontStyle: 'bold' as const, fillColor: [241, 245, 249] as [number, number, number] } },
      { content: headMmStr, styles: { fontStyle: 'bold' as const }, colSpan: 7 },
    ],
  ];

  autoTable(doc, {
    startY: lastY,
    margin: { left: margin, right: margin },
    head: [
      [
        {
          content: '2. BOLUM: SASE OLCULERI, KUYUDIBI, SON KAT VE KONSOL MESAFELERI (mm)',
          colSpan: 10,
          styles: {
            fillColor: [10, 38, 71], // Navy #0A2647
            textColor: [255, 255, 255],
            fontStyle: 'bold' as const,
            fontSize: 8.5,
            cellPadding: 2,
          },
        },
      ],
    ],
    body: section2Rows,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 1.8,
      lineColor: [203, 213, 225],
      lineWidth: 0.2,
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lastY = (doc as any).lastAutoTable.finalY + 2;

  // Chase Table 1 AutoTable
  autoTable(doc, {
    startY: lastY,
    margin: { left: margin, right: margin },
    head: [
      [
        {
          content: '1. Sase Olculeri Kontrolu (mm)',
          colSpan: chaseCols.length,
          styles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold' as const, fontSize: 7 },
        },
      ],
      chaseCols.map((c) => ({ content: c, styles: { halign: 'center' as const } })),
    ],
    body: [
      chaseValues.map((v) => ({ content: v, styles: { halign: 'center' as const, fontStyle: 'bold' as const } })),
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [226, 232, 240],
      textColor: [15, 23, 42],
      fontStyle: 'bold' as const,
      fontSize: 7,
      cellPadding: 1.5,
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 1.8,
      lineColor: [203, 213, 225],
      lineWidth: 0.2,
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lastY = (doc as any).lastAutoTable.finalY + 2;

  // Console Table 2 AutoTable
  autoTable(doc, {
    startY: lastY,
    margin: { left: margin, right: margin },
    head: [
      [
        {
          content: '2. Konsol Mesafeleri (mm)',
          colSpan: consoleCols.length + 1,
          styles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold' as const, fontSize: 7 },
        },
      ],
      [
        { content: 'BOLGE / TARAF', styles: { cellWidth: 40 } },
        ...consoleCols.map((c) => ({ content: c, styles: { halign: 'center' as const } })),
      ],
    ],
    body: [
      [
        { content: '1. U Bolme Tarafi', styles: { fontStyle: 'bold' as const, fillColor: [241, 245, 249] as [number, number, number] } },
        ...uBolmeValues.map((v) => ({ content: v, styles: { halign: 'center' as const, fontStyle: 'bold' as const } })),
      ],
      [
        { content: '2. Tek Ray Tarafi', styles: { fontStyle: 'bold' as const, fillColor: [241, 245, 249] as [number, number, number] } },
        ...tekRayValues.map((v) => ({ content: v, styles: { halign: 'center' as const, fontStyle: 'bold' as const } })),
      ],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [226, 232, 240],
      textColor: [15, 23, 42],
      fontStyle: 'bold' as const,
      fontSize: 7,
      cellPadding: 1.5,
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 1.8,
      lineColor: [203, 213, 225],
      lineWidth: 0.2,
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lastY = (doc as any).lastAutoTable.finalY + 3;

  // 5. SECTION 3: NON-CONFORMITIES (If any)
  if (data.nonConformities && data.nonConformities.length > 0) {
    if (lastY > pageHeight - 40) {
      doc.addPage();
      lastY = margin + 5;
    }

    const ncRows = data.nonConformities.map((nc, idx) => [
      (idx + 1).toString(),
      cleanTr(nc.floor || 'Genel'),
      cleanTr(nc.title),
      nc.status === 'resolved' ? '[GIDERILDI]' : '[ACIK / BEKLIYOR]',
      cleanTr(nc.description || '-'),
    ]);

    autoTable(doc, {
      startY: lastY,
      margin: { left: margin, right: margin },
      head: [
        [
          {
            content: `3. BOLUM: SAHA UYGUNSUZLUKLARI VE KUSUR KAYITLARI (${data.nonConformities.length} Adet)`,
            colSpan: 5,
            styles: {
              fillColor: [220, 38, 38], // Red #DC2626
              textColor: [255, 255, 255],
              fontStyle: 'bold' as const,
              fontSize: 8,
              cellPadding: 1.8,
            },
          },
        ],
        [
          { content: '#', styles: { halign: 'center' as const, cellWidth: 8 } },
          { content: 'KAT/DURAK', styles: { halign: 'center' as const, cellWidth: 20 } },
          { content: 'KUSUR BASLIGI', styles: { cellWidth: 50 } },
          { content: 'DURUM', styles: { halign: 'center' as const, cellWidth: 30 } },
          { content: 'ACIKLAMA VE NOTLAR' },
        ],
      ],
      body: ncRows,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: 'bold' as const,
        fontSize: 7,
        cellPadding: 1.5,
      },
      styles: {
        fontSize: 7,
        cellPadding: 1.5,
        lineColor: [203, 213, 225],
        lineWidth: 0.2,
      },
      columnStyles: {
        0: { halign: 'center' as const, fontStyle: 'bold' as const },
        1: { halign: 'center' as const, fontStyle: 'bold' as const },
        2: { fontStyle: 'bold' as const },
        3: { halign: 'center' as const, fontStyle: 'bold' as const },
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lastY = (doc as any).lastAutoTable.finalY + 3;
  }

  // Add Page Numbers & Footer to all pages
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.25);
    doc.line(margin, pageHeight - 8, pageWidth - margin, pageHeight - 8);

    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Beta Asansor Ray & Kapi - Cihaz Donanim: ${cleanTr(devSec.hardwareId)} (#${cleanTr(devSec.installationId)}) - Resmi Montaj Kontrol Kaydi`,
      margin,
      pageHeight - 5
    );
    doc.text(`Sayfa ${i} / ${totalPages}`, pageWidth - margin - 15, pageHeight - 5);
  }

  return doc;
}

/**
 * Downloads the Rail & Door PDF directly to the device / BETAKALİTE folder
 */
export async function downloadRailDoorPdf(
  data: RailDoorInspectionFullData
): Promise<{ success: boolean; message: string; filePath?: string }> {
  try {
    const doc = buildRailDoorJsPdfDocument(data);
    const fileName = getRailDoorStandardizedFileName(data);
    const folderName = 'BETAKALİTE';
    let savedLocation = '';

    // 1. Android Capacitor Native Platform
    if (Capacitor.isNativePlatform()) {
      try {
        try {
          await Filesystem.requestPermissions();
        } catch {
          // Ignore if permission already granted
        }

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
          });
          savedLocation = `Cihaz Hafızası / Belgeler / ${folderName} / ${fileName}`;
          savedFileUri = res.uri;
        } catch (docErr) {
          console.warn('Documents folder write failed, trying root Documents/Cache', docErr);
          try {
            const res2 = await Filesystem.writeFile({
              path: fileName,
              data: base64Data,
              directory: Directory.Documents,
            });
            savedLocation = `Cihaz Hafızası / Belgeler / ${fileName}`;
            savedFileUri = res2.uri;
          } catch (rootErr) {
            const res3 = await Filesystem.writeFile({
              path: fileName,
              data: base64Data,
              directory: Directory.Cache,
            });
            savedLocation = `Cihaz İndirilenler / ${fileName}`;
            savedFileUri = res3.uri;
          }
        }

        // Native share sheet popup for instant viewing/printing
        if (savedFileUri) {
          try {
            await Share.share({
              title: `Beta Asansör Ray & Kapı Raporu - ${data.identity.serialNumber || 'RK'}`,
              url: savedFileUri,
              dialogTitle: 'PDF Raporunu Aç / Kaydet / Yazdır',
            });
          } catch {
            // Dismissed
          }
        }

        return {
          success: true,
          message: `PDF başarıyla kaydedildi: ${savedLocation}`,
          filePath: savedLocation,
        };
      } catch (nativeErr: any) {
        console.warn('Native Filesystem save failed, falling back to browser blob download', nativeErr);
      }
    }

    const pdfBlob = doc.output('blob');

    // 2. Modern File System Access API
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

        return {
          success: true,
          message: `PDF dosyası kaydedildi: ${fileHandle.name || fileName}`,
          filePath: fileHandle.name || fileName,
        };
      } catch (pickerErr: any) {
        if (pickerErr?.name === 'AbortError') {
          return { success: false, message: 'İndirme iptal edildi.' };
        }
      }
    }

    // 3. Fallback Binary Blob Download
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

    return {
      success: true,
      message: `PDF indirildi: ${fileName}`,
      filePath: fileName,
    };
  } catch (error: any) {
    console.error('PDF indirme hatası:', error);
    return {
      success: false,
      message: `PDF oluşturulamadı: ${error.message || error}`,
    };
  }
}

/**
 * Shares the actual PDF File directly (WhatsApp / Telegram / Email / Google Drive)
 */
export async function shareRailDoorPdf(
  data: RailDoorInspectionFullData
): Promise<{ success: boolean; message: string }> {
  try {
    const doc = buildRailDoorJsPdfDocument(data);
    const fileName = getRailDoorStandardizedFileName(data);

    // 1. Android Capacitor Native Share (Direct File Attachment)
    if (Capacitor.isNativePlatform()) {
      try {
        const base64Data = doc.output('datauristring').split(',')[1];
        const tempFile = await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Cache,
        });

        await Share.share({
          title: `Beta Asansör Ray & Kapı Raporu - ${data.identity.serialNumber || 'RK'}`,
          url: tempFile.uri,
          dialogTitle: 'PDF Raporunu WhatsApp / Drive / Dosyalar ile Paylaş',
        });

        return { success: true, message: 'PDF paylaşım penceresi açıldı.' };
      } catch (nativeShareErr: any) {
        console.warn('Capacitor native share error, falling back to Web Share API', nativeShareErr);
      }
    }

    const pdfBlob = doc.output('blob');
    const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

    // 2. Web Share API with File (Direct document sharing)
    if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
      await navigator.share({
        files: [pdfFile],
        title: `Beta Asansör Ray & Kapı Raporu - ${data.identity.serialNumber || 'RK'}`,
      });
      return { success: true, message: 'PDF başarıyla paylaşıldı.' };
    }

    // 3. Fallback: Download PDF and notify user
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

    return {
      success: true,
      message: `PDF indirildi (${fileName}). WhatsApp veya mesajlaşma uygulamanızdan bu PDF dosyasını seçerek doğrudan gönderebilirsiniz.`,
    };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return { success: false, message: 'Paylaşım iptal edildi.' };
    }
    console.error('PDF paylaşma hatası:', error);
    return {
      success: false,
      message: `PDF paylaşılamadı: ${error.message || error}`,
    };
  }
}
