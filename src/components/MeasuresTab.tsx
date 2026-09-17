import React, { useState } from 'react';
import { Plus, Ruler, Trash2, Edit2, Check, X, ShieldCheck, Calendar, Lock } from 'lucide-react';
import { MeasureItem } from '../types';
import { SmartTextInput } from './SmartTextInput';

interface MeasuresTabProps {
  measures: MeasureItem[];
  onAddMeasure: (item: MeasureItem) => void;
  onUpdateMeasure: (id: string, updated: Partial<MeasureItem>) => void;
  onDeleteMeasure: (id: string) => void;
}

export const MeasuresTab: React.FC<MeasuresTabProps> = ({
  measures,
  onAddMeasure,
  onUpdateMeasure,
  onDeleteMeasure,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // New measure draft state
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [notes, setNotes] = useState('');

  // Edit draft state
  const [editName, setEditName] = useState('');
  const [editValue, setEditValue] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const handleStartAdd = () => {
    setName('');
    setValue('');
    setNotes('');
    setIsAdding(true);
  };

  const handleSaveNew = () => {
    if (!name.trim() || !value.trim()) return;

    const newMeasure: MeasureItem = {
      id: `measure_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      value: value.trim(),
      notes: notes.trim(),
      isFixed: false,
    };

    onAddMeasure(newMeasure);
    setIsAdding(false);
    setName('');
    setValue('');
    setNotes('');
  };

  const handleStartEdit = (m: MeasureItem) => {
    setEditingId(m.id);
    setEditName(m.name);
    setEditValue(m.value);
    setEditNotes(m.notes || '');
  };

  const handleSaveEdit = (id: string, isFixed?: boolean) => {
    if (!editName.trim()) return;

    onUpdateMeasure(id, {
      name: isFixed ? undefined : editName.trim(), // Keep fixed item title immutable
      value: editValue.trim(),
      notes: editNotes.trim(),
    });
    setEditingId(null);
  };

  const handleQuickValueChange = (id: string, newValue: string) => {
    onUpdateMeasure(id, { value: newValue });
  };

  const handleQuickNotesChange = (id: string, newNotes: string) => {
    onUpdateMeasure(id, { notes: newNotes });
  };

  return (
    <div className="space-y-3">
      {/* Introduction Card */}
      <div className="bg-slate-900 p-3 sm:p-4 rounded border border-slate-800">
        <div className="flex items-center gap-2 text-slate-200 font-bold text-xs sm:text-sm mb-1">
          <Ruler className="w-4 h-4 text-blue-400" />
          <span className="uppercase tracking-wider">Saha Ölçü & Mesafe Kontrolleri</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Bakım günü, limit kesiciler, tampon mesafeleri ve sahada alınan diğer ölçümleri giriniz.
          Girilen tüm değerler ve açıklamalar kalite kontrol raporuna doğrudan aktarılır.
        </p>
      </div>

      {/* Adding form inline modal box */}
      {isAdding && (
        <div className="bg-slate-900 p-3.5 rounded border border-blue-500/60 shadow-lg space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-blue-400" />
              <span>Yeni Ekstra Saha Ölçüsü Ekle</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="p-1 text-slate-400 hover:text-slate-200 rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <SmartTextInput
              id="input-measure-name"
              label="ÖLÇÜ ADI"
              value={name}
              onChange={setName}
              placeholder="Örn: Ray Arası Açıklığı, Halat Çapı"
              required
            />
            <SmartTextInput
              id="input-measure-value"
              label="ÖLÇÜLEN DEĞER"
              value={value}
              onChange={setValue}
              placeholder="Örn: 23 cm, 1450 mm, Uygun"
              required
            />
          </div>

          <SmartTextInput
            id="input-measure-notes"
            label="AÇIKLAMA (İSTEĞE BAĞLI)"
            value={notes}
            onChange={setNotes}
            placeholder="Örn: Sol ve sağ taraf kontrol edildi, standart dahilinde."
            isTextarea
            rows={2}
          />

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="button"
              disabled={!name.trim() || !value.trim()}
              onClick={handleSaveNew}
              className={`px-3.5 py-1.5 text-xs font-bold rounded flex items-center gap-1 cursor-pointer ${
                name.trim() && value.trim()
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>Ölçüyü Kaydet</span>
            </button>
          </div>
        </div>
      )}

      {/* List of Entered Measures (Fixed + Custom) */}
      <div className="space-y-3">
        {measures.map((m, idx) => {
          const isFixed = m.isFixed || m.id.startsWith('fixed_');
          const isBakimGunu = m.id === 'fixed_bakim_gunu' || m.name.toUpperCase().includes('BAKIM GÜNÜ');

          return (
            <div
              key={m.id}
              className={`bg-slate-900 p-3 sm:p-4 rounded border transition-all ${
                isFixed
                  ? 'border-slate-800 hover:border-blue-500/50'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {editingId === m.id ? (
                <div className="space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {isFixed ? (
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                          ÖLÇÜ ADI (Sabit Madde)
                        </label>
                        <div className="py-2 px-3 bg-slate-950 rounded border border-slate-800 text-xs font-bold text-slate-200 flex items-center justify-between">
                          <span>{m.name}</span>
                          <Lock className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      </div>
                    ) : (
                      <SmartTextInput
                        id={`edit-mname-${m.id}`}
                        label="ÖLÇÜ ADI"
                        value={editName}
                        onChange={setEditName}
                        required
                      />
                    )}

                    <SmartTextInput
                      id={`edit-mval-${m.id}`}
                      label="ÖLÇÜLEN DEĞER"
                      value={editValue}
                      onChange={setEditValue}
                      placeholder={isBakimGunu ? 'Örn: 15.04.2025 veya Her Ayın 15i' : 'Örn: 25 cm, 140 mm'}
                      required
                    />
                  </div>

                  <SmartTextInput
                    id={`edit-mnotes-${m.id}`}
                    label="AÇIKLAMA (İSTEĞE BAĞLI)"
                    value={editNotes}
                    onChange={setEditNotes}
                    placeholder="Ekstra açıklama veya saha notu..."
                    isTextarea
                    rows={2}
                  />

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 cursor-pointer"
                    >
                      İptal
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(m.id, isFixed)}
                      className="px-3 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded cursor-pointer"
                    >
                      Kaydet
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {/* Row 1: Header - ÖLÇÜ ADI */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <span className="text-[10px] font-mono text-slate-400 font-bold bg-slate-800/80 px-1.5 py-0.5 rounded">
                        #{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          ÖLÇÜ ADI
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-100 truncate">
                          {m.name}
                        </h4>
                      </div>
                      {isFixed && (
                        <span className="px-1.5 py-0.5 text-[9px] font-bold bg-blue-950/60 text-blue-400 border border-blue-500/30 rounded uppercase tracking-wider">
                          Sabit Ölçü
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(m)}
                        title="Düzenle"
                        className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {!isFixed && (
                        <button
                          type="button"
                          onClick={() => onDeleteMeasure(m.id)}
                          title="Bu Ekstra Ölçüyü Sil"
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Form Inputs with explicit headers ÖLÇÜLEN DEĞER & AÇIKLAMA (İSTEĞE BAĞLI) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
                    <SmartTextInput
                      id={`measure-val-${m.id}`}
                      label="ÖLÇÜLEN DEĞER"
                      value={m.value || ''}
                      onChange={(val) => handleQuickValueChange(m.id, val)}
                      placeholder={
                        isBakimGunu
                          ? 'Örn: 15.04.2025 veya Her Ayın 15i'
                          : 'Örn: 25 cm, 150 mm'
                      }
                      required
                    />
                    <SmartTextInput
                      id={`measure-notes-${m.id}`}
                      label="AÇIKLAMA (İSTEĞE BAĞLI)"
                      value={m.notes || ''}
                      onChange={(n) => handleQuickNotesChange(m.id, n)}
                      placeholder="Saha notu veya açıklama yazınız..."
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Add button */}
      {!isAdding && (
        <div className="pt-2">
          <button
            type="button"
            id="btn-add-extra-measure"
            onClick={handleStartAdd}
            className="w-full py-3 px-3 border border-dashed border-slate-700 hover:border-slate-500 bg-slate-900 hover:bg-slate-850 rounded text-slate-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-blue-400" />
            <span>[ + ÖLÇÜ EKLE ]</span>
          </button>
        </div>
      )}
    </div>
  );
};
