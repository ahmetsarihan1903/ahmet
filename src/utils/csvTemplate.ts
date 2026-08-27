import {
  CONTROL_PANEL_ITEMS,
  MOTOR_MR_ITEMS,
  CABIN_TOP_ITEMS,
  COUNTERWEIGHT_ITEMS,
  SHAFT_AND_PIT_ITEMS,
  CABIN_AND_BUTTONS_ITEMS,
} from '../data/initialChecklists';
import { InspectionItem } from '../types';

export function generateTemplateCSV(): string {
  const rows: string[] = [
    'Kategori,Madde Tanimi,Zorunlu Aciklama (Evet/Hayir)',
  ];

  const addCategoryItems = (catName: string, items: InspectionItem[]) => {
    items.forEach((item) => {
      const escapedTitle = `"${item.title.replace(/"/g, '""')}"`;
      const req = item.isRequiredDescription ? 'Evet' : 'Hayır';
      rows.push(`${catName},${escapedTitle},${req}`);
    });
  };

  addCategoryItems('KUMANDA_PANOSU', CONTROL_PANEL_ITEMS);
  addCategoryItems('MOTOR_SASE', MOTOR_MR_ITEMS);
  addCategoryItems('KABIN_USTU', CABIN_TOP_ITEMS);
  addCategoryItems('KARSI_AGIRLIK', COUNTERWEIGHT_ITEMS);
  addCategoryItems('KUYU_DIBI', SHAFT_AND_PIT_ITEMS);
  addCategoryItems('KABIN_VE_BUTONLAR', CABIN_AND_BUTTONS_ITEMS);

  return '\uFEFF' + rows.join('\r\n');
}

export function downloadTemplateCSV(): void {
  const csvContent = generateTemplateCSV();
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'Beta_Kalite_Kontrol_Maddeleri_Sablon.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
