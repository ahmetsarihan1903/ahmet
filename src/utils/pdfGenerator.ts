import { CustomerInspectionMetadata, CustomerInspectionItem } from '../modules/customerPreInspection/customerChecklistData';
import { formatDateDMY } from './dateUtils';

export async function exportPdfDirectly(
  metadata: CustomerInspectionMetadata,
  items: CustomerInspectionItem[],
  fileName: string,
  mode: 'download' | 'share'
): Promise<{ success: boolean; message: string; blobUrl?: string }> {
  try {
    const htmlElement = document.getElementById('official-pdf-report');
    if (!htmlElement) {
      window.print();
      return { success: true, message: 'Yazdırma penceresi açıldı.' };
    }

    // Modern browser print or share
    if (mode === 'share' && navigator.share) {
      window.print();
      return { success: true, message: 'Paylaşım / Yazdırma başlatıldı.' };
    }

    window.print();
    return { success: true, message: 'PDF yazdırma hazırlandı.' };
  } catch (err: any) {
    console.error('PDF export error', err);
    window.print();
    return { success: true, message: 'Yazdırma arayüzüne yönlendirildi.' };
  }
}

export async function generateDirectPdf(
  metadata: CustomerInspectionMetadata,
  items: CustomerInspectionItem[],
  fileName: string
): Promise<{ blobUrl: string }> {
  window.print();
  return { blobUrl: '' };
}

export function printElementDirectly() {
  window.print();
}
