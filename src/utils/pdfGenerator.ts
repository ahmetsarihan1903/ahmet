import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import {
  CustomerInspectionMetadata,
  CustomerInspectionItem,
} from '../modules/customerPreInspection/customerChecklistData';
import { formatDateDMY } from './dateUtils';
import { getBetaLogoDataUrl } from './logoUtils';
import { getDeviceSecurityProfile } from './deviceSecurity';

/**
 * Clean Turkish special characters for standard jsPDF Latin fonts
 * to prevent corrupted or garbled glyphs
 */
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
 * Builds the official jsPDF document for Yeşil Etiket Öncesi Müşteri İşleri
 */
export function generateCustomerJsPdfDocument(
  metadata: CustomerInspectionMetadata,
  items: CustomerInspectionItem[]
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;

  // 1. TOP HEADER BANNER (Navy #0A2647)
  const bannerHeight = 22;
  doc.setFillColor(10, 38, 71);
  doc.roundedRect(margin, margin, contentWidth, bannerHeight, 1.5, 1.5, 'F');

  // Beta Logo inside banner
  const logoDataUrl = getBetaLogoDataUrl();
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', margin + 3, margin + 2.5, 14, 17);
    } catch {
      doc.setFillColor(217, 119, 6);
      doc.rect(margin + 3, margin + 2.5, 14, 17, 'F');
    }
  }

  // Header Title & Subtitle
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('BETA ASANSOR - YESIL ETIKET ONCESI MUSTERI ISLERI RAPORU', margin + 20, margin + 9);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  const cleanSerial = cleanTr(metadata.serialNumber || '001');
  doc.text(
    `Resmi Saha Muayene & Eksiklik Tespit Belgesi | Form No: BA-ETK-${cleanSerial.toUpperCase()} | Tarih: ${cleanTr(formatDateDMY(metadata.inspectionDate))}`,
    margin + 20,
    margin + 16
  );

  let currentY = margin + bannerHeight + 4;
  const devSec = getDeviceSecurityProfile();
  const defectiveItems = items.filter((item) => item.isDefective || item.isCustom);

  // 2. METADATA KÜNYE TABLE
  const metaRows = [
    [
      { content: 'REFERANS / PROJE:', styles: { fontStyle: 'bold' as const, fillColor: [241, 245, 249] as [number, number, number] } },
      cleanTr(metadata.projectName) || '-',
      { content: 'KONTROLU YAPAN:', styles: { fontStyle: 'bold' as const, fillColor: [241, 245, 249] as [number, number, number] } },
      cleanTr(metadata.auditorName) || '-',
    ],
    [
      { content: 'ASANSOR SERI NO:', styles: { fontStyle: 'bold' as const, fillColor: [241, 245, 249] as [number, number, number] } },
      cleanTr(metadata.serialNumber) || '-',
      { content: 'DENETIM TARIHI:', styles: { fontStyle: 'bold' as const, fillColor: [241, 245, 249] as [number, number, number] } },
      cleanTr(formatDateDMY(metadata.inspectionDate)) || '-',
    ],
    [
      { content: 'ASANSOR TIPI:', styles: { fontStyle: 'bold' as const, fillColor: [241, 245, 249] as [number, number, number] } },
      `${cleanTr(metadata.elevatorType)} (${metadata.elevatorType === 'MR' ? 'MAKINE DAIRELI' : 'MAKINE DAIRESIZ'})`,
      { content: 'RAPOR DURUMU:', styles: { fontStyle: 'bold' as const, fillColor: [241, 245, 249] as [number, number, number] } },
      defectiveItems.length > 0 ? `${defectiveItems.length} Adet Eksik Tespit Edildi` : 'Kusursuz / Eksiksiz',
    ],
    [
      { content: 'CIHAZ DONANIM NO:', styles: { fontStyle: 'bold' as const, fillColor: [241, 245, 249] as [number, number, number] } },
      `${cleanTr(devSec.hardwareId)} (#${cleanTr(devSec.installationId)})`,
      { content: 'KONTROL TIPI:', styles: { fontStyle: 'bold' as const, fillColor: [241, 245, 249] as [number, number, number] } },
      'Yesil Etiket Oncesi Santiye & Kuyu Muayenesi',
    ],
  ];

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    body: metaRows,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      lineColor: [203, 213, 225],
      lineWidth: 0.2,
      textColor: [15, 23, 42],
    },
    columnStyles: {
      0: { cellWidth: 42, fontStyle: 'bold' as const },
      1: { cellWidth: 51 },
      2: { cellWidth: 42, fontStyle: 'bold' as const },
      3: { cellWidth: 51 },
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  currentY = (doc as any).lastAutoTable.finalY + 5;

  // 3. DEFECTIVE ITEMS / CHECKLIST TABLE
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(10, 38, 71);
  doc.text('TESPIT EDILEN EKSIKLIKLER VE MUSTERI ISLERI LISTESI', margin, currentY);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Toplam ${defectiveItems.length} Madde Listelendi`, pageWidth - margin - 45, currentY);

  currentY += 2;

  if (defectiveItems.length === 0) {
    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      body: [
        [
          {
            content: 'MUSTERI ISLERI KUSURSUZ VE EKSIKSIZDIR\n\nYapilan saha denetiminde incelenen kontrol maddelerinde herhangi bir eksiklik veya uygunsuzluk tespit edilmemistir. Asansor kuyusu ve santiye montaj icin uygundur.',
            styles: {
              halign: 'center' as const,
              valign: 'middle' as const,
              fillColor: [240, 253, 244] as [number, number, number],
              textColor: [22, 101, 52] as [number, number, number],
              fontSize: 9,
              fontStyle: 'bold' as const,
              cellPadding: 8,
              lineColor: [187, 247, 208],
              lineWidth: 0.3,
            },
          },
        ],
      ],
      theme: 'plain',
    });
  } else {
    const tableBody = defectiveItems.map((item, idx) => [
      String(idx + 1),
      cleanTr(item.description || 'Kontrol Maddesi'),
      cleanTr(item.notes || 'Ozel aciklama girilmedi.'),
      'EKSIK',
    ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['No', 'Kontrol Kriteri / Teknik Tanim', 'Tespit Edilen Eksiklik & Not', 'Durum']],
      body: tableBody,
      theme: 'grid',
      headStyles: {
        fillColor: [10, 38, 71],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold' as const,
        halign: 'center' as const,
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2.2,
        lineColor: [226, 232, 240],
        lineWidth: 0.25,
        textColor: [15, 23, 42],
        valign: 'middle' as const,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' as const, fontStyle: 'bold' as const },
        1: { cellWidth: 85, fontStyle: 'bold' as const },
        2: { cellWidth: 70, textColor: [159, 18, 57] },
        3: { cellWidth: 19, halign: 'center' as const, fontStyle: 'bold' as const, textColor: [190, 18, 60], fillColor: [255, 241, 242] },
      },
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  currentY = (doc as any).lastAutoTable.finalY + 5;

  // 4. MANDATORY NOTICE (UYARI KUTUSU)
  if (currentY + 28 > pageHeight - 20) {
    doc.addPage();
    currentY = margin + 5;
  }

  doc.setFillColor(254, 243, 199); // Amber 100
  doc.setDrawColor(245, 158, 11); // Amber 500
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, currentY, contentWidth, 18, 1.5, 1.5, 'FD');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(120, 53, 15); // Amber 900
  const noticeLines = doc.splitTextToSize(
    'UYARI: YUKARIDA BELIRTILEN EKSIKLER TAMAMLANDIKTAN SONRA, BETA ASANSORE YAZILI BILDIRIMDE BULUNULMALIDIR. YAPILAN ISLERIN YERINDE KONTROL EDILMESINDEN SONRA, YESIL ETIKET BASVURUSU YAPILACAKTIR.',
    contentWidth - 8
  );
  doc.text(noticeLines, margin + 4, currentY + 6);

  currentY += 23;

  // 5. SIGNATURES SECTION
  if (currentY + 28 > pageHeight - 20) {
    doc.addPage();
    currentY = margin + 5;
  }

  const sigColWidth = (contentWidth - 8) / 2;
  // Left Box: Kontrolü Yapan Denetçi
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.setLineWidth(0.3);
  doc.rect(margin, currentY, sigColWidth, 24, 'FD');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(10, 38, 71);
  doc.text('KONTROLU YAPAN YETKILI / DENETCI', margin + 3, currentY + 5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`Isim: ${cleanTr(metadata.auditorName)}`, margin + 3, currentY + 10);
  doc.text(`Tarih: ${cleanTr(formatDateDMY(metadata.inspectionDate))}`, margin + 3, currentY + 15);
  doc.text('Imza / Kase: ____________________', margin + 3, currentY + 20);

  // Right Box: Şantiye / Müşteri Yetkilisi
  doc.rect(margin + sigColWidth + 8, currentY, sigColWidth, 24, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(10, 38, 71);
  doc.text('SANTIYE / MUSTERI YETKILISI', margin + sigColWidth + 11, currentY + 5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`Proje: ${cleanTr(metadata.projectName)}`, margin + sigColWidth + 11, currentY + 10);
  doc.text('Teslim Alan: ____________________', margin + sigColWidth + 11, currentY + 15);
  doc.text('Imza / Kase: ____________________', margin + sigColWidth + 11, currentY + 20);

  // 6. FOOTER ON ALL PAGES
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.25);
    doc.line(margin, pageHeight - 8, pageWidth - margin, pageHeight - 8);

    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Beta Asansor Yesil Etiket Oncesi Kontrol Sistemi - Cihaz Donanim No: ${cleanTr(devSec.hardwareId)} (#${cleanTr(devSec.installationId)}) - Resmi Belge`,
      margin,
      pageHeight - 4.5
    );
    doc.text(`Sayfa ${i} / ${totalPages}`, pageWidth - margin - 18, pageHeight - 4.5);
  }

  return doc;
}

/**
 * Direct PDF Export and Share handler with Capacitor Android Filesystem & Web fallback
 */
export async function exportPdfDirectly(
  metadata: CustomerInspectionMetadata,
  items: CustomerInspectionItem[],
  fileName: string,
  mode: 'download' | 'share'
): Promise<{ success: boolean; message: string; blobUrl?: string }> {
  try {
    const doc = generateCustomerJsPdfDocument(metadata, items);
    const folderName = 'BETAKALİTE';
    const pdfBlob = doc.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);

    // 1. CAPACITOR / ANDROID NATIVE EXPORT & SHARE
    if (Capacitor.isNativePlatform()) {
      try {
        try {
          await Filesystem.requestPermissions();
        } catch {}

        const base64Data = doc.output('datauristring').split(',')[1];
        let savedLocation = '';
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

        if (mode === 'share' && savedFileUri) {
          try {
            await Share.share({
              title: `Beta Asansör Yeşil Etiket Raporu - ${metadata.serialNumber || 'Eksiklik'}`,
              url: savedFileUri,
              dialogTitle: 'PDF Raporunu Paylaş (WhatsApp vb.)',
            });
            return {
              success: true,
              message: 'PDF hazırlandı ve paylaşım menüsü açıldı.',
              blobUrl,
            };
          } catch (shareErr) {
            console.warn('Native share fallback', shareErr);
          }
        }

        return {
          success: true,
          message: `PDF başarıyla kaydedildi: ${savedLocation}`,
          blobUrl,
        };
      } catch (nativeErr: any) {
        console.warn('Native save failed, fallback to web download', nativeErr);
      }
    }

    // 2. WEB / DESKTOP DOWNLOAD & SHARE
    if (mode === 'share') {
      try {
        const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `Beta Asansör Yeşil Etiket Raporu - ${metadata.serialNumber || 'Eksiklik'}`,
            files: [file],
          });
          return {
            success: true,
            message: 'PDF paylaşım menüsü açıldı.',
            blobUrl,
          };
        }
      } catch (shareErr: any) {
        if (shareErr.name === 'AbortError') {
          return { success: true, message: 'Paylaşım iptal edildi.', blobUrl };
        }
      }
    }

    // Modern file system access API for web desktop
    if ('showSaveFilePicker' in window) {
      try {
        const fileHandle = await (window as any).showSaveFilePicker({
          suggestedName: fileName,
          types: [
            {
              description: 'PDF Belgesi',
              accept: { 'application/pdf': ['.pdf'] },
            },
          ],
        });
        const writableStream = await fileHandle.createWritable();
        await writableStream.write(pdfBlob);
        await writableStream.close();
        return {
          success: true,
          message: `PDF başarıyla kaydedildi: ${fileHandle.name || fileName}`,
          blobUrl,
        };
      } catch (pickerErr: any) {
        if (pickerErr?.name === 'AbortError') {
          return { success: true, message: 'Kayıt iptal edildi.', blobUrl };
        }
      }
    }

    // Fallback standard browser anchor download
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
    }, 1500);

    return {
      success: true,
      message: 'PDF dosyası başarıyla indirildi.',
      blobUrl,
    };
  } catch (err: any) {
    console.error('PDF export fatal error:', err);
    return {
      success: false,
      message: 'PDF oluşturulurken bir hata oluştu: ' + (err?.message || 'Bilinmeyen hata'),
    };
  }
}

export async function generateDirectPdf(
  metadata: CustomerInspectionMetadata,
  items: CustomerInspectionItem[],
  fileName: string
): Promise<{ blobUrl: string }> {
  const result = await exportPdfDirectly(metadata, items, fileName, 'download');
  return { blobUrl: result.blobUrl || '' };
}

export function printElementDirectly() {
  window.print();
}
