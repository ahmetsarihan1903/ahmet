import React, { useState } from 'react';
import { CustomerInspectionMetadata, CustomerInspectionItem } from './customerChecklistData';
import {
  Download,
  Share2,
  X,
  CheckCircle,
  AlertTriangle,
  Loader2,
  FileText,
} from 'lucide-react';
import {
  exportPdfDirectly,
} from '../../utils/pdfGenerator';
import { formatDateDMY } from '../../utils/dateUtils';
import { BetaLogo } from '../../components/BetaLogo';
import { useUser } from '../../context/UserContext';

interface ReportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  metadata: CustomerInspectionMetadata;
  items: CustomerInspectionItem[];
}

export const CustomerReportPreviewModal: React.FC<ReportPreviewModalProps> = ({
  isOpen,
  onClose,
  metadata,
  items,
}) => {
  const { deviceProfile } = useUser();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);

  React.useEffect(() => {
    setPdfBlobUrl(null);
    setStatusMessage(null);
  }, [isOpen, items, metadata]);

  if (!isOpen) return null;

  const defectiveItems = items.filter((item) => item.isDefective || item.isCustom);

  const sanitizeFilename = (text: string) => {
    return text.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
  };

  const reportFileName = `uygunsuzluk_raporu_${sanitizeFilename(metadata.projectName)}_${sanitizeFilename(metadata.serialNumber)}_${metadata.inspectionDate}.pdf`;

  const showToast = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => {
      setStatusMessage(null);
    }, 5000);
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    setStatusMessage('Yüksek kaliteli çok sayfalı PDF hazırlanıyor...');
    try {
      const result = await exportPdfDirectly(metadata, items, reportFileName, 'download');
      if (result.blobUrl) {
        setPdfBlobUrl(result.blobUrl);
      }
      showToast(result.message);
    } catch (err: any) {
      console.error(err);
      showToast('PDF oluşturulurken bir sorun oluştu.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleShare = async () => {
    setIsGeneratingPdf(true);
    setStatusMessage('PDF hazırlanıyor ve paylaşım menüsü açılıyor...');
    try {
      const result = await exportPdfDirectly(metadata, items, reportFileName, 'share');
      if (result.blobUrl) {
        setPdfBlobUrl(result.blobUrl);
      }
      showToast(result.message);
    } catch (err: any) {
      console.error(err);
      showToast('Paylaşım sırasında bir sorun oluştu.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };



  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex flex-col justify-start items-center pt-[max(0.5rem,calc(env(safe-area-inset-top,0px)+0.25rem))] pb-[max(0.75rem,calc(env(safe-area-inset-bottom,0px)+0.5rem))] px-2 sm:px-4 overflow-y-auto">
      {/* Top Floating Control Bar */}
      <div className="w-full max-w-4xl bg-slate-900 text-white rounded-xl sm:rounded-2xl p-2.5 sm:p-4 shadow-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-2.5 mb-3 sticky top-[max(0.5rem,calc(env(safe-area-inset-top,0px)+0.25rem))] z-10 no-print">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-black">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs sm:text-base font-bold text-white leading-tight">Rapor Önizleme & PDF Üretici</h2>
            <p className="text-[10px] sm:text-[11px] text-slate-400">
              {defectiveItems.length > 0
                ? `${defectiveItems.length} Adet Uygunsuzluk Bulundu`
                : 'Tüm Maddeler Uygun'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <button
            onClick={handleShare}
            disabled={isGeneratingPdf}
            className="flex items-center gap-1 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
            title="WhatsApp veya Diğer Uygulamalar ile Paylaş / PDF Olarak Kaydet"
          >
            {isGeneratingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Share2 className="w-3.5 h-3.5" />
            )}
            <span>PDF Paylaş (WhatsApp)</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="flex items-center gap-1 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
            title="PDF dosyasını telefona / bilgisayara kaydet"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PDF İndir</span>
          </button>



          <button
            onClick={onClose}
            className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs sm:text-sm border border-slate-700 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>Kapat</span>
          </button>
        </div>

        {statusMessage && (
          <div className="w-full mt-1 py-1 px-2.5 bg-amber-500/20 border border-amber-500/40 rounded-lg text-amber-300 text-xs font-semibold flex items-center justify-between animate-fadeIn">
            <span>{statusMessage}</span>
            {pdfBlobUrl && (
              <a
                href={pdfBlobUrl}
                download={reportFileName}
                className="underline text-amber-200 font-bold ml-2 hover:text-white"
              >
                Doğrudan İndir
              </a>
            )}
          </div>
        )}
      </div>

      {/* OFFICIAL A4 REPORT CONTAINER */}
      <div
        id="official-pdf-report"
        className="w-full max-w-[800px] bg-white text-slate-900 rounded-xl shadow-2xl p-4 sm:p-10 border border-slate-300 font-sans print-container my-2"
        style={{ minHeight: '1050px', boxSizing: 'border-box' }}
      >
        {/* REPORT HEADER */}
        <div className="border-b-2 border-slate-900 pb-3 sm:pb-4 mb-4 sm:mb-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <BetaLogo size="lg" />
            </div>

            <div className="text-right">
              <span className="inline-block px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-md font-mono font-bold text-[11px] sm:text-xs">
                TİP: {metadata.elevatorType} ({metadata.elevatorType === 'MR' ? 'MAKİNE DAİRELİ' : 'MAKİNE DAİRESİZ'})
              </span>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                Form No: BA-ETK-{metadata.serialNumber ? metadata.serialNumber.toUpperCase() : '001'}
              </div>
            </div>
          </div>
        </div>

        {/* METADATA KÜNYE TABLE */}
        <div className="mb-4 sm:mb-6">
          <div className="bg-slate-50 rounded-lg border border-slate-300 overflow-hidden">
            <div className="bg-slate-200/80 px-3 py-1.5 border-b border-slate-300">
              <span className="text-[11px] sm:text-xs font-bold text-slate-800 uppercase tracking-wider">
                Denetim Künye ve Şantiye Bilgileri
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 text-xs">
              <div className="p-2.5 sm:p-3 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-slate-500 w-28 shrink-0">Referans / Proje:</span>
                  <span className="font-bold text-slate-900 text-right flex-1 break-words">{metadata.projectName}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-500 w-28 shrink-0">Asansör Seri No:</span>
                  <span className="font-mono font-bold text-slate-900 text-right break-words">{metadata.serialNumber}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-500 w-28 shrink-0">Asansör Tipi:</span>
                  <span className="font-bold text-amber-800 text-right">{metadata.elevatorType} (Makine {metadata.elevatorType === 'MR' ? 'Daireli' : 'Dairesiz'})</span>
                </div>
              </div>

              <div className="p-2.5 sm:p-3 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-500 w-28 shrink-0">Kontrolü Yapan:</span>
                  <span className="font-bold text-slate-900 text-right break-words">{metadata.auditorName}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-500 w-28 shrink-0">Denetim Tarihi:</span>
                  <span className="font-bold text-slate-900 text-right font-mono">{formatDateDMY(metadata.inspectionDate)}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-500 w-28 shrink-0">Rapor Durumu:</span>
                  <span className={`font-bold text-right ${defectiveItems.length > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                    {defectiveItems.length > 0 ? `${defectiveItems.length} Adet Eksik` : 'Kusursuz / Eksiksiz'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200 text-[10px]">
                  <span className="font-semibold text-slate-500 shrink-0">Cihaz Güvenlik No:</span>
                  <span className="font-black text-slate-900 font-mono text-right">{deviceProfile.hardwareId} (#{deviceProfile.installationId})</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* DEFECTIVE ITEMS TABLE */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Tespit Edilen Eksiklikler ve Müşteri İşleri Listesi
            </h2>
            <span className="text-[11px] font-semibold text-slate-500">
              Toplam {defectiveItems.length} Madde Listelendi
            </span>
          </div>

          {defectiveItems.length === 0 ? (
            <div className="p-6 sm:p-8 text-center bg-emerald-50 rounded-lg border border-emerald-300">
              <CheckCircle className="w-9 h-9 text-emerald-600 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-emerald-900">MÜŞTERİ İŞLERİ KUSURSUZ VE EKSİKSİZDİR</h3>
              <p className="text-xs text-emerald-700 mt-1 max-w-lg mx-auto leading-relaxed">
                Yapılan saha denetiminde incelenen kontrol maddelerinde herhangi bir eksiklik veya uygunsuzluk tespit edilmemiştir. Asansör kuyusu ve şantiye montaj için uygundur.
              </p>
            </div>
          ) : (
            <div className="border border-slate-300 rounded-lg overflow-hidden w-full">
              <table className="w-full text-left border-collapse text-xs table-fixed">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold border-b border-slate-900">
                    <th className="py-2 px-2.5 w-[8%] text-center">No</th>
                    <th className="py-2 px-2.5 w-[52%]">Kontrol Kriteri / Teknik Tanım</th>
                    <th className="py-2 px-2.5 w-[28%]">Tespit Edilen Eksiklik & Not</th>
                    <th className="py-2 px-2 w-[12%] text-center">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {defectiveItems.map((item, idx) => (
                    <tr
                      key={item.id}
                      className={`print-break-inside-avoid ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'
                      }`}
                    >
                      <td className="py-2.5 px-2 font-bold text-center align-top bg-slate-100/60 text-slate-900 border-r border-slate-300">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-2.5 align-top leading-normal text-slate-900 font-medium border-r border-slate-200 break-words">
                        <div>{item.description}</div>
                      </td>
                      <td className="py-2.5 px-2.5 align-top border-r border-slate-200 break-words">
                        {item.notes && item.notes.trim() ? (
                          <div className="p-1.5 rounded bg-rose-50 border border-rose-200 text-rose-950 font-semibold text-[11px] leading-snug break-words">
                            {item.notes}
                          </div>
                        ) : (
                          <div className="italic text-slate-400 text-[11px]">
                            Özel açıklama girilmedi.
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-1.5 text-center align-top">
                        <span className="inline-block px-1.5 py-0.5 bg-rose-100 text-rose-800 font-black text-[10px] rounded border border-rose-300">
                          EKSİK
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* MANDATORY FIXED NOTICE */}
        <div className="mt-4 p-3 sm:p-4 bg-amber-50/90 border-2 border-amber-400 rounded-lg text-slate-900 shadow-xs print-break-inside-avoid">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-700 shrink-0 mt-0.5" />
            <p className="text-xs sm:text-[13px] font-bold leading-snug tracking-tight text-amber-950 uppercase">
              UYARI: YUKARIDA BELİRTİLEN EKSİKLER TAMAMLANDIKTAN SONRA, BETA ASANSÖRE YAZILI BİLDİRİMDE BULUNULMALIDIR. YAPILAN İŞLERİN YERİNDE KONTROL EDİLMESİNDEN SONRA, YEŞİL ETİKET BAŞVURUSU YAPILACAKTIR.
            </p>
          </div>
        </div>

        {/* FOOTER METADATA */}
        <div className="mt-6 pt-2.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-1 text-[9px] text-slate-400">
          <span>Beta Asansör Denetim Sistemi • Cihaz Donanım No: {deviceProfile.hardwareId} (#{deviceProfile.installationId})</span>
          <span>Seri No: {metadata.serialNumber} • Tarih: {formatDateDMY(metadata.inspectionDate)}</span>
        </div>
      </div>
    </div>
  );
};
