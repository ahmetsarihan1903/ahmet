import { Capacitor, CapacitorHttp } from '@capacitor/core';
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

  // Extract gid (tab ID) only if explicitly present
  const gidMatch = trimmed.match(/[#&?]gid=([0-9]+)/);
  const hasExplicitGid = Boolean(gidMatch && gidMatch[1]);
  const gid = hasExplicitGid ? gidMatch![1] : '0';

  // 1. Check for "Web'de Yayınla" (Publish to Web) format: /spreadsheets(/u/0)?/d/e/2PACX-.../pub...
  const pubWebMatch = trimmed.match(/\/spreadsheets(?:\/u\/\d+)?\/d\/e\/([a-zA-Z0-9-_]+)/);
  if (pubWebMatch && pubWebMatch[1]) {
    const pubId = pubWebMatch[1];
    if (hasExplicitGid) {
      candidates.push(`https://docs.google.com/spreadsheets/d/e/${pubId}/pub?output=csv&gid=${gid}`);
      candidates.push(`https://docs.google.com/spreadsheets/d/e/${pubId}/pub?output=csv`);
    } else {
      candidates.push(`https://docs.google.com/spreadsheets/d/e/${pubId}/pub?output=csv`);
      candidates.push(`https://docs.google.com/spreadsheets/d/e/${pubId}/pub?output=csv&gid=0`);
    }
    return candidates;
  }

  // 2. Standard Google Sheets share or edit URL: /spreadsheets(/u/0)?/d/{SPREADSHEET_ID}/...
  const standardMatch = trimmed.match(/\/spreadsheets(?:\/u\/\d+)?\/d\/([a-zA-Z0-9-_]+)/);
  if (standardMatch && standardMatch[1] && standardMatch[1] !== 'e') {
    const sheetId = standardMatch[1];
    if (hasExplicitGid) {
      candidates.push(`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`);
      candidates.push(`https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`);
      candidates.push(`https://docs.google.com/spreadsheets/d/${sheetId}/pub?output=csv&gid=${gid}`);
    }
    candidates.push(`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`);
    candidates.push(`https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`);
    candidates.push(`https://docs.google.com/spreadsheets/d/${sheetId}/pub?output=csv`);
    return candidates;
  }

  // 3. Google Drive file URL: /file/d/{FILE_ID}/view or ?id={FILE_ID}
  const driveMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9-_]+)/) || trimmed.match(/[?&]id=([a-zA-Z0-9-_]+)/);
  if (driveMatch && driveMatch[1]) {
    const fileId = driveMatch[1];
    candidates.push(`https://docs.google.com/spreadsheets/d/${fileId}/gviz/tq?tqx=out:csv`);
    candidates.push(`https://docs.google.com/spreadsheets/d/${fileId}/export?format=csv`);
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

function escapeCsvCell(val: unknown): string {
  const str = val === null || val === undefined ? '' : String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Zero-CORS JSONP fallback via Google Visualization API for standard Google Sheets URLs
function fetchViaGvizJsonp(sheetId: string, gid?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      reject(new Error('Document unavailable for JSONP'));
      return;
    }

    const cbName = `__betaGvizCb_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const script = document.createElement('script');
    let settled = false;

    const cleanup = () => {
      try {
        delete (window as any)[cbName];
      } catch {
        (window as any)[cbName] = undefined;
      }
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        cleanup();
        reject(new Error('Google E-Tablo zaman aşımına uğradı.'));
      }
    }, 12000);

    (window as any)[cbName] = (payload: any) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      cleanup();

      try {
        if (!payload || payload.status === 'error' || !payload.table) {
          reject(new Error('E-Tablo verisi okunamadı veya gizli görünüyor.'));
          return;
        }

        const cols: any[] = payload.table.cols || [];
        const rows: any[] = payload.table.rows || [];
        const csvLines: string[] = [];

        const colLabels = cols.map((c) => escapeCsvCell(c?.label || ''));
        if (colLabels.some((lbl) => lbl.trim() !== '')) {
          csvLines.push(colLabels.join(','));
        }

        for (const r of rows) {
          const cells: any[] = r?.c || [];
          const rowVals = cols.map((_, idx) => {
            const cell = cells[idx];
            if (!cell) return '';
            const raw = cell.f !== undefined && cell.f !== null ? cell.f : cell.v;
            return escapeCsvCell(raw);
          });
          if (rowVals.some((v) => v.trim() !== '')) {
            csvLines.push(rowVals.join(','));
          }
        }

        resolve(csvLines.join('\n'));
      } catch (err) {
        reject(err);
      }
    };

    const gidParam = gid ? `&gid=${encodeURIComponent(gid)}` : '';
    script.src = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json;responseHandler:${cbName}${gidParam}`;
    script.async = true;
    script.onerror = () => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        cleanup();
        reject(new Error('Google E-Tablo bağlantısı kurulamadı.'));
      }
    };

    document.head.appendChild(script);
  });
}

function isHtmlAuthResponse(text: string): boolean {
  const lower = text.trim().toLowerCase();
  return (
    lower.startsWith('<!doctype html') ||
    lower.startsWith('<html') ||
    lower.includes('accounts.google.com/servicelogin') ||
    lower.includes('<title>google sheets')
  );
}

// Helper to fetch CSV text trying native HTTP, Electron proxy, standard fetch, and JSONP fallback
export async function fetchGoogleSheetCsvText(url: string): Promise<string> {
  const candidates = getGoogleSheetUrlCandidates(url);
  if (candidates.length === 0) {
    throw new Error('Geçersiz Google E-Tablo URL bağlantısı.');
  }

  let lastError: any = null;
  const isNative = Capacitor.isNativePlatform();
  const isElectronDesktop =
    typeof window !== 'undefined' &&
    window.location.hostname === 'localhost' &&
    window.location.port === '45123';

  for (const candidateUrl of candidates) {
    try {
      // 1. Android APK Native HTTP (bypasses WebView CORS & handles Google redirects cleanly)
      if (isNative) {
        const res = await CapacitorHttp.get({
          url: candidateUrl,
          responseType: 'text',
        });
        if (res.status >= 200 && res.status < 300) {
          const text = typeof res.data === 'string' ? res.data : JSON.stringify(res.data || '');
          if (text && text.trim().length > 0 && !isHtmlAuthResponse(text)) {
            return text;
          }
          if (isHtmlAuthResponse(text)) {
            throw new Error('E-Tablo gizli görünüyor. Lütfen paylaşım ayarını "Bağlantıya sahip olan herkes görüntüleyebilir" yapın.');
          }
        }
      }

      // 2. Windows Electron Desktop Local Proxy (bypasses CORS cleanly)
      if (isElectronDesktop) {
        const proxyRes = await fetch(`/api/fetch-sheet?url=${encodeURIComponent(candidateUrl)}`);
        if (proxyRes.ok) {
          const text = await proxyRes.text();
          if (text && text.trim().length > 0 && !isHtmlAuthResponse(text)) {
            return text;
          }
          if (isHtmlAuthResponse(text)) {
            throw new Error('E-Tablo gizli görünüyor. Lütfen paylaşım ayarını "Bağlantıya sahip olan herkes görüntüleyebilir" yapın.');
          }
        }
      }

      // 3. Standard Web Browser Fetch
      const response = await fetch(candidateUrl, {
        method: 'GET',
      });

      if (response.ok) {
        const text = await response.text();
        if (text && text.trim().length > 0) {
          if (isHtmlAuthResponse(text)) {
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

  // 4. Zero-CORS JSONP fallback for standard Google Sheets links (/spreadsheets/d/{sheetId}/...)
  const standardMatch = url.trim().match(/\/spreadsheets(?:\/u\/\d+)?\/d\/([a-zA-Z0-9-_]+)/);
  if (standardMatch && standardMatch[1] && standardMatch[1] !== 'e') {
    const gidMatch = url.trim().match(/[#&?]gid=([0-9]+)/);
    try {
      return await fetchViaGvizJsonp(standardMatch[1], gidMatch?.[1]);
    } catch (jsonpErr: any) {
      lastError = jsonpErr;
    }
  }

  throw lastError || new Error('E-Tabloya erişilemedi. Lütfen bağlantının "Bağlantıya sahip olan herkes görüntüleyebilir" veya "Web\'de Yayınla" olarak paylaşıldığından emin olun.');
}

// Detect dominant CSV delimiter (comma, semicolon, or tab) outside quoted strings
function detectDelimiter(csvText: string): string {
  const firstLineEnd = csvText.indexOf('\n');
  const sampleLine = firstLineEnd >= 0 ? csvText.slice(0, firstLineEnd) : csvText;

  let commas = 0;
  let semicolons = 0;
  let tabs = 0;
  let inQuotes = false;

  for (let i = 0; i < sampleLine.length; i++) {
    const ch = sampleLine[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (!inQuotes) {
      if (ch === ',') commas++;
      else if (ch === ';') semicolons++;
      else if (ch === '\t') tabs++;
    }
  }

  if (tabs > commas && tabs >= semicolons) return '\t';
  if (semicolons > commas && semicolons > 0) return ';';
  return ',';
}

// Simple robust CSV/TSV parser handling commas, semicolons, tabs, quotes, and newlines
export function parseCSV(csvText: string): string[][] {
  const cleanText = csvText.replace(/^\uFEFF/, '');
  const delimiter = detectDelimiter(cleanText);
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

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
      } else if (char === delimiter) {
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
