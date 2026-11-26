import { Capacitor } from '@capacitor/core';
import { AuditChangeLogEntry, AuditFormData } from '../types';

const WIN_SESSION_FLAG_KEY = 'beta_win_desktop_mode_v1';
const WIN_ACCOUNTS_STORAGE_KEY = 'beta_windows_user_accounts_v1';

export interface WindowsUserAccount {
  userId: string; // Örn: ID-482913
  name: string;
  normalizedName: string;
  passwordHash: string;
  createdAt: string;
}

export interface WindowsSessionUser {
  userId: string;
  name: string;
}

export interface WindowsPublicAccountInfo {
  userId: string;
  name: string;
  createdAt: string;
}

export function isWindowsDesktopApp(): boolean {
  if (typeof window === 'undefined') return false;

  // Android / iOS native APK asla Windows İzleme Modu'na girmez
  try {
    if (Capacitor.isNativePlatform()) {
      return false;
    }
  } catch {
    // ignore
  }

  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('winapp') === '1') {
      try {
        sessionStorage.setItem(WIN_SESSION_FLAG_KEY, '1');
      } catch {
        // ignore
      }
      return true;
    }
    if (sessionStorage.getItem(WIN_SESSION_FLAG_KEY) === '1') {
      return true;
    }
  } catch {
    // ignore
  }

  try {
    const ua = (navigator.userAgent || '').toLowerCase();
    if (ua.includes('electron')) {
      return true;
    }
  } catch {
    // ignore
  }

  return false;
}

export function normalizeTurkishName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLocaleLowerCase('tr-TR');
}

async function hashPassword(password: string): Promise<string> {
  const salted = `BETA_WIN_AUTH_2026::${password}`;
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const encoder = new TextEncoder();
      const buf = await crypto.subtle.digest('SHA-256', encoder.encode(salted));
      return Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }
  } catch {
    // fallback below
  }

  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  for (let i = 0; i < salted.length; i++) {
    const c = salted.charCodeAt(i);
    h1 ^= c;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= c + i;
    h2 = Math.imul(h2, 0x85ebca6b);
  }
  return `fb_${(h1 >>> 0).toString(16).padStart(8, '0')}${(h2 >>> 0).toString(16).padStart(8, '0')}`;
}

function loadStoredAccounts(): WindowsUserAccount[] {
  try {
    const raw = localStorage.getItem(WIN_ACCOUNTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveStoredAccounts(accounts: WindowsUserAccount[]): void {
  localStorage.setItem(WIN_ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
}

function generateUniqueUserId(existingAccounts: WindowsUserAccount[]): string {
  const existingIds = new Set(existingAccounts.map((a) => a.userId));
  for (let attempt = 0; attempt < 50; attempt++) {
    const num = Math.floor(100000 + Math.random() * 900000);
    const candidate = `ID-${num}`;
    if (!existingIds.has(candidate)) {
      return candidate;
    }
  }
  return `ID-${String(Date.now()).slice(-6)}`;
}

export function getWindowsAccountsPublicList(): WindowsPublicAccountInfo[] {
  return loadStoredAccounts().map((acc) => ({
    userId: acc.userId,
    name: acc.name,
    createdAt: acc.createdAt,
  }));
}

export async function registerWindowsUserAccount(
  name: string,
  password: string
): Promise<{
  ok: boolean;
  user?: WindowsSessionUser;
  error?: string;
}> {
  const cleanName = name.trim().replace(/\s+/g, ' ');
  const cleanPassword = password.trim();

  if (cleanName.length < 3) {
    return { ok: false, error: 'Lütfen en az 3 karakterden oluşan Ad Soyad giriniz.' };
  }
  if (cleanPassword.length < 4) {
    return { ok: false, error: 'Şifre en az 4 karakter olmalıdır.' };
  }

  const normalizedName = normalizeTurkishName(cleanName);
  const passwordHash = await hashPassword(cleanPassword);
  const existing = loadStoredAccounts();

  // Aynı isimle ikinci kullanıcı oluşturulabilir; ancak aynı isim + aynı şifre kombinasyonu çakışmasını engelle
  const exactConflict = existing.find(
    (acc) => acc.normalizedName === normalizedName && acc.passwordHash === passwordHash
  );
  if (exactConflict) {
    return {
      ok: false,
      error:
        'Bu isim ve şifreyle kayıtlı bir kullanıcı zaten mevcut. Aynı isimde farklı bir kişiyseniz farklı bir şifre belirleyiniz.',
    };
  }

  const userId = generateUniqueUserId(existing);
  const newAccount: WindowsUserAccount = {
    userId,
    name: cleanName,
    normalizedName,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  try {
    saveStoredAccounts([...existing, newAccount]);
    return {
      ok: true,
      user: {
        userId,
        name: cleanName,
      },
    };
  } catch {
    return { ok: false, error: 'Kullanıcı kaydı cihaz hafızasına kaydedilemedi.' };
  }
}

export async function authenticateWindowsUserAccount(
  name: string,
  password: string
): Promise<{
  ok: boolean;
  user?: WindowsSessionUser;
  error?: string;
}> {
  const cleanName = name.trim().replace(/\s+/g, ' ');
  const cleanPassword = password.trim();

  if (!cleanName || !cleanPassword) {
    return { ok: false, error: 'Lütfen Ad Soyad ve şifrenizi eksiksiz giriniz.' };
  }

  const accounts = loadStoredAccounts();
  if (accounts.length === 0) {
    return {
      ok: false,
      error: 'Henüz oluşturulmuş bir Windows kullanıcı şifresi yok. Önce "Şifre Oluştur" sekmesinden kayıt olunuz.',
    };
  }

  const normalizedName = normalizeTurkishName(cleanName);
  const passwordHash = await hashPassword(cleanPassword);

  const matched = accounts.find(
    (acc) => acc.normalizedName === normalizedName && acc.passwordHash === passwordHash
  );

  if (!matched) {
    return {
      ok: false,
      error: 'Ad Soyad veya şifre hatalı. Kaydınız yoksa "Şifre Oluştur" sekmesinden yeni şifre oluşturabilirsiniz.',
    };
  }

  return {
    ok: true,
    user: {
      userId: matched.userId,
      name: matched.name,
    },
  };
}

export function formatWindowsChangeTimestamp(date = new Date()): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${d}.${m}.${y} ${h}:${min}`;
}

export function appendWindowsChangeLog(
  audit: AuditFormData,
  user: WindowsSessionUser | null,
  actionSummary: string
): AuditFormData {
  if (!user) return audit;
  const timestamp = formatWindowsChangeTimestamp();
  const existingLogs = Array.isArray(audit.changeLogs) ? audit.changeLogs : [];
  const lastLog = existingLogs[existingLogs.length - 1];

  // Aynı kullanıcı aynı dakika içinde aynı tür düzenlemeyi sürdürüyorsa satır şişmesini önle
  if (
    lastLog &&
    lastLog.userId === user.userId &&
    lastLog.actionSummary === actionSummary &&
    lastLog.timestamp === timestamp
  ) {
    return audit;
  }

  const nextEntry: AuditChangeLogEntry = {
    id: `wlog_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    userId: user.userId,
    userName: user.name,
    timestamp,
    platform: 'WINDOWS',
    actionSummary,
  };

  return {
    ...audit,
    changeLogs: [...existingLogs, nextEntry],
  };
}
