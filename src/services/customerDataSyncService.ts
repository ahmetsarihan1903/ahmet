import { MASTER_CUSTOMER_CHECKLIST } from '../modules/customerPreInspection/customerChecklistData';
import { formatGoogleSheetUrl, parseCSV } from './dataSyncService';

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

export async function syncCustomerItemsFromGoogleSheet(url: string): Promise<CustomerDataSyncResult> {
  const formattedUrl = formatGoogleSheetUrl(url);
  if (!formattedUrl) {
    return { success: false, message: 'Geçersiz Google E-Tablo bağlantısı.' };
  }

  try {
    const response = await fetch(formattedUrl, {
      method: 'GET',
      headers: {
        Accept: 'text/csv, text/plain, */*',
      },
    });

    if (!response.ok) {
      throw new Error(`Ağ hatası: ${response.status} ${response.statusText}`);
    }

    const csvText = await response.text();
    if (!csvText || csvText.trim().length === 0) {
      throw new Error('E-Tablo boş veya okunamadı.');
    }

    const rows = parseCSV(csvText);
    if (rows.length < 2) {
      throw new Error('E-Tabloda yeterli veri satırı bulunamadı (En az başlık ve 1 satır olmalıdır).');
    }

    const headers = rows[0].map((h) => h.toLowerCase().trim());
    let categoryIdx = headers.findIndex((h) => h.includes('kategori') || h.includes('category') || h.includes('bolum'));
    let descIdx = headers.findIndex((h) => h.includes('madde') || h.includes('aciklama') || h.includes('açıklama') || h.includes('tanim'));

    if (categoryIdx === -1) categoryIdx = 0;
    if (descIdx === -1) descIdx = 1;

    const common: { description: string }[] = [];
    const mr: { description: string }[] = [];
    const mrl: { description: string }[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length < 2) continue;

      const rawCat = (row[categoryIdx] || '').toUpperCase().trim();
      const desc = (row[descIdx] || '').trim();

      if (!desc) continue;

      if (rawCat === 'MRL' || rawCat.includes('MRL') || rawCat.includes('DAIRESIZ') || rawCat.includes('DAİRESİZ')) {
        mrl.push({ description: desc });
      } else if (rawCat === 'MR' || rawCat.includes('MR') || rawCat.includes('DAIRELI') || rawCat.includes('DAİRELİ')) {
        mr.push({ description: desc });
      } else if (rawCat === 'ORTAK' || rawCat.includes('ORTAK') || rawCat.includes('GENEL') || rawCat.includes('COMMON')) {
        common.push({ description: desc });
      } else {
        common.push({ description: desc });
      }
    }

    if (common.length === 0 && mr.length === 0 && mrl.length === 0) {
      throw new Error('Hiçbir geçerli madde okunamadı. Kategori kolonunda ORTAK, MR veya MRL yazdığından emin olun.');
    }

    const data = { common, mr, mrl };
    const total = common.length + mr.length + mrl.length;

    return {
      success: true,
      message: `Başarıyla ${total} madde güncellendi (Ortak: ${common.length}, MR: ${mr.length}, MRL: ${mrl.length}).`,
      data,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `E-Tabloya erişilemedi. Lütfen bağlantının "Bağlantıya sahip herkes görüntüleyebilir" olarak paylaşıldığından emin olun. (${err?.message || ''})`,
    };
  }
}

export function generateCustomerTemplateCSV(): string {
  const rows: string[] = [
    'Kategori,Madde Aciklamasi',
  ];

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
