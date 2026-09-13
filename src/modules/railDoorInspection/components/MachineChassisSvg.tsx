import React from 'react';

interface MachineChassisSvgProps {
  activeCode?: string;
  onSelectCode?: (code: string) => void;
}

export const MachineChassisSvg: React.FC<MachineChassisSvgProps> = ({
  activeCode,
  onSelectCode,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-sm flex flex-col items-center">
      <div className="w-full flex items-center justify-between mb-2">
        <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          Makine Şase ve Askı Şeması
        </span>
        <span className="text-[10px] text-slate-400 font-mono">STANDART KONTROL</span>
      </div>

      <div className="w-full aspect-square max-w-[420px] bg-slate-950 rounded-xl border border-slate-800 p-2 flex items-center justify-center relative overflow-hidden">
        <svg
          viewBox="0 0 500 500"
          className="w-full h-full select-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background Grid Lines */}
          <defs>
            <pattern id="chassisGrid" width="25" height="25" patternUnits="userSpaceOnUse">
              <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#1e293b" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="500" height="500" fill="url(#chassisGrid)" />

          {/* Kuyu Tavanı / Kaide Çizgisi */}
          <rect x="40" y="40" width="420" height="420" fill="#0f172a" stroke="#334155" strokeWidth="3" strokeDasharray="6 4" rx="10" />
          <text x="55" y="65" fill="#64748b" fontSize="11" fontWeight="bold" fontFamily="monospace">KUYU TAVANI / BETONARME KAİDE</text>

          {/* Çelik Şase Ana Profilleri */}
          {/* Sol Kiriş */}
          <rect x="90" y="100" width="45" height="300" fill="#1e293b" stroke="#475569" strokeWidth="2" rx="4" />
          {/* Sağ Kiriş */}
          <rect x="365" y="100" width="45" height="300" fill="#1e293b" stroke="#475569" strokeWidth="2" rx="4" />
          {/* Üst Bağlantı Kirişi */}
          <rect x="90" y="140" width="320" height="50" fill="#334155" stroke="#64748b" strokeWidth="2" rx="4" />
          {/* Alt Bağlantı Kirişi */}
          <rect x="90" y="310" width="320" height="50" fill="#334155" stroke="#64748b" strokeWidth="2" rx="4" />

          {/* İzolasyon / Titreşim Takozları (4 Köşe) */}
          <rect x="92" y="95" width="41" height="15" fill="#f59e0b" stroke="#d97706" strokeWidth="1.5" rx="2" />
          <rect x="367" y="95" width="41" height="15" fill="#f59e0b" stroke="#d97706" strokeWidth="1.5" rx="2" />
          <rect x="92" y="390" width="41" height="15" fill="#f59e0b" stroke="#d97706" strokeWidth="1.5" rx="2" />
          <rect x="367" y="390" width="41" height="15" fill="#f59e0b" stroke="#d97706" strokeWidth="1.5" rx="2" />

          {/* Makine / Motor Gövdesi */}
          <circle cx="250" cy="250" r="85" fill="#091e3a" stroke="#38bdf8" strokeWidth="3" />
          <circle cx="250" cy="250" r="50" fill="#0284c7" stroke="#bae6fd" strokeWidth="2" />
          <circle cx="250" cy="250" r="15" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />

          {/* Tahrik Kasnağı Kanalları */}
          <circle cx="250" cy="250" r="70" fill="none" stroke="#60a5fa" strokeWidth="1.5" strokeDasharray="4 2" />

          {/* Halat Düşüş Hatları */}
          {/* Kabin Tarafı Askı Halatı */}
          <line x1="180" y1="250" x2="180" y2="460" stroke="#f43f5e" strokeWidth="3" strokeDasharray="5 3" />
          <circle cx="180" cy="460" r="6" fill="#f43f5e" />
          <text x="145" y="480" fill="#f43f5e" fontSize="11" fontWeight="bold">KABİN ASKI AKS</text>

          {/* Ağırlık Tarafı Askı Halatı */}
          <line x1="320" y1="250" x2="320" y2="460" stroke="#10b981" strokeWidth="3" strokeDasharray="5 3" />
          <circle cx="320" cy="460" r="6" fill="#10b981" />
          <text x="290" y="480" fill="#10b981" fontSize="11" fontWeight="bold">AĞIRLIK ASKI AKS</text>

          {/* Merkez Aks Çizgileri */}
          <line x1="250" y1="50" x2="250" y2="450" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="8 4" opacity="0.6" />
          <line x1="50" y1="250" x2="450" y2="250" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="8 4" opacity="0.6" />

          {/* Hız Regülatörü */}
          <circle cx="380" cy="165" r="22" fill="#475569" stroke="#fbbf24" strokeWidth="2" />
          <circle cx="380" cy="165" r="6" fill="#fbbf24" />
          <text x="350" y="135" fill="#fbbf24" fontSize="10" fontWeight="bold">HIZ REGÜLATÖRÜ</text>

          {/* ÖLÇÜ ETİKETLERİ & BUTONLARI (M1..M9) */}

          {/* M1: Makine Ray Eksen Kaçıklığı */}
          <g
            className="cursor-pointer group"
            onClick={() => onSelectCode && onSelectCode('M1')}
          >
            <rect x="235" y="80" width="30" height="24" rx="6" fill={activeCode === 'M1' ? '#f59e0b' : '#1e293b'} stroke={activeCode === 'M1' ? '#fff' : '#f59e0b'} strokeWidth="2" />
            <text x="250" y="96" fill={activeCode === 'M1' ? '#000' : '#f59e0b'} fontSize="11" fontWeight="black" textAnchor="middle">M1</text>
          </g>

          {/* M2: Takozlar Arası Ön-Arka Mesafe */}
          <g
            className="cursor-pointer group"
            onClick={() => onSelectCode && onSelectCode('M2')}
          >
            <rect x="45" y="240" width="32" height="24" rx="6" fill={activeCode === 'M2' ? '#f59e0b' : '#1e293b'} stroke={activeCode === 'M2' ? '#fff' : '#f59e0b'} strokeWidth="2" />
            <text x="61" y="256" fill={activeCode === 'M2' ? '#000' : '#f59e0b'} fontSize="11" fontWeight="black" textAnchor="middle">M2</text>
          </g>

          {/* M3: Şase Genişlik Ölçüsü */}
          <g
            className="cursor-pointer group"
            onClick={() => onSelectCode && onSelectCode('M3')}
          >
            <rect x="235" y="375" width="30" height="24" rx="6" fill={activeCode === 'M3' ? '#f59e0b' : '#1e293b'} stroke={activeCode === 'M3' ? '#fff' : '#f59e0b'} strokeWidth="2" />
            <text x="250" y="391" fill={activeCode === 'M3' ? '#000' : '#f59e0b'} fontSize="11" fontWeight="black" textAnchor="middle">M3</text>
          </g>

          {/* M4: Ağırlık Askı Ekseni Mesafesi */}
          <g
            className="cursor-pointer group"
            onClick={() => onSelectCode && onSelectCode('M4')}
          >
            <rect x="305" y="300" width="30" height="24" rx="6" fill={activeCode === 'M4' ? '#f59e0b' : '#1e293b'} stroke={activeCode === 'M4' ? '#fff' : '#10b981'} strokeWidth="2" />
            <text x="320" y="316" fill={activeCode === 'M4' ? '#000' : '#10b981'} fontSize="11" fontWeight="black" textAnchor="middle">M4</text>
          </g>

          {/* M5: Kabin Askı Ekseni Mesafesi */}
          <g
            className="cursor-pointer group"
            onClick={() => onSelectCode && onSelectCode('M5')}
          >
            <rect x="165" y="300" width="30" height="24" rx="6" fill={activeCode === 'M5' ? '#f59e0b' : '#1e293b'} stroke={activeCode === 'M5' ? '#fff' : '#f43f5e'} strokeWidth="2" />
            <text x="180" y="316" fill={activeCode === 'M5' ? '#000' : '#f43f5e'} fontSize="11" fontWeight="black" textAnchor="middle">M5</text>
          </g>

          {/* M6: Şase Altı Kuyu Tavanı Boşluğu */}
          <g
            className="cursor-pointer group"
            onClick={() => onSelectCode && onSelectCode('M6')}
          >
            <rect x="420" y="340" width="30" height="24" rx="6" fill={activeCode === 'M6' ? '#f59e0b' : '#1e293b'} stroke={activeCode === 'M6' ? '#fff' : '#38bdf8'} strokeWidth="2" />
            <text x="435" y="356" fill={activeCode === 'M6' ? '#000' : '#38bdf8'} fontSize="11" fontWeight="black" textAnchor="middle">M6</text>
          </g>

          {/* M7: Halat Delikleri Kaçıklık Ölçüsü */}
          <g
            className="cursor-pointer group"
            onClick={() => onSelectCode && onSelectCode('M7')}
          >
            <rect x="235" y="430" width="30" height="24" rx="6" fill={activeCode === 'M7' ? '#f59e0b' : '#1e293b'} stroke={activeCode === 'M7' ? '#fff' : '#e2e8f0'} strokeWidth="2" />
            <text x="250" y="446" fill={activeCode === 'M7' ? '#000' : '#e2e8f0'} fontSize="11" fontWeight="black" textAnchor="middle">M7</text>
          </g>

          {/* M8: Hız Regülatörü Eksen Ölçüsü */}
          <g
            className="cursor-pointer group"
            onClick={() => onSelectCode && onSelectCode('M8')}
          >
            <rect x="420" y="155" width="30" height="24" rx="6" fill={activeCode === 'M8' ? '#f59e0b' : '#1e293b'} stroke={activeCode === 'M8' ? '#fff' : '#fbbf24'} strokeWidth="2" />
            <text x="435" y="171" fill={activeCode === 'M8' ? '#000' : '#fbbf24'} fontSize="11" fontWeight="black" textAnchor="middle">M8</text>
          </g>

          {/* M9: Şase Terazi Düzlemsellik */}
          <g
            className="cursor-pointer group"
            onClick={() => onSelectCode && onSelectCode('M9')}
          >
            <rect x="135" y="152" width="30" height="24" rx="6" fill={activeCode === 'M9' ? '#f59e0b' : '#1e293b'} stroke={activeCode === 'M9' ? '#fff' : '#c084fc'} strokeWidth="2" />
            <text x="150" y="168" fill={activeCode === 'M9' ? '#000' : '#c084fc'} fontSize="11" fontWeight="black" textAnchor="middle">M9</text>
          </g>
        </svg>
      </div>
    </div>
  );
};
