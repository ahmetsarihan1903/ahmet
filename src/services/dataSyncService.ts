import { InspectionItem } from '../types';

export interface DataSyncResult {
  success: boolean;
  message: string;
  totalCount?: number;
  data?: Record<string, InspectionItem[]>;
}

// Get all candidate export URLs for a given Google Sheet link to avoid 400 Bad Request or CORS issues
export function getGoogleSheetUrlCandidates(url: string): string[] {
  const trimmed = url.trim();
  if (!trimmed) return [];

  const candidates: string[] = [];

  // Extract gid (tab ID) if present
  const gidMatch = trimmed.match(/[#&?]gid=([0-9]+)/);
  const gid = gidMatch ? gidMatch[1] : '0';

  // 1. Check for "Web'de Yayınla" (Publish to Web) format: /spreadsheets/d/e/2PACX-.../pub...
  const pubWebMatch = trimmed.match(/\/spreadsheets\/d\/e\/([a-zA-Z0-9-_]+)/);
  if (pubWebMatch && pubWebMatch[1]) {
    const pubId = pubWebMatch[1];
    candidates.push(`https://docs.google.com/spreadsheets/d/e/${pubId}/pub?output=csv&gid=${gid}`);
    candidates.push(`https://docs.google.com/spreadsheets/d/e/${pubId}/pub?output=csv`);
    return candidates;
  }

  // 2. Standard Google Sheets share or edit URL: /spreadsheets/d/{SPREADSHEET_ID}/...
  // Make sure not to match if it's the "e" path
  const standardMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (standardMatch && standardMatch[1] && standardMatch[1] !== 'e') {
    const sheetId = standardMatch[1];
    // Candidate A: Google Visualization API CSV export (Best CORS support & handles public sheets without auth)
    candidates.push(`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`);
    // Candidate B: Direct export endpoint
    candidates.push(`https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`);
    // Candidate C: Publish endpoint
    candidates.push(`https://docs.google.com/spreadsheets/d/${sheetId}/pub?output=csv&gid=${gid}`);
    return candidates;
  }

  // 3. Google Drive file URL: /file/d/{FILE_ID}/view
  const driveMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
  if (driveMatch && driveMatch[1]) {
    const fileId = driveMatch[1];
    candidates.push(`https://docs.google.com/spreadsheets/d/${fileId}/gviz/tq?tqx=out:csv`);
    candidates.push(`https://drive.google.com/uc?export=download&id=${fileId}`);
    return candidates;
  }

  // 4. If already an explicit export or CSV URL
  if (trimmed.includes('output=csv') || trimmed.includes('/export?format=csv') || trimmed.includes('gviz/tq?tqx=out:csv')) {
    candidates.push(trimmed);
    return candidates;
  }

  candidates.push(trimmed);
  return candidates;
}

// Convert any standard Google Sheet Share link or Published CSV link into a direct CSV export URL
export function formatGoogleSheetUrl(url: string): string {
  const candidates = getGoogleSheetUrlCandidates(url);
  return candidates[0] || url.trim();
}

// Helper to fetch CSV text trying all candidate URLs
export async function fetchGoogleSheetCsvText(url: string): Promise<string> {
  const candidates = getGoogleSheetUrlCandidates(url);
  if (candidates.length === 0) {
    throw new Error('Geçersiz Google E-Tablo URL bağlantısı.');
  }

  let lastError: any = null;

  for (const candidateUrl of candidates) {
    try {
      const response = await fetch(candidateUrl, {
        method: 'GET',
        headers: {
          Accept: 'text/csv, text/plain, */*',
        },
      });

      if (response.ok) {
        const text = await response.text();
        // Check if returned text looks like HTML login page instead of CSV
        if (text && text.trim().length > 0) {
          if (text.includes('<!DOCTYPE html>') || text.includes('<html') || text.includes('accounts.google.com')) {
            throw new Error('E-Tablo gizli görünüyor. Lütfen paylaşım ayarını "Bağlantıya sahip olan herkes görüntüleyebilir" yapın.');
          }
          return text;
        }
      } else {
        lastError = new Error(`Ağ hatası: ${response.status} ${response.statusText}`);
      }
    } catch (err: any) {
      lastError = err;
    }
  }

  throw lastError || new Error('E-Tabloya erişilemedi. Lütfen bağlantının "Bağlantıya sahip olan herkes görüntüleyebilir" veya "Web\'de Yayınla" olarak paylaşıldığından emin olun.');
}

// Simple robust CSV parser handling commas, quotes, and newlines
export function parseCSV(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++; // skip next quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\r') {
        // ignore carriage return
      } else if (char === '\n') {
        currentRow.push(currentField.trim());
        if (currentRow.some((field) => field.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((field) => field.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

// Category normalization helper supporting explicit MR and MRL motor chassis separation
function normalizeCategoryKey(rawCategory: string): string | null {
  const c = rawCategory.toUpperCase().replace(/\s+/g, '_').trim();

  if (c.includes('KUMANDA') || c.includes('PANO') || c === 'CONTROL_PANEL') return 'controlPanel';
  if (c.includes('MRL') || c.includes('MOTOR_MRL') || c.includes('MOTOR_SASE_MRL') || c.includes('MAKINE_DAIRESIZ')) return 'motorChassisMRL';
  if (c.includes('MR') || c.includes('MOTOR_MR') || c.includes('MOTOR_SASE_MR') || c.includes('MAKINE_DAIRELI')) return 'motorChassisMR';
  if (c.includes('MOTOR') || c.includes('SASE') || c.includes('ŞASE') || c === 'MOTOR_CHASSIS') return 'motorChassis';
  if (c.includes('KABIN_UST') || c.includes('KABİN_ÜST') || c === 'CABIN_TOP') return 'cabinTop';
  if (c.includes('KARSI_AGIRLIK') || c.includes('KARŞI_AĞIRLIK') || c === 'COUNTERWEIGHT') return 'counterweight';
  if (c.includes('KUYU') || c.includes('DIBI') || c.includes('DİBİ') || c === 'SHAFT_AND_PIT') return 'shaftAndPit';
  if (c.includes('BUTON') || c.includes('KABIN_ICI') || c.includes('KABİN_İÇİ') || c === 'CABIN_AND_BUTTONS') return 'cabinAndButtons';
  if (c.includes('KAPI') || c === 'DOORS') return 'doors';

  return null;
}

// Fetches and parses items from Google Sheet or CSV URL
export async function syncItemsFromGoogleSheet(url: string): Promise<DataSyncResult> {
  try {
    const csvText = await fetchGoogleSheetCsvText(url);
    if (!csvText || csvText.trim().length === 0) {
      throw new Error('E-Tablo boş veya okunamadı.');
    }

    const rows = parseCSV(csvText);
    if (rows.length < 2) {
      throw new Error('E-Tabloda yeterli veri satırı bulunamadı (En az 1 başlık ve 1 veri satırı olmalıdır).');
    }

    // Identify header column indexes
    const headers = rows[0].map((h) => h.toLowerCase().trim());
    let categoryIdx = headers.findIndex((h) => h.includes('kategori') || h.includes('category') || h.includes('bolum') || h.includes('bölüm'));
    let titleIdx = headers.findIndex((h) => h.includes('madde') || h.includes('title') || h.includes('tanim') || h.includes('tanım') || h.includes('kontrol'));
    let reqDescIdx = headers.findIndex((h) => h.includes('zorunlu') || h.includes('required') || h.includes('aciklama') || h.includes('açıklama'));

    // Fallbacks if headers not detected by name
    if (categoryIdx === -1) categoryIdx = 0;
    if (titleIdx === -1) titleIdx = 1;
    if (reqDescIdx === -1) reqDescIdx = 2;

    const parsedData: Record<string, InspectionItem[]> = {
      controlPanel: [],
      motorChassis: [],
      motorChassisMR: [],
      motorChassisMRL: [],
      cabinTop: [],
      counterweight: [],
      shaftAndPit: [],
      cabinAndButtons: [],
    };

    let count = 0;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length < 2) continue;

      const rawCategory = row[categoryIdx] || '';
      const title = row[titleIdx] || '';
      const rawReqDesc = (row[reqDescIdx] || '').toLowerCase().trim();

      if (!title.trim()) continue;

      const categoryKey = normalizeCategoryKey(rawCategory);
      if (!categoryKey || !parsedData[categoryKey]) continue;

      const isRequiredDescription =
        rawReqDesc === 'evet' ||
        rawReqDesc === 'yes' ||
        rawReqDesc === '1' ||
        rawReqDesc === 'true' ||
        rawReqDesc === 'zorunlu';

      const item: InspectionItem = {
        id: `custom-sheet-${categoryKey}-${Date.now()}-${i}`,
        title: title.trim(),
        isNonCompliant: false,
        description: '',
        category: categoryKey,
        isRequiredDescription,
      };

      parsedData[categoryKey].push(item);
      count++;
    }

    if (count === 0) {
      return {
        success: false,
        message: 'Tablo okundu fakat geçerli kategoriye sahip hiçbir madde bulunamadı. Lütfen kategori sütununu kontrol ediniz.',
      };
    }

    return {
      success: true,
      message: `${count} adet kontrol maddesi Google E-Tablodan başarıyla çekildi ve güncellendi.`,
      totalCount: count,
      data: parsedData,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Güncelleme başarısız: ${err?.message || 'Bağlantı kurulamadı. Tablonun "Bağlantıya sahip herkes görüntüleyebilir" olarak paylaşıldığından emin olun.'}`,
    };
  }
}

// LocalStorage helpers for persistence
const STORAGE_KEY_CUSTOM_ITEMS = 'beta_elevator_custom_sync_items';
const STORAGE_KEY_SHEET_URL = 'beta_elevator_google_sheet_url';

export function saveSyncedItemsToStorage(data: Record<string, InspectionItem[]>): void {
  try {
    localStorage.setItem(STORAGE_KEY_CUSTOM_ITEMS, JSON.stringify(data));
  } catch (e) {
    console.warn('LocalStorage save error:', e);
  }
}

export function loadSyncedItemsFromStorage(): Record<string, InspectionItem[]> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_ITEMS);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveGoogleSheetUrl(url: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_SHEET_URL, url.trim());
  } catch (e) {
    console.warn('LocalStorage URL save error:', e);
  }
}

export function loadGoogleSheetUrl(): string {
  try {
    return (
      localStorage.getItem(STORAGE_KEY_SHEET_URL) ||
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vTIFBymZABJw0Z_fmmdT3m8f3r6G7iTVn5Qla7EfnVZFeo76tZlrv1-Fw-tCcmGJ7j6WQJ4f2Um2m2W/pub?output=csv'
    );
  } catch {
    return 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTIFBymZABJw0Z_fmmdT3m8f3r6G7iTVn5Qla7EfnVZFeo76tZlrv1-Fw-tCcmGJ7j6WQJ4f2Um2m2W/pub?output=csv';
  }
}
