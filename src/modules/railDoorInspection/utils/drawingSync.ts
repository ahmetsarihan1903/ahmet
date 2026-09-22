/**
 * Kullanıcının önizleme üzerinde yüklediği veya tarayıcıda saklanan
 * teknik çizimleri sunucu dosyalarına (public/teknik-cizimler) kalıcı olarak yazar.
 */
export async function syncDrawingsToServer(drawings: Record<string, { dataUrl?: string; name?: string }>): Promise<boolean> {
  try {
    const payloadItems: Record<string, { dataUrl: string; name?: string }> = {};

    for (const [key, item] of Object.entries(drawings)) {
      if (item?.dataUrl && item.dataUrl.startsWith('data:')) {
        payloadItems[key] = {
          dataUrl: item.dataUrl,
          name: item.name,
        };
      }
    }

    if (Object.keys(payloadItems).length === 0) {
      return false;
    }

    const res = await fetch('/api/sync-drawings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ drawings: payloadItems }),
    });

    if (res.ok) {
      const data = await res.json();
      console.log('Teknik çizimler kalıcı dosya sistemine eşitlendi:', data.saved);
      return true;
    }
  } catch (err) {
    // Offline or APK mode: silently ignore network errors
    console.debug('Sunucu çizim senkronizasyonu atlandı (çevrimdışı/APK):', err);
  }
  return false;
}

/**
 * Tarayıcı yerel hafızasındaki çizimleri kontrol edip sunucuya kalıcı olarak aktarır.
 */
export function autoSyncLocalDrawings(): void {
  try {
    const syncPayload: Record<string, { dataUrl?: string; name?: string }> = {};

    // 1. asansor_rail_door_active_inspection içindeki çizimler
    const rawInspection = localStorage.getItem('asansor_rail_door_active_inspection');
    if (rawInspection) {
      const parsed = JSON.parse(rawInspection);
      if (parsed.chassisImages) {
        Object.entries(parsed.chassisImages).forEach(([k, v]: [string, any]) => {
          if (v?.imageUrl?.startsWith('data:')) {
            syncPayload[k] = { dataUrl: v.imageUrl, name: v.imageName };
          }
        });
      }
      if (parsed.layoutImages) {
        Object.entries(parsed.layoutImages).forEach(([k, v]: [string, any]) => {
          if (v?.imageUrl?.startsWith('data:')) {
            syncPayload[k] = { dataUrl: v.imageUrl, name: v.imageName };
          }
        });
      }
    }

    // 2. asansor_custom_chassis_images içindeki çizimler
    const rawChassis = localStorage.getItem('asansor_custom_chassis_images');
    if (rawChassis) {
      const parsed = JSON.parse(rawChassis);
      Object.entries(parsed).forEach(([k, url]: [string, any]) => {
        if (typeof url === 'string' && url.startsWith('data:') && !syncPayload[k]) {
          syncPayload[k] = { dataUrl: url, name: k };
        }
      });
    }

    if (Object.keys(syncPayload).length > 0) {
      syncDrawingsToServer(syncPayload);
    }
  } catch (e) {
    console.debug('Otomatik çizim eşitleme hatası:', e);
  }
}
