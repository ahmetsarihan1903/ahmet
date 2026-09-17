import { InspectionItem, ElevatorType, MeasureItem } from '../types';

export const CONTROL_PANEL_ITEMS: InspectionItem[] = [
  'Kumanda panosu montajı (terazisi, deformasyon, kapı açılması ve kapanması)',
  'Harici takılan ekipmanların montajı (GSM, telefon vb.)',
  'Pano içi kablolamanın düzenli, karmaşadan uzak ve profesyonel işçilik standartlarına uygun yapılması',
  'Set – Reset bobini çalışma kontrolü',
  'Baypas sisteminin kontrol ve testleri',
  'GSM modülü montajı ve filtreleme montajının kontrolü',
  'Pano aydınlatma kontrolü ve geri alma kumandası kontrolleri',
  'Kumanda panosu iç temizliği',
].map((title, idx) => ({
  id: `cp_${idx + 1}`,
  title,
  isNonCompliant: false,
  description: '',
  category: 'Kumanda Panosu',
}));

export const MOTOR_MR_ITEMS: InspectionItem[] = [
  'Makine şasesi montajı, civata, rondela ve kare pul kontrolü (kare pul yön doğruluğu dahil)',
  'Kasnak seperatörleri kontrolü (ana kasnak ve saptırma kasnakları)',
  'Halat atma pim mesafelerinin kontrolü',
  'Makine terazisi kontrolü',
  'Makine fren ayarlarının kontrolü, sesli çalışan frenlerin ayarlanması, yağ ve gres vb. kontrolleri',
  'Makine tesisatının kontrolü (kablo kanalı, spiral hortum vb.)',
  'Hız regülatörü tesisatının kontrolleri (kanal içi veya spiral içerisinde olması vb.)',
  'Hız regülatörü yön kontrolü',
  'Halat akışı kontrolü',
  'Halat delik akışı ve korumalarının kontrolü (sürtme vb.)',
  'Temizlik ve boyama (kaynak yerleri vb.)',
  'Makine askı konsolunun kontrolü',
  'Makine enkoderinin ana tesisattan harici olarak çekilmesi',
  '1/2 askı halat şişeleri, klemens, kontra somun ve kopilya vb. kontrolü',
].map((title, idx) => ({
  id: `mr_${idx + 1}`,
  title,
  isNonCompliant: false,
  description: '',
  category: 'Motor / Şase (MR)',
}));

export const MOTOR_MRL_ITEMS: InspectionItem[] = [
  'Makine şasesi terazisinin kontrolü',
  'Makine şasesi civata kontrolü (gevşeklik, rondela vb.)',
  'Makine şasesi sallantı kontrolü, makine üstü konsol sabitleme vb.',
  'Makine şasesi ve ray üzerindeki delinmesi gereken deliklerin eksiksiz ve uygun civata çapında delinmesi',
  'Makine motor tesisatının kontrolü (tertip, düzen, kanal içerisinde olması vb.)',
  'Makine enkoderinin ana tesisattan harici olarak çekilmesi',
  'Makine kasnak seperatörü ve halat atma pim mesafelerinin montajının kontrolü',
  'Ağırlık veya kabin en üstte veya en altta iken kabine, şaseye veya koruma saclarına sürtme ve ses kontrolü',
  'Regülatör halatının kabin askı aparatına kontrolü (halat delik önüne gelmesi, süspansiyona veya kabine çarpması)',
  'Ana halat akışlarının kontrolü',
  'Makine askı konsolu kontrolü',
  'Halat şişeleri, klemens, kontra somun ve kopilya vb. kontrolü',
  'Temizlik ve kaynak yerlerinin boyanması',
  'Hız regülatörü yön ve terazisi kontrolü',
].map((title, idx) => ({
  id: `mrl_${idx + 1}`,
  title,
  isNonCompliant: false,
  description: '',
  category: 'Motor / Şase (MRL)',
}));

export function getMotorChassisItems(type: ElevatorType): InspectionItem[] {
  return type === 'MR' ? MOTOR_MR_ITEMS : MOTOR_MRL_ITEMS;
}

export const CABIN_TOP_ITEMS: InspectionItem[] = [
  { title: 'Kabin üstü temizlik kontrolü' },
  { title: 'Kabin çaprazları kontrolü (halata sürtme, kabine temas vb.)' },
  { title: 'T palanga kontrolleri (eksik vida, halat atma mesafeleri, sallantı, halata sürtme, koruma sacları vb.)' },
  { title: 'Kabin üstü korkuluğunun standarda uygun montajının yapılması (sağlamlık, ölçüleri, uygun civatalarla montajı vb.)' },
  { title: 'Revizyon kutusu montajı kontrolleri (montaj sağlamlığı, uygun yere montajı vb.)' },
  { title: 'Kabin üstü tesisatın spiralli veya kanal içerisinde olması, özellikle kabin tavanı üzerindeki tesisatın üzerine basılmayacak şekilde düzenlenmesi' },
  { title: 'Kanal dışındaki tesisatın spiral boru içerisinde olması' },
  { title: 'Kabin üstü ekipmanlarının doğru yerlerinde montajının yapılması (aşırı yük, fotosel, sesli anons/geveze revizyon kutusu içerisinde olması vb.)' },
  { title: 'Lift Sense montajının imalatçının belirlediği ekipmanlarla ve doğru konumda montajının yapılması' },
  { title: 'Limit kesici şalterin doğru montajı (kuyu bölmelerine, seperatör tellerine veya başka bir şeye seyirde temas etmeyecek şekilde ayarlanarak montajının yapılması)' },
  { title: 'Kabin sabitleme lastik takozlarının mesafeleri, boşluklarının olmaması ve imalatçının öngördüğü civata adetlerince montajının yapılması' },
  { title: 'Alttan palangalı asansörlerde halat mesafeleri, siperlik montajları, koruma sacı doğru montajı ve eksik civata kontrolü' },
  { title: 'Paten blokları ve yağdanlıkların uygun şekilde montajının yapılması (trapez atılması veya 4 civata ile montajının yapılması)' },
  { title: 'Aşırı yük ayarları, sesli anons (geveze) ses şiddeti ayarları, hoparlörün kabin tavanı içerisine montajı, kabin üstü GSM montajı ve çalıştırılması' },
  { title: 'Kabin üstü katlanır korkuluk ve benzeri bağlantılarının eksiksiz yapılması' },
  {
    title: 'Boy fotosel montajının doğru yapılması ve tüm civatalarının sıkılması',
    isRequiredDescription: true,
  },
].map((item, idx) => ({
  id: `ct_${idx + 1}`,
  title: item.title,
  isNonCompliant: false,
  description: '',
  category: 'Kabin Üstü Kontrolleri',
  isRequiredDescription: item.isRequiredDescription || false,
}));

export const COUNTERWEIGHT_ITEMS: InspectionItem[] = [
  'Tampon çarpma plakasının tam açık şekilde montajının yapılması (halatların açık olacak şekilde atılması)',
  'Koruma sacları ve halat atma mesafeleri kontrolü',
  'Şase civataları kontrolü (gevşek civata, eksik civata vb.)',
  'Barit ağırlıkların karkas içerisinde ses yapmaması için gerekli önlemlerin alınması',
  'Yağdanlık kontrolü',
  'Paten blokları ray arası mesafelerinin ayarlanması, şim ile beslenmesi vb.',
  'Barit zıplatma aparatları ve karkas barit boşluk lamalarının montajı',
].map((title, idx) => ({
  id: `cw_${idx + 1}`,
  title,
  isNonCompliant: false,
  description: '',
  category: 'Ağırlık Karkası Kontrolleri',
}));

export const SHAFT_AND_PIT_ITEMS: InspectionItem[] = [
  { title: 'Uygun noktadan fleksibil kablonun yaşam alanı vb. denk gelmeyecek şekilde atılması ve fleksibil takozlarının en az 3 adet olacak şekilde montajının yapılması' },
  { title: 'Kabin altı fleksibil takozunun aparat ile montajının yapılması' },
  {
    title: 'Varsa denge zinciri montajının doğru yapılması, olağan akışında ses yapmayacak şekilde ayarlanması (açıklama zorunlu)',
    isRequiredDescription: true,
  },
  { title: 'Kuyu aydınlatmalarının konumlarının doğru ayarlanması, mekanizma üstlerine montajının yapılmaması, klemens vb. kullanılması' },
  { title: 'Kuyu tesisat kanallarının konumlarının doğru ayarlanması, mekanizmaya veya kat kapı panellerine çarpmayacak şekilde ayarlanması' },
  { title: 'Ağırlık seperatörünün yerden yüksekliği, tampon lastiğini tam kapatması, sağlamlığı, esnemesi vb.' },
  { title: 'Kabin ve karşı ağırlık tamponlarının sağlam montajı, ray merkezlerinde montajının yapılması ve terazisi' },
  { title: 'Kuyu ayırıcı seperatörün esnemeyecek şekilde standarda uygun montajının yapılması' },
  { title: 'Hidrolik tampon tesisatının kanal içerisinde ve eksiz olarak montajının yapılması' },
  { title: 'Kuyu dibi tesisatının kablo kanalı ile veya spiral hortum içerisinde montajının yapılması, hiçbir kablonun spiralsiz ve kanal dışında montajının yapılmaması' },
  { title: 'Kuyu dibi setinin ve revizyon terminalinin uygun mesafelerde montajının yapılması' },
  { title: 'Kuyu dibi prizinin kullanılabilir şekilde montajının yapılması, gerekiyorsa harici sıva üstü priz takılması' },
  { title: 'Kuyu merdiveninin uygun montajının kontrolü, çarpma riski, sağlamlığı vb.' },
  { title: 'Alt regülatör mafsal kolunun yere paralel ve uygun gerginlikte montajının yapılması, trapez vida ile sabitlenmesi, halat klemenslerinin doğru bağlanması' },
  { title: 'Kuyu dibi ekipmanlarının standarda uygun şekilde ve ölçülerinde montajlarının yapılması' },
  { title: 'Alt paten blokları düzlükleri ve civatalarının üst patenlerdeki gibi uygun montajının yapılması' },
  { title: 'Paraşüt fren mesafelerinin iki tarafa da çalışacak şekilde merkezlenerek süspansiyon kurulumunun yapılması' },
  { title: 'Kuyu dibi genel temizliği' },
].map((item, idx) => ({
  id: `sp_${idx + 1}`,
  title: item.title,
  isNonCompliant: false,
  description: '',
  category: 'Kuyu İçerisi ve Kuyu Dibi',
  isRequiredDescription: item.isRequiredDescription || false,
}));

export const CABIN_AND_BUTTONS_ITEMS: InspectionItem[] = [
  'Temizlik (kabin tavanı pleksisi vb.)',
  'Kabin kasedi montajı (kenar boşlukları, esneme vb.)',
  'Kabin bazaları ile kat kapı kasaları arasındaki düzlüklerin ve mesafelerin kontrolü',
  'Kat ve kabin kapı alüminyum kızak mesafelerinin kontrolü (maksimum 3.5 cm)',
  'Kabin kat seviye ayarlarının yapılması (±5 mm olacak şekilde)',
  'Fotosel zeminden başlama mesafelerinin kontrolü',
  'Kabin kapısı panelleri, kabin butonu kenarları ve ulaşılması zor olan yerlerdeki koruyucu bantların soyulması',
  'Kabinde kasıntı ve trim seslerinin kontrolü',
  'Kabin duvarları, bazalar, kabin tavanı ve kabin altı civatalarının sıkılması, düzgün montajlarının yapılması, süpürgelik ve mermer boşlukları hizaları vb.',
  'Kat kasetleri mermer üzerine yapıştırma yapılacaksa mermer ile kaset arasında boşluk kalmayacak şekilde ve terazisinde montajlarının yapılması',
  'Dubleks kaset tesisatının yönlerine ve buton yönlerine uygun şekilde montajlarının yapılması',
  'Kat kasetleri duvar, alçıpan veya ahşap üzerine monte edilecekse yapıştırma yapılmadan uygun ekipmanla montajlarının yapılması',
].map((title, idx) => ({
  id: `cb_${idx + 1}`,
  title,
  isNonCompliant: false,
  description: '',
  category: 'Kabin İçi ve Kat Butonları',
}));

export const DEFAULT_FIXED_MEASURES: MeasureItem[] = [
  {
    id: 'fixed_bakim_gunu',
    name: 'BAKIM GÜNÜ TARİHİ',
    value: '',
    notes: '',
    isFixed: true,
  },
  {
    id: 'fixed_ust_limit',
    name: 'ÜST LİMİT KESİCİ MESAFESİ',
    value: '',
    notes: '',
    isFixed: true,
  },
  {
    id: 'fixed_alt_limit',
    name: 'ALT LİMİT KESİCİ MESAFESİ',
    value: '',
    notes: '',
    isFixed: true,
  },
  {
    id: 'fixed_kabin_tampon',
    name: 'KABİN TAMPON MESAFESİ',
    value: '',
    notes: '',
    isFixed: true,
  },
  {
    id: 'fixed_agirlik_tampon',
    name: 'AĞIRLIK TAMPON MESAFESİ',
    value: '',
    notes: '',
    isFixed: true,
  },
];

