import React, { useRef, useState } from 'react';
import { MeasurementFieldDef } from '../types';
import { getDefaultFloorAlias } from '../constants';
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  BookOpen,
} from 'lucide-react';

interface RailDoorMatrixTableProps {
  stopCount: number;
  startFloor: number;
  measurementDefs: MeasurementFieldDef[]; // 1..15 definitions
  floorMatrixMeasurements: Record<string, Record<string, string>>;
  floorAliases?: Record<number, string>;
  projectNominalValues?: Record<string, string>;
  activeCode?: string;
  onSelectCode?: (code: string) => void;
  onCellChange: (stopIndex: number, colCode: string, value: string) => void;
  onAliasChange: (stopIndex: number, alias: string) => void;
  onNominalChange: (colCode: string, value: string) => void;
  onApplyNominalToAll: (colCode: string) => void;
  onClearColumn: (colCode: string) => void;
  onOpenReferenceGuide?: () => void;
}

export const RailDoorMatrixTable: React.FC<RailDoorMatrixTableProps> = ({
  stopCount,
  startFloor,
  measurementDefs,
  floorMatrixMeasurements,
  floorAliases = {},
  projectNominalValues = {},
  activeCode,
  onSelectCode,
  onCellChange,
  onAliasChange,
  onNominalChange,
  onApplyNominalToAll,
  onClearColumn,
  onOpenReferenceGuide,
}) => {
  const tableRef = useRef<HTMLDivElement>(null);

  // Sayfa başına durak sayısı: 6 Durak
  const FLOORS_PER_PAGE = 6;
  const [currentPage, setCurrentPage] = useState(0);

  // Toplam sayfa sayısı
  const totalPages = Math.max(1, Math.ceil(stopCount / FLOORS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages - 1);

  // 1..stopCount dizisi (1.DR, 2.DR, ..., N.DR)
  const stopIndices = Array.from({ length: Math.max(1, stopCount) }, (_, i) => i + 1);

  // Aktif sayfada gösterilecek 6 durak dilimi
  const visibleStopIndices = stopIndices.slice(
    safeCurrentPage * FLOORS_PER_PAGE,
    (safeCurrentPage + 1) * FLOORS_PER_PAGE
  );

  // 1..15 kolon kodları
  const columnCodes = Array.from({ length: 15 }, (_, i) => String(i + 1));

  // Kolonları Yatay Kaydırma
  const scrollHorizontally = (amount: number) => {
    if (tableRef.current) {
      tableRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  // Aşağı Ok: Sonraki 6 Durağa Geç
  const handleNextPage = () => {
    if (safeCurrentPage < totalPages - 1) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  // Yukarı Ok: Önceki 6 Durağa Geç
  const handlePrevPage = () => {
    if (safeCurrentPage > 0) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  // Hücreler arası klavye navigasyonu (Excel stili)
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    currentStop: number,
    currentColIndex: number
  ) => {
    let nextStop = currentStop;
    let nextColIndex = currentColIndex;

    if (e.key === 'ArrowDown' || e.key === 'Enter') {
      e.preventDefault();
      nextStop = currentStop + 1;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      nextStop = currentStop - 1;
    } else if (e.key === 'ArrowRight') {
      if (e.currentTarget.selectionEnd === e.currentTarget.value.length) {
        nextColIndex = currentColIndex + 1;
      }
    } else if (e.key === 'ArrowLeft') {
      if (e.currentTarget.selectionStart === 0) {
        nextColIndex = currentColIndex - 1;
      }
    }

    if (nextStop >= 1 && nextStop <= stopCount && nextColIndex >= 0 && nextColIndex < columnCodes.length) {
      const targetPage = Math.floor((nextStop - 1) / FLOORS_PER_PAGE);
      if (targetPage !== safeCurrentPage) {
        setCurrentPage(targetPage);
        setTimeout(() => {
          const targetInput = document.getElementById(
            `cell-${nextStop}-${columnCodes[nextColIndex]}`
          );
          if (targetInput) targetInput.focus();
        }, 50);
      } else {
        const targetInput = document.getElementById(
          `cell-${nextStop}-${columnCodes[nextColIndex]}`
        );
        if (targetInput) {
          targetInput.focus();
        }
      }
    }
  };

  // Toplam girilen ölçüm sayısı
  let filledCount = 0;
  stopIndices.forEach((sIdx) => {
    const row = floorMatrixMeasurements[String(sIdx)] || {};
    columnCodes.forEach((cCode) => {
      if (row[cCode] && row[cCode].trim() !== '') filledCount++;
    });
  });
  const totalCells = stopCount * 15;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2 sm:p-3 shadow-xl space-y-2">
      {/* TEK SATIR NAVİGASYON ÇUBUĞU: SOL OK | AŞAĞI OK | YUKARI OK | SAĞ OK | ÖLÇÜLERİ GÖR */}
      <div className="bg-slate-950 border border-slate-800 hover:border-slate-750 rounded-xl p-1.5 sm:p-2 flex items-center justify-between gap-1.5 sm:gap-2 shadow-md">
        {/* Yön Butonları: SOL OK, AŞAĞI OK, YUKARI OK, SAĞ OK (Satırı Tam Dolduracak Şekilde Büyütülmüş) */}
        <div className="flex-1 grid grid-cols-4 gap-1.5 sm:gap-2">
          {/* 1. Sol Ok (Kolonları Sola Kaydır) */}
          <button
            type="button"
            id="btn-scroll-left"
            onClick={() => scrollHorizontally(-280)}
            className="w-full py-2 sm:py-2.5 bg-slate-900 hover:bg-slate-800 active:bg-amber-500 active:text-slate-950 text-amber-400 border border-slate-700 hover:border-amber-400/60 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer shadow-xs"
            title="Tabloyu Sola Kaydır (1..5 Sütunları)"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            <span className="font-bold">Sol Ok</span>
          </button>

          {/* 2. Aşağı Ok (Sonraki 6 Durak) */}
          <button
            type="button"
            id="btn-scroll-down"
            onClick={handleNextPage}
            disabled={safeCurrentPage >= totalPages - 1}
            className={`w-full py-2 sm:py-2.5 border rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer shadow-xs ${
              safeCurrentPage >= totalPages - 1
                ? 'bg-slate-900/50 text-slate-600 border-slate-800 cursor-not-allowed opacity-50'
                : 'bg-slate-900 hover:bg-slate-800 active:bg-amber-500 active:text-slate-950 text-slate-200 hover:text-amber-400 border-slate-700 hover:border-slate-600'
            }`}
            title="Sonraki Katlara Geç (Alt Duraklar)"
          >
            <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            <span className="font-bold">Aşağı Ok</span>
          </button>

          {/* 3. Yukarı Ok (Önceki 6 Durak) */}
          <button
            type="button"
            id="btn-scroll-up"
            onClick={handlePrevPage}
            disabled={safeCurrentPage === 0}
            className={`w-full py-2 sm:py-2.5 border rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer shadow-xs ${
              safeCurrentPage === 0
                ? 'bg-slate-900/50 text-slate-600 border-slate-800 cursor-not-allowed opacity-50'
                : 'bg-slate-900 hover:bg-slate-800 active:bg-amber-500 active:text-slate-950 text-slate-200 hover:text-amber-400 border-slate-700 hover:border-slate-600'
            }`}
            title="Önceki Katlara Geç (Üst Duraklar)"
          >
            <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            <span className="font-bold">Yukarı Ok</span>
          </button>

          {/* 4. Sağ Ok (Kolonları Sağa Kaydır) */}
          <button
            type="button"
            id="btn-scroll-right"
            onClick={() => scrollHorizontally(280)}
            className="w-full py-2 sm:py-2.5 bg-slate-900 hover:bg-slate-800 active:bg-amber-500 active:text-slate-950 text-amber-400 border border-slate-700 hover:border-amber-400/60 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer shadow-xs"
            title="Tabloyu Sağa Kaydır (11..15 Sütunları)"
          >
            <span className="font-bold">Sağ Ok</span>
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
          </button>
        </div>

        {/* En Sonda: ÖLÇÜLERİ GÖR BUTONU */}
        {onOpenReferenceGuide && (
          <button
            type="button"
            id="btn-open-reference-guide-table"
            onClick={onOpenReferenceGuide}
            className="px-3.5 sm:px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer shadow-md shrink-0 active:scale-95"
            title="Kuyu Ölçüm Şemasını Görüntüle"
          >
            <BookOpen className="w-4 h-4 text-slate-950" />
            <span>Ölçüleri Gör</span>
          </button>
        )}
      </div>

      {/* EXCEL / MATRIX TABLO ALANI (Dikey Scrollbar Olmadan Tam 6 Durak Sabit Sığar) */}
      <div
        ref={tableRef}
        className="w-full overflow-x-auto border border-slate-800 rounded-xl bg-slate-950 shadow-inner relative scrollbar-thin scrollbar-thumb-slate-700"
      >
        <table className="w-full border-collapse text-xs text-slate-200 min-w-[1280px]">
          {/* TABLO BAŞLIĞI: RESİMDEKİ BİREBİR GÖRÜNÜM (KAT RUMUZ + 1..15) */}
          <thead className="sticky top-0 z-30 bg-slate-900 border-b-2 border-slate-700 shadow-md">
            {/* 1. Satır: Kolon Numaraları */}
            <tr>
              {/* Sol Üst Köşe Boşluk (1. Sütun: DURAK) */}
              <th className="sticky left-0 z-40 bg-slate-900 border-r border-b border-slate-750 p-1 text-center text-[10px] font-black text-amber-400 w-[44px] min-w-[44px] max-w-[44px]">
                DURAK
              </th>

              {/* 2. Sütun: KAT RUMUZ (Maksimum daraltılmış) */}
              <th className="sticky left-[44px] z-40 bg-slate-900 border-r-2 border-b border-slate-700 p-1 text-center font-black text-amber-400 w-[42px] min-w-[42px] max-w-[46px] leading-tight">
                <div className="text-[9px] font-black uppercase tracking-tighter">KAT<br/>RMZ</div>
              </th>

              {/* 1..15 Kolon Başlıkları */}
              {columnCodes.map((cCode) => {
                const isSelected = activeCode === cCode;
                const def = measurementDefs.find((d) => d.code === cCode);
                return (
                  <th
                    key={cCode}
                    onClick={() => {
                      if (onSelectCode) {
                        onSelectCode(cCode);
                      }
                    }}
                    className={`border-r border-b border-slate-750 p-1.5 text-center font-black transition-colors cursor-pointer min-w-[70px] w-[70px] ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 shadow-inner'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                    title={def?.title || `Ölçüm ${cCode}`}
                  >
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-sm font-black">{cCode}</span>
                    </div>
                  </th>
                );
              })}
            </tr>

            {/* 2. Başlık Satırı: PROJE / NOMİNAL DEĞER SATIRI */}
            <tr className="bg-slate-950/90 text-[11px] border-b-2 border-amber-500/40">
              <th className="sticky left-0 z-40 bg-slate-950 border-r border-slate-800 p-1 text-[9px] font-black text-slate-400 text-center w-[44px] min-w-[44px]">
                PROJE
              </th>
              <th className="sticky left-[44px] z-40 bg-slate-950 border-r-2 border-slate-700 p-0.5 text-[9px] font-bold text-amber-400/90 text-center w-[42px] min-w-[42px]">
                NOM
              </th>
              {columnCodes.map((cCode) => {
                const val = projectNominalValues[cCode] || '';
                const isSelected = activeCode === cCode;
                return (
                  <td
                    key={`nominal-${cCode}`}
                    className={`border-r border-slate-800 p-1 text-center ${
                      isSelected ? 'bg-amber-950/40' : 'bg-slate-950'
                    }`}
                  >
                    <input
                      type="text"
                      inputMode="decimal"
                      value={val}
                      onChange={(e) => onNominalChange(cCode, e.target.value.replace(/[^0-9.-]/g, ''))}
                      onFocus={() => onSelectCode && onSelectCode(cCode)}
                      placeholder="mm"
                      className="w-full bg-slate-900/90 border border-slate-750 focus:border-amber-400 rounded px-1 py-1 text-center font-mono font-bold text-xs text-amber-300 outline-none cursor-text"
                      title={`${cCode} nolu sütun için Proje Referans Ölçüsü`}
                    />
                  </td>
                );
              })}
            </tr>
          </thead>

          {/* TABLO GÖVDESİ: SADECE SAYFADAKİ 6 DURAK SATIRI GÖRÜNÜR */}
          <tbody className="divide-y divide-slate-800/80">
            {visibleStopIndices.map((sIdx, rowIdx) => {
              const floorNum = startFloor + (sIdx - 1);
              const defaultAlias = getDefaultFloorAlias(floorNum);
              const currentAlias = floorAliases[sIdx] ?? defaultAlias;
              const rowMeasurements = floorMatrixMeasurements[String(sIdx)] || {};
              const isEven = rowIdx % 2 === 0;

              return (
                <tr
                  key={`stop-${sIdx}`}
                  className={`transition-colors ${
                    isEven ? 'bg-slate-950 hover:bg-slate-850/60' : 'bg-slate-900/40 hover:bg-slate-850/60'
                  }`}
                >
                  {/* 1. Kolon: DURAK (1.DR, 2.DR ...) */}
                  <td className="sticky left-0 z-20 bg-slate-900 border-r border-slate-800 px-1 py-1 text-center font-black text-[11px] text-slate-300 whitespace-nowrap w-[44px] min-w-[44px]">
                    {sIdx}.DR
                  </td>

                  {/* 2. Kolon: KAT RUMUZ (Maksimum Daraltılmış Kompakt Kutu) */}
                  <td className="sticky left-[44px] z-20 bg-slate-900 border-r-2 border-slate-700 p-0.5 text-center font-bold text-xs whitespace-nowrap w-[42px] min-w-[42px]">
                    <input
                      type="text"
                      value={currentAlias}
                      onChange={(e) => onAliasChange(sIdx, e.target.value)}
                      className="w-full bg-slate-950 border border-slate-750 focus:border-amber-400 rounded px-0.5 py-1 text-center font-bold text-xs text-amber-400 outline-none cursor-text"
                      placeholder={defaultAlias}
                      title={`Durak ${sIdx} Kat Rumuzu (Örn: Z, -1, 1)`}
                    />
                  </td>

                  {/* 1..15 Ölçüm Giriş Hücreleri */}
                  {columnCodes.map((cCode, colIdx) => {
                    const cellVal = rowMeasurements[cCode] || '';
                    const nominalVal = projectNominalValues[cCode] || '';
                    const isSelectedCol = activeCode === cCode;

                    // Sapma Kontrolü
                    let deviationClass = 'bg-slate-900 border-slate-750 text-white';
                    let deviationBadge = null;

                    if (cellVal && nominalVal) {
                      const numCell = parseFloat(cellVal);
                      const numNom = parseFloat(nominalVal);
                      if (!isNaN(numCell) && !isNaN(numNom)) {
                        const diff = numCell - numNom;
                        if (diff === 0) {
                          deviationClass = 'bg-emerald-950/30 border-emerald-500/60 text-emerald-300';
                        } else if (Math.abs(diff) <= 2) {
                          deviationClass = 'bg-amber-950/40 border-amber-500/80 text-amber-300';
                          deviationBadge = `${diff > 0 ? '+' : ''}${diff}`;
                        } else {
                          deviationClass = 'bg-rose-950/50 border-rose-500 text-rose-300 font-black';
                          deviationBadge = `${diff > 0 ? '+' : ''}${diff}`;
                        }
                      }
                    }

                    return (
                      <td
                        key={`cell-container-${sIdx}-${cCode}`}
                        className={`border-r border-slate-800 p-1 text-center relative ${
                          isSelectedCol ? 'bg-amber-950/20' : ''
                        }`}
                      >
                        <div className="relative flex items-center justify-center">
                          <input
                            id={`cell-${sIdx}-${cCode}`}
                            type="text"
                            inputMode="decimal"
                            value={cellVal}
                            onChange={(e) =>
                              onCellChange(sIdx, cCode, e.target.value.replace(/[^0-9.-]/g, ''))
                            }
                            onFocus={() => onSelectCode && onSelectCode(cCode)}
                            onKeyDown={(e) => handleKeyDown(e, sIdx, colIdx)}
                            placeholder="---"
                            className={`w-full border focus:border-amber-400 rounded px-1 py-1.5 text-center font-mono font-bold text-xs outline-none transition-all cursor-text ${deviationClass}`}
                          />
                          {deviationBadge && (
                            <span
                              className="absolute -top-1.5 -right-1 text-[8px] font-black bg-rose-600 text-white px-1 py-0.2 rounded shadow-xs pointer-events-none"
                              title={`Sapma: ${deviationBadge} mm`}
                            >
                              {deviationBadge}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Alt Bilgi ve Tolerans Renk Rehberi */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400 pt-1">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" />
            <span>Tam Uyumlu (0 mm)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block" />
            <span>Tolerans İçi (±1-2 mm)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block" />
            <span>Kritik Sapma (&gt;2 mm)</span>
          </span>
        </div>

        <div className="text-[10px] sm:text-[11px] text-slate-500">
          <span>Tüm ölçümler milimetre (mm) cinsindendir.</span>
        </div>
      </div>
    </div>
  );
};
