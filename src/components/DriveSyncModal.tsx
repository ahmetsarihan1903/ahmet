import React, { useState, useEffect } from 'react';
import {
  X,
  Cloud,
  HardDrive,
  UploadCloud,
  DownloadCloud,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  FolderOpen,
  FileText,
  FileCode2,
  Calendar,
  Lock,
  LogOut,
  Sparkles,
} from 'lucide-react';
import {
  DEFAULT_DRIVE_FOLDER_ID,
  DEFAULT_DRIVE_FOLDER_URL,
  DEFAULT_DRIVE_ACCOUNT,
  getSavedDriveFolderId,
  setSavedDriveFolderId,
  requestDriveAccessToken,
  getCachedDriveToken,
  saveCachedDriveToken,
  clearCachedDriveToken,
  listDriveFolderFiles,
  uploadAuditJsonToDrive,
  downloadAuditJsonFromDrive,
  DriveProjectFile,
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
  const [folderId, setFolderId] = useState(getSavedDriveFolderId());
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [files, setFiles] = useState<DriveProjectFile[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [showManualToken, setShowManualToken] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info' | null; text: string }>({
    type: null,
    text: '',
  });

  useEffect(() => {
    if (isOpen) {
      const saved = getSavedDriveFolderId();
      setFolderId(saved);
      const token = getCachedDriveToken();
      setIsConnected(!!token);
      if (token) {
        handleRefreshFiles(saved);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleManualTokenSave = async () => {
    const trimmed = manualToken.trim();
    if (!trimmed) {
      setStatusMsg({ type: 'error', text: 'Lütfen geçerli bir Google erişim tokeni giriniz.' });
      return;
    }
    saveCachedDriveToken(trimmed, 3600);
    setIsConnected(true);
    setStatusMsg({ type: 'success', text: 'Manuel token kaydedildi, Drive dosyaları taranıyor...' });
    await handleRefreshFiles(folderId);
  };

  const handleConnect = async () => {
    setIsLoading(true);
    setStatusMsg({ type: 'info', text: 'Google hesabına bağlanılıyor...' });
    try {
      await requestDriveAccessToken();
      setIsConnected(true);
      setStatusMsg({
        type: 'success',
        text: 'Google Drive başarıyla bağlandı! Klasördeki dosyalar listeleniyor...',
      });
      await handleRefreshFiles(folderId);
    } catch (err: any) {
      setIsConnected(false);
      setStatusMsg({
        type: 'error',
        text: err?.message || 'Google oturum açılamadı.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    clearCachedDriveToken();
    setIsConnected(false);
    setFiles([]);
    setStatusMsg({ type: 'info', text: 'Google Drive oturumu kapatıldı.' });
  };

  const handleRefreshFiles = async (targetFId = folderId) => {
    setIsLoading(true);
    setStatusMsg({ type: 'info', text: 'Drive klasörü taranıyor...' });
    try {
      const list = await listDriveFolderFiles(targetFId);
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

  const handleUploadCurrentAudit = async () => {
    if (!currentAuditData) {
      setStatusMsg({ type: 'error', text: 'Yüklenecek aktif bir denetim verisi bulunamadı.' });
      return;
    }

    setIsUploading(true);
    setStatusMsg({ type: 'info', text: 'Mevcut denetim verisi Google Drive klasörüne yükleniyor...' });
    try {
      setSavedDriveFolderId(folderId);
      const res = await uploadAuditJsonToDrive(currentAuditData, folderId);
      setStatusMsg({
        type: 'success',
        text: res.isUpdated
          ? `"${res.fileName}" mevcut referans dosyasının üzerine başarıyla güncellendi!`
          : `"${res.fileName}" başarıyla Drive klasörüne kaydedildi! Diğer tabletler artık bu dosyayı yükleyebilir.`,
      });
      await handleRefreshFiles(folderId);
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
      `"${file.name}" isimli denetim projesi yüklenecektir. Mevcut ekrandaki veriniz bu projenin içeriğiyle güncellenecektir. Devam edilsin mi?`
    );
    if (!confirmLoad) return;

    setIsLoading(true);
    setStatusMsg({ type: 'info', text: 'Proje verisi Drive üzerinden çekiliyor...' });
    try {
      const data = await downloadAuditJsonFromDrive(file.id);
      onLoadAuditFromDrive(data);
      setStatusMsg({
        type: 'success',
        text: `"${file.name}" projesi başarıyla yüklendi! Artık eksik kapatma veya inceleme yapabilirsiniz.`,
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
      <div className="bg-slate-900 rounded-xl max-w-xl w-full p-4 sm:p-5 shadow-2xl border border-slate-800 text-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
              <Cloud className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-slate-100 uppercase tracking-tight">
                GOOGLE DRİVE BULUT ARŞİVİ & SENKRONİZASYON
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

        {/* Info / Account Banner */}
        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 mb-3 space-y-2 text-xs">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5 text-slate-300">
              <FolderOpen className="w-4 h-4 text-amber-400" />
              <span className="font-bold">Hedef Klasör:</span>
              <span className="font-mono text-[11px] text-amber-300">KALITEKONTROL ARSIV</span>
            </div>
            <a
              href={DEFAULT_DRIVE_FOLDER_URL}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-bold underline"
            >
              <span>Drive'da Aç</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-2 text-[11px] text-slate-400 pt-1 border-t border-slate-900">
            <span>Tablet Hesabı: <strong className="text-slate-200">{DEFAULT_DRIVE_ACCOUNT}</strong></span>
            {isConnected ? (
              <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Bağlandı
              </span>
            ) : (
              <span className="text-slate-400">Oturum Açılmadı</span>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="space-y-2 mb-3">
          {!isConnected ? (
            <div className="space-y-2">
              <button
                type="button"
                id="btn-drive-connect"
                onClick={handleConnect}
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Cloud className="w-4 h-4" />
                )}
                <span>Google Drive ile Oturum Aç & Klasöre Bağlan</span>
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowManualToken(!showManualToken)}
                  className="text-[11px] text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
                >
                  {showManualToken ? '▲ Manuel Token Alanını Gizle' : '▼ Tablet Açılır Pencere / Domain Engeli Varsa: Manuel Token Gir'}
                </button>
              </div>

              {showManualToken && (
                <div className="p-3 bg-slate-950 rounded-lg border border-amber-500/40 space-y-2 animate-fadeIn">
                  <p className="text-[11px] text-slate-300">
                    Tablet tarayıcınızda veya domain engeliniz varsa Google OAuth Access Token yapıştırabilirsiniz:
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="ya29.a0A..."
                      value={manualToken}
                      onChange={(e) => setManualToken(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleManualTokenSave}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs rounded cursor-pointer"
                    >
                      Kaydet & Bağlan
                    </button>
                  </div>
                </div>
              )}

              {/* Direct Offline / File Option for Tablet APK */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <label className="py-2 px-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer text-center">
                  <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Cihazdan Dosya Aç</span>
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (evt) => {
                        try {
                          const parsed = JSON.parse(evt.target?.result as string);
                          onLoadAuditFromDrive(parsed);
                          setStatusMsg({
                            type: 'success',
                            text: `"${parsed.clientProjectName || parsed.serialNumber || 'Proje'}" cihazdan başarıyla yüklendi!`,
                          });
                          setTimeout(() => onClose(), 800);
                        } catch (err: any) {
                          setStatusMsg({ type: 'error', text: 'Dosya okunamadı: ' + err?.message });
                        }
                      };
                      reader.readAsText(file);
                    }}
                    className="hidden"
                  />
                </label>

                {currentAuditData && (
                  <button
                    type="button"
                    onClick={() => {
                      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(currentAuditData, null, 2));
                      const dlAnchor = document.createElement('a');
                      const fName = `Beta_Denetim_${currentAuditData.serialNumber || currentAuditData.clientProjectName || 'Proje'}.json`;
                      dlAnchor.setAttribute('href', dataStr);
                      dlAnchor.setAttribute('download', fName);
                      dlAnchor.click();
                      setStatusMsg({ type: 'success', text: 'Proje cihaz hafızasına JSON olarak indirildi!' });
                    }}
                    className="py-2 px-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <UploadCloud className="w-3.5 h-3.5 text-blue-400" />
                    <span>Cihaza İndir (JSON)</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Upload Active Audit */}
              {currentAuditData && (
                <button
                  type="button"
                  id="btn-drive-upload-active"
                  onClick={handleUploadCurrentAudit}
                  disabled={isUploading || isLoading}
                  className="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  {isUploading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <UploadCloud className="w-3.5 h-3.5" />
                  )}
                  <span>Bu Projeyi Drive'a Yedekle</span>
                </button>
              )}

              {/* Refresh Files List */}
              <button
                type="button"
                id="btn-drive-refresh-list"
                onClick={() => handleRefreshFiles(folderId)}
                disabled={isLoading}
                className="py-2 px-3 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-850 text-slate-200 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-700"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Listeyi Yenile</span>
              </button>

              {/* Logout */}
              <button
                type="button"
                onClick={handleDisconnect}
                className="py-1.5 px-2.5 bg-slate-900 hover:bg-red-950/40 text-slate-400 hover:text-red-300 border border-slate-800 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all sm:col-span-2 cursor-pointer"
              >
                <LogOut className="w-3 h-3" />
                <span>Oturumu Kapat</span>
              </button>
            </div>
          )}
        </div>

        {/* Feedback Message */}
        {statusMsg.text && (
          <div
            className={`p-2.5 rounded-lg text-xs mb-3 flex items-start gap-2 border ${
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

        {/* Files List Header */}
        <div className="flex items-center justify-between pb-1 text-xs">
          <span className="font-bold text-slate-300 uppercase tracking-wider">
            Drive Klasöründeki Projeler & Raporlar ({files.length})
          </span>
          <span className="text-[10px] text-slate-400">Mavi JSON dosyaları tablete yüklenir</span>
        </div>

        {/* Files Scrollable Container */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 min-h-[140px]">
          {files.length === 0 ? (
            <div className="p-8 text-center bg-slate-950 rounded-lg border border-slate-800">
              <Cloud className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400">
                {isConnected
                  ? 'Klasörde henüz kayıtlı proje veya PDF dosyası bulunmuyor.'
                  : 'Dosyaları görmek için yukarıdan Google Drive ile oturum açınız.'}
              </p>
            </div>
          ) : (
            files.map((file) => {
              const isJson = file.isAuditData;
              return (
                <div
                  key={file.id}
                  className={`p-2.5 rounded-lg border transition-all flex items-center justify-between gap-2.5 ${
                    isJson
                      ? 'bg-slate-950 hover:bg-slate-850 border-blue-900/60 hover:border-blue-500'
                      : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <div className="min-w-0 flex items-center gap-2 flex-1">
                    <div
                      className={`w-7 h-7 rounded flex items-center justify-center shrink-0 ${
                        isJson ? 'bg-blue-600/20 text-blue-400' : 'bg-red-600/20 text-red-400'
                      }`}
                    >
                      {isJson ? <FileCode2 className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-100 truncate">{file.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {file.modifiedTime ? new Date(file.modifiedTime).toLocaleString('tr-TR') : 'Tarih Yok'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isJson ? (
                      <button
                        type="button"
                        onClick={() => handleDownloadAndApply(file)}
                        className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] font-black uppercase tracking-wider flex items-center gap-1 shadow-xs cursor-pointer"
                        title="Bu projeyi ekrana yükle ve eksik kapatmasını yap"
                      >
                        <DownloadCloud className="w-3.5 h-3.5" />
                        <span>Yükle</span>
                      </button>
                    ) : (
                      file.webViewLink && (
                        <a
                          href={file.webViewLink}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-bold flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Görüntüle</span>
                        </a>
                      )
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
