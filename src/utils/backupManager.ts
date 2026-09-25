import { CURRENT_APP_VERSION } from '../constants/version';
import { getDeviceSecurityProfile } from './deviceSecurity';

export interface BetaBackupPackage {
  meta: {
    app: string;
    version: string;
    updateCount: number;
    exportDate: string;
    deviceHardwareId: string;
    deviceInstallationId: string;
    totalKeys: number;
  };
  payload: Record<string, string>;
}

/**
 * Exports all application data stored in localStorage into a clean JSON structure
 */
export function createAllDataBackup(): BetaBackupPackage {
  const payload: Record<string, string> = {};
  const devSec = getDeviceSecurityProfile();

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const val = localStorage.getItem(key);
      if (val !== null) {
        payload[key] = val;
      }
    }
  }

  return {
    meta: {
      app: 'Beta Asansor Saha Portali',
      version: CURRENT_APP_VERSION.version,
      updateCount: CURRENT_APP_VERSION.updateCount,
      exportDate: new Date().toISOString(),
      deviceHardwareId: devSec.hardwareId,
      deviceInstallationId: devSec.installationId,
      totalKeys: Object.keys(payload).length,
    },
    payload,
  };
}

/**
 * Downloads the backup file to device (.json)
 */
export function downloadBackupFile(): { success: boolean; filename: string; count: number } {
  try {
    const backup = createAllDataBackup();
    const jsonStr = JSON.stringify(backup, null, 2);
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
      now.getDate()
    ).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(
      now.getMinutes()
    ).padStart(2, '0')}`;
    const filename = `Beta_Asansor_Saha_Yedek_${dateStr}.json`;

    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return { success: true, filename, count: backup.meta.totalKeys };
  } catch (err: any) {
    console.error('Backup download error:', err);
    throw new Error('Yedek dosyası oluşturulurken hata meydana geldi: ' + (err?.message || ''));
  }
}

/**
 * Restores data from a parsed JSON backup object into localStorage
 */
export function restoreDataFromBackup(backup: BetaBackupPackage): {
  success: boolean;
  message: string;
  restoredCount: number;
} {
  if (
    !backup ||
    typeof backup !== 'object' ||
    !backup.payload ||
    typeof backup.payload !== 'object'
  ) {
    throw new Error('Geçersiz veya bozuk yedek dosyası formatı.');
  }

  let count = 0;
  const entries = Object.entries(backup.payload);

  for (const [key, val] of entries) {
    if (typeof key === 'string' && typeof val === 'string') {
      localStorage.setItem(key, val);
      count++;
    }
  }

  return {
    success: true,
    message: `Başarıyla ${count} adet veri, form taslağı ve ayar geri yüklendi.`,
    restoredCount: count,
  };
}
