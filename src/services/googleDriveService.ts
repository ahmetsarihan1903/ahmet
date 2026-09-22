// Google Drive Service for Beta Asansör Saha Yönetim Sistemi
// Supports cloud backup of Quality Control Audits (both JSON data and PDF files)
// Default shared folder ID: 1GAUJoTIEtCpSRepZqHNkzq_dx64JRQ_4

import { AuditFormData } from '../types';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export const DEFAULT_DRIVE_FOLDER_ID = '1GAUJoTIEtCpSRepZqHNkzq_dx64JRQ_4';
export const DEFAULT_DRIVE_FOLDER_URL = `https://drive.google.com/drive/folders/${DEFAULT_DRIVE_FOLDER_ID}`;
export const DEFAULT_DRIVE_ACCOUNT = 'betaasansormontaj@gmail.com';

const STORAGE_TOKEN_KEY = 'beta_drive_access_token_v1';
const STORAGE_TOKEN_EXPIRY_KEY = 'beta_drive_token_expiry_v1';
const STORAGE_FOLDER_ID_KEY = 'beta_drive_target_folder_id_v1';

// Firebase Auth App and Provider Initialization
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

const driveProvider = new GoogleAuthProvider();
driveProvider.addScope('https://www.googleapis.com/auth/drive.file');
driveProvider.setCustomParameters({
  prompt: 'select_account',
});

let inMemoryDriveToken: string | null = null;
let isSigningIn = false;

export function getSavedDriveFolderId(): string {
  try {
    return localStorage.getItem(STORAGE_FOLDER_ID_KEY) || DEFAULT_DRIVE_FOLDER_ID;
  } catch {
    return DEFAULT_DRIVE_FOLDER_ID;
  }
}

export function setSavedDriveFolderId(folderId: string): void {
  try {
    localStorage.setItem(STORAGE_FOLDER_ID_KEY, folderId.trim() || DEFAULT_DRIVE_FOLDER_ID);
  } catch (e) {
    console.warn('Folder ID save error:', e);
  }
}

export function getCachedDriveToken(): string | null {
  if (inMemoryDriveToken) return inMemoryDriveToken;
  try {
    const token = localStorage.getItem(STORAGE_TOKEN_KEY);
    const expiry = localStorage.getItem(STORAGE_TOKEN_EXPIRY_KEY);
    if (!token) return null;
    if (expiry && Date.now() > parseInt(expiry, 10)) {
      localStorage.removeItem(STORAGE_TOKEN_KEY);
      localStorage.removeItem(STORAGE_TOKEN_EXPIRY_KEY);
      inMemoryDriveToken = null;
      return null;
    }
    inMemoryDriveToken = token;
    return token;
  } catch {
    return null;
  }
}

export function saveCachedDriveToken(token: string, expiresInSeconds = 3500): void {
  inMemoryDriveToken = token;
  try {
    localStorage.setItem(STORAGE_TOKEN_KEY, token);
    localStorage.setItem(STORAGE_TOKEN_EXPIRY_KEY, (Date.now() + expiresInSeconds * 1000).toString());
  } catch (e) {
    console.warn('Drive token save error:', e);
  }
}

export function clearCachedDriveToken(): void {
  inMemoryDriveToken = null;
  try {
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    localStorage.removeItem(STORAGE_TOKEN_EXPIRY_KEY);
    signOut(auth).catch(() => {});
  } catch (e) {
    console.warn('Token clear error:', e);
  }
}

/**
 * Requests an OAuth access token using Firebase Auth Google Provider.
 */
export async function requestDriveAccessToken(): Promise<string> {
  const cached = getCachedDriveToken();
  if (cached) return cached;

  if (isSigningIn) {
    await new Promise((r) => setTimeout(r, 600));
    const tokenAfterWait = getCachedDriveToken();
    if (tokenAfterWait) return tokenAfterWait;
  }

  isSigningIn = true;

  try {
    const result = await signInWithPopup(auth, driveProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken;

    if (!accessToken) {
      throw new Error('Google Drive yetkilendirme anahtarı (access token) alınamadı.');
    }

    saveCachedDriveToken(accessToken, 3500);
    return accessToken;
  } catch (error: any) {
    console.error('Drive Sign-in error:', error);
    const errCode = error?.code || '';
    const errMsg = error?.message || String(error);

    if (errCode === 'auth/popup-closed-by-user' || errMsg.includes('closed-by-user')) {
      throw new Error('Giriş penceresi kullanıcı tarafından kapatıldı.');
    }
    if (errCode === 'auth/popup-blocked' || errMsg.includes('blocked')) {
      throw new Error('Tarayıcı/Tablet açılır pencereyi engelledi. Lütfen açılır pencerelere izin veriniz.');
    }
    throw new Error(`Google Drive Bağlantı Hatası: ${errMsg}`);
  } finally {
    isSigningIn = false;
  }
}

export interface DriveProjectFile {
  id: string;
  name: string;
  mimeType: string;
  createdTime?: string;
  modifiedTime?: string;
  size?: string;
  webViewLink?: string;
  iconLink?: string;
  isAuditData?: boolean;
}

/**
 * Lists files in the target Google Drive folder
 */
export async function listDriveFolderFiles(targetFolderId = getSavedDriveFolderId()): Promise<DriveProjectFile[]> {
  const token = await requestDriveAccessToken();
  const folderQuery = targetFolderId ? `'${targetFolderId}' in parents and trashed = false` : 'trashed = false';
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    folderQuery
  )}&fields=files(id,name,mimeType,createdTime,modifiedTime,size,webViewLink,iconLink)&orderBy=modifiedTime desc&pageSize=100`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    clearCachedDriveToken();
    throw new Error('Google oturum süreniz doldu. Lütfen tekrar oturum açınız.');
  }

  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson?.error?.message || `Drive dosyaları listelenemedi (${response.status})`);
  }

  const result = await response.json();
  const files: DriveProjectFile[] = (result.files || []).map((f: any) => ({
    ...f,
    isAuditData: f.name.endsWith('.json'),
  }));

  return files;
}

// Offline Cloud Sync Queue Key
const STORAGE_OFFLINE_SYNC_QUEUE_KEY = 'beta_drive_offline_sync_queue_v1';

/**
 * Saves or queues audit data for offline background sync
 */
export function queueAuditForCloudSync(auditData: AuditFormData): void {
  try {
    localStorage.setItem(STORAGE_OFFLINE_SYNC_QUEUE_KEY, JSON.stringify(auditData));
  } catch (e) {
    console.warn('Offline sync queue save error:', e);
  }
}

export function getQueuedAuditForCloudSync(): AuditFormData | null {
  try {
    const raw = localStorage.getItem(STORAGE_OFFLINE_SYNC_QUEUE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return null;
}

export function clearQueuedAuditForCloudSync(): void {
  try {
    localStorage.removeItem(STORAGE_OFFLINE_SYNC_QUEUE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Uploads or updates a JSON project audit dataset to Google Drive.
 * If a file for this serialNumber / project reference already exists, it OVERWRITES (PATCH)
 * that existing file so duplicate files are NOT created!
 */
export async function uploadAuditJsonToDrive(
  auditData: AuditFormData,
  targetFolderId = getSavedDriveFolderId(),
  options: { silent?: boolean } = {}
): Promise<{ fileId: string; fileName: string; webViewLink?: string; isUpdated?: boolean }> {
  // If not online, queue for sync when internet is back
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    queueAuditForCloudSync(auditData);
    throw new Error('Cihaz şu an çevrimdışı (internetsiz). Bağlantı geldiğinde otomatik buluta yüklenecek.');
  }

  let token: string | null = null;
  if (options.silent) {
    token = getCachedDriveToken();
    if (!token) {
      // If no valid cached token and silent mode, queue it for next opportunity
      queueAuditForCloudSync(auditData);
      throw new Error('Google Drive oturumu açık değil.');
    }
  } else {
    token = await requestDriveAccessToken();
  }

  // Türkçe karakterleri koruyarak sadece dosya sistemi/URL için geçersiz karakterleri temizle
  const cleanSerial = (auditData.serialNumber || 'SN-YOK').trim().replace(/[/\\:*?"<>|]/g, '-').replace(/\s+/g, ' ');
  const cleanProject = (auditData.clientProjectName || 'Referans-Yok').trim().replace(/[/\\:*?"<>|]/g, '-').replace(/\s+/g, ' ');
  // Sadece seri numarası ve referans adı ile .json uzantısı
  const fileName = `${cleanSerial}_${cleanProject}.json`;

  // Search if a file with the same reference/serial already exists in this folder
  let existingFileId: string | null = null;
  try {
    const searchFolderQuery = targetFolderId ? `'${targetFolderId}' in parents and trashed = false` : 'trashed = false';
    const searchQuery = `${searchFolderQuery} and (name = '${fileName}' or name contains '${cleanSerial}_')`;
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      searchQuery
    )}&fields=files(id,name,webViewLink)&pageSize=10`;

    const searchRes = await fetch(searchUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.files && searchData.files.length > 0) {
        existingFileId = searchData.files[0].id;
      }
    }
  } catch (err) {
    console.warn('Existing Drive file search failed, will attempt upload:', err);
  }

  const jsonPayload = JSON.stringify(
    {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      auditData,
    },
    null,
    2
  );

  // If existing file found, UPDATE / OVERWRITE content (PATCH/UPLOAD)
  if (existingFileId) {
    const updateResponse = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=media`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: jsonPayload,
      }
    );

    if (updateResponse.status === 401) {
      clearCachedDriveToken();
      queueAuditForCloudSync(auditData);
      throw new Error('Google oturum süreniz doldu.');
    }

    if (!updateResponse.ok) {
      const errJson = await updateResponse.json().catch(() => ({}));
      throw new Error(errJson?.error?.message || `Dosya güncellenemedi (${updateResponse.status})`);
    }

    const updatedFile = await updateResponse.json();
    clearQueuedAuditForCloudSync();

    return {
      fileId: existingFileId,
      fileName,
      webViewLink: updatedFile.webViewLink,
      isUpdated: true,
    };
  }

  // If new, create multipart file in folder
  const metadata: any = {
    name: fileName,
    mimeType: 'application/json',
    description: `Beta Asansör Kalite Kontrol Veri Dosyası - SN: ${auditData.serialNumber} - ${auditData.clientProjectName}`,
  };

  if (targetFolderId) {
    metadata.parents = [targetFolderId];
  }

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    jsonPayload +
    closeDelimiter;

  const uploadResponse = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (uploadResponse.status === 401) {
    clearCachedDriveToken();
    queueAuditForCloudSync(auditData);
    throw new Error('Google oturum süreniz doldu. Lütfen tekrar deneyiniz.');
  }

  if (!uploadResponse.ok) {
    const errJson = await uploadResponse.json().catch(() => ({}));
    throw new Error(errJson?.error?.message || `Veri dosyası Drive'a yüklenemedi (${uploadResponse.status})`);
  }

  const createdFile = await uploadResponse.json();
  clearQueuedAuditForCloudSync();

  return {
    fileId: createdFile.id,
    fileName: createdFile.name,
    webViewLink: createdFile.webViewLink,
    isUpdated: false,
  };
}

/**
 * Uploads a PDF Blob to Google Drive
 */
export async function uploadPdfBlobToDrive(
  pdfBlob: Blob,
  fileName: string,
  targetFolderId = getSavedDriveFolderId()
): Promise<{ fileId: string; fileName: string; webViewLink?: string }> {
  const token = await requestDriveAccessToken();

  const metadata: any = {
    name: fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`,
    mimeType: 'application/pdf',
    description: 'Beta Asansör Resmi Kalite Kontrol Raporu (PDF)',
  };

  if (targetFolderId) {
    metadata.parents = [targetFolderId];
  }

  // Use Multipart upload with FormData/ArrayBuffer
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', pdfBlob);

  const uploadResponse = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    }
  );

  if (uploadResponse.status === 401) {
    clearCachedDriveToken();
    throw new Error('Google oturum süreniz doldu. Lütfen tekrar deneyiniz.');
  }

  if (!uploadResponse.ok) {
    const errJson = await uploadResponse.json().catch(() => ({}));
    throw new Error(errJson?.error?.message || `PDF raporu Drive'a yüklenemedi (${uploadResponse.status})`);
  }

  const createdFile = await uploadResponse.json();
  return {
    fileId: createdFile.id,
    fileName: createdFile.name,
    webViewLink: createdFile.webViewLink,
  };
}

/**
 * Downloads and parses an Audit JSON file from Google Drive
 */
export async function downloadAuditJsonFromDrive(fileId: string): Promise<AuditFormData> {
  const token = await requestDriveAccessToken();
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    clearCachedDriveToken();
    throw new Error('Google oturum süreniz doldu. Lütfen tekrar deneyiniz.');
  }

  if (!response.ok) {
    throw new Error(`Drive dosyası indirilemedi (${response.status})`);
  }

  const rawJson = await response.json();
  if (rawJson.auditData) {
    return rawJson.auditData as AuditFormData;
  }
  return rawJson as AuditFormData;
}
