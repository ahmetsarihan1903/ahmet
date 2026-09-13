import { ElevatorType } from '../../types';

export type CustomerElevatorType = ElevatorType;

export interface CustomerInspectionMetadata {
  projectName: string;
  serialNumber: string;
  elevatorType: CustomerElevatorType;
  auditorName: string;
  inspectionDate: string;
}

export interface CustomerInspectionItem {
  id: string;
  itemNumber: number;
  category: 'COMMON' | 'MR' | 'MRL' | 'CUSTOM';
  description: string;
  isDefective: boolean;
  notes?: string;
  isCustom?: boolean;
}

export interface CustomerInspectionRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  metadata: CustomerInspectionMetadata;
  items: CustomerInspectionItem[];
  status: 'completed' | 'draft';
}

export interface BaseChecklistItem {
  itemNumber: number;
  category: 'COMMON' | 'MR' | 'MRL';
  description: string;
}

export const MASTER_CUSTOMER_CHECKLIST: BaseChecklistItem[] = [
  // ORTAK MADDELER (MR & MRL)
  {
    itemNumber: 1,
    category: 'COMMON',
    description: 'Kuyu dibi temizlenmelidir. Su sorunu var ise kesin çözüm uygulanmalıdır.',
  },
  {
    itemNumber: 2,
    category: 'COMMON',
    description: 'Akustik projeye göre kuyu duvarlarına ses izolasyonu yapılmalıdır. Bu işlem asansör ray-kapı montajına başlamadan yapılmalıdır (Kartal Belediyesi\'ne bağlı şantiyeler için geçerlidir).',
  },
  {
    itemNumber: 3,
    category: 'COMMON',
    description: 'DENEME MADDESİ',
  },
  {
    itemNumber: 4,
    category: 'COMMON',
    description: 'Asansör kat kapısı önü sahanlık aydınlatmaları yapılmalıdır (Min. 50 lüks sağlamalıdır).',
  },
  {
    itemNumber: 4,
    category: 'COMMON',
    description: 'Asansör kat kapılarının altında, üstünde ve kenarlarında kuyuya açılan hiçbir boşluk olmamalıdır. Kenar sıvaları yapılmış ve son kaplama malzemesi (seramik, mermer vb.) tamamlanmalıdır. Buton delikleri için Beta Asansör\'den yazılı ölçü alınmalıdır.',
  },
  {
    itemNumber: 5,
    category: 'COMMON',
    description: 'Mimariye uygun şekilde otopark ve bina girişinden asansöre engelli ulaşımı sağlanmalıdır. Mimaride yazan uygulamalar yapılmalı; otoparktan asansöre ulaşım yollarındaki çıkıntılarda pah yapılmalıdır.',
  },
  {
    itemNumber: 6,
    category: 'COMMON',
    description: 'Yeşil etiket denetimi öncesinde asansöre, GSM haberleşme için SIM kart alınmalıdır.',
  },
  {
    itemNumber: 7,
    category: 'COMMON',
    description: 'Asansör kumanda panosuna yangın sinyal ucu getirilmelidir. Binanın yangın sistemi çalışır vaziyette olmalı ve kumanda panosuna kuru kontak en az 2\'li kablo getirilmelidir.',
  },
  {
    itemNumber: 8,
    category: 'COMMON',
    description: 'Beton bir yüzeye deprem sensörü takılmalıdır. Sensörden asansör kumanda panosuna 2\'li sinyal ucu çekilmelidir.',
  },
  {
    itemNumber: 9,
    category: 'COMMON',
    description: 'Kapı önü sahanlıklarda asansör kapısı kasası ile karşı duvar arası mesafe, bütün imalatlar bittikten sonra min. 120 cm olmalıdır.',
  },
  {
    itemNumber: 10,
    category: 'COMMON',
    description: 'Kuyu içerisinde kapı yüzeyi tarafında, bir kapının altından diğer kapının üstüne kadar olan mesafeler Boardex ile kapatılmalıdır (bodrum kat kapısı alt kısmı dahil). Bu işlem yapılmadan önce Beta Asansör\'e haber verilmeli ve Beta Asansör personeli eşliğinde yapılmalıdır.',
  },
  {
    itemNumber: 11,
    category: 'COMMON',
    description: 'Mimari proje ve onaylı asansör projesi yeşil etiket kontrolünde şantiyede hazır bulundurulmalıdır.',
  },
  {
    itemNumber: 12,
    category: 'COMMON',
    description: 'Kapı kenar boşlukları tuğla duvar yapılacak ise, kuyu içerisinden de sıva yapılmalıdır (Ytong yapılır ise sıva zorunluluğu yoktur).',
  },
  {
    itemNumber: 13,
    category: 'COMMON',
    description: 'Asansör kalıcı trifaze enerji hattı çekilmelidir (5*6 mm²). Kanal içinden asansör kumanda panosuna kadar getirilip 3 mt paylı olacak şekilde bırakılmalıdır.',
  },

  // MRL (MAKİNE DAİRESİZ) ÖZEL MADDELER
  {
    itemNumber: 14,
    category: 'MRL',
    description: 'İşin başında belirlenen projelerde, çatı katı kuyu önü duvarına iç ölçüleri min. 90*210 cm müdahale kapısı yapılmalıdır. Makine dairesi kapı özelliğinde olmalı; dışarı doğru açılan, menfezi olmayan, kilitleme mekanizması iptal edilmiş tirajlı model kilit takılmalıdır.',
  },
  {
    itemNumber: 15,
    category: 'MRL',
    description: 'Pano bölgesine ulaşım yolu ve merdiven geçiş güzergahına aydınlatma yapılmalıdır (Min. 100 lüks aydınlatma sağlamalıdır).',
  },
  {
    itemNumber: 16,
    category: 'MRL',
    description: 'Pano bölgesi sahanlık ekstra aydınlatması yapılmalıdır (Minimum 200 lüks olmalıdır).',
  },

  // MR (MAKİNE DAİRELİ) ÖZEL MADDELER
  {
    itemNumber: 17,
    category: 'MR',
    description: 'Makine dairesi beton tabya altı boşluk kapatılmalıdır. Tuğla veya beyaz alçıpan yapılır ise kuyu içerisinden de sıvanmalıdır (Montaj tamamlandıktan sonra; o boşluktan makine çekilecektir).',
  },
  {
    itemNumber: 18,
    category: 'MR',
    description: 'Makine dairesi aydınlatması yapılmalıdır (Çalışma alanlarında min. 200 lüks sağlamalıdır). Enerjisini asansör kumanda panosundaki LMDA-NMDA klemenslerinden almalı, aydınlatma anahtarı takılmalıdır.',
  },
  {
    itemNumber: 19,
    category: 'MR',
    description: 'Makine dairesi çıkış alanı (200 cm) ve çalışma alanı (210 cm) düşük yapılarda; makine tabya betonunun tavanı ve kenarlarındaki kirişler komple yanmaz yumuşak malzeme ile kaplanıp, sarı-siyah ikaz bandı yapıştırılmalıdır. 1 adet baret asılmalı, akabinde akredite kuruluştan risk analizi belgelendirmesi yapılmalıdır.',
  },
  {
    itemNumber: 20,
    category: 'MR',
    description: 'Makine dairesi çıkış merdiveni ve el tutamağı yapılmalıdır. Merdiven ile duvar arası mesafe min. 15 cm, basamak araları max. 25 cm, basamak net genişliği min. 60 cm olmalıdır.',
  },
  {
    itemNumber: 21,
    category: 'MR',
    description: 'Makine dairesi duvarları sıvalı ve boyalı olmalıdır.',
  },
  {
    itemNumber: 22,
    category: 'MR',
    description: 'Makine dairesine giriş kapısı önü aydınlatması yapılmalıdır (Minimum 100 lüks olmalıdır).',
  },
  {
    itemNumber: 23,
    category: 'MR',
    description: 'Makine dairesi tabya betonu üzeri kenarlarına 110 cm yüksekliğinde mukavemetli metal ve boyalı korkuluk yapılmalıdır. Merdiven çıkış alanı 70-100 cm arasında çıkış boşluğu bırakılmalıdır.',
  },
  {
    itemNumber: 24,
    category: 'MR',
    description: 'Makine dairesi içerisinden başka bir mahale kesinlikle geçiş olmamalıdır (çatı arası vb.).',
  },
  {
    itemNumber: 25,
    category: 'MR',
    description: 'Makine dairesi içerisinde asansöre ait olmayan hiçbir teçhizat olmamalıdır. Var ise kapalı şekilde koruma altına alınmalıdır (anten santrali, gider borusu vb.).',
  },
];

import { loadCustomerSyncedItemsFromStorage } from '../../services/customerDataSyncService';

export function generateInitialCustomerItems(elevatorType: CustomerElevatorType): CustomerInspectionItem[] {
  const baseFiltered = MASTER_CUSTOMER_CHECKLIST.filter(
    (item) => item.category === 'COMMON' || item.category === elevatorType
  );

  const baseItems: CustomerInspectionItem[] = baseFiltered.map((item, index) => ({
    id: `item-${item.category}-${item.itemNumber}-${index}`,
    itemNumber: index + 1,
    category: item.category,
    description: item.description,
    isDefective: false,
    notes: '',
    isCustom: false,
  }));

  try {
    const customSynced = loadCustomerSyncedItemsFromStorage();
    if (customSynced) {
      const commonExtra = (customSynced.common || []).filter(
        (ci: any) => !baseFiltered.some((bf) => bf.category === 'COMMON' && bf.description.trim().toLowerCase() === ci.description.trim().toLowerCase())
      );
      const specificExtra = (elevatorType === 'MRL' ? (customSynced.mrl || []) : (customSynced.mr || [])).filter(
        (ci: any) => !baseFiltered.some((bf) => bf.category === elevatorType && bf.description.trim().toLowerCase() === ci.description.trim().toLowerCase())
      );

      const extraItems = [...commonExtra, ...specificExtra].map((item: any, idx: number) => ({
        id: `extra-item-${idx + 1}-${Date.now()}`,
        itemNumber: baseItems.length + idx + 1,
        category: (idx < commonExtra.length ? 'COMMON' : elevatorType) as 'COMMON' | 'MR' | 'MRL',
        description: item.description,
        isDefective: false,
        notes: '',
        isCustom: true,
      }));

      return [...baseItems, ...extraItems];
    }
  } catch (e) {
    // ignore
  }

  return baseItems;
}
