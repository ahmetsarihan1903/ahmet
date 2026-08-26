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
      <div className="bg-white p-4 rounded-xl border-2 border-slate-300 shadow-xs">
        <div className="flex items-center gap-2 text-slate-950 font-black text-xs sm:text-sm mb-1">
          <Ruler className="w-4 h-4 text-blue-600" />
          <span className="uppercase tracking-wider">Saha Ölçü Kontrolleri</span>
        </div>
        <p className="text-xs text-slate-600 font-medium leading-relaxed">
          Kuyu dibi, ray açıklıkları, kuyu üstü ve kabin boyutları gibi sahada alınan ölçümleri giriniz.
          Girilen değerler doğrudan rapora işlenir.
        </p>
      </div>

      {/* Adding form modal / inline box */}
      {isAdding ? (
        <div className="bg-white p-4 rounded-xl border-2 border-blue-600 shadow-md space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between pb-2 border-b-2 border-slate-200">
            <h3 className="font-black text-xs uppercase tracking-wider text-slate-950 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-blue-600" />
              <span>Yeni Saha Ölçüsü Ekle</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="p-1 text-slate-500 hover:text-slate-800 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              className="px-3.5 py-2 text-xs font-black text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg border-2 border-slate-300 cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="button"
              disabled={!name.trim() || !value.trim()}
              onClick={handleSaveNew}
              className={`px-4 py-2 text-xs font-black rounded-lg flex items-center gap-1.5 cursor-pointer ${
                name.trim() && value.trim()
                  ? 'bg-blue-600 hover:bg-blue-700 text-white border-2 border-blue-800 shadow-md'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed border-2 border-slate-300'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>Ölçüyü Kaydet</span>
            </button>
          </div>
        </div>
      ) : null}

      {/* List of Entered Measures */}
      {measures.length === 0 && !isAdding ? (
        <div className="bg-white p-6 rounded-xl border-2 border-dashed border-slate-300 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border-2 border-blue-200">
            <Ruler className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h4 className="font-black text-xs sm:text-sm text-slate-950 uppercase tracking-wider">Henüz ölçü eklenmedi</h4>
            <p className="text-xs text-slate-600 font-medium mt-1 max-w-xs mx-auto">
              Sahada alınan mekanik veya elektriksel ölçüleri listelemek için aşağıdaki butona basınız.
            </p>
          </div>
          <button
            type="button"
            id="btn-add-measure-empty"
            onClick={handleStartAdd}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-lg shadow-md transition-all uppercase tracking-wider cursor-pointer active:scale-95 border-2 border-blue-800"
          >
            <Plus className="w-4 h-4" />
            <span>[ + ÖLÇÜ EKLE ]</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {measures.map((m, idx) => (
            <div
              key={m.id}
              className="bg-white p-3.5 sm:p-4 rounded-xl border-2 border-slate-300 shadow-xs transition-all"
            >
              {editingId === m.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                      className="px-3 py-1.5 text-xs font-black text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg border-2 border-slate-300 cursor-pointer"
                    >
                      İptal
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(m.id)}
                      className="px-4 py-1.5 text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg border-2 border-emerald-800 shadow-xs cursor-pointer"
                    >
                      Güncelle
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono font-black text-slate-500">
                        #{idx + 1}
                      </span>
                      <h4 className="text-sm font-black text-slate-950">{m.name}</h4>
                    </div>
                    <div className="mt-1.5 flex items-baseline gap-2">
                      <span className="text-xs text-slate-600 font-black uppercase tracking-wider">Değer:</span>
                      <span className="text-xs font-black text-blue-950 bg-blue-100 px-2.5 py-0.5 rounded border border-blue-300">
                        {m.value}
                      </span>
                    </div>
                    {m.notes && (
                      <p className="mt-2 text-xs text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-200 break-words font-medium">
                        {m.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(m)}
                      title="Düzenle"
                      className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteMeasure(m.id)}
                      title="Sil"
                      className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Bottom Add button */}
          {!isAdding && (
            <div className="pt-2">
              <button
                type="button"
                id="btn-add-extra-measure"
                onClick={handleStartAdd}
                className="w-full py-3 px-4 border-2 border-dashed border-blue-400 hover:border-blue-600 bg-white hover:bg-blue-50 rounded-xl text-blue-900 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4 text-blue-600" />
                <span>[ + ÖLÇÜ EKLE ]</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
