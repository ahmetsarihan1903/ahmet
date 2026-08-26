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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border-2 border-slate-300">
        <div className="flex items-center justify-between pb-3 border-b-2 border-slate-200 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-900 border border-blue-300 flex items-center justify-center font-bold">
              <Plus className="w-4 h-4 text-blue-700" />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-950">Ekstra Kontrol Maddesi Ekle</h3>
              <p className="text-xs text-slate-600 font-bold">{categoryName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <SmartTextInput
            id="input-extra-item-title"
            label="Madde Tanımı"
            value={title}
            onChange={setTitle}
            placeholder="Örn: Ekstra sismik sensör montajı..."
            required
            helperText="Metni yazabilir veya mikrofon [🎙️] ile sesli girebilirsiniz."
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-black text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl border-2 border-slate-300 cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className={`px-5 py-2.5 text-xs font-black rounded-xl flex items-center gap-1.5 cursor-pointer ${
                title.trim()
                  ? 'bg-blue-600 hover:bg-blue-700 text-white border-2 border-blue-800 shadow-md'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed border-2 border-slate-300'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Maddeyi Ekle</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
