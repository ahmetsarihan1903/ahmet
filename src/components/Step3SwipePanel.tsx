import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  Ruler,
  Cpu,
  Cog,
  ArrowUpCircle,
  Anchor,
  Layers,
  Sliders,
  DoorOpen,
  ChevronLeft,
  ChevronRight,
  Plus,
  FileCheck2,
} from 'lucide-react';
import { InspectionItem, MeasureItem, ElevatorType } from '../types';
import { InspectionItemCard } from './InspectionItemCard';
import { MeasuresTab } from './MeasuresTab';
import { AddExtraItemModal } from './AddExtraItemModal';

interface Step3SwipePanelProps {
  elevatorType: ElevatorType;
  activeTab: number;
  onTabChange: (tabIndex: number) => void;

  measures: MeasureItem[];
  controlPanelItems: InspectionItem[];
  motorChassisItems: InspectionItem[];
  cabinTopItems: InspectionItem[];
  counterweightItems: InspectionItem[];
  shaftAndPitItems: InspectionItem[];
  cabinAndFloorButtonsItems: InspectionItem[];
  doorsItems: InspectionItem[];

  onAddMeasure: (m: MeasureItem) => void;
  onUpdateMeasure: (id: string, updated: Partial<MeasureItem>) => void;
  onDeleteMeasure: (id: string) => void;

  onToggleUD: (categoryKey: string, id: string) => void;
  onDescriptionChange: (categoryKey: string, id: string, desc: string) => void;
  onAddExtraItem: (categoryKey: string, title: string) => void;
  onDeleteCustomItem: (categoryKey: string, id: string) => void;

  onFinishAudit: () => void;
}

export const Step3SwipePanel: React.FC<Step3SwipePanelProps> = ({
  elevatorType,
  activeTab,
  onTabChange,
  measures,
  controlPanelItems,
  motorChassisItems,
  cabinTopItems,
  counterweightItems,
  shaftAndPitItems,
  cabinAndFloorButtonsItems,
  doorsItems,
  onAddMeasure,
  onUpdateMeasure,
  onDeleteMeasure,
  onToggleUD,
  onDescriptionChange,
  onAddExtraItem,
  onDeleteCustomItem,
  onFinishAudit,
}) => {
  const [modalCategory, setModalCategory] = useState<{ key: string; name: string } | null>(null);

  // Swipe detection touch coordinates
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const tabsContainerRef = useRef<HTMLDivElement>(null);

  // Count non-compliant items per tab
  const tabCounts = useMemo(() => {
    const countUD = (items: InspectionItem[]) => items.filter((it) => it.isNonCompliant).length;

    return [
      measures.length, // Tab 0: count of measures
      countUD(controlPanelItems), // Tab 1
      countUD(motorChassisItems), // Tab 2
      countUD(cabinTopItems), // Tab 3
      countUD(counterweightItems), // Tab 4
      countUD(shaftAndPitItems), // Tab 5
      countUD(cabinAndFloorButtonsItems), // Tab 6
      countUD(doorsItems), // Tab 7
    ];
  }, [
    measures,
    controlPanelItems,
    motorChassisItems,
    cabinTopItems,
    counterweightItems,
    shaftAndPitItems,
    cabinAndFloorButtonsItems,
    doorsItems,
  ]);

  const totalUDCount = useMemo(() => {
    return (
      tabCounts[1] +
      tabCounts[2] +
      tabCounts[3] +
      tabCounts[4] +
      tabCounts[5] +
      tabCounts[6] +
      tabCounts[7]
    );
  }, [tabCounts]);

  // Tab definitions (allowExtra is enabled for all pages except Tab 0 / Page 1 and Tab 7 / Page 8)
  const tabs = [
    { id: 0, title: 'Ölçü Kontrolleri', icon: Ruler, allowExtra: false, key: 'measures' },
    { id: 1, title: 'Kumanda Panosu', icon: Cpu, allowExtra: true, key: 'controlPanel' },
    { id: 2, title: `Motor / Şase (${elevatorType})`, icon: Cog, allowExtra: true, key: 'motorChassis' },
    { id: 3, title: 'Kabin Üstü', icon: ArrowUpCircle, allowExtra: true, key: 'cabinTop' },
    { id: 4, title: 'Ağırlık Karkası', icon: Anchor, allowExtra: true, key: 'counterweight' },
    { id: 5, title: 'Kuyu ve Kuyu Dibi', icon: Layers, allowExtra: true, key: 'shaftAndPit' },
    { id: 6, title: 'Kabin & Butonlar', icon: Sliders, allowExtra: true, key: 'cabinAndButtons' },
    { id: 7, title: 'Kapı Montajları', icon: DoorOpen, allowExtra: false, key: 'doors' },
  ];

  // Auto-scroll active tab into view in the horizontal tabs bar
  useEffect(() => {
    if (tabsContainerRef.current) {
      const activeBtn = tabsContainerRef.current.querySelector(`#tab-btn-${activeTab}`) as HTMLElement;
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeTab]);

  // Touch Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const deltaX = touchStartX.current - touchEndX;
    const deltaY = touchStartY.current - touchEndY;

    // Only swipe if horizontal move is significantly larger than vertical scroll
    if (Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      if (deltaX > 0 && activeTab < tabs.length - 1) {
        // Swiped Left -> Next Tab
        onTabChange(activeTab + 1);
      } else if (deltaX < 0 && activeTab > 0) {
        // Swiped Right -> Previous Tab
        onTabChange(activeTab - 1);
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  const currentTabInfo = tabs[activeTab];

  return (
    <div
      className="max-w-3xl mx-auto py-2 sm:py-3 px-3 sm:px-4 pb-36 sm:pb-48"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Sticky Top Header Navigation & Controls (Fixed at the very top of pages) */}
      <div className="sticky top-12 sm:top-14 z-30 bg-slate-100 border-b-2 border-slate-300 -mx-3 sm:-mx-4 px-3 sm:px-4 mb-3 shadow-sm">
        {/* Navigation Action Buttons: Önceki | DENETİMİ BİTİR | Sonraki */}
        <div className="py-2.5 flex items-center justify-between gap-2 border-b-2 border-slate-200">
          {/* Önceki Button */}
          <button
            type="button"
            id="btn-top-prev-tab"
            disabled={activeTab === 0}
            onClick={() => onTabChange(Math.max(0, activeTab - 1))}
            className={`min-h-[44px] px-3.5 py-2 rounded-lg font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shrink-0 select-none ${
              activeTab === 0
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed border-2 border-slate-300'
                : 'bg-white hover:bg-slate-200 text-slate-900 border-2 border-slate-300 active:scale-95 cursor-pointer shadow-xs'
            }`}
            title="Önceki Sayfaya Geç"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="inline">Önceki</span>
          </button>

          {/* Prominent DENETİMİ BİTİR Button */}
          <button
            type="button"
            id="btn-top-finish-audit"
            onClick={onFinishAudit}
            className="min-h-[44px] flex-1 max-w-md py-2 px-2.5 sm:px-4 rounded-lg font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-1.5 sm:gap-2 bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white shadow-md border-2 border-red-800 transition-all cursor-pointer select-none"
            title="Denetimi Bitir ve Rapor Ekranına Geç"
          >
            <FileCheck2 className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            <span className="truncate">DENETİMİ BİTİR {totalUDCount > 0 ? `(${totalUDCount} Hata)` : ''}</span>
          </button>

          {/* Sonraki Button */}
          <button
            type="button"
            id="btn-top-next-tab"
            disabled={activeTab === tabs.length - 1}
            onClick={() => onTabChange(Math.min(tabs.length - 1, activeTab + 1))}
            className={`min-h-[44px] px-3.5 py-2 rounded-lg font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shrink-0 select-none ${
              activeTab === tabs.length - 1
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed border-2 border-slate-300'
                : 'bg-orange-500 hover:bg-orange-600 active:scale-95 text-white border-2 border-orange-700 shadow-md cursor-pointer'
            }`}
            title="Sonraki Sayfaya Geç"
          >
            <span className="inline">Sonraki</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* 8 Swipe Tabs Horizontal Bar */}
        <div
          ref={tabsContainerRef}
          className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1.5"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const count = tabCounts[tab.id];
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                id={`tab-btn-${tab.id}`}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 sm:py-2.5 border-b-4 text-xs font-black uppercase tracking-tight shrink-0 transition-all cursor-pointer rounded-t-lg ${
                  isActive
                    ? 'border-blue-600 text-blue-900 bg-white shadow-xs'
                    : 'border-transparent text-slate-600 hover:text-slate-950 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="whitespace-nowrap">{tab.id + 1}. {tab.title}</span>

                {/* Badge */}
                {tab.id === 0 ? (
                  count > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-black bg-blue-100 text-blue-900 border border-blue-300">
                      {count}
                    </span>
                  )
                ) : count > 0 ? (
                  <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-black bg-red-600 text-white shadow-xs">
                    {count} UD
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* Current Page Banner & Info */}
      <div className="bg-white rounded-xl p-3.5 sm:p-4 shadow-xs border-2 border-slate-300 mb-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-800 border-2 border-slate-300">
            Sayfa {activeTab + 1} / 8
          </span>
          <h2 className="text-sm sm:text-base font-black text-slate-950">
            {currentTabInfo.title}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-slate-700">
            {activeTab === 0
              ? `${measures.length} Saha Ölçüsü`
              : `${tabCounts[activeTab]} Uygunsuzluk`}
          </span>
        </div>
      </div>

      {/* Tab Contents */}
      <div className="space-y-3">
        {/* Tab 0: ÖLÇÜ KONTROLLERİ */}
        {activeTab === 0 && (
          <MeasuresTab
            measures={measures}
            onAddMeasure={onAddMeasure}
            onUpdateMeasure={onUpdateMeasure}
            onDeleteMeasure={onDeleteMeasure}
          />
        )}

        {/* Tab 1: KUMANDA PANOSU */}
        {activeTab === 1 && (
          <div className="space-y-3">
            {controlPanelItems.map((item, idx) => (
              <InspectionItemCard
                key={item.id}
                item={item}
                index={idx}
                onToggleUD={(id) => onToggleUD('controlPanel', id)}
                onDescriptionChange={(id, desc) => onDescriptionChange('controlPanel', id, desc)}
                onDeleteCustomItem={(id) => onDeleteCustomItem('controlPanel', id)}
              />
            ))}
          </div>
        )}

        {/* Tab 2: MOTOR / ŞASE (Dinamik MR / MRL) */}
        {activeTab === 2 && (
          <div className="space-y-3">
            <div className="bg-white p-3.5 rounded-xl border-2 border-slate-300 text-xs text-slate-800 flex items-center justify-between shadow-xs">
              <span className="font-black text-slate-950">Asansör Yapısı: {elevatorType === 'MR' ? 'Makine Daireli (MR)' : 'Makine Dairesiz (MRL)'}</span>
              <span className="text-slate-600 font-bold">{motorChassisItems.length} Kontrol Maddesi</span>
            </div>
            {motorChassisItems.map((item, idx) => (
              <InspectionItemCard
                key={item.id}
                item={item}
                index={idx}
                onToggleUD={(id) => onToggleUD('motorChassis', id)}
                onDescriptionChange={(id, desc) => onDescriptionChange('motorChassis', id, desc)}
                onDeleteCustomItem={(id) => onDeleteCustomItem('motorChassis', id)}
              />
            ))}
          </div>
        )}

        {/* Tab 3: KABİN ÜSTÜ KONTROLLERİ */}
        {activeTab === 3 && (
          <div className="space-y-3">
            {cabinTopItems.map((item, idx) => (
              <InspectionItemCard
                key={item.id}
                item={item}
                index={idx}
                onToggleUD={(id) => onToggleUD('cabinTop', id)}
                onDescriptionChange={(id, desc) => onDescriptionChange('cabinTop', id, desc)}
                onDeleteCustomItem={(id) => onDeleteCustomItem('cabinTop', id)}
              />
            ))}
          </div>
        )}

        {/* Tab 4: AĞIRLIK KARKASI KONTROLLERİ */}
        {activeTab === 4 && (
          <div className="space-y-3">
            {counterweightItems.map((item, idx) => (
              <InspectionItemCard
                key={item.id}
                item={item}
                index={idx}
                onToggleUD={(id) => onToggleUD('counterweight', id)}
                onDescriptionChange={(id, desc) => onDescriptionChange('counterweight', id, desc)}
                onDeleteCustomItem={(id) => onDeleteCustomItem('counterweight', id)}
              />
            ))}
          </div>
        )}

        {/* Tab 5: KUYU İÇERİSİ VE KUYU DİBİ */}
        {activeTab === 5 && (
          <div className="space-y-3">
            {shaftAndPitItems.map((item, idx) => (
              <InspectionItemCard
                key={item.id}
                item={item}
                index={idx}
                onToggleUD={(id) => onToggleUD('shaftAndPit', id)}
                onDescriptionChange={(id, desc) => onDescriptionChange('shaftAndPit', id, desc)}
                onDeleteCustomItem={(id) => onDeleteCustomItem('shaftAndPit', id)}
              />
            ))}
          </div>
        )}

        {/* Tab 6: KABİN İÇİ VE KAT BUTONLARI */}
        {activeTab === 6 && (
          <div className="space-y-3">
            {cabinAndFloorButtonsItems.map((item, idx) => (
              <InspectionItemCard
                key={item.id}
                item={item}
                index={idx}
                onToggleUD={(id) => onToggleUD('cabinAndButtons', id)}
                onDescriptionChange={(id, desc) => onDescriptionChange('cabinAndButtons', id, desc)}
                onDeleteCustomItem={(id) => onDeleteCustomItem('cabinAndButtons', id)}
              />
            ))}
          </div>
        )}

        {/* Tab 7: KABİN VE KAT KAPISI MONTAJLARI (No Extra Item Button) */}
        {activeTab === 7 && (
          <div className="space-y-3">
            <div className="bg-white p-3.5 rounded-xl border-2 border-slate-300 text-xs text-slate-800 shadow-xs">
              <span className="font-black text-slate-950 block">Otomatik Oluşturulan Kat Kapısı Matrisi</span>
              <span className="text-slate-600 text-xs block mt-1 font-medium">
                Kabin kapısı ve tüm katların durak kapı kontrolleri listelenmiştir. Uygunsuzluk tespit edilen katın [ UD ] butonuna basınız.
              </span>
            </div>
            {doorsItems.map((item, idx) => (
              <InspectionItemCard
                key={item.id}
                item={item}
                index={idx}
                onToggleUD={(id) => onToggleUD('doors', id)}
                onDescriptionChange={(id, desc) => onDescriptionChange('doors', id, desc)}
              />
            ))}
          </div>
        )}

        {/* + Ekstra Madde Ekle Button */}
        {currentTabInfo.allowExtra && activeTab !== 0 && (
          <div className="pt-2">
            <button
              type="button"
              id="btn-add-extra-item"
              onClick={() => setModalCategory({ key: currentTabInfo.key, name: currentTabInfo.title })}
              className="w-full py-3.5 px-4 rounded-xl border-2 border-dashed border-slate-400 hover:border-slate-600 bg-white hover:bg-slate-50 text-slate-900 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4 text-blue-600" />
              <span>[ + Ekstra Madde Ekle ]</span>
            </button>
          </div>
        )}
      </div>

      {/* Extra Bottom Clearance Scroll Space (3+ satırlık rahat kaydırma payı) */}
      <div className="h-32 sm:h-40 w-full pointer-events-none" aria-hidden="true" />

      {/* Extra Item Modal */}
      {modalCategory && (
        <AddExtraItemModal
          categoryName={modalCategory.name}
          isOpen={!!modalCategory}
          onClose={() => setModalCategory(null)}
          onAdd={(title) => onAddExtraItem(modalCategory.key, title)}
        />
      )}
    </div>
  );
};
