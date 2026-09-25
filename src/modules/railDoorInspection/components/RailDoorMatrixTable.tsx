import React, { useRef, useState, useEffect, useMemo } from 'react';
import { MeasurementFieldDef, RailLayoutPosition } from '../types';
import {
  getDefaultFloorAlias,
  calculateMmDeviation,
  getColumnInferredNominals,
  calculateColumnMinMm,
  evaluateColumns1And2Diff,
} from '../constants';
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Eye,
  Plus,
  X,
  AlertTriangle,
  Flame,
} from 'lucide-react';

interface RailDoorMatrixTableProps {
  stopCount: number;
  startFloor: number;
  measurementDefs: MeasurementFieldDef[]; // 1..15 definitions
  floorMatrixMeasurements: Record<string, Record<string, string>>;
  floorAliases?: Record<number, string>;
  projectNominalValues?: Record<string, string>;
  customColumnCodes?: string[];
  column9Direction?: string;
  onColumn9DirectionChange?: (direction: string) => void;
  layoutPosition?: RailLayoutPosition;
  activeCode?: string;
  flaggedAbnormalCells?: Record<string, boolean>;
  onToggleFlaggedCell?: (cellKey: string) => void;
  onSelectCode?: (code: string) => void;
  onCellChange: (stopIndex: number, colCode: string, value: string) => void;
  onAliasChange: (stopIndex: number, alias: string) => void;
  onNominalChange: (colCode: string, value: string) => void;
  onApplyNominalToAll: (colCode: string) => void;
  onClearColumn: (colCode: string) => void;
  onAddColumn?: (code: string) => void;
  onRemoveColumn?: (code: string) => void;
  onOpenReferenceGuide?: () => void;
}

export const RailDoorMatrixTable: React.FC<RailDoorMatrixTableProps> = ({
  stopCount,
  startFloor,
  measurementDefs,
  floorMatrixMeasurements,
  floorAliases = {},
  projectNominalValues = {},
  customColumnCodes = [],
  column9Direction,
  onColumn9DirectionChange,
  layoutPosition,
  activeCode,
  flaggedAbnormalCells = {},
  onToggleFlaggedCell,
  onSelectCode,
  onCellChange,
  onAliasChange,
  onNominalChange,
  onApplyNominalToAll,
  onClearColumn,
  onAddColumn,
  onRemoveColumn,
  onOpenReferenceGuide,
}) => {
  const tableRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sütun Ekleme Modalı State'i
  const [showAddColumnModal, setShowAddColumnModal] = useState(false);
  const [newColumnCode, setNewColumnCode] = useState('');
  const [columnError, setColumnError] = useState('');

  // 9 Nolu Sütun İbaresi Seçim Modalı State'i (SAĞ, SOL, MRK)
  const [showCol9Modal, setShowCol9Modal] = useState(false);

  // Uzun Basma (Long-Press) Timer'ı (2 saniye basılı tutunca Anormal Durum olarak işaretler)
  const pressTimer = useRef<NodeJS.Timeout | null>(null);
  const [pressingCellKey, setPressingCellKey] = useState<string | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

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

  // Standart 1..15 + Kullanıcının Eklediği Özel Sütunlar
  const baseColumnCodes = Array.from({ length: 15 }, (_, i) => String(i + 1));
  const columnCodes = [...baseColumnCodes, ...customColumnCodes];

  // Proje nominali girilmemiş sütunlar için katlar arası otomatik iç referans hesabı
  const inferredNominals = useMemo(
    () => getColumnInferredNominals(floorMatrixMeasurements, columnCodes),
    [floorMatrixMeasurements, columnCodes]
  );

  // TÜM SÜTUNLARIN EN KÜÇÜK (MİNİMUM) DEĞERLERİ (mm)
  const columnMinValues = useMemo(
    () => calculateColumnMinMm(floorMatrixMeasurements, columnCodes, stopCount),
    [floorMatrixMeasurements, columnCodes, stopCount]
  );

  // SONUÇ SATIRINDA 1. VE 2. SÜTUNUN EN KÜÇÜKLERİ ARASINDAKİ FARK (>3mm Denetimi)
  const summary1And2Diff = useMemo(
    () => evaluateColumns1And2Diff(columnMinValues['1'], columnMinValues['2'], 3),
    [columnMinValues]
  );

  // Modal açıldığında inputa odaklan
  useEffect(() => {
    if (showAddColumnModal) {
      const lastCode = columnCodes[columnCodes.length - 1];
      const lastNum = parseInt(lastCode, 10);
      const suggested = !isNaN(lastNum) ? String(lastNum + 1) : '16';
      setNewColumnCode(suggested);
      setColumnError('');
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 50);
    }
  }, [showAddColumnModal]);

  // Uzun basma (Long-Press) Başlatma
  const handleStartPress = (cellKey: string, stopIdx: number, colCode: string) => {
    setPressingCellKey(cellKey);
    if (pressTimer.current) clearTimeout(pressTimer.current);

    pressTimer.current = setTimeout(() => {
      if (onToggleFlaggedCell) {
        onToggleFlaggedCell(cellKey);
        const willBeFlagged = !flaggedAbnormalCells[cellKey];
        const msg = willBeFlagged
          ? `⬛ ${stopIdx}.DR / Sütun ${colCode} hücresi SİYAH (BEYAZ YAZI) olarak işaretlendi!`
          : `✓ ${stopIdx}.DR / Sütun ${colCode} hücresi normale döndürüldü.`;
        setFeedbackToast(msg);
        setTimeout(() => setFeedbackToast(null), 3500);

        if ('vibrate' in navigator) {
          try {
            navigator.vibrate(100);
          } catch {}
        }
      }
      setPressingCellKey(null);
    }, 1800); // 1.8 saniye
  };

  const handleCancelPress = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    setPressingCellKey(null);
  };

  const handleOpenAddModal = () => {
    setShowAddColumnModal(true);
  };

  const handleConfirmAddColumn = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newColumnCode.trim();
    if (!trimmed) {
      setColumnError('Lütfen bir sütun numarası veya kodu girin.');
      return;
    }
    if (columnCodes.includes(trimmed)) {
      setColumnError(`"${trimmed}" numaralı sütun tabloda zaten mevcut!`);
      return;
    }

    if (onAddColumn) {
      onAddColumn(trimmed);
    }
    setShowAddColumnModal(false);
    setNewColumnCode('');
    setColumnError('');

    // Tabloyu yeni eklenen sütuna doğru otomatik kaydır
    setTimeout(() => {
      if (tableRef.current) {
        tableRef.current.scrollBy({ left: 600, behavior: 'smooth' });
      }
    }, 100);
  };

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
    handleCancelPress();
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

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2 sm:p-3 shadow-xl space-y-2 relative">
      {/* Uzun Basma Feedback Bildirimi */}
      {feedbackToast && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 bg-red-900/95 text-white border-2 border-amber-400 px-4 py-2 rounded-xl text-xs font-black shadow-2xl animate-bounce flex items-center gap-2 pointer-events-none">
          <Flame className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* TEK SATIR NAVİGASYON ÇUBUĞU: SOL OK | AŞAĞI OK | YUKARI OK | SAĞ OK | SÜTUN EKLE (+) | ÖLÇÜLERİ GÖR */}
      <div className="bg-slate-950 border border-slate-800 hover:border-slate-750 rounded-xl p-1.5 sm:p-2 flex items-center justify-between gap-1.5 sm:gap-2 shadow-md">
        {/* Yön Butonları */}
        <div className="flex-1 grid grid-cols-4 gap-1.5 sm:gap-2">
          {/* 1. Sol Ok (Kolonları Sola Kaydır) */}
          <button
            type="button"
            id="btn-scroll-left"
            onClick={() => scrollHorizontally(-280)}
            className="w-full min-h-[40px] py-2 sm:py-2.5 bg-slate-900 hover:bg-slate-800 active:bg-amber-500 active:text-slate-950 text-amber-400 border border-slate-700 hover:border-amber-400/60 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer shadow-xs select-none"
            title="Tabloyu Sola Kaydır (1..5 Sütunları)"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0" />
            <span className="font-bold whitespace-nowrap">Sol Ok</span>
          </button>

          {/* 2. Aşağı Ok (Sonraki 6 Durak) */}
          <button
            type="button"
            id="btn-scroll-down"
            onClick={handleNextPage}
            disabled={safeCurrentPage >= totalPages - 1}
            className={`w-full min-h-[40px] py-2 sm:py-2.5 border rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer shadow-xs select-none ${
              safeCurrentPage >= totalPages - 1
                ? 'bg-slate-900/50 text-slate-600 border-slate-800 cursor-not-allowed opacity-50'
                : 'bg-slate-900 hover:bg-slate-800 active:bg-amber-500 active:text-slate-950 text-slate-200 hover:text-amber-400 border-slate-700 hover:border-slate-600'
            }`}
            title="Sonraki Katlara Geç (Alt Duraklar)"
          >
            <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0" />
            <span className="font-bold whitespace-nowrap">Aşağı Ok</span>
          </button>

          {/* 3. Yukarı Ok (Önceki 6 Durak) */}
          <button
            type="button"
            id="btn-scroll-up"
            onClick={handlePrevPage}
            disabled={safeCurrentPage === 0}
            className={`w-full min-h-[40px] py-2 sm:py-2.5 border rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer shadow-xs select-none ${
              safeCurrentPage === 0
                ? 'bg-slate-900/50 text-slate-600 border-slate-800 cursor-not-allowed opacity-50'
                : 'bg-slate-900 hover:bg-slate-800 active:bg-amber-500 active:text-slate-950 text-slate-200 hover:text-amber-400 border-slate-700 hover:border-slate-600'
            }`}
            title="Önceki Katlara Geç (Üst Duraklar)"
          >
            <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0" />
            <span className="font-bold whitespace-nowrap">Yukarı Ok</span>
          </button>

          {/* 4. Sağ Ok (Kolonları Sağa Kaydır) */}
          <button
            type="button"
            id="btn-scroll-right"
            onClick={() => scrollHorizontally(280)}
            className="w-full min-h-[40px] py-2 sm:py-2.5 bg-slate-900 hover:bg-slate-800 active:bg-amber-500 active:text-slate-950 text-amber-400 border border-slate-700 hover:border-amber-400/60 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer shadow-xs select-none"
            title="Tabloyu Sağa Kaydır"
          >
            <span className="font-bold whitespace-nowrap">Sağ Ok</span>
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0" />
          </button>
        </div>

        {/* En Sonda: RESMİ GÖR BUTONU */}
        {onOpenReferenceGuide && (
          <button
            type="button"
            id="btn-open-reference-guide-table"
            onClick={onOpenReferenceGuide}
            className="min-h-[40px] px-3.5 sm:px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer shadow-md shrink-0 select-none whitespace-nowrap"
            title="Kuyu Ölçüm Şemasını Görüntüle"
          >
            <Eye className="w-4 h-4 text-slate-950 shrink-0" />
            <span>Resmi Gör</span>
          </button>
        )}
      </div>

      {/* EXCEL / MATRIX TABLO ALANI */}
      <div
        ref={tableRef}
        className="w-full overflow-x-auto border border-slate-800 rounded-xl bg-slate-950 shadow-inner relative scrollbar-thin scrollbar-thumb-slate-700"
      >
        <table className="w-full border-collapse text-xs text-slate-200 min-w-[1280px]">
          {/* TABLO BAŞLIĞI: (KAT RUMUZ + 1..15 + ÖZEL EKLENEN SÜTUNLAR + [+] SİMGE BUTONU) */}
          <thead className="sticky top-0 z-30 bg-slate-900 border-b-2 border-slate-700 shadow-md">
            {/* 1. Satır: Kolon Numaraları */}
            <tr>
              <th className="sticky left-0 z-40 bg-slate-900 border-r border-b border-slate-750 p-1 text-center text-[10px] font-black text-amber-400 w-[44px] min-w-[44px] max-w-[44px]">
                DURAK
              </th>

              <th className="sticky left-[44px] z-40 bg-slate-900 border-r-2 border-b border-slate-700 p-1 text-center font-black text-amber-400 w-[42px] min-w-[42px] max-w-[46px] leading-tight">
                <div className="text-[9px] font-black uppercase tracking-tighter">KAT<br/>RMZ</div>
              </th>

              {columnCodes.map((cCode) => {
                const isSelected = activeCode === cCode;
                const def = measurementDefs.find((d) => d.code === cCode);
                const isCustom = !baseColumnCodes.includes(cCode);
                const isCol9 = cCode === '9';
                const col9Title = isCol9 && column9Direction ? `9 - ${column9Direction}` : cCode;

                return (
                  <th
                    key={cCode}
                    id={`th-col-${cCode}`}
                    onClick={() => {
                      if (onSelectCode) {
                        onSelectCode(cCode);
                      }
                      if (isCol9) {
                        setShowCol9Modal(true);
                      }
                    }}
                    className={`border-r border-b border-slate-750 p-1 text-center font-black transition-colors cursor-pointer relative group ${
                      isCol9
                        ? (column9Direction ? 'min-w-[96px] w-[96px]' : 'min-w-[82px] w-[82px]')
                        : 'min-w-[70px] w-[70px]'
                    } ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 shadow-inner'
                        : isCustom
                        ? 'bg-sky-950/80 hover:bg-sky-900 text-sky-200 border-sky-800'
                        : isCol9 && column9Direction
                        ? 'bg-slate-900 hover:bg-slate-850 text-amber-300 border-amber-500/40 ring-1 ring-amber-500/30'
                        : 'bg-slate-900 hover:bg-slate-850 text-white'
                    }`}
                    title={
                      isCol9
                        ? 'Dokunun: SAĞ, SOL, MRK seçimi yapın (Eksen Kaçıklığı)'
                        : (def?.title || `Ölçüm Sütunu ${cCode}`)
                    }
                  >
                    {isCol9 ? (
                      <div className="flex flex-col items-center justify-center relative py-0.5 select-none">
                        <div className="flex items-center gap-1 justify-center">
                          <span
                            className={`text-sm font-black whitespace-nowrap ${
                              isSelected
                                ? 'text-slate-950'
                                : column9Direction
                                ? 'text-amber-400 font-extrabold'
                                : 'text-white'
                            }`}
                          >
                            {col9Title}
                          </span>
                          <ChevronDown
                            className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                              isSelected ? 'text-slate-950' : 'text-amber-400'
                            }`}
                          />
                        </div>
                        {!column9Direction && (
                          <span
                            className={`text-[8px] font-bold tracking-tight uppercase ${
                              isSelected ? 'text-slate-900/80' : 'text-amber-400/90'
                            }`}
                          >
                            (Yön Seç)
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center relative">
                        <span className="text-sm font-black">{cCode}</span>

                        {isCustom && onRemoveColumn && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              onRemoveColumn(cCode);
                            }}
                            className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full bg-rose-600 hover:bg-rose-500 active:scale-90 text-white flex items-center justify-center transition shadow-md z-10 cursor-pointer border border-rose-400"
                            title={`"${cCode}" Özel Sütununu Sil`}
                          >
                            <X className="w-2.5 h-2.5 stroke-[3]" />
                          </button>
                        )}
                      </div>
                    )}
                  </th>
                );
              })}

              <th className="border-b border-slate-750 p-1 text-center bg-slate-900/90 w-[54px] min-w-[54px]">
                <button
                  type="button"
                  id="btn-add-column-header"
                  onClick={handleOpenAddModal}
                  className="w-8 h-8 mx-auto rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-90 text-white flex items-center justify-center transition-all shadow-md cursor-pointer border border-emerald-400 group"
                  title="Yeni Sütun Ekle (Rakamı Siz Belirleyin)"
                >
                  <Plus className="w-4 h-4 group-hover:scale-125 transition-transform" />
                </button>
              </th>
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
                const isCustom = !baseColumnCodes.includes(cCode);
                const isCol9 = cCode === '9';
                const colTitle = isCol9 && column9Direction ? `9 - ${column9Direction}` : `${cCode} nolu sütun`;

                return (
                  <td
                    key={`nominal-${cCode}`}
                    className={`border-r border-slate-800 p-1 text-center ${
                      isSelected ? 'bg-amber-950/40' : isCustom ? 'bg-sky-950/30' : isCol9 && column9Direction ? 'bg-amber-950/20' : 'bg-slate-950'
                    }`}
                  >
                    <input
                      type="text"
                      inputMode="decimal"
                      value={val}
                      onChange={(e) => onNominalChange(cCode, e.target.value.replace(/[^0-9.,-]/g, ''))}
                      onFocus={() => onSelectCode && onSelectCode(cCode)}
                      placeholder="---"
                      className={`w-full bg-slate-900/90 border focus:border-amber-400 rounded px-1 py-1 text-center font-mono font-bold text-xs outline-none cursor-text ${
                        isCustom ? 'border-sky-800 text-sky-300' : 'border-slate-750 text-amber-300'
                      }`}
                      title={`${colTitle} için Proje Referans Ölçüsü`}
                    />
                  </td>
                );
              })}
              <td className="bg-slate-950 p-1 text-center" />
            </tr>
          </thead>

          {/* TABLO GÖVDESİ */}
          <tbody className="divide-y divide-slate-800/80">
            {visibleStopIndices.map((sIdx, rowIdx) => {
              const floorNum = startFloor + (sIdx - 1);
              const defaultAlias = getDefaultFloorAlias(floorNum);
              const currentAlias = floorAliases[sIdx] ?? defaultAlias;
              const rowMeasurements = floorMatrixMeasurements[String(sIdx)] || {};
              const isEven = rowIdx % 2 === 0;

              // 1. ve 2. Sütun Farkı > 3mm Denetimi
              const row1And2Diff = evaluateColumns1And2Diff(rowMeasurements['1'], rowMeasurements['2'], 3);

              return (
                <tr
                  key={`stop-${sIdx}`}
                  className={`transition-colors ${
                    isEven ? 'bg-slate-950 hover:bg-slate-850/60' : 'bg-slate-900/40 hover:bg-slate-850/60'
                  }`}
                >
                  {/* 1. Kolon: DURAK */}
                  <td className="sticky left-0 z-20 bg-slate-900 border-r border-slate-800 px-1 py-1 text-center font-black text-[11px] text-slate-300 whitespace-nowrap w-[44px] min-w-[44px]">
                    {sIdx}.DR
                  </td>

                  {/* 2. Kolon: KAT RUMUZ */}
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

                  {/* Ölçüm Giriş Hücreleri (1..15 + Özel Sütunlar) */}
                  {columnCodes.map((cCode, colIdx) => {
                    const cellKey = `${sIdx}_${cCode}`;
                    const cellVal = rowMeasurements[cCode] || '';
                    const nominalVal = projectNominalValues[cCode] || '';
                    const isSelectedCol = activeCode === cCode;
                    const isFlagged = !!flaggedAbnormalCells[cellKey];

                    // 1-2 Sütun Farkı Kontrolü
                    const isCol1Or2 = cCode === '1' || cCode === '2';
                    const isCol12DiffExceeded = isCol1Or2 && row1And2Diff.hasBoth && row1And2Diff.exceeded;

                    // Sapma Kontrolü
                    let deviationClass = 'bg-slate-900 border-slate-750 text-white';
                    let deviationBadge: string | null = null;

                    const devResult = calculateMmDeviation(
                      cellVal,
                      nominalVal,
                      cCode,
                      inferredNominals[cCode],
                      layoutPosition
                    );

                    if (devResult) {
                      if (devResult.isMatch) {
                        deviationClass = 'bg-emerald-950/30 border-emerald-500/60 text-emerald-300';
                      } else if (devResult.isWarning) {
                        deviationClass = 'bg-amber-950/40 border-amber-500/80 text-amber-300';
                        deviationBadge = devResult.badgeText;
                      } else if (devResult.isCritical) {
                        deviationClass = 'bg-rose-950/50 border-rose-500 text-rose-300 font-black ring-1 ring-rose-500';
                        deviationBadge = devResult.badgeText;
                      }
                    }

                    // 1-2 Sütun Farkı > 3mm ise Özel Sarı-Kırmızı Kombinasyon
                    if (isCol12DiffExceeded && !isFlagged) {
                      deviationClass = 'bg-amber-950/80 border-2 border-amber-400 text-amber-200 ring-1 ring-amber-400 font-black shadow-inner';
                      deviationBadge = `Δ:${row1And2Diff.diffMm}mm`;
                    }

                    // 2 Saniye Basılı Tutularak ANORMAL / ÖZEL olarak İşaretlenmişse (SİYAH ZEMİN - BEYAZ YAZI)
                    if (isFlagged) {
                      deviationClass = '!bg-black border-2 border-zinc-600 !text-white font-black ring-1 ring-zinc-400 shadow-lg';
                      deviationBadge = '⬛';
                    }

                    return (
                      <td
                        key={`cell-container-${sIdx}-${cCode}`}
                        className={`border-r border-slate-800 p-1 text-center relative ${
                          isSelectedCol ? 'bg-amber-950/20' : ''
                        }`}
                      >
                        <div
                          className="relative flex items-center justify-center"
                          onMouseDown={() => handleStartPress(cellKey, sIdx, cCode)}
                          onMouseUp={handleCancelPress}
                          onMouseLeave={handleCancelPress}
                          onTouchStart={() => handleStartPress(cellKey, sIdx, cCode)}
                          onTouchEnd={handleCancelPress}
                          onTouchCancel={handleCancelPress}
                        >
                          <input
                            id={`cell-${sIdx}-${cCode}`}
                            type="text"
                            inputMode="decimal"
                            value={cellVal}
                            style={
                              isFlagged
                                ? { backgroundColor: '#000000', color: '#ffffff', WebkitTextFillColor: '#ffffff' }
                                : undefined
                            }
                            onChange={(e) =>
                              onCellChange(sIdx, cCode, e.target.value.replace(/[^0-9.,-]/g, ''))
                            }
                            onFocus={() => onSelectCode && onSelectCode(cCode)}
                            onKeyDown={(e) => handleKeyDown(e, sIdx, colIdx)}
                            placeholder="---"
                            className={`w-full border focus:border-amber-400 rounded px-1 py-1.5 text-center font-mono font-bold text-xs outline-none transition-all cursor-text ${deviationClass}`}
                            title={
                              isFlagged
                                ? '⬛ SİYAH İŞARET: Bu hücre kullanıcı tarafından özel olarak işaretlendi (Normale döndürmek için 2sn basılı tutun).'
                                : isCol12DiffExceeded
                                ? `⚠️ DİKKAT: 1. ve 2. sütun arasında ${row1And2Diff.diffMm} mm fark var (>3mm eşiği aşıldı!)`
                                : devResult?.isUnderLimit
                                ? `DİKKAT: ${cCode} nolu sütun ölçüsü proje/asgari sınırın altında! (Kritik Uyarı)`
                                : devResult?.isInferred && !devResult.isMatch
                                ? `${cCode} nolu sütun iç analiz sapması: ${devResult.badgeText} (Referans: ${(devResult.nomMm! / 10).toFixed(1)} cm)`
                                : 'Ölçü girin. 2 saniye basılı tutarak Siyah Zemin / Beyaz Yazı ile işaretleyebilirsiniz.'
                            }
                          />
                          {deviationBadge && (
                            <span
                              className={`absolute -top-1.5 -right-1 text-[8px] font-black px-1 py-0.2 rounded shadow-xs pointer-events-none ${
                                isFlagged
                                  ? 'bg-black text-white border border-zinc-400'
                                  : isCol12DiffExceeded
                                  ? 'bg-amber-500 text-slate-950 font-black border border-amber-300'
                                  : 'bg-rose-600 text-white'
                              }`}
                            >
                              {deviationBadge}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}

                  <td className="p-1 text-center bg-slate-950/50" />
                </tr>
              );
            })}

            {/* ========================================================================= */}
            {/* EN ALT SATIR: SONUÇ (MİNİMUM / EN KÜÇÜK ÖLÇÜ) SATIRI (BOYAMASIZ / SADE)   */}
            {/* ========================================================================= */}
            <tr className="bg-slate-900 border-t-2 border-slate-700 font-bold text-xs">
              {/* 1. Kolon: DURAK Hizası SONUÇ */}
              <th className="sticky left-0 z-20 bg-slate-900 text-slate-300 border-r border-slate-800 px-1 py-2 text-center font-bold text-[10px] uppercase tracking-wider w-[44px] min-w-[44px]">
                SONUÇ
              </th>

              {/* 2. Kolon: KAT RMZ Hizası MIN */}
              <th className="sticky left-[44px] z-20 bg-slate-900 text-slate-400 border-r-2 border-slate-700 p-0.5 text-center font-bold text-[10px] uppercase tracking-wider w-[42px] min-w-[42px]">
                MIN
              </th>

              {/* Tüm Sütunların Minimum Değerleri (Boyamasız / Sade) */}
              {columnCodes.map((cCode) => {
                const minMm = columnMinValues[cCode];

                return (
                  <td
                    key={`summary-min-${cCode}`}
                    className="border-r border-slate-800 p-1.5 text-center font-mono font-bold text-slate-200 bg-slate-900/60"
                    title={`${cCode} Nolu Sütun En Küçük Ölçüsü: ${minMm !== null ? `${minMm} mm` : 'Veri yok'}`}
                  >
                    <span className="text-xs">
                      {minMm !== null ? `${minMm}` : '---'}
                    </span>
                  </td>
                );
              })}

              <td className="p-1 text-center bg-slate-950/50" />
            </tr>
          </tbody>
        </table>
      </div>

      {/* Alt Bilgi ve Tolerans Renk Rehberi */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 text-[11px] text-slate-400 pt-1">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" />
            <span>Tam Uyumlu</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block" />
            <span>±1-3 mm Fark</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-amber-600 border border-amber-300 inline-block" />
            <span className="text-amber-300 font-bold">1-2. Sütun Farkı &gt;3mm</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-black border border-zinc-500 inline-block" />
            <span className="text-slate-200 font-bold">⬛ 2sn Basılı Tutulan (Siyah)</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium">
            💡 <strong>İpucu:</strong> Bir hücreye <strong>2 saniye basılı tutarak</strong> siyah zemin / beyaz yazı yapabilirsiniz.
          </span>
        </div>
      </div>

      {/* SÜTUN EKLEME MODALI */}
      {showAddColumnModal && (
        <div
          className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setShowAddColumnModal(false)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-white">Yeni Sütun Ekle</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddColumnModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmAddColumn} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Sütun Numarası / Kodu:
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  value={newColumnCode}
                  onChange={(e) => {
                    setNewColumnCode(e.target.value);
                    setColumnError('');
                  }}
                  placeholder="Örn: 16 veya 18"
                  className="w-full bg-slate-950 border border-slate-750 focus:border-emerald-500 rounded-xl p-2.5 text-sm font-bold text-white outline-none"
                />
                {columnError && (
                  <p className="text-rose-400 text-xs font-bold mt-1.5">{columnError}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddColumnModal(false)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md"
                >
                  Sütunu Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9 NOLU SÜTUN İBARESİ SEÇİM MODALI */}
      {showCol9Modal && (
        <div
          className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setShowCol9Modal(false)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-white">9 Nolu Sütun Yön Seçimi</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCol9Modal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              9 nolu sütun eksen kaçıklığı ölçümünün yönünü belirtiniz:
            </p>

            <div className="grid grid-cols-3 gap-2">
              {['SAĞ', 'SOL', 'MRK'].map((dir) => (
                <button
                  key={dir}
                  type="button"
                  onClick={() => {
                    if (onColumn9DirectionChange) onColumn9DirectionChange(dir);
                    setShowCol9Modal(false);
                  }}
                  className={`py-3 px-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                    column9Direction === dir
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                      : 'bg-slate-950 text-slate-200 border-slate-750 hover:border-amber-400 hover:text-amber-400'
                  }`}
                >
                  {dir}
                </button>
              ))}
            </div>

            {column9Direction && (
              <button
                type="button"
                onClick={() => {
                  if (onColumn9DirectionChange) onColumn9DirectionChange('');
                  setShowCol9Modal(false);
                }}
                className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-slate-400 text-xs font-bold rounded-xl border border-slate-700 cursor-pointer"
              >
                Seçimi Temizle (Varsayılan 9)
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
