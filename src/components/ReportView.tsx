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
  PlusCircle,
  Ruler,
  CheckCircle2,
  ShieldAlert,
  Loader2,
  MessageCircle,
  Download,
  Printer,
  FolderCheck,
  FileText,
  Eye,
} from 'lucide-react';
import { AuditFormData, InspectionItem } from '../types';
import { BetaLogo } from './BetaLogo';
import { getBetaLogoDataUrl } from '../utils/logoUtils';

interface ReportViewProps {
  data: AuditFormData;
  onEditAudit: () => void;
  onNewInspection: () => void;
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

export const ReportView: React.FC<ReportViewProps> = ({
  data,
  onEditAudit,
  onNewInspection,
}) => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [downloadedFilePath, setDownloadedFilePath] = useState<string | null>(null);

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
      },
    });
  }

  // Generate standardized filename using Serial Number
  const getStandardizedFileName = (): string => {
    const cleanSerial = cleanTr(data.serialNumber || '').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    if (cleanSerial) {
      return `${cleanSerial}.pdf`;
    }
    const cleanProject = cleanTr(data.clientProjectName || '').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    if (cleanProject) {
      return `${cleanProject}.pdf`;
    }
    return 'BETA_KK_Raporu.pdf';
  };

  // Generate Reusable Full jsPDF Document
  const buildJsPdfDocument = (): jsPDF => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 12;

    // 1. TOP HEADER BANNER (Navy #0A2647)
    doc.setFillColor(10, 38, 71); // #0A2647
    doc.rect(margin, margin, pageWidth - margin * 2, 22, 'F');

    // Official Beta Asansör Logo
    const logoDataUrl = getBetaLogoDataUrl();
    if (logoDataUrl) {
      try {
        doc.addImage(logoDataUrl, 'PNG', margin + 3, margin + 2.5, 12, 14.4);
      } catch {
        doc.setFillColor(0, 136, 206);
        doc.rect(margin + 3, margin + 2.5, 12, 14.4, 'F');
      }
    }

    // Header Text
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('BETA ASANSOR - KALITE KONTROL RAPORU', margin + 18, margin + 9);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225); // Slate 300
    doc.text(
      'Resmi Son Muayene ve Saha Uygunluk Belgesi | Kalite Guvence Birimi',
      margin + 18,
      margin + 16
    );

    // 2. METADATA TABLE (2 Column Grid)
    const metaRows = [
      [
        {
          content: 'KONTROLU YAPAN:',
          styles: {
            fontStyle: 'bold' as const,
            fillColor: [241, 245, 249] as [number, number, number],
            textColor: [15, 23, 42] as [number, number, number],
          },
        },
        cleanTr(data.inspectorName) || '-',
        {
          content: 'MUSTERI / PROJE:',
          styles: {
            fontStyle: 'bold' as const,
            fillColor: [241, 245, 249] as [number, number, number],
            textColor: [15, 23, 42] as [number, number, number],
          },
        },
        cleanTr(data.clientProjectName) || '-',
      ],
      [
        {
          content: 'ASANSOR TIPI:',
          styles: {
            fontStyle: 'bold' as const,
            fillColor: [241, 245, 249] as [number, number, number],
            textColor: [15, 23, 42] as [number, number, number],
          },
        },
        cleanTr(data.elevatorType) || '-',
        {
          content: 'SERI / TAKIP NO:',
          styles: {
            fontStyle: 'bold' as const,
            fillColor: [241, 245, 249] as [number, number, number],
            textColor: [15, 23, 42] as [number, number, number],
          },
        },
        cleanTr(data.serialNumber) || '-',
      ],
      [
        {
          content: 'KAPASITE (KG):',
          styles: {
            fontStyle: 'bold' as const,
            fillColor: [241, 245, 249] as [number, number, number],
            textColor: [15, 23, 42] as [number, number, number],
          },
        },
        `${data.capacityKg || '-'} KG`,
        {
          content: 'DURAK SAYISI:',
          styles: {
            fontStyle: 'bold' as const,
            fillColor: [241, 245, 249] as [number, number, number],
            textColor: [15, 23, 42] as [number, number, number],
          },
        },
        `${data.stopCount || '-'} Durak (Baslangic: ${cleanTr(data.floorStart) || '0'})`,
      ],
      [
        {
          content: 'DENETIM TARIHI:',
          styles: {
            fontStyle: 'bold' as const,
            fillColor: [241, 245, 249] as [number, number, number],
            textColor: [15, 23, 42] as [number, number, number],
          },
        },
        cleanTr(data.dateDisplay) || '-',
        {
          content: 'CALISMA SURESI:',
          styles: {
            fontStyle: 'bold' as const,
            fillColor: [241, 245, 249] as [number, number, number],
            textColor: [15, 23, 42] as [number, number, number],
          },
        },
        `${data.startTime || '-'} - ${data.endTime || '-'} (${cleanTr(data.totalDurationFormatted) || '-'})`,
      ],
      [
        {
          content: 'DURUM ONAYI:',
          styles: {
            fontStyle: 'bold' as const,
            fillColor: [241, 245, 249] as [number, number, number],
            textColor: [15, 23, 42] as [number, number, number],
          },
        },
        allUDItems.length === 0 ? 'UYGUN (0 HATA)' : `${allUDItems.length} UYGUNSUZLUK MEVCUT`,
        {
          content: 'RAPOR NO:',
          styles: {
            fontStyle: 'bold' as const,
            fillColor: [241, 245, 249] as [number, number, number],
            textColor: [15, 23, 42] as [number, number, number],
          },
        },
        cleanTr(data.serialNumber || 'BETA-QC'),
      ],
    ];

    autoTable(doc, {
      startY: margin + 25,
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
        0: { cellWidth: 35 },
        1: { cellWidth: 55 },
        2: { cellWidth: 35 },
        3: { cellWidth: 61 },
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let lastY = (doc as any).lastAutoTable.finalY + 6;

    // 3. SECTION: UYGUNSUZLUKLAR (UD LISTESI)
    if (allUDItems.length === 0) {
      autoTable(doc, {
        startY: lastY,
        margin: { left: margin, right: margin },
        head: [
          [
            {
              content: 'TESPIT EDILEN UYGUNSUZLUKLAR (UD LISTESI) - 0 HATA',
              styles: {
                fillColor: [16, 185, 129],
                textColor: [255, 255, 255],
                fontStyle: 'bold' as const,
              },
            },
          ],
        ],
        body: [
          [
            {
              content:
                'TEBRIKLER: Bu asansor denetiminde hicbir uygunsuzluk veya montaj hatasi tespit edilmemistir. Tum kontroller sartnameye uygundur.',
              styles: {
                textColor: [6, 95, 70],
                fillColor: [236, 253, 245],
                fontStyle: 'bold' as const,
                halign: 'center' as const,
                cellPadding: 5,
              },
            },
          ],
        ],
        theme: 'grid',
        styles: { fontSize: 8.5 },
      });
    } else {
      const udTableRows = allUDItems.map((entry, index) => [
        (index + 1).toString(),
        cleanTr(entry.category),
        cleanTr(entry.item.title),
        cleanTr(entry.item.floorLabel) || '-',
        cleanTr(entry.item.description) || 'Aciklama girilmedi',
      ]);

      autoTable(doc, {
        startY: lastY,
        margin: { left: margin, right: margin },
        head: [
          [
            { content: '#', styles: { halign: 'center' as const, cellWidth: 8 } },
            { content: 'BOLUM / KATEGORI', styles: { cellWidth: 38 } },
            { content: 'KONTROL MADDESI', styles: { cellWidth: 46 } },
            { content: 'DURAK', styles: { halign: 'center' as const, cellWidth: 16 } },
            { content: 'UYGUNSUZLUK / HATA ACIKLAMASI', styles: { cellWidth: 78 } },
          ],
        ],
        body: udTableRows,
        theme: 'striped',
        headStyles: {
          fillColor: [220, 38, 38], // Red #DC2626
          textColor: [255, 255, 255],
          fontStyle: 'bold' as const,
          fontSize: 7.5,
          cellPadding: 2.5,
        },
        styles: {
          fontSize: 7.5,
          cellPadding: 2,
          lineColor: [226, 232, 240],
          lineWidth: 0.2,
          textColor: [15, 23, 42],
          valign: 'middle' as const,
        },
        alternateRowStyles: {
          fillColor: [254, 242, 242], // Light Red Tint
        },
        columnStyles: {
          0: { halign: 'center' as const, fontStyle: 'bold' as const, textColor: [185, 28, 28] },
          1: { fontStyle: 'bold' as const },
          3: { halign: 'center' as const },
          4: { textColor: [153, 27, 27] },
        },
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lastY = (doc as any).lastAutoTable.finalY + 6;

    // 4. SECTION: SAHA ÖLÇÜ KONTROLLERİ
    if (data.measures && data.measures.length > 0) {
      if (lastY > pageHeight - 40) {
        doc.addPage();
        lastY = margin + 5;
      }

      const measureTableRows = data.measures.map((m, index) => [
        (index + 1).toString(),
        cleanTr(m.name),
        cleanTr(m.value) || '-',
        cleanTr(m.notes) || '-',
      ]);

      autoTable(doc, {
        startY: lastY,
        margin: { left: margin, right: margin },
        head: [
          [
            { content: '#', styles: { halign: 'center' as const, cellWidth: 8 } },
            { content: 'OLCU TANIMI', styles: { cellWidth: 80 } },
            { content: 'OLCULEN DEGER', styles: { halign: 'center' as const, cellWidth: 40 } },
            { content: 'ACIKLAMA / NOTLAR', styles: { cellWidth: 58 } },
          ],
        ],
        body: measureTableRows,
        theme: 'striped',
        headStyles: {
          fillColor: [10, 38, 71], // Navy #0A2647
          textColor: [255, 255, 255],
          fontStyle: 'bold' as const,
          fontSize: 7.5,
          cellPadding: 2.5,
        },
        styles: {
          fontSize: 7.5,
          cellPadding: 2,
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
          2: { halign: 'center' as const, fontStyle: 'bold' as const, textColor: [10, 38, 71] },
        },
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      lastY = (doc as any).lastAutoTable.finalY + 6;
    }

    // Add page numbers and official footer note to all pages
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184); // Slate 400
      doc.setFont('helvetica', 'normal');
      doc.text(
        'Beta Asansor Kalite Kontrol Sistemi tarafindan otomatik olarak derlenmistir. Bu belge resmi denetim kaydidir.',
        margin,
        pageHeight - 8
      );
      doc.text(`Sayfa ${i} / ${totalPages}`, pageWidth - margin - 15, pageHeight - 8);
    }

    return doc;
  };

  // Direct PDF Download and Android BETAKALİTE Folder Storage Handler
  const handleDownloadPDF = async () => {
    if (isDownloading) return;
    setIsDownloading(true);

    try {
      const doc = buildJsPdfDocument();
      const fileName = getStandardizedFileName();
      const folderName = 'BETAKALİTE';
      let savedLocation = '';

      // 1. Check if running inside Capacitor Android native environment
      if (Capacitor.isNativePlatform()) {
        try {
          try {
            await Filesystem.requestPermissions();
          } catch {
            // Permission might already be granted
          }

          const base64Data = doc.output('datauristring').split(',')[1];
          let savedFileUri = '';

          // Attempt 1: Documents/BETAKALİTE (Primary Target)
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
          } catch (docErr) {
            console.warn('Documents save error, trying root Documents or Cache:', docErr);
            // Attempt 2: Direct Documents root
            try {
              const res2 = await Filesystem.writeFile({
                path: fileName,
                data: base64Data,
                directory: Directory.Documents,
              });
              savedLocation = `Cihaz Hafızası / Belgeler / ${fileName}`;
              savedFileUri = res2.uri;
            } catch (docRootErr) {
              // Attempt 3: Cache / Data with native share trigger
              const res3 = await Filesystem.writeFile({
                path: fileName,
                data: base64Data,
                directory: Directory.Cache,
              });
              savedLocation = `Cihaz İndirilenler / ${fileName}`;
              savedFileUri = res3.uri;
            }
          }

          setDownloadedFilePath(savedLocation);
          setDownloadSuccess(true);
          setTimeout(() => setDownloadSuccess(false), 8000);

          // Prompt native Android system share/open sheet so user can directly open in Acrobat/Drive or copy to any folder
          if (savedFileUri) {
            try {
              await Share.share({
                title: `Beta Asansör Raporu - ${data.serialNumber || 'QC'}`,
                url: savedFileUri,
                dialogTitle: 'PDF Raporunu Aç / Kaydet / Gönder',
              });
            } catch (shareErr) {
              // User dismissed sheet
            }
          }
          return;
        } catch (nativeErr) {
          console.warn('Native Filesystem save fallback to browser download', nativeErr);
        }
      }

      const pdfBlob = doc.output('blob');

      // 2. Modern Web File System Access API (Allows selecting & directly overwriting the existing file)
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
          if (pickerErr?.name === 'AbortError') {
            // User intentionally cancelled the file picker dialog
            return;
          }
          console.warn('File System Access API fallback', pickerErr);
        }
      }

      // 3. Fallback standard direct binary blob download (Android Chrome, Tablet WebView, PC)
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

  // Direct PDF Preview in New Tab / In-App Viewer
  const handlePreviewPDF = async () => {
    try {
      const doc = buildJsPdfDocument();

      if (Capacitor.isNativePlatform()) {
        const fileName = getStandardizedFileName();
        const base64Data = doc.output('datauristring').split(',')[1];
        const res = await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Cache,
        });
        await Share.share({
          title: `Beta Asansör Raporu - ${data.serialNumber || 'QC'}`,
          url: res.uri,
          dialogTitle: 'PDF Raporunu Önizle / Aç',
        });
        return;
      }

      const pdfBlob = doc.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      window.open(blobUrl, '_blank');
    } catch (err) {
      console.error('PDF önizleme hatası:', err);
    }
  };

  // Direct PDF Sharing Handler for WhatsApp & System Share (Sends actual PDF File, not text)
  const handleSharePDF = async () => {
    if (isGeneratingPDF) return;
    setIsGeneratingPDF(true);

    try {
      const doc = buildJsPdfDocument();
      const fileName = getStandardizedFileName();

      // 1. Android Capacitor Native Share (100% Reliable file attachment on Android tablets & phones)
      if (Capacitor.isNativePlatform()) {
        try {
          const base64Data = doc.output('datauristring').split(',')[1];
          const tempFile = await Filesystem.writeFile({
            path: fileName,
            data: base64Data,
            directory: Directory.Cache,
          });
          await Share.share({
            title: `Beta Asansör Raporu - ${data.serialNumber || 'QC'}`,
            url: tempFile.uri,
            dialogTitle: 'Raporu WhatsApp / Drive / Dosyalar ile Paylaş',
          });
          setShareSuccess(true);
          setTimeout(() => setShareSuccess(false), 4000);
          return;
        } catch (nativeShareErr) {
          console.warn('Capacitor native share error, falling back', nativeShareErr);
        }
      }

      const pdfBlob = doc.output('blob');
      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

      // 2. Web Share API with actual PDF file attachment (No text param to force WhatsApp to attach as Document)
      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          files: [pdfFile],
          title: `Beta Asansör Raporu - ${data.serialNumber || 'QC'}`,
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 4000);
      } else {
        // 3. Fallback for older browsers / webview: Download PDF file first so user can attach it in WhatsApp
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

        // Notify user about PDF document download
        alert(
          `📄 PDF RAPORU İNDİRİLDİ!\n\n` +
          `Dosya Adı: ${fileName}\n\n` +
          `WhatsApp'ta belge olarak paylaşmak için sohbetteki (+) veya Ataş (Ek) butonuna basıp 'Belge' seçeneğinden indirilen bu PDF dosyasını seçiniz.`
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

  return (
    <div className="max-w-4xl mx-auto py-4 px-3 sm:px-4 pb-16">
      {/* Top Action Bar (İndir, Paylaş, Önizle, Yazdır) */}
      <div className="bg-[#0A2647] text-white rounded-lg p-3 sm:p-4 mb-4 shadow-md border-2 border-slate-700 flex flex-col gap-3 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-black bg-emerald-500 text-slate-950 rounded uppercase tracking-wider">
                Resmi Rapor Hazır
              </span>
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-white">Kalite Kontrol Özeti</h1>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              {data.clientProjectName || 'Proje'} &bull; Seri: <strong>{data.serialNumber || 'BETA-QC'}</strong> &bull; {data.dateDisplay}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* 1. PDF İNDİR BUTONU (Büyük & Belirgin Mavi Buton) */}
            <button
              type="button"
              id="btn-download-pdf"
              disabled={isDownloading}
              onClick={handleDownloadPDF}
              className={`min-h-[42px] px-4 py-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 shadow-md border-2 border-blue-400 transition-all cursor-pointer ${
                isDownloading ? 'opacity-80 cursor-wait' : ''
              }`}
              title="PDF Raporunu Cihaza İndir"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>İndiriliyor...</span>
                </>
              ) : downloadSuccess ? (
                <>
                  <FolderCheck className="w-4 h-4 text-emerald-300" />
                  <span>İndirildi!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-white" />
                  <span>PDF İndir</span>
                </>
              )}
            </button>

            {/* 2. WhatsApp PDF Belgesi Paylaş Butonu (Yeşil & Belirgin) */}
            <button
              type="button"
              id="btn-share-whatsapp-pdf"
              disabled={isGeneratingPDF}
              onClick={handleSharePDF}
              className={`min-h-[42px] px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 shadow-md border-2 border-emerald-400 transition-all cursor-pointer ${
                isGeneratingPDF ? 'opacity-80 cursor-wait' : ''
              }`}
              title="PDF Dosyasını WhatsApp veya Sistemden Belge Olarak Paylaş"
            >
              {isGeneratingPDF ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Hazırlanıyor...</span>
                </>
              ) : shareSuccess ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Gönderildi!</span>
                </>
              ) : (
                <>
                  <MessageCircle className="w-4 h-4 text-white fill-white" />
                  <span>WhatsApp PDF Paylaş</span>
                </>
              )}
            </button>

            {/* 3. PDF Aç / Önizle */}
            <button
              type="button"
              id="btn-preview-pdf"
              onClick={handlePreviewPDF}
              className="min-h-[42px] px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border-2 border-slate-600 cursor-pointer"
              title="PDF Belgesini Tarayıcıda Aç"
            >
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>PDF Aç</span>
            </button>

            {/* 4. Yazdır */}
            <button
              type="button"
              id="btn-print-report"
              onClick={handlePrint}
              className="min-h-[42px] px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border-2 border-slate-600 cursor-pointer"
              title="Sayfayı Yazdır"
            >
              <Printer className="w-3.5 h-3.5 text-slate-300" />
              <span>Yazdır</span>
            </button>

            {/* 5. Düzenle */}
            <button
              type="button"
              onClick={onEditAudit}
              className="min-h-[42px] px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border-2 border-slate-600 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Düzenle</span>
            </button>

            {/* 6. Yeni Form */}
            <button
              type="button"
              onClick={onNewInspection}
              className="min-h-[42px] px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border-2 border-slate-600 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Yeni Denetim</span>
            </button>
          </div>
        </div>

        {/* İndirme Başarı Bilgilendirme Notu */}
        {downloadSuccess && downloadedFilePath && (
          <div className="bg-emerald-900 border-2 border-emerald-400 rounded-lg p-3 text-xs flex items-start gap-2.5 text-white animate-fadeIn">
            <FolderCheck className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" />
            <div>
              <span className="font-black text-sm text-emerald-200 block">PDF Cihaza Kaydedildi:</span>
              <span className="font-mono text-white text-xs font-bold">{downloadedFilePath}</span>
              <span className="text-[11px] text-emerald-100 block mt-0.5">
                Android tablet ve telefonunuzda <strong>Dosyalarım &gt; İndirilenler (Download)</strong> veya <strong>Documents/BETAKALİTE</strong> klasöründen PDF dosyanıza anında ulaşabilirsiniz.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* THE OFFICIAL REPORT SHEET */}
      <div
        id="official-report-sheet"
        className="bg-white rounded-lg shadow-md border-2 border-slate-300 p-4 sm:p-6 text-slate-900"
      >
        {/* Corporate Header */}
        <div className="border-b-2 border-slate-900 pb-3.5 mb-4 header-box">
          <div className="flex flex-col sm:row sm:items-center justify-between gap-3 w-full">
            <div className="flex items-center gap-2.5">
              <BetaLogo size="lg" className="shadow-xs shrink-0" />
              <div>
                <h1 className="text-base sm:text-xl font-black text-slate-950 tracking-tight leading-tight">
                  BETA ASANSÖR
                </h1>
                <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Kalite Kontrol &amp; Saha Son Muayene Raporu
                </p>
              </div>
            </div>
            <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-300">
              <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-900 text-xs font-black rounded border-2 border-slate-400">
                RAPOR NO: {data.serialNumber || 'BETA-QC'}
              </span>
              <p className="text-[11px] font-bold text-slate-700 mt-1">Tarih: {data.dateDisplay}</p>
            </div>
          </div>
        </div>

        {/* Technical & Audit Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 p-3.5 bg-slate-100 rounded-lg border-2 border-slate-300 text-xs mb-4 grid-meta">
          <div>
            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider block">Kontrolü Yapan:</span>
            <span className="text-xs font-black text-slate-950">{data.inspectorName}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider block">Müşteri / Proje:</span>
            <span className="text-xs font-black text-slate-950">{data.clientProjectName}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider block">Asansör Tipi:</span>
            <span className="text-xs font-black text-slate-950">{data.elevatorType}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider block">Seri / Takip No:</span>
            <span className="text-xs font-black text-slate-950">{data.serialNumber}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider block">Kapasite:</span>
            <span className="text-xs font-black text-slate-950">{data.capacityKg} KG</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider block">Durak Sayısı:</span>
            <span className="text-xs font-black text-slate-950">{data.stopCount} Durak (Baş: {data.floorStart})</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider block">Denetim Zamanı:</span>
            <span className="text-xs font-black text-slate-950">{data.startTime || '-'} - {data.endTime || '-'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider block">Toplam Süre:</span>
            <span className="text-xs font-black text-slate-950">{data.totalDurationFormatted || '-'}</span>
          </div>
        </div>

        {/* Section: UD LISTESI (Hatalar ve Uygunsuzluklar) */}
        <div className="mb-6">
          <div className="flex items-center justify-between pb-1.5 mb-2.5 border-b-2 border-red-600 section-title">
            <div className="flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-red-600" />
              <h2 className="text-xs sm:text-sm font-bold uppercase text-slate-900 tracking-wider">
                TESPİT EDİLEN UYGUNSUZLUKLAR (UD LİSTESİ)
              </h2>
            </div>
            <span
              className={`text-xs font-black px-2.5 py-1 rounded border-2 ${
                allUDItems.length === 0 ? 'bg-emerald-100 text-emerald-900 border-emerald-500' : 'bg-red-100 text-red-900 border-red-500'
              }`}
            >
              Toplam {allUDItems.length} Hata / Eksik
            </span>
          </div>

          {allUDItems.length === 0 ? (
            <div className="p-4 bg-emerald-50 rounded-lg border-2 border-emerald-300 text-center space-y-1 badge-clean">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
              <h3 className="text-xs font-black text-emerald-950 uppercase tracking-wider">
                Tüm Kontroller Başarıyla Geçti
              </h3>
              <p className="text-[11px] font-bold text-emerald-800">
                Bu asansörde herhangi bir hata veya uygunsuzluk kaydı bulunmamaktadır.
              </p>
            </div>
          ) : (
            <div className="border-2 border-slate-300 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-200 border-b-2 border-slate-300 text-slate-900 font-black uppercase text-[10px]">
                  <tr>
                    <th className="p-2 border-r border-slate-300 w-10 text-center">#</th>
                    <th className="p-2 border-r border-slate-300 w-36">Bölüm / Kategori</th>
                    <th className="p-2 border-r border-slate-300">Kontrol Maddesi</th>
                    <th className="p-2 border-r border-slate-300 w-20 text-center">Durak</th>
                    <th className="p-2">Hata / Açıklama</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {allUDItems.map((entry, index) => (
                    <tr key={index} className="bg-red-50/70 hover:bg-red-100/60">
                      <td className="p-2 border-r border-slate-300 text-center font-black text-red-600">
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
                      <td className="p-2 text-red-950 text-xs font-bold">
                        {entry.item.description || (
                          <span className="italic text-slate-500">Açıklama girilmedi</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Section: ÖLÇÜ KONTROLLERİ (Measures Table) */}
        {data.measures && data.measures.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-1.5 pb-1.5 mb-2.5 border-b-2 border-blue-700 section-title section-title-blue">
              <Ruler className="w-4 h-4 text-blue-700" />
              <h2 className="text-xs sm:text-sm font-bold uppercase text-slate-900 tracking-wider">
                SAHA ÖLÇÜ KONTROLLERİ
              </h2>
            </div>
            <div className="border-2 border-slate-300 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-200 border-b-2 border-slate-300 text-slate-900 font-black uppercase text-[10px]">
                  <tr>
                    <th className="p-2 border-r border-slate-300 w-10 text-center">#</th>
                    <th className="p-2 border-r border-slate-300">Ölçü Tanımı</th>
                    <th className="p-2 border-r border-slate-300 w-44 text-center">Ölçülen Değer</th>
                    <th className="p-2">Açıklama / Notlar</th>
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
          Beta Asansör Kalite Kontrol Sistemi tarafından otomatik olarak derlenmiştir. Bu belge resmi denetim kaydıdır.
        </div>
      </div>
    </div>
  );
};

