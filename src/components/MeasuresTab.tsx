import React, { useState } from 'react';
import { Plus, Ruler, Trash2, Edit2, Check, X, AlertCircle } from 'lucide-react';
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

  const handleSaveEdit = (id: string) => {
    if (!editName.trim() || !editValue.trim()) return;

    onUpdateMeasure(id, {
      name: editName.trim(),
      value: editValue.trim(),
      notes: editNotes.trim(),
    });
    setEditingId(null);
  };

  return (
    <div className="space-y-3">
      {/* Introduction Card */}
      <div className="bg-slate-900 p-3 sm:p-4 rounded border border-slate-800">
        <div className="flex items-center gap-2 text-slate-200 font-bold text-xs sm:text-sm mb-1">
          <Ruler className="w-4 h-4 text-blue-400" />
          <span className="uppercase tracking-wider">Saha Ölçü Kontrolleri</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Kuyu dibi, ray açıklıkları, kuyu üstü ve kabin boyutları gibi sahada alınan ölçümleri giriniz.
          Girilen değerler doğrudan rapora işlenir.
        </p>
      </div>

      {/* Adding form modal / inline box */}
      {isAdding ? (
        <div className="bg-slate-900 p-3.5 rounded border border-blue-500/60 shadow-lg space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-blue-400" />
              <span>Yeni Saha Ölçüsü Ekle</span>
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
              label="Ölçü Adı"
              value={name}
              onChange={setName}
              placeholder="Örn: Ray Arası Açıklığı, Kuyu Dibi"
              required
            />
            <SmartTextInput
              id="input-measure-value"
              label="Ölçülen Değer"
              value={value}
              onChange={setValue}
              placeholder="Örn: 23 cm, 1450 mm"
              required
            />
          </div>

          <SmartTextInput
            id="input-measure-notes"
            label="Açıklama (İsteğe Bağlı)"
            value={notes}
            onChange={setNotes}
            placeholder="Örn: Sol ve sağ taraf kontrol edildi, sapma yok."
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
      ) : null}

      {/* List of Entered Measures */}
      {measures.length === 0 && !isAdding ? (
        <div className="bg-slate-900 p-5 rounded border border-dashed border-slate-800 text-center space-y-2.5">
          <div className="w-10 h-10 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto border border-slate-700">
            <Ruler className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-slate-200 uppercase tracking-wider">Henüz ölçü eklenmedi</h4>
            <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs mx-auto">
              Sahada alınan mekanik veya elektriksel ölçüleri listelemek için aşağıdaki butona basınız.
            </p>
          </div>
          <button
            type="button"
            id="btn-add-measure-empty"
            onClick={handleStartAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded shadow-md transition-all uppercase tracking-wider cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>[ + ÖLÇÜ EKLE ]</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {measures.map((m, idx) => (
            <div
              key={m.id}
              className="bg-slate-900 p-3 sm:p-3.5 rounded border border-slate-800 transition-all"
            >
              {editingId === m.id ? (
                <div className="space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <SmartTextInput
                      id={`edit-mname-${m.id}`}
                      label="Ölçü Adı"
                      value={editName}
                      onChange={setEditName}
                      required
                    />
                    <SmartTextInput
                      id={`edit-mval-${m.id}`}
                      label="Ölçülen Değer"
                      value={editValue}
                      onChange={setEditValue}
                      required
                    />
                  </div>
                  <SmartTextInput
                    id={`edit-mnotes-${m.id}`}
                    label="Açıklama"
                    value={editNotes}
                    onChange={setEditNotes}
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
                      onClick={() => handleSaveEdit(m.id)}
                      className="px-3 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded cursor-pointer"
                    >
                      Güncelle
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-slate-400">
                        #{idx + 1}
                      </span>
                      <h4 className="text-xs sm:text-sm font-semibold text-slate-200">{m.name}</h4>
                    </div>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-[11px] text-slate-400 uppercase font-mono">Değer:</span>
                      <span className="text-xs font-mono font-bold text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded border border-blue-400/40">
                        {m.value}
                      </span>
                    </div>
                    {m.notes && (
                      <p className="mt-1.5 text-xs text-slate-300 bg-slate-950 p-2 rounded border border-slate-800 break-words">
                        {m.notes}
                      </p>
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
                    <button
                      type="button"
                      onClick={() => onDeleteMeasure(m.id)}
                      title="Sil"
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Bottom Add button */}
          {!isAdding && (
            <div className="pt-1.5">
              <button
                type="button"
                id="btn-add-extra-measure"
                onClick={handleStartAdd}
                className="w-full py-2.5 px-3 border border-dashed border-slate-700 hover:border-slate-500 bg-slate-900 hover:bg-slate-850 rounded text-slate-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-blue-400" />
                <span>[ + ÖLÇÜ EKLE ]</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
