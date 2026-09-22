import React, { useState, useEffect } from 'react';
import {
  X,
  RefreshCw,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  RotateCcw,
} from 'lucide-react';
import {
  syncCustomerItemsFromGoogleSheet,
  saveCustomerSyncedItemsToStorage,
  saveCustomerGoogleSheetUrl,
  loadCustomerGoogleSheetUrl,
  loadCustomerSyncedItemsFromStorage,
  downloadCustomerTemplateCSV,
} from '../../services/customerDataSyncService';

interface CustomerSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplySyncedData: (data: any) => void;
  onResetToDefault: () => void;
}

export const CustomerSyncModal: React.FC<CustomerSyncModalProps> = ({
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
      const savedUrl = loadCustomerGoogleSheetUrl();
      setSheetUrl(savedUrl);
      const customData = loadCustomerSyncedItemsFromStorage();
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
      const result = await syncCustomerItemsFromGoogleSheet(sheetUrl);

      if (result.success && result.data) {
        saveCustomerGoogleSheetUrl(sheetUrl);
        saveCustomerSyncedItemsToStorage(result.data);
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
        localStorage.removeItem('beta_customer_custom_sync_items');
        localStorage.removeItem('beta_customer_google_sheet_url');
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
              <p className="text-[11px] text-slate-400">Kontrol maddelerini Google E-Tablodan güncelleyin</p>
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
            <li>Google Drive'da bir Google E-Tablosu oluşturun veya şablonu indirin.</li>
            <li>Tabloyu <span className="text-slate-200 font-semibold">"Bağlantıya sahip olan herkes görüntüleyebilir"</span> olarak paylaşın.</li>
            <li>Paylaşım bağlantısını aşağıdaki alana yapıştırıp <span className="text-emerald-400 font-semibold">"Şimdi Güncelle"</span> butonuna basın.</li>
          </ol>
        </div>

        {/* Download CSV Template Button */}
        <div className="p-3 bg-slate-950 rounded border border-slate-800 flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-slate-200">Örnek CSV Şablonu</div>
            <div className="text-[11px] text-slate-400">ORTAK, MR ve MRL formatında hazır şablon</div>
          </div>
          <button
            type="button"
            onClick={downloadCustomerTemplateCSV}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Şablonu İndir (.csv)</span>
          </button>
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
            placeholder="https://docs.google.com/spreadsheets/d/..."
            className="w-full bg-slate-950 border border-slate-700 rounded-md p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
          />
        </div>

        {/* Status Message */}
        {statusMessage.type && (
          <div
            className={`p-3 rounded text-xs flex items-start gap-2 border ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : statusMessage.type === 'error'
                ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                : 'bg-blue-950/40 border-blue-500/40 text-blue-300'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : statusMessage.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            ) : (
              <RefreshCw className="w-4 h-4 text-blue-400 shrink-0 mt-0.5 animate-spin" />
            )}
            <div className="leading-relaxed">{statusMessage.text}</div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800 gap-2">
          {hasCustomData ? (
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-2 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800 rounded text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Varsayılana Dön</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-bold cursor-pointer transition-colors"
            >
              Kapat
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={handleSync}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Güncelleniyor...' : 'Şimdi Güncelle'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
