import { MASTER_CUSTOMER_CHECKLIST } from '../modules/customerPreInspection/customerChecklistData';
import { parseCSV, fetchGoogleSheetCsvText } from './dataSyncService';

export interface CustomerDataSyncResult {
  success: boolean;
  message: string;
  data?: {
    common: { description: string }[];
    mr: { description: string }[];
    mrl: { description: string }[];
  };
}

export function saveCustomerSyncedItemsToStorage(data: any): void {
  try {
    localStorage.setItem('beta_customer_custom_sync_items', JSON.stringify(data));
  } catch (e) {
    console.error('Error saving customer synced items', e);
  }
}

export function loadCustomerSyncedItemsFromStorage(): any {
  try {
    const raw = localStorage.getItem('beta_customer_custom_sync_items');
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading customer synced items', e);
  }
  return null;
}

export function saveCustomerGoogleSheetUrl(url: string): void {
  try {
    localStorage.setItem('beta_customer_google_sheet_url', url);
  } catch (e) {
    // ignore
  }
}

export function loadCustomerGoogleSheetUrl(): string {
  try {
    return localStorage.getItem('beta_customer_google_sheet_url') || '';
  } catch {
    return '';
  }
}

/**
 * Parses raw CSV or Tab-separated text into structured customer checklist categories
 */
export function parseCustomerChecklistCsv(csvText: string): CustomerDataSyncResult {
  if (!csvText || csvText.trim().length === 0) {
    return { success: false, message: 'CSV içeriği boş veya okunamadı.' };
  }

  const rows = parseCSV(csvText);
  if (rows.length < 2) {
    return {
      success: false,
      message: 'Tabloda yeterli veri satırı bulunamadı (En az 1 başlık ve 1 veri satırı olmalıdır).',
    };
  }

  // Identify column indices
  const headers = rows[0].map((h) => h.toLowerCase().trim());
  let categoryIdx = headers.findIndex(
    (h) => h.includes('kategori') || h.includes('category') || h.includes('bolum') || h.includes('bölüm')
  );
  let descIdx = headers.findIndex(
    (h) =>
      h.includes('madde') ||
      h.includes('aciklama') ||
      h.includes('açıklama') ||
      h.includes('tanim') ||
      h.includes('tanım') ||
      h.includes('kontrol')
  );

  if (categoryIdx === -1) categoryIdx = 0;
  if (descIdx === -1) descIdx = 1;

  const common: { description: string }[] = [];
  const mr: { description: string }[] = [];
  const mrl: { description: string }[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const rawCat = (row[categoryIdx] || '').toUpperCase().trim();
    // If only 1 column was provided in row, use it as description
    const desc = (row[descIdx] !== undefined ? row[descIdx] : row[0] || '').trim();

    if (!desc) continue;

    if (rawCat.includes('MRL') || rawCat.includes('DAIRESIZ') || rawCat.includes('DAİRESİZ')) {
      mrl.push({ description: desc });
    } else if (rawCat.includes('MR') || rawCat.includes('DAIRELI') || rawCat.includes('DAİRELİ')) {
      mr.push({ description: desc });
    } else {
      // Default to ORTAK (COMMON)
      common.push({ description: desc });
    }
  }

  if (common.length === 0 && mr.length === 0 && mrl.length === 0) {
    return {
      success: false,
      message: 'Hiçbir geçerli madde okunamadı. Kategori sütununda ORTAK, MR veya MRL yazdığından emin olun.',
    };
  }

  const data = { common, mr, mrl };
  const total = common.length + mr.length + mrl.length;

  return {
    success: true,
    message: `Başarıyla ${total} madde içe aktarıldı (Ortak: ${common.length}, MR: ${mr.length}, MRL: ${mrl.length}).`,
    data,
  };
}

/**
 * Fetches and syncs customer items directly from Google Sheet URL with multi-candidate fallback
 */
export async function syncCustomerItemsFromGoogleSheet(url: string): Promise<CustomerDataSyncResult> {
  if (!url || !url.trim()) {
    return { success: false, message: 'Lütfen bir Google E-Tablo bağlantısı giriniz.' };
  }

  try {
    const csvText = await fetchGoogleSheetCsvText(url);
    return parseCustomerChecklistCsv(csvText);
  } catch (err: any) {
    return {
      success: false,
      message: `E-Tabloya erişilemedi: ${err?.message || ''}. Google E-Tablonun "Bağlantıya sahip herkes görüntüleyebilir" veya Dosya > Paylaş > "Web'de Yayınla" olarak ayarlandığından emin olun. Dilerseniz alternatif olarak "Metin Olarak Yapıştır" sekmesinden verilerinizi doğrudan yapıştırabilirsiniz.`,
    };
  }
}

/**
 * Sync from direct CSV text
 */
export function syncCustomerItemsFromCsvText(csvText: string): CustomerDataSyncResult {
  return parseCustomerChecklistCsv(csvText);
}

export function generateCustomerTemplateCSV(): string {
  const rows: string[] = ['Kategori,Madde Aciklamasi'];

  MASTER_CUSTOMER_CHECKLIST.forEach((item) => {
    const escapedDesc = `"${item.description.replace(/"/g, '""')}"`;
    let catLabel = 'ORTAK';
    if (item.category === 'MRL') catLabel = 'MRL';
    else if (item.category === 'MR') catLabel = 'MR';
    rows.push(`${catLabel},${escapedDesc}`);
  });

  return '\uFEFF' + rows.join('\r\n');
}

export function downloadCustomerTemplateCSV(): void {
  const csvContent = generateCustomerTemplateCSV();
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'Beta_Musteri_On_Inceleme_Maddeleri_Sablon.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
