import React, { useRef, useState, useEffect, useMemo } from 'react';
import { MeasurementFieldDef, RailLayoutPosition } from '../types';
import { getDefaultFloorAlias, calculateMmDeviation, getColumnInferredNominals } from '../constants';
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  BookOpen,
  Plus,
  X,
  Trash2,
  Check,
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

  // Modal açıldığında inputa odaklan
  useEffect(() => {
    if (showAddColumnModal) {
      // Varsayılan öneri (varsa son numaranın 1 fazlası veya 16)
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

        {/* En Sonda: ÖLÇÜLERİ GÖR BUTONU */}
        {onOpenReferenceGuide && (
          <button
            type="button"
            id="btn-open-reference-guide-table"
            onClick={onOpenReferenceGuide}
            className="min-h-[40px] px-3.5 sm:px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer shadow-md shrink-0 select-none whitespace-nowrap"
            title="Kuyu Ölçüm Şemasını Görüntüle"
          >
            <BookOpen className="w-4 h-4 text-slate-950 shrink-0" />
            <span>Ölçüleri Gör</span>
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
              {/* Sol Üst Köşe Boşluk (1. Sütun: DURAK) */}
              <th className="sticky left-0 z-40 bg-slate-900 border-r border-b border-slate-750 p-1 text-center text-[10px] font-black text-amber-400 w-[44px] min-w-[44px] max-w-[44px]">
                DURAK
              </th>

              {/* 2. Sütun: KAT RUMUZ */}
              <th className="sticky left-[44px] z-40 bg-slate-900 border-r-2 border-b border-slate-700 p-1 text-center font-black text-amber-400 w-[42px] min-w-[42px] max-w-[46px] leading-tight">
                <div className="text-[9px] font-black uppercase tracking-tighter">KAT<br/>RMZ</div>
              </th>

              {/* 1..15 ve Özel Eklenen Kolon Başlıkları */}
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
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
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

                        {/* Özel sütunlar için doğrudan kaldır butonu */}
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

              {/* SADECE SİMGE OLAN "SÜTUN EKLE" BAŞLIK BUTONU (+) */}
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
              {/* Boş hücre (+) butonu altı */}
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
                    const cellVal = rowMeasurements[cCode] || '';
                    const nominalVal = projectNominalValues[cCode] || '';
                    const isSelectedCol = activeCode === cCode;

                    // Sapma Kontrolü (CM girişini MM'ye çevirip toleransı mm olarak denetler)
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
                              onCellChange(sIdx, cCode, e.target.value.replace(/[^0-9.,-]/g, ''))
                            }
                            onFocus={() => onSelectCode && onSelectCode(cCode)}
                            onKeyDown={(e) => handleKeyDown(e, sIdx, colIdx)}
                            placeholder="---"
                            className={`w-full border focus:border-amber-400 rounded px-1 py-1.5 text-center font-mono font-bold text-xs outline-none transition-all cursor-text ${deviationClass}`}
                            title={
                              devResult?.isUnderLimit
                                ? `DİKKAT: ${cCode} nolu sütun ölçüsü proje/asgari sınırın altında! (Kritik Uyarı)`
                                : devResult?.isInferred && !devResult.isMatch
                                ? `${cCode} nolu sütun iç analiz sapması: ${devResult.badgeText} (Referans: ${(devResult.nomMm! / 10).toFixed(1)} cm)`
                                : undefined
                            }
                          />
                          {deviationBadge && (
                            <span
                              className="absolute -top-1.5 -right-1 text-[8px] font-black bg-rose-600 text-white px-1 py-0.2 rounded shadow-xs pointer-events-none"
                              title={
                                devResult?.isUnderLimit
                                  ? `${cCode} nolu sütun sınır altı: ${deviationBadge}`
                                  : devResult?.isInferred
                                  ? `İç Analiz Sapması: ${deviationBadge} (Referans: ${(devResult.nomMm! / 10).toFixed(1)} cm)`
                                  : `Sapma: ${deviationBadge}`
                              }
                            >
                              {deviationBadge}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}

                  {/* Sütun Ekle (+) Hizası Boş Hücre */}
                  <td className="p-1 text-center bg-slate-950/50" />
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
            <span>Farklı Ölçü (±1-3 mm)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block" />
            <span>Kritik Sapma (&gt;3 mm / Alt Sınır)</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {customColumnCodes.length > 0 && (
            <span className="text-sky-400 font-bold">
              +{customColumnCodes.length} Özel Sütun Ekli ({customColumnCodes.join(', ')})
            </span>
          )}
          <span className="text-[10px] sm:text-[11px] text-amber-400 font-medium">
            📐 Ölçüleri cm olarak giriniz (virgül/nokta desteklenir), raporda otomatik mm'ye çevrilir.
          </span>
        </div>
      </div>

      {/* SÜTUN EKLEME MODALI / DIALOGU */}
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
                  placeholder="Örn: 16, 18, 20, 25, 1A"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-base font-black text-amber-300 font-mono text-center outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  İstediğiniz sütun numarasını veya harf kodunu yazabilirsiniz (15'ten sonra sıralı gitmek zorunda değildir).
                </p>
                {columnError && (
                  <p className="text-xs font-bold text-rose-400 mt-1.5 bg-rose-950/40 border border-rose-800/60 p-2 rounded-lg">
                    {columnError}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddColumnModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition shadow-lg active:scale-95 flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Sütun Ekle</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9 NUMARALI SÜTUN İÇİN SAĞ, SOL, MRK SEÇİM MODALI */}
      {showCol9Modal && (
        <div
          id="col9-direction-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn cursor-pointer"
          onClick={() => setShowCol9Modal(false)}
        >
          <div
            id="col9-direction-modal"
            className="relative bg-slate-900 border border-slate-700/80 rounded-2xl p-4 sm:p-5 max-w-sm w-full shadow-2xl space-y-4 cursor-default animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Başlık ve Kapat */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black text-base shadow-inner">
                  9
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-black text-white">
                    9 Nolu Sütun Başlığı
                  </h4>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Kuyu / Kapı Eksen Kaçıklığı (SAĞ, SOL, MRK)
                  </p>
                </div>
              </div>
              <button
                type="button"
                id="btn-close-col9-modal"
                onClick={() => setShowCol9Modal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                title="Kapat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Seçenek Butonları: SAĞ, SOL, MRK */}
            <div className="space-y-2 pt-1">
              {[
                { code: 'SAĞ', title: '9 - SAĞ', desc: 'Sağa Kaçıklık Referansı' },
                { code: 'SOL', title: '9 - SOL', desc: 'Sola Kaçıklık Referansı' },
                { code: 'MRK', title: '9 - MRK', desc: 'Merkez Aks (Sıfır Kaçıklık)' },
              ].map((opt) => {
                const isSelected = column9Direction === opt.code;
                return (
                  <button
                    key={opt.code}
                    type="button"
                    id={`btn-col9-opt-${opt.code}`}
                    onClick={() => {
                      if (onColumn9DirectionChange) {
                        onColumn9DirectionChange(opt.code);
                      }
                      setShowCol9Modal(false);
                    }}
                    className={`w-full min-h-[52px] px-3.5 py-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer select-none active:scale-[0.98] ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/30 text-white shadow-md'
                        : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 hover:border-amber-400/60 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-sm sm:text-base font-black px-3 py-1 rounded-lg transition-colors ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 font-black'
                            : 'bg-slate-900 text-amber-400 border border-slate-700'
                        }`}
                      >
                        {opt.title}
                      </span>
                      <span className="text-xs text-slate-300 font-medium">
                        {opt.desc}
                      </span>
                    </div>
                    {isSelected && (
                      <Check className="w-5 h-5 text-amber-400 stroke-[3]" />
                    )}
                  </button>
                );
              })}

              {/* Sadece 9 (Varsayılan / Kaldır) */}
              <button
                type="button"
                id="btn-col9-opt-reset"
                onClick={() => {
                  if (onColumn9DirectionChange) {
                    onColumn9DirectionChange('');
                  }
                  setShowCol9Modal(false);
                }}
                className={`w-full min-h-[44px] px-3 py-2 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer select-none active:scale-[0.98] ${
                  !column9Direction
                    ? 'bg-slate-800 border-slate-600 text-amber-300 ring-1 ring-amber-500/30'
                    : 'bg-slate-900/60 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Sadece "9" Olarak Bırak (Yönü Kaldır)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
