import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Cloud,
  UploadCloud,
  DownloadCloud,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
  FileText,
  FileCode2,
  Copy,
  Check,
  HelpCircle,
  Settings2,
  Trash2,
  KeyRound,
  Search,
} from 'lucide-react';
import {
  DEFAULT_DRIVE_ACCOUNT,
  getSavedDriveFolderId,
  requestDriveAccessToken,
  getCachedDriveToken,
  clearCachedDriveToken,
  listDriveFolderFiles,
  uploadAuditJsonToDrive,
  downloadAuditJsonFromDrive,
  DriveProjectFile,
  getSavedDriveScriptUrl,
  setSavedDriveScriptUrl,
  GOOGLE_APPS_SCRIPT_TEMPLATE,
} from '../services/googleDriveService';
import { AuditFormData } from '../types';

interface DriveSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAuditData?: AuditFormData;
  onLoadAuditFromDrive: (data: AuditFormData) => void;
}

export const DriveSyncModal: React.FC<DriveSyncModalProps> = ({
  isOpen,
  onClose,
  currentAuditData,
  onLoadAuditFromDrive,
}) => {
  const [folderId] = useState(getSavedDriveFolderId());
  const [scriptUrl, setScriptUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [files, setFiles] = useState<DriveProjectFile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showConfigEdit, setShowConfigEdit] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info' | null; text: string }>({
    type: null,
    text: '',
  });

  useEffect(() => {
    if (isOpen) {
      const savedScript = getSavedDriveScriptUrl();
      const token = getCachedDriveToken();
      setScriptUrl(savedScript);

      const hasConn = !!savedScript || !!token;
      setIsConnected(hasConn);

      if (hasConn) {
        setShowConfigEdit(false);
        handleRefreshFiles();
      } else {
        setShowConfigEdit(true);
        setStatusMsg({
          type: 'info',
          text: 'Tabletlerde engelsiz ve şifresiz bulut bağlantısı için aşağıdaki rehberi uygulayıp Webhook linkini yapıştırınız.',
        });
      }
    }
  }, [isOpen]);

  // Filtrelenmiş dosya listesi (Seri no veya referans adına göre anlık arama)
  const filteredFiles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return files;
    return files.filter((f) => f.name.toLowerCase().includes(q));
  }, [files, searchQuery]);

  if (!isOpen) return null;

  const handleRefreshFiles = async () => {
    setIsLoading(true);
    setStatusMsg({ type: 'info', text: 'Drive klasörü taranıyor...' });
    try {
      const list = await listDriveFolderFiles(folderId);
      setFiles(list);
      setStatusMsg({
        type: 'success',
        text: `Klasörde ${list.length} adet dosya bulundu.`,
      });
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err?.message || 'Dosyalar listelenemedi.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveWebhook = async () => {
    const trimmed = scriptUrl.trim();
    if (!trimmed) {
      setStatusMsg({ type: 'error', text: 'Lütfen geçerli bir Google Apps Script Webhook URL adresi giriniz.' });
      return;
    }

    if (!trimmed.startsWith('https://script.google.com/')) {
      setStatusMsg({
        type: 'error',
        text: 'Girilen link "https://script.google.com/..." ile başlamalıdır. Lütfen doğru Web App linkini kopyalayınız.',
      });
      return;
    }

    setIsLoading(true);
    setStatusMsg({ type: 'info', text: 'Bulut köprüsü test ediliyor...' });
    try {
      setSavedDriveScriptUrl(trimmed);
      const list = await listDriveFolderFiles(folderId);
      setFiles(list);
      setIsConnected(true);
      setShowConfigEdit(false);
      setShowGuide(false);
      setStatusMsg({
        type: 'success',
        text: `Bulut bağlantısı başarıyla sağlandı! ${list.length} adet dosya listelendi.`,
      });
    } catch (err: any) {
      setIsConnected(false);
      setStatusMsg({
        type: 'error',
        text: `Bağlantı testi başarısız: ${err?.message || 'Lütfen Web Uygulamasının erişim iznini "Herkes (Anyone)" olarak ayarladığınızdan emin olun.'}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    setSavedDriveScriptUrl('');
    clearCachedDriveToken();
    setScriptUrl('');
    setIsConnected(false);
    setShowConfigEdit(true);
    setFiles([]);
    setStatusMsg({ type: 'info', text: 'Bulut bağlantısı sıfırlandı.' });
  };

  const handleUploadCurrentAudit = async () => {
    if (!currentAuditData) {
      setStatusMsg({ type: 'error', text: 'Yüklenecek aktif bir denetim verisi bulunamadı.' });
      return;
    }

    setIsUploading(true);
    setStatusMsg({ type: 'info', text: 'Denetim projesi Google Drive klasörüne aktarılıyor...' });
    try {
      const res = await uploadAuditJsonToDrive(currentAuditData, folderId);
      setStatusMsg({
        type: 'success',
        text: res.isUpdated
          ? `"${res.fileName}" mevcut referans dosyasının üzerine başarıyla güncellendi!`
          : `"${res.fileName}" başarıyla Drive klasörüne kaydedildi! Diğer tabletler artık bu dosyayı yükleyebilir.`,
      });
      await handleRefreshFiles();
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err?.message || 'Drive yüklemesi başarısız oldu.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadAndApply = async (file: DriveProjectFile) => {
    if (!file.isAuditData) {
      if (file.webViewLink) {
        window.open(file.webViewLink, '_blank');
      }
      return;
    }

    const confirmLoad = window.confirm(
      `"${file.name}" isimli denetim projesi tablete yüklenecektir. Mevcut ekrandaki veriniz bu projenin içeriğiyle güncellenecektir. Devam edilsin mi?`
    );
    if (!confirmLoad) return;

    setIsLoading(true);
    setStatusMsg({ type: 'info', text: 'Proje verisi Drive üzerinden çekiliyor...' });
    try {
      const data = await downloadAuditJsonFromDrive(file.id);
      onLoadAuditFromDrive(data);
      setStatusMsg({
        type: 'success',
        text: `"${file.name}" projesi başarıyla yüklendi!`,
      });
      onClose();
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err?.message || 'Proje verisi indirilemedi.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 3000);
    } catch {
      const el = document.createElement('textarea');
      el.value = GOOGLE_APPS_SCRIPT_TEMPLATE;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 3000);
    }
  };

  const handleOauthConnect = async () => {
    setIsLoading(true);
    setStatusMsg({ type: 'info', text: 'Google hesabına bağlanılıyor...' });
    try {
      await requestDriveAccessToken();
      setIsConnected(true);
      setShowConfigEdit(false);
      setStatusMsg({
        type: 'success',
        text: 'Google oturumu açıldı! Klasördeki dosyalar listeleniyor...',
      });
      await handleRefreshFiles();
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err?.message || 'Google oturum açılamadı.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
      <div className="bg-slate-900 rounded-xl max-w-xl w-full p-4 sm:p-5 shadow-2xl border border-slate-800 text-slate-100 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
              <Cloud className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-slate-100 uppercase tracking-tight">
                GOOGLE DRİVE BULUT SENKRONİZASYONU
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Tabletler arası ortak klasörden proje yükleme & yedekleme
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info / Account Banner - Sadeleştirildi (Drive'da Aç kaldırıldı) */}
        <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 mb-3 space-y-1.5 text-xs shrink-0">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5 text-slate-300">
              <FolderOpen className="w-4 h-4 text-amber-400" />
              <span className="font-bold">Hedef Klasör:</span>
              <span className="font-mono text-[11px] text-amber-300">KALITEKONTROL ARSIV</span>
            </div>
            {isConnected ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Bulut Bağlı
                </span>
                <button
                  type="button"
                  onClick={() => setShowConfigEdit(!showConfigEdit)}
                  className="text-slate-400 hover:text-slate-200 flex items-center gap-1 text-[10px] underline cursor-pointer"
                >
                  <Settings2 className="w-3 h-3" />
                  <span>{showConfigEdit ? 'Gizle' : 'Ayar'}</span>
                </button>
              </div>
            ) : (
              <span className="text-amber-400 font-bold text-[11px]">Kurulum Bekleniyor</span>
            )}
          </div>

          <div className="flex items-center justify-between flex-wrap gap-2 text-[11px] text-slate-400 pt-1 border-t border-slate-900">
            <span>Yetkili Hesap: <strong className="text-slate-200">{DEFAULT_DRIVE_ACCOUNT}</strong></span>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {/* Webhook Configuration Panel (if not connected or toggled) */}
          {(showConfigEdit || !isConnected) && (
            <div className="p-3 bg-slate-950 rounded-lg border border-blue-900/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Cloud className="w-3.5 h-3.5 text-blue-400" />
                  <span>Google Apps Script Bulut Köprüsü</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowGuide(!showGuide)}
                  className="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 underline cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>{showGuide ? 'Rehberi Kapat' : 'Nasıl Kurulur? (1 Dk Rehber)'}</span>
                </button>
              </div>

              {/* Step-by-step Guide Accordion */}
              {showGuide && (
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-2 text-xs text-slate-300 animate-fadeIn">
                  <p className="font-bold text-slate-100 border-b border-slate-800 pb-1">
                    📌 1 Dakikalık Kurulum Adımları (Tek Seferlik):
                  </p>
                  <ol className="list-decimal list-inside space-y-1.5 text-[11px] leading-relaxed text-slate-300">
                    <li>
                      Bilgisayarda veya tablette{' '}
                      <a
                        href="https://script.google.com/home/start"
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-400 underline font-bold"
                      >
                        script.google.com
                      </a>{' '}
                      adresine girip <strong>Yeni Proje</strong> açın.
                    </li>
                    <li>
                      Açılan ekrandaki varsayılan kodu silin ve aşağıdaki <strong>Hazır Kodu</strong> yapıştırın.
                    </li>
                    <li>
                      Sağ üstteki mavi <strong>Dağıt (Deploy) &gt; Yeni Dağıtım</strong> butonuna basın.
                    </li>
                    <li>
                      Sol çark simgesinden <strong>Web Uygulaması (Web app)</strong> seçin:
                      <div className="pl-4 pt-1 font-mono text-[10px] text-amber-300">
                        • Yürüten: <strong>Ben (Me - ahmetsarihan1903@gmail.com)</strong><br />
                        • Erişimi olanlar: <strong>Herkes (Anyone)</strong>
                      </div>
                    </li>
                    <li>
                      <strong>Dağıt</strong>'a basıp çıkan <strong>Web Uygulaması URL'sini (Web app URL)</strong> kopyalayıp aşağıdaki kutucuğa yapıştırın.
                    </li>
                  </ol>

                  {/* Copy Code Box */}
                  <div className="pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold flex items-center justify-center gap-1.5 shadow cursor-pointer transition-colors"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCode ? 'Kod Panoya Kopyalandı! ✓' : 'Google Apps Script Kodunu Kopyala'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* URL Input and Action */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 block">
                  Web Uygulaması Bağlantı Linki (URL):
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={scriptUrl}
                    onChange={(e) => setScriptUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-slate-100 font-mono placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleSaveWebhook}
                    disabled={isLoading}
                    className="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white rounded-lg text-xs font-bold shrink-0 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    <span>Bağlan</span>
                  </button>
                </div>
              </div>

              {/* Disconnect or OAuth alternative */}
              <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                {isConnected && (
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="text-red-400 hover:text-red-300 flex items-center gap-1 underline cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Bağlantıyı Kaldır</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleOauthConnect}
                  disabled={isLoading}
                  className="text-slate-400 hover:text-slate-200 flex items-center gap-1 text-[10px] ml-auto underline cursor-pointer"
                  title="Klasik Google Pop-up ile giriş"
                >
                  <KeyRound className="w-3 h-3" />
                  <span>(Alternatif: Google Pop-up ile Giriş Yap)</span>
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons when Connected */}
          {isConnected && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {currentAuditData && (
                <button
                  type="button"
                  id="btn-drive-upload-active"
                  onClick={handleUploadCurrentAudit}
                  disabled={isUploading || isLoading}
                  className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  {isUploading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <UploadCloud className="w-3.5 h-3.5" />
                  )}
                  <span>Bu Projeyi Drive'a Yedekle</span>
                </button>
              )}

              <button
                type="button"
                id="btn-drive-refresh-list"
                onClick={handleRefreshFiles}
                disabled={isLoading}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-850 text-slate-200 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-700"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Listeyi Yenile</span>
              </button>
            </div>
          )}

          {/* Feedback Message */}
          {statusMsg.text && (
            <div
              className={`p-2.5 rounded-lg text-xs flex items-start gap-2 border ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                  : statusMsg.type === 'error'
                  ? 'bg-red-950/60 border-red-500/50 text-red-200'
                  : 'bg-blue-950/60 border-blue-500/50 text-blue-200'
              }`}
            >
              {statusMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : statusMsg.type === 'error' ? (
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              ) : (
                <RefreshCw className="w-4 h-4 text-blue-400 shrink-0 mt-0.5 animate-spin" />
              )}
              <span className="leading-snug">{statusMsg.text}</span>
            </div>
          )}

          {/* Files List Header with Search Bar */}
          <div className="space-y-2 pt-1 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-200 uppercase tracking-wider">
                Drive Klasöründeki Projeler ({filteredFiles.length}{files.length !== filteredFiles.length ? ` / ${files.length}` : ''})
              </span>
              <span className="text-[10px] text-slate-400">Mavi JSON dosyaları tablete yüklenir</span>
            </div>

            {/* Arama Çubuğu (Referans adı veya Seri no filtreleme) */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Seri no veya referans adına göre ara..."
                className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-lg pl-9 pr-8 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                  title="Aramayı Temizle"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Files Scrollable Container */}
          <div className="space-y-1.5 min-h-[140px]">
            {files.length === 0 ? (
              <div className="p-6 text-center bg-slate-950 rounded-lg border border-slate-800">
                <Cloud className="w-7 h-7 text-slate-600 mx-auto mb-1.5" />
                <p className="text-xs text-slate-400">
                  {isConnected
                    ? 'Klasörde henüz kayıtlı proje bulunmuyor veya taranıyor.'
                    : 'Bulut dosyalarını görmek için yukarıdaki Webhook linkinizi kaydediniz.'}
                </p>
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="p-6 text-center bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-400">
                <Search className="w-6 h-6 text-slate-600 mx-auto mb-1.5" />
                <p>"{searchQuery}" aramasına uygun proje bulunamadı.</p>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="mt-2 text-blue-400 hover:underline text-[11px] font-bold"
                >
                  Aramayı Temizle
                </button>
              </div>
            ) : (
              filteredFiles.map((file) => {
                const isJson = file.isAuditData;
                return (
                  <div
                    key={file.id}
                    className={`p-2 rounded-lg border transition-all flex items-center justify-between gap-2 ${
                      isJson
                        ? 'bg-slate-950 hover:bg-slate-850 border-blue-900/60 hover:border-blue-500'
                        : 'bg-slate-950/60 border-slate-800'
                    }`}
                  >
                    <div className="min-w-0 flex items-center gap-2 flex-1">
                      <div
                        className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${
                          isJson ? 'bg-blue-600/20 text-blue-400' : 'bg-red-600/20 text-red-400'
                        }`}
                      >
                        {isJson ? <FileCode2 className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-100 truncate">{file.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {file.modifiedTime ? new Date(file.modifiedTime).toLocaleString('tr-TR') : 'Tarih Yok'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isJson && (
                        <button
                          type="button"
                          onClick={() => handleDownloadAndApply(file)}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] font-black uppercase tracking-wider flex items-center gap-1 shadow-xs cursor-pointer"
                          title="Bu projeyi ekrana yükle"
                        >
                          <DownloadCloud className="w-3 h-3" />
                          <span>Yükle</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
