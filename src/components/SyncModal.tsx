import React, { useState, useEffect } from 'react';
import {
  X,
  RefreshCw,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  HelpCircle,
  RotateCcw,
} from 'lucide-react';
import {
  syncItemsFromGoogleSheet,
  saveSyncedItemsToStorage,
  saveGoogleSheetUrl,
  loadGoogleSheetUrl,
  loadSyncedItemsFromStorage,
} from '../services/dataSyncService';
import { downloadTemplateCSV } from '../utils/csvTemplate';
import { InspectionItem } from '../types';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplySyncedData: (data: Record<string, InspectionItem[]>) => void;
  onResetToDefault: () => void;
}

export const SyncModal: React.FC<SyncModalProps> = ({
  isOpen,
  onClose,
  onApplySyncedData,
  onResetToDefault,
}) => {
  const [sheetUrl, setSheetUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info' | null;
    text: string;
  }>({ type: null, text: '' });
  const [hasCustomData, setHasCustomData] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const savedUrl = loadGoogleSheetUrl();
      setSheetUrl(savedUrl);
      const customData = loadSyncedItemsFromStorage();
      setHasCustomData(!!customData);
      setStatusMessage({ type: null, text: '' });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSync = async () => {
    if (!sheetUrl.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'Lütfen geçerli bir Google E-Tablo veya CSV bağlantı linki giriniz.',
      });
      return;
    }

    setIsLoading(true);
    setStatusMessage({
      type: 'info',
      text: 'Google E-Tabloya bağlanılıyor ve maddeler alınıyor...',
    });

    try {
      const result = await syncItemsFromGoogleSheet(sheetUrl);

      if (result.success && result.data) {
        saveGoogleSheetUrl(sheetUrl);
        saveSyncedItemsToStorage(result.data);
        onApplySyncedData(result.data);
        setHasCustomData(true);
        setStatusMessage({
          type: 'success',
          text: result.message,
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: result.message,
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Beklenmeyen bir hata oluştu: ${err?.message || ''}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Özel E-Tablo verileri silinecek ve uygulamanın orijinal standart maddelerine dönülecektir. Onaylıyor musunuz?')) {
      try {
        localStorage.removeItem('beta_elevator_custom_sync_items');
      } catch {
        // ignore
      }
      setHasCustomData(false);
      onResetToDefault();
      setStatusMessage({
        type: 'info',
        text: 'Orijinal fabrika standart maddelerine başarıyla geri dönüldü.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay-safe bg-black/80 backdrop-blur-xs animate-fadeIn">
      <div className="bg-slate-900 rounded-lg max-w-lg w-full p-4 sm:p-5 shadow-2xl border border-slate-800 space-y-4 modal-box-safe overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-100">E-Tablo Veri Güncelleme</h3>
              <p className="text-[11px] text-slate-400">Yeni APK kurmadan kontrol maddelerini internetten güncelleyin</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info Box: How it works */}
        <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-2 text-xs text-slate-300">
          <div className="flex items-center gap-1.5 font-bold text-blue-400">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Nasıl Kullanılır?</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-400 leading-relaxed">
            <li>Google Drive'da bir Google E-Tablosu oluşturun veya hazır şablonu indirin.</li>
            <li>Tabloyu <span className="text-slate-200 font-semibold">"Bağlantıya sahip olan herkes görüntüleyebilir"</span> olarak paylaşın.</li>
            <li>Paylaşım bağlantısını aşağıdaki alana yapıştırıp <span className="text-emerald-400 font-semibold">"Şimdi Güncelle"</span> butonuna basın.</li>
            <li>Tüm maddeler tabletinizin yerel hafızasına kaydedilir, internet olmasa dahi güncel kalır.</li>
          </ol>
        </div>

        {/* Input Area */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
            Google E-Tablo veya CSV Bağlantı Linki:
          </label>
          <input
            type="url"
            value={sheetUrl}
            onChange={(e) => setSheetUrl(e.target.value)}
            placeholder="https://docs.google.com/spreadsheets/d/1A2B3C4D.../edit?usp=sharing"
            className="w-full bg-slate-950 text-slate-100 text-xs px-3 py-2.5 rounded border border-slate-700 focus:outline-hidden focus:border-emerald-500 font-mono transition-colors"
          />
        </div>

        {/* Status Message */}
        {statusMessage.text && (
          <div
            className={`p-3 rounded border text-xs flex items-start gap-2 animate-fadeIn ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/80 text-emerald-300'
                : statusMessage.type === 'error'
                ? 'bg-red-950/40 border-red-500/80 text-red-300'
                : 'bg-blue-950/40 border-blue-500/80 text-blue-300'
            }`}
          >
            {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
            {statusMessage.type === 'error' && <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />}
            {statusMessage.type === 'info' && <RefreshCw className="w-4 h-4 text-blue-400 shrink-0 mt-0.5 animate-spin" />}
            <span className="leading-relaxed">{statusMessage.text}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            disabled={isLoading || !sheetUrl.trim()}
            onClick={handleSync}
            className={`w-full py-2.5 px-4 rounded font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all select-none ${
              isLoading || !sheetUrl.trim()
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : 'bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white cursor-pointer'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Veriler Alınıyor...' : 'E-Tablodan Şimdi Güncelle'}</span>
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {/* Download Starter Template */}
            <button
              type="button"
              onClick={downloadTemplateCSV}
              className="py-2 px-3 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title="Mevcut maddelerin dolu olduğu CSV şablonunu indirin"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Hazır Şablonu İndir (.CSV)</span>
            </button>

            {/* Reset to Factory Defaults */}
            <button
              type="button"
              onClick={handleReset}
              disabled={!hasCustomData}
              className={`py-2 px-3 rounded font-bold text-xs flex items-center justify-center gap-1.5 border transition-colors select-none ${
                hasCustomData
                  ? 'bg-slate-800 hover:bg-red-950/40 text-slate-300 hover:text-red-300 border-slate-700 hover:border-red-500/60 cursor-pointer'
                  : 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed'
              }`}
              title="Özel maddeleri silip orijinal liste maddelerine geri döner"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Orijinal Maddelere Dön</span>
            </button>
          </div>
        </div>

        {/* Footer Note */}
        <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-500 text-center">
          Veriler tablet hafızasına ({hasCustomData ? 'Özel Liste Aktif' : 'Standart Liste Aktif'}) kaydedilmiştir.
        </div>
      </div>
    </div>
  );
};
