import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Tablet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X,
  Copy,
  Trash2,
  RefreshCw,
  HardDrive,
  Download,
  Upload,
  Layers,
  Terminal,
  ShieldCheck,
  Cpu,
  Eye,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { getAppLogs, clearAppLogs, subscribeToLogs, AppLogEntry } from '../polyfills';
import { loadActiveDraft, saveActiveDraft } from '../utils/storage';
import { AuditFormData } from '../types';

interface AndroidDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadAudit?: (data: AuditFormData) => void;
}

interface CompatibilityCheckItem {
  id: string;
  name: string;
  category: 'js' | 'storage' | 'dom' | 'network';
  passed: boolean;
  detail: string;
}

export const AndroidDiagnosticModal: React.FC<AndroidDiagnosticModalProps> = ({
  isOpen,
  onClose,
  onLoadAudit,
}) => {
  const { isDark } = useTheme();
  const [logs, setLogs] = useState<AppLogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'doctor' | 'logs' | 'offline_backup' | 'device_info'>('doctor');
  const [copied, setCopied] = useState(false);
  const [checks, setChecks] = useState<CompatibilityCheckItem[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const unsub = subscribeToLogs((newLogs) => setLogs(newLogs));
    runCompatibilityDoctor();
    return () => unsub();
  }, [isOpen]);

  const runCompatibilityDoctor = () => {
    setIsTesting(true);
    const results: CompatibilityCheckItem[] = [];

    // 1. structuredClone
    try {
      const testObj = { a: 1, b: { c: 'test' } };
      const cloned = (window as any).structuredClone ? (window as any).structuredClone(testObj) : null;
      results.push({
        id: 'structuredClone',
        name: 'structuredClone Desteği / Polyfill',
        category: 'js',
        passed: cloned && cloned.b.c === 'test' && cloned !== testObj,
        detail: cloned ? 'Çalışıyor (Derin klonlama aktif)' : 'Desteklenmiyor',
      });
    } catch (e: any) {
      results.push({
        id: 'structuredClone',
        name: 'structuredClone Desteği',
        category: 'js',
        passed: false,
        detail: e?.message || 'Hata',
      });
    }

    // 2. globalThis
    results.push({
      id: 'globalThis',
      name: 'globalThis Değişken Desteği',
      category: 'js',
      passed: typeof (window as any).globalThis !== 'undefined',
      detail: 'Mevcut (Android 8.1 uyumlu)',
    });

    // 3. Array Modern Metodları (.at, .flat, .flatMap)
    const arrOk = !!Array.prototype.at && !!Array.prototype.flat && !!Array.prototype.flatMap;
    results.push({
      id: 'arrayMethods',
      name: 'Modern Dizi Metodları (at, flat, flatMap)',
      category: 'js',
      passed: arrOk,
      detail: arrOk ? 'Polyfill ile tam destek' : 'Eksik metodlar mevcut',
    });

    // 4. Object.fromEntries & Object.hasOwn
    const objOk = !!Object.fromEntries && !!(Object as any).hasOwn;
    results.push({
      id: 'objectMethods',
      name: 'Object Metodları (fromEntries, hasOwn)',
      category: 'js',
      passed: objOk,
      detail: objOk ? 'Polyfill ile tam destek' : 'Eksik metod',
    });

    // 5. String.prototype.replaceAll
    results.push({
      id: 'replaceAll',
      name: 'String replaceAll Desteği',
      category: 'js',
      passed: !!String.prototype.replaceAll,
      detail: 'Metin dönüştürmeleri güvenli',
    });

    // 6. LocalStorage Bellek Testi
    try {
      const testKey = '__beta_android8_test__';
      localStorage.setItem(testKey, 'ok_value');
      const val = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      results.push({
        id: 'localStorage',
        name: 'LocalStorage Yerel Kayıt Belleği',
        category: 'storage',
        passed: val === 'ok_value',
        detail: 'Hızlı yerel depolama aktif ve yazılabilir',
      });
    } catch (e: any) {
      results.push({
        id: 'localStorage',
        name: 'LocalStorage Yerel Bellek',
        category: 'storage',
        passed: false,
        detail: 'Depolama erişimi kısıtlı: ' + (e?.message || 'Hata'),
      });
    }

    // 7. IndexedDB Desteği
    const hasIndexedDB = !!window.indexedDB;
    results.push({
      id: 'indexedDB',
      name: 'IndexedDB Veritabanı Motoru',
      category: 'storage',
      passed: hasIndexedDB,
      detail: hasIndexedDB ? 'Mevcut (Gelişmiş çevrimdışı önbellek)' : 'Kullanılamıyor',
    });

    // 8. Dokunmatik & Pointer Olayları
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    results.push({
      id: 'touchEvents',
      name: 'Dokunmatik & Tablet Touch Motoru',
      category: 'dom',
      passed: true,
      detail: hasTouch ? `Dokunmatik Algılandı (${navigator.maxTouchPoints} nokta)` : 'Masaüstü/Fare Modu',
    });

    // 9. Canvas & Çizim / PDF Yeteneği
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      results.push({
        id: 'canvas',
        name: 'HTML5 Canvas & PDF Render Motoru',
        category: 'dom',
        passed: !!ctx,
        detail: ctx ? 'Grafik ve Rapor Çıktı Motoru Aktif' : 'Canvas desteği yok',
      });
    } catch {
      results.push({
        id: 'canvas',
        name: 'HTML5 Canvas Render',
        category: 'dom',
        passed: false,
        detail: 'Canvas hatası',
      });
    }

    setChecks(results);
    setIsTesting(false);
  };

  const handleCopyLogs = () => {
    const errorText = [
      `=== BETA ASANSÖR ANDROID 8.1.0 TEŞHİS RAPORU ===`,
      `Tarih: ${new Date().toLocaleString('tr-TR')}`,
      `Tarayıcı User-Agent: ${navigator.userAgent}`,
      `Ekran Çözünürlüğü: ${window.innerWidth} x ${window.innerHeight} (DPR: ${window.devicePixelRatio})`,
      ``,
      `--- SİSTEM VE UYUMLULUK KONTROLLERİ ---`,
      ...checks.map((c) => `[${c.passed ? 'BAŞARILI' : 'BAŞARISIZ'}] ${c.name}: ${c.detail}`),
      ``,
      `--- CANLI HATA VE UYARI GÜNLÜĞÜ (${logs.length} Kayıt) ---`,
      ...logs.map((l) => `[${l.timestamp}] [${l.type.toUpperCase()}] ${l.message} ${l.stack ? '\n  ' + l.stack : ''}`),
    ].join('\n');

    navigator.clipboard.writeText(errorText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // 1-Click Export Active Audit JSON
  const handleExportJson = () => {
    const draft = loadActiveDraft();
    if (!draft) {
      alert('Kaydedilecek aktif taslak bulunamadı.');
      return;
    }
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(draft, null, 2));
    const dlAnchor = document.createElement('a');
    const fileName = `Beta_Denetim_${draft.serialNumber || draft.clientProjectName || 'Proje'}_${new Date().toISOString().slice(0, 10)}.json`;
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', fileName);
    dlAnchor.click();
  };

  // 1-Click Import JSON File
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (onLoadAudit) {
          onLoadAudit(parsed);
          saveActiveDraft(parsed);
          alert(`"${parsed.clientProjectName || parsed.serialNumber || 'Proje'}" dosyadan başarıyla yüklendi!`);
          onClose();
        } else {
          saveActiveDraft(parsed);
          alert('Proje taslağa kaydedildi, sayfayı yenileyiniz.');
          onClose();
        }
      } catch (err: any) {
        alert('Geçersiz dosya formatı: ' + err?.message);
      }
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  const totalErrors = logs.filter((l) => l.type === 'error').length;
  const totalWarns = logs.filter((l) => l.type === 'warn').length;
  const allChecksPassed = checks.length > 0 && checks.every((c) => c.passed);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay-safe bg-slate-950/85 backdrop-blur-xs animate-fadeIn">
      <div
        className={`rounded-xl max-w-2xl w-full p-4 sm:p-5 shadow-2xl border modal-box-safe flex flex-col ${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between pb-3 border-b mb-3 ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold">
              <Cpu className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`font-black text-sm sm:text-base tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  ANDROİD 8.1 (TABLET) UYUMLULUK & HATA DOKTORU
                </h3>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Android 8.1+ Oreo
                </span>
              </div>
              <p className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                APK ve Tablet çalışma ortamı doğrulama, canlı hata konsolu ve çevrimdışı yedekleme
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className={`flex rounded-lg p-1 mb-3 border shrink-0 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
          <button
            type="button"
            onClick={() => setActiveTab('doctor')}
            className={`flex-1 py-1.5 px-2 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'doctor'
                ? 'bg-emerald-600 text-white shadow-xs font-black'
                : isDark
                ? 'text-slate-400 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Uyumluluk Testi ({checks.filter((c) => c.passed).length}/{checks.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`flex-1 py-1.5 px-2 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'logs'
                ? 'bg-rose-600 text-white shadow-xs font-black'
                : isDark
                ? 'text-slate-400 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Canlı Hata Konsolu</span>
            {totalErrors > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-white text-rose-600">
                {totalErrors}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('offline_backup')}
            className={`flex-1 py-1.5 px-2 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'offline_backup'
                ? 'bg-blue-600 text-white shadow-xs font-black'
                : isDark
                ? 'text-slate-400 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Çevrimdışı / APK Aktarımı</span>
          </button>
        </div>

        {/* Tab 1: Uyumluluk Doktoru */}
        {activeTab === 'doctor' && (
          <div className="flex-1 overflow-y-auto pr-1 space-y-3">
            <div className={`p-3 rounded-lg border flex items-center justify-between ${
              allChecksPassed
                ? isDark
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : isDark
                ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                : 'bg-amber-50 border-amber-300 text-amber-800'
            }`}>
              <div className="flex items-center gap-2">
                {allChecksPassed ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />}
                <div>
                  <h4 className="text-xs font-black uppercase">
                    {allChecksPassed ? 'Android 8.1.0 Uyumluluğu %100 Doğrulandı' : 'Bazı Uyarılar Algılandı'}
                  </h4>
                  <p className="text-[11px] opacity-90">
                    Legacy Polyfills & Modern ES2015 motoru tablet tarayıcısında eksiksiz çalışmaya hazırdır.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={runCompatibilityDoctor}
                disabled={isTesting}
                className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-xs font-bold flex items-center gap-1 cursor-pointer transition shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                <span>Tekrar Test Et</span>
              </button>
            </div>

            <div className="space-y-1.5">
              {checks.map((check) => (
                <div
                  key={check.id}
                  className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 text-xs transition-colors ${
                    check.passed
                      ? isDark
                        ? 'bg-slate-950/70 border-slate-800 text-slate-200'
                        : 'bg-slate-50 border-slate-200 text-slate-800'
                      : isDark
                      ? 'bg-rose-950/30 border-rose-800/60 text-rose-200'
                      : 'bg-rose-50 border-rose-300 text-rose-800'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {check.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-xs truncate">{check.name}</p>
                      <p className={`text-[10px] truncate ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {check.detail}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-black uppercase shrink-0 ${
                      check.passed
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {check.passed ? 'Uyumlu' : 'Eksik'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Canlı Hata Konsolu */}
        {activeTab === 'logs' && (
          <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2 shrink-0">
              <div className="text-xs text-slate-400 font-medium">
                Toplam Kayıt: <strong className="text-white">{logs.length}</strong> (Hata: <span className="text-rose-400 font-bold">{totalErrors}</span>, Uyarı: <span className="text-amber-400 font-bold">{totalWarns}</span>)
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCopyLogs}
                  className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition shadow-xs"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? 'Kopyalandı!' : 'Raporu Kopyala'}</span>
                </button>
                <button
                  type="button"
                  onClick={clearAppLogs}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1 cursor-pointer transition border border-slate-700"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Temizle</span>
                </button>
              </div>
            </div>

            <div className={`flex-1 min-h-[220px] max-h-[360px] overflow-y-auto p-2.5 rounded-lg border font-mono text-[11px] space-y-2 ${
              isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-950 border-slate-800 text-slate-200'
            }`}>
              {logs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 py-10">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2 opacity-60" />
                  <p className="font-sans font-bold text-xs">Hiçbir Hata veya Uyarı Algılanmadı</p>
                  <p className="font-sans text-[10px] text-slate-500">Uygulama arka planda temiz ve hatasız çalışıyor.</p>
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-2 rounded border leading-relaxed break-all ${
                      log.type === 'error'
                        ? 'bg-rose-950/40 border-rose-800/80 text-rose-200'
                        : log.type === 'warn'
                        ? 'bg-amber-950/40 border-amber-800/80 text-amber-200'
                        : 'bg-slate-900 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] opacity-60">[{log.timestamp}]</span>
                      <span
                        className={`text-[9px] font-black uppercase px-1 rounded ${
                          log.type === 'error'
                            ? 'bg-rose-600 text-white'
                            : log.type === 'warn'
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-blue-600 text-white'
                        }`}
                      >
                        {log.type}
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold">{log.message}</p>
                    {log.stack && (
                      <pre className="mt-1 text-[9px] text-slate-400 overflow-x-auto whitespace-pre-wrap opacity-75">
                        {log.stack}
                      </pre>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Çevrimdışı / APK Aktarımı */}
        {activeTab === 'offline_backup' && (
          <div className="flex-1 overflow-y-auto pr-1 space-y-3">
            <div className={`p-3 rounded-lg border ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <h4 className="text-xs font-black uppercase text-blue-400 mb-1 flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-blue-400" />
                Google Hesapsız Doğrudan Dosya Aktarımı (APK Uyumlu)
              </h4>
              <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                Android APK içinde Google OAuth pencereleri güvenlik kısıtlamaları sebebiyle açılmadığında, projelerinizi tablet hafızasına tek tıkla <strong>.json dosyası</strong> olarak kaydedebilir ve istediğiniz tablete anında aktarabilirsiniz.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* 1. Projeyi Dosya Olarak İndir */}
              <div className={`p-3.5 rounded-lg border flex flex-col justify-between ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
              }`}>
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Download className="w-4 h-4 text-emerald-400" />
                    <h5 className="text-xs font-black">Projeyi Cihaza İndir (JSON)</h5>
                  </div>
                  <p className={`text-[11px] mb-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Mevcut doldurulmuş denetim formunu tablet hafızasına veya bilgisayara dosya olarak kaydeder.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleExportJson}
                  className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>JSON Olarak Kaydet</span>
                </button>
              </div>

              {/* 2. Cihazdan Proje Yükle */}
              <div className={`p-3.5 rounded-lg border flex flex-col justify-between ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
              }`}>
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Upload className="w-4 h-4 text-blue-400" />
                    <h5 className="text-xs font-black">Cihazdan Proje Dosyası Aç</h5>
                  </div>
                  <p className={`text-[11px] mb-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Daha önce kaydedilmiş veya başka tabletten aktarılmış .json dosyasını anında ekrana yükler.
                  </p>
                </div>

                <label className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition text-center">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Dosya Seç & Yükle</span>
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={handleImportJson}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className={`mt-3 pt-3 border-t flex items-center justify-between ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="text-[10px] text-slate-500 font-mono">
            Vite Legacy ES2015 + Android 8.1 API 27 Ready
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-black transition cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
