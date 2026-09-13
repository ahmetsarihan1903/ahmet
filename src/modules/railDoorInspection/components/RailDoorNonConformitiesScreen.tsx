import React, { useState } from 'react';
import {
  RailDoorInspectionFullData,
  RailDoorNonConformityItem,
} from '../types';
import {
  getMeasurementDefsForLayout,
  MEASUREMENTS_MACHINE_CHASSIS,
  getDefaultFloorAlias,
} from '../constants';
import {
  AlertTriangle,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  AlertOctagon,
  FileCheck2,
  ShieldCheck,
  Building,
  Wrench,
  Sliders,
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

  const railDefs = getMeasurementDefsForLayout(data.layoutPosition);
  const chassisDefs = MEASUREMENTS_MACHINE_CHASSIS;
  const stopCount = data.stopCount || 1;
  const startFloor = data.startFloor ?? 0;
  const stopIndices = Array.from({ length: stopCount }, (_, i) => i + 1);
  const columnCodes = Array.from({ length: 15 }, (_, i) => String(i + 1));

  // Otomatik tespit edilen matris sapmaları (>0 mm ve kritik >2 mm)
  const autoMatrixDeviations: {
    stopIndex: number;
    stopLabel: string;
    colCode: string;
    title: string;
    project: string;
    actual: string;
    diff: number;
    isCritical: boolean;
  }[] = [];

  stopIndices.forEach((sIdx) => {
    const floorNum = startFloor + (sIdx - 1);
    const alias = data.floorAliases?.[sIdx] ?? getDefaultFloorAlias(floorNum);
    const stopLabel = `${sIdx}.DR (${alias})`;
    const row = data.floorMatrixMeasurements?.[String(sIdx)] || {};

    columnCodes.forEach((cCode) => {
      const act = row[cCode];
      const nom = data.projectNominalValues?.[cCode];
      if (act && nom && act.trim() !== '' && nom.trim() !== '') {
        const numAct = parseFloat(act);
        const numNom = parseFloat(nom);
        if (!isNaN(numAct) && !isNaN(numNom)) {
          const diff = numAct - numNom;
          if (diff !== 0) {
            const def = railDefs.find((d) => d.code === cCode);
            autoMatrixDeviations.push({
              stopIndex: sIdx,
              stopLabel,
              colCode: cCode,
              title: def?.title || `Sütun ${cCode}`,
              project: nom,
              actual: act,
              diff,
              isCritical: Math.abs(diff) > 2,
            });
          }
        }
      }
    });
  });

  // Otomatik tespit edilen şase sapmaları
  const autoChassisDeviations: {
    code: string;
    title: string;
    project: string;
    actual: string;
    diff: number;
    isCritical: boolean;
  }[] = [];

  chassisDefs.forEach((mDef) => {
    const val = data.machineChassisMeasurements?.[mDef.code];
    if (val && val.projectValueMm && val.actualValueMm) {
      const p = parseFloat(val.projectValueMm);
      const a = parseFloat(val.actualValueMm);
      if (!isNaN(p) && !isNaN(a)) {
        const diff = a - p;
        if (diff !== 0) {
          autoChassisDeviations.push({
            code: mDef.code,
            title: mDef.title,
            project: val.projectValueMm,
            actual: val.actualValueMm,
            diff,
            isCritical: Math.abs(diff) > 2,
          });
        }
      }
    }
  });

  const totalAutoDeviations = autoMatrixDeviations.length + autoChassisDeviations.length;
  const criticalAutoDeviations =
    autoMatrixDeviations.filter((d) => d.isCritical).length +
    autoChassisDeviations.filter((d) => d.isCritical).length;

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

  // Hızlı hazır şablon ekleme
  const handleAddPreset = (title: string, severity: 'low' | 'medium' | 'high' | 'critical') => {
    const newItem: RailDoorNonConformityItem = {
      id: 'nc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      floor: newFloor,
      title,
      severity,
      status: 'open',
      createdAt: Date.now(),
    };

    onUpdateData((prev) => ({
      ...prev,
      nonConformities: [...(prev.nonConformities || []), newItem],
    }));
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

  // Genel Notlar ve Onay Değişimi
  const handleGeneralNotesChange = (notes: string) => {
    onUpdateData((prev) => ({
      ...prev,
      generalNotes: notes,
    }));
  };

  const handleApprovalToggle = () => {
    onUpdateData((prev) => ({
      ...prev,
      isApproved: !prev.isApproved,
    }));
  };

  return (
    <div className="space-y-4 sm:space-y-5 animate-fadeIn">
      {/* 1. ÖZET İSTATİSTİK KARTLARI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
        {/* Toplam Sapma */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-black shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-white">{totalAutoDeviations}</div>
            <div className="text-[11px] text-slate-400 font-medium">Tespit Edilen Ölçü Sapması</div>
          </div>
        </div>

        {/* Kritik Sapmalar (>2mm) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center font-black shrink-0">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-rose-400">{criticalAutoDeviations}</div>
            <div className="text-[11px] text-slate-400 font-medium">Kritik Sapma (&gt; 2 mm)</div>
          </div>
        </div>

        {/* Saha Eksiklikleri / Punch List */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/40 text-sky-400 flex items-center justify-center font-black shrink-0">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-sky-400">{nonConformities.length}</div>
            <div className="text-[11px] text-slate-400 font-medium">Kayıtlı Saha Uygunsuzluğu</div>
          </div>
        </div>
      </div>

      {/* 2. YENİ UYGUNSUZLUK / EKSİKLİK EKLEME FORMU */}
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

        {/* Hızlı Şablon Butonları */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Hızlı Şablonlar:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: 'Ray Eki Çapak/Basamak', sev: 'high' as const },
              { label: 'Konsol Kayması / Gevşek Cıvata', sev: 'critical' as const },
              { label: 'Kapı Düşey Şakül Kaçıklığı', sev: 'high' as const },
              { label: 'Şase Titreşim Takozu Eksik/Hatalı', sev: 'medium' as const },
              { label: 'Lojik Şakül Sapması', sev: 'high' as const },
              { label: 'Ağırlık Kuyu Boşluğu Yetersiz', sev: 'critical' as const },
              { label: 'Kabin Ray DBG Tolerans Dışı', sev: 'critical' as const },
            ].map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleAddPreset(preset.label, preset.sev)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
              >
                + {preset.label}
              </button>
            ))}
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

      {/* 3. KAYITLI UYGUNSUZLUKLAR LİSTESİ */}
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

      {/* 4. OTOMATİK TESPİT EDİLEN ÖLÇÜ VE ŞASE SAPMALARI TABLOSU */}
      {totalAutoDeviations > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Matris & Şase Ölçümlerinden Otomatik Tespit Edilen Sapmalar ({totalAutoDeviations})</span>
            </h4>
          </div>

          <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
            {autoMatrixDeviations.map((dev, idx) => (
              <div
                key={`mat_${idx}`}
                className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="px-1.5 py-0.5 bg-amber-500 text-slate-950 font-black rounded text-[10px]">
                    {dev.colCode}
                  </span>
                  <span className="text-slate-300 font-bold truncate">
                    {dev.stopLabel} - {dev.title}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0 font-mono">
                  <span className="text-slate-400 text-[11px]">Proje: {dev.project} mm</span>
                  <span className="text-slate-200 text-[11px] font-bold">Saha: {dev.actual} mm</span>
                  <span
                    className={`px-2 py-0.5 rounded font-black text-[11px] ${
                      dev.isCritical
                        ? 'bg-rose-950 text-rose-300 border border-rose-600/50'
                        : 'bg-amber-950 text-amber-300 border border-amber-600/50'
                    }`}
                  >
                    {dev.diff > 0 ? `+${dev.diff}` : dev.diff} mm
                  </span>
                </div>
              </div>
            ))}

            {autoChassisDeviations.map((dev, idx) => (
              <div
                key={`ch_${idx}`}
                className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="px-1.5 py-0.5 bg-blue-500 text-white font-black rounded text-[10px]">
                    {dev.code}
                  </span>
                  <span className="text-slate-300 font-bold truncate">
                    Makine Şase - {dev.title}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0 font-mono">
                  <span className="text-slate-400 text-[11px]">Proje: {dev.project} mm</span>
                  <span className="text-slate-200 text-[11px] font-bold">Saha: {dev.actual} mm</span>
                  <span
                    className={`px-2 py-0.5 rounded font-black text-[11px] ${
                      dev.isCritical
                        ? 'bg-rose-950 text-rose-300 border border-rose-600/50'
                        : 'bg-amber-950 text-amber-300 border border-amber-600/50'
                    }`}
                  >
                    {dev.diff > 0 ? `+${dev.diff}` : dev.diff} mm
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. GENEL NOTLAR VE KONTROL ONAYI */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1.5">
            Saha Denetim ve Genel Notlar
          </label>
          <textarea
            value={data.generalNotes || ''}
            onChange={(e) => handleGeneralNotesChange(e.target.value)}
            rows={3}
            placeholder="Montaj durumu, kuyu koşulları veya ek açıklama giriniz..."
            className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl p-3 text-xs text-white outline-none font-medium resize-none"
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={data.isApproved || false}
              onChange={handleApprovalToggle}
              className="w-5 h-5 rounded border-slate-700 text-amber-500 focus:ring-amber-500 bg-slate-950 cursor-pointer"
            />
            <div className="text-xs">
              <span className="font-bold text-white block">Saha Kontrolü Onaylandı</span>
              <span className="text-[10px] text-slate-400">
                Bu kontrol formundaki değerler sahada ölçülmüş ve onaylanmıştır.
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* 6. EN ALT TEK SATIR: SADECE RAPOR BUTONU */}
      <div className="pt-2">
        <button
          type="button"
          id="btn-view-report-nonconformities"
          onClick={onViewReport}
          className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-sm font-black rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer tracking-wide uppercase"
        >
          <FileCheck2 className="w-5 h-5 text-slate-950" />
          <span>Raporu Önizle ve Yazdır</span>
        </button>
      </div>
    </div>
  );
};
