import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  RefreshCw,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  RotateCcw,
  ClipboardPaste,
  Upload,
  Link2,
  FileText,
} from 'lucide-react';
import {
  syncCustomerItemsFromGoogleSheet,
  syncCustomerItemsFromCsvText,
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
  const [activeTab, setActiveTab] = useState<'url' | 'paste'>('url');
  const [sheetUrl, setSheetUrl] = useState('');
  const [pastedCsvText, setPastedCsvText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info' | null;
    text: string;
  }>({ type: null, text: '' });
  const [hasCustomData, setHasCustomData] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // 1. Google Sheets URL ile senkronizasyon
  const handleSyncUrl = async () => {
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
        text: `Bağlantı hatası: ${err?.message || ''}. Google E-Tablonun herkese açık paylaşıldığından emin olun veya yan sekmedeki "Metin Olarak Yapıştır" seçeneğini kullanın.`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Doğrudan CSV Metni Yapıştırarak senkronizasyon
  const handleSyncText = () => {
    if (!pastedCsvText.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'Lütfen kutuya CSV veya tablo metnini yapıştırınız.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = syncCustomerItemsFromCsvText(pastedCsvText);

      if (result.success && result.data) {
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
        text: `İşleme hatası: ${err?.message || ''}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Dosyadan CSV yükleme (.csv / .txt)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setPastedCsvText(content);
        setActiveTab('paste');
        setStatusMessage({
          type: 'info',
          text: `"${file.name}" dosyası okundu. "Metni Uygula ve Kaydet" butonuna basarak aktarabilirsiniz.`,
        });
      }
    };
    reader.readAsText(file);
    // Reset file input
    e.target.value = '';
  };

  // 4. Varsayılana dönme
  const handleReset = () => {
    if (
      window.confirm(
        'Özel E-Tablo verileri silinecek ve uygulamanın orijinal standart maddelerine dönülecektir. Onaylıyor musunuz?'
      )
    ) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay-safe bg-black/80 backdrop-blur-xs animate-fadeIn p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 rounded-xl max-w-xl w-full p-4 sm:p-5 shadow-2xl border border-slate-800 space-y-4 max-h-[92vh] flex flex-col modal-box-safe">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-100">
                Yeşil Etiket Maddelerini Güncelleme
              </h3>
              <p className="text-[11px] text-slate-400">
                Google E-Tablo bağlantısı veya doğrudan metin yapıştırarak güncelleyin
              </p>
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

        {/* Tab Selection */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`py-2 px-3 text-xs font-bold rounded-md flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'url'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Google E-Tablo Linki</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('paste')}
            className={`py-2 px-3 text-xs font-bold rounded-md flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'paste'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <ClipboardPaste className="w-3.5 h-3.5" />
            <span>Metin / CSV Yapıştır (Hızlı)</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-0.5">
          {activeTab === 'url' ? (
            /* TAB 1: Google E-Tablo Linki */
            <div className="space-y-3">
              {/* How it works info */}
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2 text-xs text-slate-300">
                <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Google E-Tablo Bağlantı Rehberi</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400 leading-relaxed">
                  <li>
                    Google E-Tablonuzda <strong className="text-slate-200">Paylaş</strong> butonuna basıp{' '}
                    <span className="text-amber-400 font-semibold">"Bağlantıya sahip olan herkes görüntüleyebilir"</span>{' '}
                    olarak ayarlayın.
                  </li>
                  <li>
                    Veya en garantili yöntem: <strong className="text-slate-200">Dosya &gt; Paylaş &gt; Web'de Yayınla</strong>{' '}
                    kısmından <span className="text-emerald-400 font-semibold">"Virgülle ayrılmış değerler (.csv)"</span> seçip yayınlayın.
                  </li>
                  <li>Kopyaladığınız linki aşağıdaki alana yapıştırıp butona tıklayın.</li>
                </ul>
              </div>

              {/* Input Area */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Google E-Tablo veya Yayın CSV Bağlantısı:
                </label>
                <input
                  type="url"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <button
                type="button"
                disabled={isLoading}
                onClick={handleSyncUrl}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>{isLoading ? 'E-Tabloya Bağlanılıyor...' : 'E-Tablodan Şimdi Güncelle'}</span>
              </button>
            </div>
          ) : (
            /* TAB 2: Doğrudan Metin / CSV Yapıştır (Hatasız & İnternetsiz) */
            <div className="space-y-3">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5 text-xs text-slate-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Doğrudan Yapıştırma (Ağ Hatasız)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[11px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Upload className="w-3 h-3" />
                    Dosyadan Yükle (.csv)
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Excel veya Google Sheets'ten kopyaladığınız satırları veya CSV metnini doğrudan buraya yapıştırabilirsiniz.
                  Kategori sütununa <strong className="text-slate-200">ORTAK</strong>,{' '}
                  <strong className="text-slate-200">MR</strong> veya <strong className="text-slate-200">MRL</strong> yazmanız yeterlidir.
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    CSV / Tablo Metni:
                  </label>
                  {pastedCsvText && (
                    <button
                      type="button"
                      onClick={() => setPastedCsvText('')}
                      className="text-[10px] text-rose-400 hover:underline cursor-pointer"
                    >
                      Temizle
                    </button>
                  )}
                </div>
                <textarea
                  rows={6}
                  value={pastedCsvText}
                  onChange={(e) => setPastedCsvText(e.target.value)}
                  placeholder={`Kategori,Madde Aciklamasi\nORTAK,Kuyu dibi temizlenmelidir...\nMRL MADDE,Pano bölgesine aydınlatma yapılmalıdır...\nMR MADDE,Makine dairesi tabyası boyanmalıdır...`}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono leading-relaxed resize-none"
                />
              </div>

              <button
                type="button"
                disabled={isLoading || !pastedCsvText.trim()}
                onClick={handleSyncText}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all disabled:opacity-50"
              >
                <ClipboardPaste className="w-4 h-4" />
                <span>Metni Uygula ve Maddeleri Kaydet</span>
              </button>
            </div>
          )}

          {/* Status Message */}
          {statusMessage.type && (
            <div
              className={`p-3 rounded-lg text-xs flex items-start gap-2 border ${
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

          {/* Sample CSV Template Download */}
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-slate-200">Standart Şablon Dosyası</div>
              <div className="text-[11px] text-slate-400">ORTAK, MR ve MRL formatında hazır CSV indir</div>
            </div>
            <button
              type="button"
              onClick={downloadCustomerTemplateCSV}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Şablonu İndir (.csv)</span>
            </button>
          </div>
        </div>

        {/* Modal Footer Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800 gap-2">
          {hasCustomData ? (
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-2 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Fabrika Standartlarına Dön</span>
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold cursor-pointer transition-colors"
          >
            Kapat / Tamam
          </button>
        </div>
      </div>
    </div>
  );
};
