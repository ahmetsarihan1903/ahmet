import React, { useState } from 'react';
import {
  RailDoorInspectionFullData,
  RailDoorNonConformityItem,
} from '../types';
import { getDefaultFloorAlias } from '../constants';
import {
  Plus,
  Trash2,
  Clock,
  FileCheck2,
  Check,
} from 'lucide-react';

interface RailDoorNonConformitiesScreenProps {
  data: RailDoorInspectionFullData;
  onUpdateData: (updater: (prev: RailDoorInspectionFullData) => RailDoorInspectionFullData) => void;
  onViewReport: () => void;
}

export const RailDoorNonConformitiesScreen: React.FC<RailDoorNonConformitiesScreenProps> = ({
  data,
  onUpdateData,
  onViewReport,
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [newFloor, setNewFloor] = useState('Tüm Kuyu');
  const [newSeverity, setNewSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('high');
  const [newDescription, setNewDescription] = useState('');

  const stopCount = data.stopCount || 1;
  const startFloor = data.startFloor ?? 0;
  const stopIndices = Array.from({ length: stopCount }, (_, i) => i + 1);

  const nonConformities = data.nonConformities || [];

  // Manuel uygunsuzluk ekleme
  const handleAddNonConformity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newItem: RailDoorNonConformityItem = {
      id: 'nc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      floor: newFloor,
      title: newTitle.trim(),
      description: newDescription.trim() || undefined,
      severity: newSeverity,
      status: 'open',
      createdAt: Date.now(),
    };

    onUpdateData((prev) => ({
      ...prev,
      nonConformities: [...(prev.nonConformities || []), newItem],
    }));

    setNewTitle('');
    setNewDescription('');
  };

  // Silme
  const handleDeleteItem = (id: string) => {
    onUpdateData((prev) => ({
      ...prev,
      nonConformities: (prev.nonConformities || []).filter((item) => item.id !== id),
    }));
  };

  // Durum değiştirme (Açık <-> Giderildi)
  const handleToggleStatus = (id: string) => {
    onUpdateData((prev) => ({
      ...prev,
      nonConformities: (prev.nonConformities || []).map((item) => {
        if (item.id === id) {
          const nextStatus = item.status === 'open' ? 'resolved' : 'open';
          return { ...item, status: nextStatus };
        }
        return item;
      }),
    }));
  };

  return (
    <div className="space-y-4 sm:space-y-5 animate-fadeIn">
      {/* 1. YENİ UYGUNSUZLUK / EKSİKLİK EKLEME FORMU (EKLE SATIRI) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
            <Plus className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white">Saha Uygunsuzluğu / Kusur Kaydı Ekle</h3>
            <p className="text-[11px] text-slate-400">
              Montaj ve denetim esnasında tespit edilen mekanik ve yapısal kusurları kaydedin.
            </p>
          </div>
        </div>

        {/* Form Alanı */}
        <form onSubmit={handleAddNonConformity} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          {/* Durak / Konum Seçimi */}
          <div className="sm:col-span-3">
            <label className="text-[10px] font-bold text-slate-400 block mb-1">Konum / Durak</label>
            <select
              value={newFloor}
              onChange={(e) => setNewFloor(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer"
            >
              <option value="Tüm Kuyu">Tüm Kuyu / Genel</option>
              <option value="Makine Dairesi / Tavan">Makine Dairesi / Tavan</option>
              <option value="Kuyu Dibi (PİT)">Kuyu Dibi (PİT)</option>
              {stopIndices.map((sIdx) => {
                const floorNum = startFloor + (sIdx - 1);
                const alias = data.floorAliases?.[sIdx] ?? getDefaultFloorAlias(floorNum);
                return (
                  <option key={sIdx} value={`${sIdx}.DR (${alias})`}>
                    {sIdx}.DR ({alias})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Önem Derecesi */}
          <div className="sm:col-span-3">
            <label className="text-[10px] font-bold text-slate-400 block mb-1">Önem Seviyesi</label>
            <select
              value={newSeverity}
              onChange={(e) => setNewSeverity(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer"
            >
              <option value="critical">🔴 Kritik (&gt; 2mm / Güvenlik)</option>
              <option value="high">🟠 Yüksek (Standart Dışı)</option>
              <option value="medium">🟡 Orta (Gözden Geçirilmeli)</option>
              <option value="low">🔵 Düşük (Kozmetik / İnce Ayar)</option>
            </select>
          </div>

          {/* Başlık / Kusur */}
          <div className="sm:col-span-6">
            <label className="text-[10px] font-bold text-slate-400 block mb-1">Uygunsuzluk Tanımı</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Örn: 2. Kat kapı sol dikme şakülü 3mm dışarıda..."
                className="flex-1 bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white outline-none font-medium"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Ekle</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* 2. KAYITLI UYGUNSUZLUKLAR LİSTESİ */}
      {nonConformities.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
          <h4 className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center justify-between">
            <span>Kayıtlı Saha Kusurları & İyileştirme Listesi</span>
            <span className="text-[10px] font-bold text-slate-400">
              {nonConformities.filter((i) => i.status === 'resolved').length} / {nonConformities.length} Çözüldü
            </span>
          </h4>

          <div className="space-y-2">
            {nonConformities.map((item) => {
              const isResolved = item.status === 'resolved';
              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                    isResolved
                      ? 'bg-emerald-950/20 border-emerald-600/40 opacity-75'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(item.id)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer shrink-0 mt-0.5 ${
                        isResolved
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-800 text-slate-400 hover:bg-amber-500 hover:text-slate-950'
                      }`}
                      title={isResolved ? 'Açık duruma getir' : 'Giderildi olarak işaretle'}
                    >
                      {isResolved ? <Check className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {item.floor && (
                          <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px] font-bold">
                            {item.floor}
                          </span>
                        )}
                        <span
                          className={`text-xs font-bold ${
                            isResolved ? 'line-through text-slate-400' : 'text-white'
                          }`}
                        >
                          {item.title}
                        </span>
                        <span
                          className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                            item.severity === 'critical'
                              ? 'bg-rose-950 text-rose-300 border border-rose-600/50'
                              : item.severity === 'high'
                              ? 'bg-amber-950 text-amber-300 border border-amber-600/50'
                              : item.severity === 'medium'
                              ? 'bg-yellow-950 text-yellow-300 border border-yellow-600/50'
                              : 'bg-blue-950 text-blue-300 border border-blue-600/50'
                          }`}
                        >
                          {item.severity === 'critical'
                            ? 'Kritik'
                            : item.severity === 'high'
                            ? 'Yüksek'
                            : item.severity === 'medium'
                            ? 'Orta'
                            : 'Düşük'}
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-[11px] text-slate-400 mt-1">{item.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(item.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                        isResolved
                          ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                      }`}
                    >
                      {isResolved ? 'Giderildi' : 'Giderilmedi (Açık)'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1.5 bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-300 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                      title="Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* RAPOR BUTONU */}
      <div className="pt-3">
        <button
          type="button"
          id="btn-view-report-nonconformities"
          onClick={onViewReport}
          className="btn-amber-action w-full py-4 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 text-sm sm:text-base font-black rounded-2xl flex items-center justify-center gap-2.5 transition-all shadow-xl shadow-amber-500/25 cursor-pointer tracking-wide uppercase border-2 border-amber-600"
        >
          <FileCheck2 className="w-6 h-6 text-slate-950" />
          <span>Raporu Önizle ve Yazdır</span>
        </button>
      </div>
    </div>
  );
};
