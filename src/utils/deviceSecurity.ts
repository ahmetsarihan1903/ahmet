/**
 * Cihaz Güvenliği & Donanım Kimliği Motoru (Device Security & Hardware Identification)
 * 
 * Bu modül iki katmanlı güvenlik sağlar:
 * 1. Cihaz Donanım Kimliği (Hardware ID): Cihazın ekran çözünürlüğü, GPU unmasked renderer,
 *    CPU çekirdek sayısı ve donanım mimarisinden üretilen kalıcı parmak izidir.
 *    Kullanıcı uygulamayı silip yeniden kursa bile bu donanım kimliği AYNI KALIR.
 * 
 * 2. Kurulum Kimliği (Installation ID): Uygulamanın her sıfırdan kurulumunda üretilen
 *    benzersiz kimliktir. Uygulama silinip yeniden kurulursa bu numara DEĞİŞİR.
 * 
 * Bu sayede denetçi adını değiştirse bile:
 * "Aynı fiziksel cihaz (Hardware ID) ama farklı kurulum (Installation ID)!" tespiti yapılabilir.
 */

const INSTALLATION_STORAGE_KEY = 'beta_asansor_installation_id';
const INSTALLATION_DATE_KEY = 'beta_asansor_installed_at';

// Basit 32-bit FNV-1a / DJB2 hibrit hash fonksiyonu
function hashString(str: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const val = 4294967296 * (2097151 & h2) + (h1 >>> 0);
  return Math.abs(val).toString(16).toUpperCase().padStart(8, '0');
}

/**
 * WebGL GPU Üretici ve Model bilgisini çeker (Unmasked GPU Renderer)
 */
function getGpuFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return 'GL_DEFAULT';
    const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return 'GL_GENERIC';
    const renderer = (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
    const vendor = (gl as any).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '';
    return `${vendor}~${renderer}`;
  } catch {
    return 'GL_UNAVAILABLE';
  }
}

/**
 * Cihazın kalıcı Donanım Parmak İzini (Hardware ID) üretir.
 * Uygulama silinip yeniden kurulsa dahi aynı donanımda aynı sonucu verir.
 */
export function getDeviceHardwareId(): string {
  try {
    const screenInfo = `${window.screen?.width || 0}x${window.screen?.height || 0}x${window.screen?.colorDepth || 0}`;
    const cpuCores = navigator.hardwareConcurrency || 4;
    const gpu = getGpuFingerprint();
    const platform = navigator.platform || 'WEB';
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'TR';

    const rawSignature = `BETA_HW_${screenInfo}_${cpuCores}_${gpu}_${platform}_${tz}`;
    const hash = hashString(rawSignature);

    // Format: DEV-XXXX-YYYY (Örn: DEV-8F42-99B1)
    const part1 = hash.slice(0, 4);
    const part2 = hash.slice(4, 8);
    return `DEV-${part1}-${part2}`;
  } catch {
    return 'DEV-GENERIC-01';
  }
}

/**
 * Kurulum Kimliği (Installation Instance ID)
 * Her sıfır kuruluma özel tekil bir kimlik üretir.
 * Uygulama silinip tekrar kurulursa bu ID değişir.
 */
export function getInstallationId(): string {
  try {
    let instId = localStorage.getItem(INSTALLATION_STORAGE_KEY);
    if (!instId) {
      // 4 karakterli benzersiz kod (Örn: INS-7E4A)
      const randomHex = Math.floor(0x1000 + Math.random() * 0xefff).toString(16).toUpperCase();
      instId = `INS-${randomHex}`;
      localStorage.setItem(INSTALLATION_STORAGE_KEY, instId);
      localStorage.setItem(INSTALLATION_DATE_KEY, new Date().toISOString());
    }
    return instId;
  } catch {
    return 'INS-INIT';
  }
}

export function getInstallationDateFormatted(): string {
  try {
    const raw = localStorage.getItem(INSTALLATION_DATE_KEY);
    if (!raw) return '-';
    const d = new Date(raw);
    const day = String(d.getDate()).padStart(2, '0');
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const y = d.getFullYear();
    return `${day}.${m}.${y}`;
  } catch {
    return '-';
  }
}

export interface DeviceSecurityProfile {
  hardwareId: string;           // Örn: DEV-8F42-99B1
  installationId: string;       // Örn: INS-7E4A
  securityStamp: string;        // Örn: DEV-8F42-99B1 (#INS-7E4A)
  hardwareDetails: string;      // Ekran & CPU bilgisi (Örn: "8 Çekirdek • 1080x2400")
}

export function getDeviceSecurityProfile(): DeviceSecurityProfile {
  const hardwareId = getDeviceHardwareId();
  const installationId = getInstallationId();
  const cores = navigator.hardwareConcurrency || 4;
  const w = window.screen?.width || 0;
  const h = window.screen?.height || 0;

  return {
    hardwareId,
    installationId,
    securityStamp: `${hardwareId} (#${installationId})`,
    hardwareDetails: `${cores} Çekirdek CPU • ${w}x${h} Ekran`,
  };
}
