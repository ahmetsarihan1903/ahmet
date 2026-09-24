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
export const DEFAULT_DRIVE_ACCOUNT = 'ahmetsarihan1903@gmail.com';

const STORAGE_TOKEN_KEY = 'beta_drive_access_token_v1';
const STORAGE_TOKEN_EXPIRY_KEY = 'beta_drive_token_expiry_v1';
const STORAGE_FOLDER_ID_KEY = 'beta_drive_target_folder_id_v1';
const STORAGE_FOLDER_URL_KEY = 'beta_drive_folder_url_v1';

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

export const STORAGE_SCRIPT_URL_KEY = 'beta_drive_script_webhook_url_v1';

export const GOOGLE_APPS_SCRIPT_TEMPLATE = `// =======================================================
// BETA ASANSÖR - GOOGLE DRIVE BULUT KÖPRÜSÜ
// Yetkili Hesap: ahmetsarihan1903@gmail.com
// =======================================================
var DEFAULT_FOLDER_ID = "1GAUJoTIEtCpSRepZqHNkzq_dx64JRQ_4";
var FOLDER_NAME = "KALITEKONTROL ARSIV";

function getTargetFolder(folderId) {
  if (folderId) {
    try {
      return DriveApp.getFolderById(folderId);
    } catch (err) {
      // Belirtilen ID'ye erişilemezse ada göre ara
    }
  }
  var folders = DriveApp.getFoldersByName(FOLDER_NAME);
  if (folders.hasNext()) {
    return folders.next();
  }
  // Klasör hesapta yoksa otomatik olarak oluşturur
  return DriveApp.createFolder(FOLDER_NAME);
}

function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) || 'list';
    var folderId = (e && e.parameter && e.parameter.folderId) || DEFAULT_FOLDER_ID;
    var folder = getTargetFolder(folderId);

    // 1. Dosya İndirme (JSON Proje Verisi)
    if (action === 'download') {
      var fileId = e.parameter.fileId;
      var file = DriveApp.getFileById(fileId);
      return ContentService.createTextOutput(file.getBlob().getDataAsString())
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 2. Klasör Dosyalarını Listeleme
    var files = folder.getFiles();
    var list = [];
    while (files.hasNext()) {
      var f = files.next();
      list.push({
        id: f.getId(),
        name: f.getName(),
        mimeType: f.getMimeType(),
        modifiedTime: f.getLastUpdated().toISOString(),
        webViewLink: f.getUrl(),
        size: f.getSize(),
        isAuditData: f.getName().toLowerCase().endsWith('.json')
      });
    }

    // En son değiştirilen en üstte
    list.sort(function(a, b) {
      return new Date(b.modifiedTime) - new Date(a.modifiedTime);
    });

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      folderId: folder.getId(),
      folderUrl: folder.getUrl(),
      files: list
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var folderId = data.folderId || DEFAULT_FOLDER_ID;
    var folder = getTargetFolder(folderId);
    var action = data.action || 'uploadJson';
    var fileName = data.fileName || 'Proje_Verisi.json';

    // 1. PDF Raporu Yükleme
    if (action === 'uploadPdf') {
      var decoded = Utilities.base64Decode(data.base64);
      var blob = Utilities.newBlob(decoded, 'application/pdf', fileName);
      var pdfFile = folder.createFile(blob);
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        fileId: pdfFile.getId(),
        fileName: pdfFile.getName(),
        webViewLink: pdfFile.getUrl(),
        folderUrl: folder.getUrl()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. JSON Denetim Dosyası Yükleme (Mevcut referans varsa üzerine yazar)
    var content = typeof data.content === 'string' ? data.content : JSON.stringify(data.content, null, 2);
    var existingFiles = folder.getFilesByName(fileName);
    var targetFile;
    var isUpdated = false;

    if (existingFiles.hasNext()) {
      targetFile = existingFiles.next();
      targetFile.setContent(content);
      isUpdated = true;
    } else {
      targetFile = folder.createFile(fileName, content, 'application/json');
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      fileId: targetFile.getId(),
      fileName: targetFile.getName(),
      webViewLink: targetFile.getUrl(),
      folderUrl: folder.getUrl(),
      isUpdated: isUpdated
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

export function getSavedDriveFolderUrl(): string {
  try {
    return localStorage.getItem(STORAGE_FOLDER_URL_KEY) || DEFAULT_DRIVE_FOLDER_URL;
  } catch {
    return DEFAULT_DRIVE_FOLDER_URL;
  }
}

export function setSavedDriveFolderUrl(url: string): void {
  try {
    if (url.trim()) {
      localStorage.setItem(STORAGE_FOLDER_URL_KEY, url.trim());
    }
  } catch (e) {
    console.warn('Folder URL save error:', e);
  }
}

export const DEFAULT_SCRIPT_WEBHOOK_URL =
  'https://script.google.com/macros/s/AKfycbzPnUqLVf4oHwS5OIHO15sR0O2y62Z1pw2HUx1PFhGGQnBuFUuHY9AGi7iUI3VtnHEA/exec';

export function getSavedDriveScriptUrl(): string {
  try {
    return localStorage.getItem(STORAGE_SCRIPT_URL_KEY) || DEFAULT_SCRIPT_WEBHOOK_URL;
  } catch {
    return DEFAULT_SCRIPT_WEBHOOK_URL;
  }
}

export function setSavedDriveScriptUrl(url: string): void {
  try {
    const trimmed = url.trim();
    if (trimmed) {
      localStorage.setItem(STORAGE_SCRIPT_URL_KEY, trimmed);
    } else {
      localStorage.removeItem(STORAGE_SCRIPT_URL_KEY);
    }
  } catch (e) {
    console.warn('Script URL save error:', e);
  }
}

export function isCloudConfigured(): boolean {
  return !!getSavedDriveScriptUrl() || !!getCachedDriveToken();
}

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
 * Dynamically loads Google Identity Services (GIS) library for direct OAuth token requests
 * without requiring Firebase Authorized Domains configuration.
 */
function loadGisScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('Pencere bulunamadı'));
    if ((window as any).google?.accounts?.oauth2) return resolve();
    const existing = document.getElementById('google-gis-script');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('GIS script yüklenemedi')));
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-gis-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Google Identity Services kütüphanesi yüklenemedi'));
    document.head.appendChild(script);
  });
}

export async function requestDriveAccessTokenViaGis(): Promise<string> {
  await loadGisScript();
  const googleObj = (window as any).google;
  if (!googleObj?.accounts?.oauth2) {
    throw new Error('Google OAuth kütüphanesi yüklenemedi.');
  }

  const clientId = (firebaseConfig as any).oAuthClientId || '31994782267-uehmrfkdgt6l05pbk614v9767d291o6s.apps.googleusercontent.com';

  return new Promise((resolve, reject) => {
    try {
      const client = googleObj.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly',
        callback: (response: any) => {
          if (response.error) {
            reject(new Error(`Google Yetkilendirme Hatası: ${response.error_description || response.error}`));
            return;
          }
          if (response.access_token) {
            saveCachedDriveToken(response.access_token, response.expires_in || 3500);
            resolve(response.access_token);
          } else {
            reject(new Error('Erişim anahtarı alınamadı.'));
          }
        },
        error_callback: (err: any) => {
          reject(new Error(`Google OAuth penceresi açılırken hata oluştu: ${err?.message || 'Açılır pencere engellendi'}`));
        },
      });
      client.requestAccessToken({ prompt: '' });
    } catch (e: any) {
      reject(e);
    }
  });
}

/**
 * Requests an OAuth access token using GIS token client first, falling back to Firebase Auth Popup.
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
    // 1. Direct Google Identity Services (GIS) Token Client
    try {
      const token = await requestDriveAccessTokenViaGis();
      if (token) return token;
    } catch (gisError: any) {
      console.warn('GIS Auth attempt failed, falling back to Firebase Auth Popup:', gisError);
    }

    // 2. Fallback to Firebase Auth Popup
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
  const scriptUrl = getSavedDriveScriptUrl();
  if (scriptUrl) {
    const separator = scriptUrl.includes('?') ? '&' : '?';
    const response = await fetch(`${scriptUrl}${separator}action=list&folderId=${encodeURIComponent(targetFolderId)}`);
    if (!response.ok) {
      throw new Error(`Bulut listesi alınamadı (${response.status})`);
    }
    const data = await response.json();
    if (!data.success && data.error) {
      throw new Error(`Bulut Hatası: ${data.error}`);
    }
    if (data.folderUrl) {
      setSavedDriveFolderUrl(data.folderUrl);
    }
    return (data.files || []).map((f: any) => ({
      ...f,
      isAuditData: f.name.toLowerCase().endsWith('.json'),
    }));
  }

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

  // Türkçe karakterleri koruyarak sadece dosya sistemi/URL için geçersiz karakterleri temizle
  const cleanSerial = (auditData.serialNumber || 'SN-YOK').trim().replace(/[/\\:*?"<>|]/g, '-').replace(/\s+/g, ' ');
  const cleanProject = (auditData.clientProjectName || 'Referans-Yok').trim().replace(/[/\\:*?"<>|]/g, '-').replace(/\s+/g, ' ');
  const fileName = `${cleanSerial}_${cleanProject}.json`;

  const jsonPayload = JSON.stringify(
    {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      auditData,
    },
    null,
    2
  );

  const scriptUrl = getSavedDriveScriptUrl();
  if (scriptUrl) {
    try {
      const res = await fetch(scriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'uploadJson',
          fileName,
          content: jsonPayload,
          folderId: targetFolderId,
        }),
      });

      if (!res.ok) {
        throw new Error(`Bulut yüklemesi başarısız oldu (${res.status})`);
      }

      const resJson = await res.json();
      if (!resJson.success && resJson.error) {
        throw new Error(`Bulut Hatası: ${resJson.error}`);
      }

      clearQueuedAuditForCloudSync();
      return {
        fileId: resJson.fileId || 'webhook-file',
        fileName,
        webViewLink: resJson.webViewLink,
        isUpdated: !!resJson.isUpdated,
      };
    } catch (err: any) {
      if (options.silent) {
        queueAuditForCloudSync(auditData);
      }
      throw err;
    }
  }

  let token: string | null = null;
  if (options.silent) {
    token = getCachedDriveToken();
    if (!token) {
      // If no valid cached token and silent mode, queue it for next opportunity
      queueAuditForCloudSync(auditData);
      throw new Error('Google Drive oturumu açık değil veya Bulut Köprüsü tanımlanmamış.');
    }
  } else {
    token = await requestDriveAccessToken();
  }

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
  const cleanName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
  const scriptUrl = getSavedDriveScriptUrl();

  if (scriptUrl) {
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const b64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(b64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(pdfBlob);
    });

    const res = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'uploadPdf',
        fileName: cleanName,
        base64: base64Data,
        folderId: targetFolderId,
      }),
    });

    if (!res.ok) {
      throw new Error(`PDF yüklenemedi (${res.status})`);
    }

    const resJson = await res.json();
    if (!resJson.success && resJson.error) {
      throw new Error(`Bulut Hatası: ${resJson.error}`);
    }

    return {
      fileId: resJson.fileId || 'webhook-pdf',
      fileName: cleanName,
      webViewLink: resJson.webViewLink,
    };
  }

  const token = await requestDriveAccessToken();

  const metadata: any = {
    name: cleanName,
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
  const scriptUrl = getSavedDriveScriptUrl();
  if (scriptUrl) {
    const separator = scriptUrl.includes('?') ? '&' : '?';
    const response = await fetch(`${scriptUrl}${separator}action=download&fileId=${encodeURIComponent(fileId)}`);
    if (!response.ok) {
      throw new Error(`Dosya indirilemedi (${response.status})`);
    }
    const rawJson = await response.json();
    if (rawJson.auditData) {
      return rawJson.auditData as AuditFormData;
    }
    return rawJson as AuditFormData;
  }

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
