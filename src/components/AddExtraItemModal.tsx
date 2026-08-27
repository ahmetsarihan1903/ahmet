import React, { useState } from 'react';
import { Plus, X, AlertCircle } from 'lucide-react';
import { SmartTextInput } from './SmartTextInput';

interface AddExtraItemModalProps {
  categoryName: string;
  isOpen: boolean;
  onClose: () => void;
  onAdd: (title: string) => void;
}

export const AddExtraItemModal: React.FC<AddExtraItemModalProps> = ({
  categoryName,
  isOpen,
  onClose,
  onAdd,
}) => {
  const [title, setTitle] = useState('');

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAdd(title.trim());
    setTitle('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-slate-900 rounded-lg max-w-md w-full p-4 sm:p-5 shadow-2xl border border-slate-800">
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-blue-500/20 text-blue-300 border border-blue-400/40 flex items-center justify-center font-bold">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100">Ekstra Kontrol Maddesi Ekle</h3>
              <p className="text-[11px] text-slate-400">{categoryName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-3">
          <SmartTextInput
            id="input-extra-item-title"
            label="Madde Tanımı"
            value={title}
            onChange={setTitle}
            placeholder="Örn: Ekstra sismik sensör montajı..."
            required
            helperText="Metni yazabilir veya mikrofon [🎙️] ile sesli girebilirsiniz."
          />

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className={`px-4 py-1.5 text-xs font-bold rounded flex items-center gap-1 cursor-pointer ${
                title.trim()
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Maddeyi Ekle</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
