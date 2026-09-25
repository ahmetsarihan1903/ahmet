export interface ReportImageData {
  imageName?: string;
  imageUrl?: string; // Base64 data URL
}

const STORAGE_KEY_LAYOUT_IMG = 'beta_rail_door_persistent_report_layout_img';
const STORAGE_KEY_CHASSIS_IMG = 'beta_rail_door_persistent_report_chassis_img';

/**
 * Resizes and compresses an uploaded image file to ensure high quality while keeping file size optimal
 */
export function compressImageFile(
  file: File,
  maxWidth = 1200,
  maxHeight = 900,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        // Fill white background for transparent PNGs before converting to JPEG if needed
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Görsel dosyası işlenemedi.'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Dosya okunamadı.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Loads persistent report drawings saved from previous projects
 */
export function loadPersistentReportImages(): {
  layoutImage: ReportImageData | null;
  chassisImage: ReportImageData | null;
} {
  let layoutImage: ReportImageData | null = null;
  let chassisImage: ReportImageData | null = null;

  try {
    const rawLayout = localStorage.getItem(STORAGE_KEY_LAYOUT_IMG);
    if (rawLayout) {
      layoutImage = JSON.parse(rawLayout);
    }
  } catch (e) {
    console.error('Error loading persistent layout image', e);
  }

  try {
    const rawChassis = localStorage.getItem(STORAGE_KEY_CHASSIS_IMG);
    if (rawChassis) {
      chassisImage = JSON.parse(rawChassis);
    }
  } catch (e) {
    console.error('Error loading persistent chassis image', e);
  }

  return { layoutImage, chassisImage };
}

/**
 * Saves or clears persistent report drawing for future projects
 */
export function savePersistentReportImage(
  type: 'layout' | 'chassis',
  imgData: ReportImageData | null
): void {
  const key = type === 'layout' ? STORAGE_KEY_LAYOUT_IMG : STORAGE_KEY_CHASSIS_IMG;
  try {
    if (imgData && imgData.imageUrl) {
      localStorage.setItem(key, JSON.stringify(imgData));
    } else {
      localStorage.removeItem(key);
    }
  } catch (e) {
    console.error(`Error saving persistent ${type} image`, e);
  }
}
