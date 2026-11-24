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

export const DEFAULT_CONTRACTOR_PORTAL_URL = 'https://ahmetsarihan1903.github.io/ahmet/';
const STORAGE_CONTRACTOR_PORTAL_URL_KEY = 'beta_contractor_portal_url_v1';

export function getContractorPortalUrl(): string {
  try {
    const saved = localStorage.getItem(STORAGE_CONTRACTOR_PORTAL_URL_KEY);
    return saved && saved.trim() ? saved.trim() : DEFAULT_CONTRACTOR_PORTAL_URL;
  } catch {
    return DEFAULT_CONTRACTOR_PORTAL_URL;
  }
}

export function setContractorPortalUrl(url: string): void {
  try {
    const trimmed = url.trim();
    if (trimmed) {
      localStorage.setItem(STORAGE_CONTRACTOR_PORTAL_URL_KEY, trimmed);
    } else {
      localStorage.removeItem(STORAGE_CONTRACTOR_PORTAL_URL_KEY);
    }
  } catch {
    // ignore
  }
}

export const GOOGLE_APPS_SCRIPT_TEMPLATE = `// =======================================================
// BETA ASANSÖR - GOOGLE DRIVE BULUT KÖPRÜSÜ (v2.0 - Taşeron Destekli)
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
  return DriveApp.createFolder(FOLDER_NAME);
}

function collectContractorItems(audit) {
  var categories = [
    { key: 'controlPanelItems', label: 'Kumanda Panosu' },
    { key: 'motorChassisItems', label: 'Motor / Şase (' + (audit.elevatorType || '') + ')' },
    { key: 'cabinTopItems', label: 'Kabin Üstü' },
    { key: 'counterweightItems', label: 'Ağırlık Karkası' },
    { key: 'shaftAndPitItems', label: 'Kuyu ve Dip' },
    { key: 'cabinAndFloorButtonsItems', label: 'Kabin ve Butonlar' },
    { key: 'doorsItems', label: 'Kapılar' }
  ];
  var items = [];
  for (var c = 0; c < categories.length; c++) {
    var cat = categories[c];
    var list = audit[cat.key];
    if (Array.isArray(list)) {
      for (var i = 0; i < list.length; i++) {
        var it = list[i];
        if (it && it.isNonCompliant && !it.isResolved) {
          items.push({
            id: it.id,
            category: cat.label,
            title: it.title || '',
            description: it.description || '',
            floorLabel: it.floorLabel || '',
            contractorDone: !!it.contractorDone,
            contractorNote: it.contractorNote || '',
            contractorUpdatedAt: it.contractorUpdatedAt || '',
            contractorName: it.contractorName || ''
          });
        }
      }
    }
  }
  if (audit.rideComfortNonCompliant && !audit.rideComfortResolved) {
    items.push({
      id: 'ride_comfort_report',
      category: 'Seyir ve Konfor',
      title: 'Asansör Seyir ve Konfor Uygunsuzluğu',
      description: audit.rideComfortNotes || 'Konfor problemi tespit edildi.',
      floorLabel: '',
      contractorDone: !!audit.rideComfortContractorDone,
      contractorNote: audit.rideComfortContractorNote || '',
      contractorUpdatedAt: audit.rideComfortContractorUpdatedAt || '',
      contractorName: audit.rideComfortContractorName || ''
    });
  }
  return items;
}

function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) || 'list';
    var folderId = (e && e.parameter && e.parameter.folderId) || DEFAULT_FOLDER_ID;

    // 1. Taşeron Görev Verisi Çekme (Sadece Açık Eksikler & Doğrulama Anahtarı Kontrollü)
    if (action === 'contractorGet') {
      var cFileId = e.parameter.fileId;
      var cKey = (e.parameter.key || '').trim();
      if (!cFileId || !cKey) {
        return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Eksik görev bağlantısı veya güvenlik kodu.' }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      var cFile = DriveApp.getFileById(cFileId);
      var rawObj = JSON.parse(cFile.getBlob().getDataAsString());
      var auditObj = rawObj.auditData ? rawObj.auditData : rawObj;
      if (!auditObj || (auditObj.auditId && auditObj.auditId !== cKey)) {
        return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Bu görev bağlantısı geçersiz veya süresi dolmuş.' }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      var openItems = collectContractorItems(auditObj);
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        task: {
          fileId: cFileId,
          auditId: auditObj.auditId || cKey,
          projectName: auditObj.clientProjectName || '-',
          serialNumber: auditObj.serialNumber || '-',
          elevatorType: auditObj.elevatorType || '-',
          stopCount: auditObj.stopCount || '-',
          dateDisplay: auditObj.dateDisplay || '-',
          items: openItems
        }
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. Dosya İndirme (JSON Proje Verisi)
    if (action === 'download') {
      var fileId = e.parameter.fileId;
      var file = DriveApp.getFileById(fileId);
      return ContentService.createTextOutput(file.getBlob().getDataAsString())
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 3. Klasör Dosyalarını Listeleme
    var folder = getTargetFolder(folderId);
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
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    var data = JSON.parse(e.postData.contents);
    var action = data.action || 'uploadJson';

    // 1. Taşeron Güncellemesi (Yalnızca Taşeron Alanlarını Güvenli Birleştirme)
    if (action === 'contractorUpdate') {
      var uFileId = data.fileId;
      var uKey = (data.key || '').trim();
      var updates = data.updates || [];
      var uName = (data.contractorName || '').trim();
      if (!uFileId || !uKey) {
        return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Eksik dosya bilgisi.' }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      var target = DriveApp.getFileById(uFileId);
      var wrapper = JSON.parse(target.getBlob().getDataAsString());
      var audit = wrapper.auditData ? wrapper.auditData : wrapper;

      if (!audit || (audit.auditId && audit.auditId !== uKey)) {
        return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Doğrulama anahtarı eşleşmedi.' }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      var updateMap = {};
      for (var k = 0; k < updates.length; k++) {
        if (updates[k] && updates[k].id) {
          updateMap[updates[k].id] = updates[k];
        }
      }

      var nowStr = Utilities.formatDate(new Date(), 'Europe/Istanbul', 'dd.MM.yyyy HH:mm');
      var listKeys = ['controlPanelItems', 'motorChassisItems', 'cabinTopItems', 'counterweightItems', 'shaftAndPitItems', 'cabinAndFloorButtonsItems', 'doorsItems'];
      var changedCount = 0;

      for (var lk = 0; lk < listKeys.length; lk++) {
        var arr = audit[listKeys[lk]];
        if (Array.isArray(arr)) {
          for (var j = 0; j < arr.length; j++) {
            var item = arr[j];
            if (item && updateMap[item.id]) {
              var upd = updateMap[item.id];
              item.contractorDone = !!upd.contractorDone;
              item.contractorNote = (upd.contractorNote || '').toString().trim();
              if (item.contractorDone || item.contractorNote) {
                item.contractorUpdatedAt = nowStr;
                if (uName) item.contractorName = uName;
              }
              changedCount++;
            }
          }
        }
      }

      if (updateMap['ride_comfort_report']) {
        var rcUpd = updateMap['ride_comfort_report'];
        audit.rideComfortContractorDone = !!rcUpd.contractorDone;
        audit.rideComfortContractorNote = (rcUpd.contractorNote || '').toString().trim();
        if (audit.rideComfortContractorDone || audit.rideComfortContractorNote) {
          audit.rideComfortContractorUpdatedAt = nowStr;
          if (uName) audit.rideComfortContractorName = uName;
        }
        changedCount++;
      }

      if (wrapper.auditData) {
        wrapper.auditData = audit;
        wrapper.contractorLastUpdatedAt = nowStr;
      } else {
        wrapper = audit;
      }

      target.setContent(JSON.stringify(wrapper, null, 2));
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        updatedAt: nowStr,
        updatedCount: changedCount
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var folderId = data.folderId || DEFAULT_FOLDER_ID;
    var folder = getTargetFolder(folderId);
    var fileName = data.fileName || 'Proje_Verisi.json';

    // 2. PDF Raporu Yükleme
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

    // 3. JSON Denetim Dosyası Yükleme (Mevcut referans varsa üzerine yazar, eski taşeron notlarını korur)
    var content = typeof data.content === 'string' ? data.content : JSON.stringify(data.content, null, 2);
    var existingFiles = folder.getFilesByName(fileName);
    var targetFile;
    var isUpdated = false;

    if (existingFiles.hasNext()) {
      targetFile = existingFiles.next();
      try {
        var oldWrapper = JSON.parse(targetFile.getBlob().getDataAsString());
        var newWrapper = JSON.parse(content);
        var oldAudit = oldWrapper.auditData ? oldWrapper.auditData : oldWrapper;
        var newAudit = newWrapper.auditData ? newWrapper.auditData : newWrapper;
        if (oldAudit && newAudit) {
          var lKeys = ['controlPanelItems', 'motorChassisItems', 'cabinTopItems', 'counterweightItems', 'shaftAndPitItems', 'cabinAndFloorButtonsItems', 'doorsItems'];
          for (var a = 0; a < lKeys.length; a++) {
            var oldArr = oldAudit[lKeys[a]];
            var newArr = newAudit[lKeys[a]];
            if (Array.isArray(oldArr) && Array.isArray(newArr)) {
              var oldMap = {};
              for (var m = 0; m < oldArr.length; m++) {
                if (oldArr[m] && oldArr[m].id) oldMap[oldArr[m].id] = oldArr[m];
              }
              for (var n = 0; n < newArr.length; n++) {
                var ni = newArr[n];
                var oi = ni && oldMap[ni.id];
                if (oi && oi.contractorUpdatedAt && !ni.contractorUpdatedAt) {
                  ni.contractorDone = oi.contractorDone;
                  ni.contractorNote = oi.contractorNote;
                  ni.contractorUpdatedAt = oi.contractorUpdatedAt;
                  ni.contractorName = oi.contractorName;
                }
              }
            }
          }
          if (oldAudit.rideComfortContractorUpdatedAt && !newAudit.rideComfortContractorUpdatedAt) {
            newAudit.rideComfortContractorDone = oldAudit.rideComfortContractorDone;
            newAudit.rideComfortContractorNote = oldAudit.rideComfortContractorNote;
            newAudit.rideComfortContractorUpdatedAt = oldAudit.rideComfortContractorUpdatedAt;
            newAudit.rideComfortContractorName = oldAudit.rideComfortContractorName;
          }
          content = JSON.stringify(newWrapper, null, 2);
        }
      } catch (mergeErr) {}
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
  } finally {
    try { lock.releaseLock(); } catch (e) {}
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

const LEGACY_V1_SCRIPT_WEBHOOK_URL =
  'https://script.google.com/macros/s/AKfycbzPnUqLVf4oHwS5OIHO15sR0O2y62Z1pw2HUx1PFhGGQnBuFUuHY9AGi7iUI3VtnHEA/exec';

export const DEFAULT_SCRIPT_WEBHOOK_URL =
  'https://script.google.com/macros/s/AKfycbyBXwWhelaZ5Yl2xmMSCXAof3DZBn2fuMJ8LXTnH6OxBxGqXOW7im-6ESIJChZ63sBh/exec';

export function getSavedDriveScriptUrl(): string {
  try {
    const saved = localStorage.getItem(STORAGE_SCRIPT_URL_KEY);
    if (!saved || saved.trim() === LEGACY_V1_SCRIPT_WEBHOOK_URL) {
      if (saved) {
        localStorage.setItem(STORAGE_SCRIPT_URL_KEY, DEFAULT_SCRIPT_WEBHOOK_URL);
      }
      return DEFAULT_SCRIPT_WEBHOOK_URL;
    }
    return saved.trim();
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

// =========================================================================
// TAŞERON (USTA) WHATSAPP BAĞLANTISI & DRİVE SENKRONİZASYONU
// =========================================================================

export interface ContractorTaskItem {
  id: string;
  category: string;
  title: string;
  description: string;
  floorLabel?: string;
  contractorDone: boolean;
  contractorNote: string;
  contractorUpdatedAt?: string;
  contractorName?: string;
}

export interface ContractorTaskPayload {
  fileId: string;
  auditId: string;
  projectName: string;
  serialNumber: string;
  elevatorType: string;
  stopCount: number | string;
  dateDisplay: string;
  items: ContractorTaskItem[];
}

export interface ContractorSubmissionItem {
  id: string;
  contractorDone: boolean;
  contractorNote: string;
}

export function buildContractorPortalLink(
  fileId: string,
  auditId: string,
  customScriptUrl?: string
): string {
  const baseUrl = getContractorPortalUrl().replace(/\/+$/, '') + '/';
  const params = new URLSearchParams();
  params.set('taseron', '1');
  params.set('f', fileId);
  params.set('k', auditId);

  const activeScript = (customScriptUrl || getSavedDriveScriptUrl() || '').trim();
  if (activeScript && activeScript !== DEFAULT_SCRIPT_WEBHOOK_URL) {
    params.set('w', activeScript);
  }
  return `${baseUrl}?${params.toString()}`;
}

export async function fetchContractorTaskFromDrive(
  fileId: string,
  auditKey: string,
  scriptUrlOverride?: string
): Promise<ContractorTaskPayload> {
  const scriptUrl = (scriptUrlOverride || getSavedDriveScriptUrl() || DEFAULT_SCRIPT_WEBHOOK_URL).trim();
  if (!scriptUrl) {
    throw new Error('Google Drive Bulut Köprüsü yapılandırılmamış.');
  }
  const separator = scriptUrl.includes('?') ? '&' : '?';
  const url = `${scriptUrl}${separator}action=contractorGet&fileId=${encodeURIComponent(fileId)}&key=${encodeURIComponent(auditKey)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Bulut sunucusuna ulaşılamadı (${res.status})`);
  }
  const data = await res.json();
  if (data && Array.isArray(data.files) && !data.task) {
    throw new Error(
      'Google Drive Köprüsü (Apps Script) henüz Taşeron (v2) sürümüne güncellenmemiş. Kontrol ekibinin Ayarlar > Drive Köprüsü üzerinden script kodunu güncellemesi gerekmektedir.'
    );
  }
  if (!data || !data.success || !data.task) {
    throw new Error(data?.error || 'Görev dosyası okunamadı.');
  }
  return data.task as ContractorTaskPayload;
}

export async function submitContractorUpdatesToDrive(params: {
  fileId: string;
  auditKey: string;
  contractorName?: string;
  updates: ContractorSubmissionItem[];
  scriptUrlOverride?: string;
}): Promise<{ success: boolean; updatedAt: string; updatedCount: number }> {
  const scriptUrl = (params.scriptUrlOverride || getSavedDriveScriptUrl() || DEFAULT_SCRIPT_WEBHOOK_URL).trim();
  if (!scriptUrl) {
    throw new Error('Google Drive Bulut Köprüsü yapılandırılmamış.');
  }
  const res = await fetch(scriptUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify({
      action: 'contractorUpdate',
      fileId: params.fileId,
      key: params.auditKey,
      contractorName: params.contractorName || '',
      updates: params.updates,
    }),
  });
  if (!res.ok) {
    throw new Error(`Bulut kaydı başarısız oldu (${res.status})`);
  }
  const json = await res.json();
  if (!json || !json.success) {
    if (json && json.fileName && !json.updatedAt) {
      throw new Error(
        'Google Drive Köprüsü (Apps Script) henüz Taşeron (v2) sürümüne güncellenmemiş.'
      );
    }
    throw new Error(json?.error || 'Taşeron güncellemesi kaydedilemedi.');
  }
  return {
    success: true,
    updatedAt: json.updatedAt || new Date().toLocaleString('tr-TR'),
    updatedCount: json.updatedCount || 0,
  };
}

/**
 * Pulls latest contractor marks & notes from Drive into the local audit object
 * without overwriting inspector's local edits or 2nd control status.
 */
export async function pullContractorUpdatesIntoAudit(
  audit: AuditFormData
): Promise<{ updatedAudit: AuditFormData; contractorUpdatedCount: number; fileId: string }> {
  let targetFileId = audit.driveFileId || '';

  if (!targetFileId) {
    const files = await listDriveFolderFiles();
    const cleanSerial = (audit.serialNumber || '').trim().toLowerCase();
    const cleanProject = (audit.clientProjectName || '').trim().toLowerCase();
    const jsonFiles = files.filter((f) => f.isAuditData);

    const exactMatch = jsonFiles.find((f) => {
      const lower = f.name.toLowerCase();
      return (cleanSerial && lower.startsWith(`${cleanSerial}_`)) ||
        (cleanSerial && cleanProject && lower.includes(cleanSerial) && lower.includes(cleanProject));
    });

    const fallbackMatch =
      exactMatch ||
      jsonFiles.find((f) => cleanSerial && f.name.toLowerCase().includes(cleanSerial)) ||
      jsonFiles.find((f) => cleanProject && f.name.toLowerCase().includes(cleanProject));

    if (!fallbackMatch) {
      throw new Error('Bu projeye ait kayıt Google Drive klasöründe henüz bulunamadı.');
    }
    targetFileId = fallbackMatch.id;
  }

  const cloudAudit = await downloadAuditJsonFromDrive(targetFileId);

  const cloudItemMap = new Map<string, any>();
  const listKeys = [
    'controlPanelItems',
    'motorChassisItems',
    'cabinTopItems',
    'counterweightItems',
    'shaftAndPitItems',
    'cabinAndFloorButtonsItems',
    'doorsItems',
  ] as const;

  listKeys.forEach((lk) => {
    const list = cloudAudit[lk] as any[] | undefined;
    if (Array.isArray(list)) {
      list.forEach((it) => {
        if (it && it.id) cloudItemMap.set(it.id, it);
      });
    }
  });

  const merged: AuditFormData = JSON.parse(JSON.stringify(audit));
  merged.driveFileId = targetFileId;
  let contractorUpdatedCount = 0;

  listKeys.forEach((lk) => {
    const list = merged[lk] as any[] | undefined;
    if (Array.isArray(list)) {
      (merged as Record<string, any>)[lk] = list.map((it) => {
        const cloudIt = cloudItemMap.get(it.id);
        if (cloudIt && (cloudIt.contractorDone || cloudIt.contractorNote || cloudIt.contractorUpdatedAt)) {
          contractorUpdatedCount++;
          return {
            ...it,
            contractorDone: !!cloudIt.contractorDone,
            contractorNote: cloudIt.contractorNote || '',
            contractorUpdatedAt: cloudIt.contractorUpdatedAt,
            contractorName: cloudIt.contractorName,
          };
        }
        return it;
      });
    }
  });

  if (
    cloudAudit.rideComfortContractorDone ||
    cloudAudit.rideComfortContractorNote ||
    cloudAudit.rideComfortContractorUpdatedAt
  ) {
    contractorUpdatedCount++;
    merged.rideComfortContractorDone = !!cloudAudit.rideComfortContractorDone;
    merged.rideComfortContractorNote = cloudAudit.rideComfortContractorNote || '';
    merged.rideComfortContractorUpdatedAt = cloudAudit.rideComfortContractorUpdatedAt;
    merged.rideComfortContractorName = cloudAudit.rideComfortContractorName;
  }

  return {
    updatedAudit: merged,
    contractorUpdatedCount,
    fileId: targetFileId,
  };
}
