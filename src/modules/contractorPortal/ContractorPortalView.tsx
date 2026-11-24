import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Send,
  User,
  Wrench,
  Check,
  Building2,
  Hash,
  Calendar,
  Layers,
  ShieldCheck,
  MessageSquare,
  PhoneCall,
} from 'lucide-react';
import { BetaLogo } from '../../components/BetaLogo';
import {
  ContractorTaskPayload,
  ContractorSubmissionItem,
  fetchContractorTaskFromDrive,
  submitContractorUpdatesToDrive,
} from '../../services/googleDriveService';

interface ContractorPortalViewProps {
  fileId: string;
  auditKey: string;
  scriptUrlOverride?: string;
}

const STORAGE_CONTRACTOR_NAME_KEY = 'beta_contractor_last_name_v1';

interface LocalItemDraft {
  contractorDone: boolean;
  contractorNote: string;
}

export const ContractorPortalView: React.FC<ContractorPortalViewProps> = ({
  fileId,
  auditKey,
  scriptUrlOverride,
}) => {
  const [task, setTask] = useState<ContractorTaskPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [contractorName, setContractorName] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_CONTRACTOR_NAME_KEY) || '';
    } catch {
      return '';
    }
  });

  const [drafts, setDrafts] = useState<Record<string, LocalItemDraft>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<{
    updatedAt: string;
    doneCount: number;
    totalCount: number;
  } | null>(null);

  const loadTask = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    setSubmitError(null);
    try {
      const payload = await fetchContractorTaskFromDrive(fileId, auditKey, scriptUrlOverride);
      setTask(payload);

      const initialDrafts: Record<string, LocalItemDraft> = {};
      let firstExistingName = '';
      payload.items.forEach((it) => {
        initialDrafts[it.id] = {
          contractorDone: !!it.contractorDone,
          contractorNote: it.contractorNote || '',
        };
        if (!firstExistingName && it.contractorName) {
          firstExistingName = it.contractorName;
        }
      });
      setDrafts(initialDrafts);

      if (firstExistingName && !contractorName.trim()) {
        setContractorName(firstExistingName);
      }
    } catch (err: any) {
      setLoadError(err?.message || 'Görev listesi Drive üzerinden yüklenemedi.');
    } finally {
      setIsLoading(false);
    }
  }, [fileId, auditKey, scriptUrlOverride]);

  useEffect(() => {
    loadTask();
  }, [loadTask]);

  const handleContractorNameChange = (value: string) => {
    setContractorName(value);
    try {
      localStorage.setItem(STORAGE_CONTRACTOR_NAME_KEY, value);
    } catch {
      // ignore
    }
  };

  const handleToggleDone = (itemId: string) => {
    setSubmitSuccess(null);
    setSubmitError(null);
    setDrafts((prev) => {
      const current = prev[itemId] || { contractorDone: false, contractorNote: '' };
      return {
        ...prev,
        [itemId]: {
          ...current,
          contractorDone: !current.contractorDone,
        },
      };
    });
  };

  const handleNoteChange = (itemId: string, note: string) => {
    setSubmitSuccess(null);
    setSubmitError(null);
    setDrafts((prev) => {
      const current = prev[itemId] || { contractorDone: false, contractorNote: '' };
      return {
        ...prev,
        [itemId]: {
          ...current,
          contractorNote: note,
        },
      };
    });
  };

  const doneCount = useMemo(() => {
    if (!task) return 0;
    return task.items.filter((it) => drafts[it.id]?.contractorDone).length;
  }, [task, drafts]);

  const handleSubmit = async () => {
    if (!task || isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const updates: ContractorSubmissionItem[] = task.items.map((it) => {
        const d = drafts[it.id] || { contractorDone: false, contractorNote: '' };
        return {
          id: it.id,
          contractorDone: !!d.contractorDone,
          contractorNote: (d.contractorNote || '').trim(),
        };
      });

      const res = await submitContractorUpdatesToDrive({
        fileId,
        auditKey,
        contractorName: contractorName.trim(),
        updates,
        scriptUrlOverride,
      });

      setSubmitSuccess({
        updatedAt: res.updatedAt,
        doneCount,
        totalCount: task.items.length,
      });

      // Local item state metadata güncelle
      setTask((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map((it) => {
            const d = drafts[it.id];
            return {
              ...it,
              contractorDone: !!d?.contractorDone,
              contractorNote: (d?.contractorNote || '').trim(),
              contractorUpdatedAt:
                d?.contractorDone || d?.contractorNote?.trim() ? res.updatedAt : it.contractorUpdatedAt,
              contractorName: contractorName.trim() || it.contractorName,
            };
          }),
        };
      });
    } catch (err: any) {
      setSubmitError(err?.message || 'Kayıt Google Drive üzerine gönderilemedi. İnternet bağlantınızı kontrol edip tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-28">
      {/* Sabit Kurumsal Üst Başlık */}
      <header className="bg-[#0A2647] text-white shadow-md sticky top-0 z-30 border-b-2 border-amber-400">
        <div className="max-w-2xl mx-auto px-3 py-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <BetaLogo size="sm" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded bg-amber-400 text-[#0A2647] text-[10px] font-black uppercase tracking-wider shrink-0">
                  Taşeron Portalı
                </span>
                <span className="text-[11px] text-slate-300 font-semibold truncate">
                  Kurulumsuz Saha Bildirimi
                </span>
              </div>
              <h1 className="text-sm sm:text-base font-black tracking-tight text-white truncate">
                Eksik Giderme & Usta Onayı
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={loadTask}
            disabled={isLoading || isSubmitting}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-100 border border-slate-600 transition-colors cursor-pointer shrink-0"
            title="Listeyi Yenile"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-300' : ''}`} />
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-3 py-4 space-y-4">
        {/* Yükleniyor Durumu */}
        {isLoading && (
          <div className="bg-white rounded-2xl border-2 border-slate-200 p-8 text-center shadow-sm space-y-3">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
            <p className="text-sm font-bold text-slate-800">
              Asansör eksik listesi Google Drive&apos;dan yükleniyor...
            </p>
            <p className="text-xs text-slate-500">Lütfen birkaç saniye bekleyiniz.</p>
          </div>
        )}

        {/* Hata Durumu */}
        {!isLoading && loadError && (
          <div className="bg-white rounded-2xl border-2 border-rose-300 p-6 text-center shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-base font-black text-slate-900">Bağlantı Açılamadı</h2>
            <p className="text-xs sm:text-sm text-rose-700 font-medium leading-relaxed">
              {loadError}
            </p>
            <button
              type="button"
              onClick={loadTask}
              className="px-5 py-2.5 bg-[#0A2647] hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider inline-flex items-center gap-2 shadow cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Tekrar Dene</span>
            </button>
          </div>
        )}

        {/* Görev İçeriği */}
        {!isLoading && !loadError && task && (
          <>
            {/* Asansör Kimlik Kartı */}
            <section className="bg-white rounded-2xl border-2 border-slate-300 p-3.5 shadow-sm space-y-3">
              <div className="flex items-start justify-between gap-2 border-b border-slate-200 pb-2.5">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase">
                    <Building2 className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                    <span>Şantiye / Proje Adı</span>
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-[#0A2647] leading-snug break-words mt-0.5">
                    {task.projectName}
                  </h2>
                </div>

                <div className="px-2.5 py-1.5 rounded-xl bg-rose-50 border border-rose-300 text-center shrink-0">
                  <span className="block text-[10px] font-bold text-rose-700 uppercase">
                    Açık Eksik
                  </span>
                  <span className="text-base font-black text-rose-700">
                    {doneCount}/{task.items.length}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div className="bg-slate-50 rounded-lg p-2 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                    <Hash className="w-3 h-3 text-blue-600" /> Seri No
                  </span>
                  <span className="font-black text-slate-900 break-all">{task.serialNumber}</span>
                </div>
                <div className="bg-slate-50 rounded-lg p-2 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                    <Layers className="w-3 h-3 text-blue-600" /> Tip / Durak
                  </span>
                  <span className="font-bold text-slate-900">
                    {task.elevatorType} &bull; {task.stopCount} Durak
                  </span>
                </div>
                <div className="bg-slate-50 rounded-lg p-2 border border-slate-200 col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-blue-600" /> 1. Kontrol Tarihi
                  </span>
                  <span className="font-bold text-slate-900">{task.dateDisplay}</span>
                </div>
              </div>

              {/* Ekip / Usta Adı */}
              <div className="pt-1">
                <label
                  htmlFor="contractor-team-name"
                  className="text-xs font-black text-slate-700 flex items-center gap-1.5 mb-1"
                >
                  <User className="w-3.5 h-3.5 text-amber-600" />
                  <span>Ekip / Usta Adı (İsteğe Bağlı):</span>
                </label>
                <input
                  id="contractor-team-name"
                  type="text"
                  value={contractorName}
                  onChange={(e) => handleContractorNameChange(e.target.value)}
                  placeholder="Örn: Ahmet Usta / Ekip 3"
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-300 focus:border-[#0A2647] bg-slate-50 focus:bg-white text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-hidden transition-colors"
                />
              </div>
            </section>

            {/* Açık Eksik Yoksa */}
            {task.items.length === 0 ? (
              <section className="bg-emerald-50 rounded-2xl border-2 border-emerald-400 p-6 text-center space-y-2 shadow-sm">
                <ShieldCheck className="w-12 h-12 text-emerald-600 mx-auto" />
                <h3 className="text-base font-black text-emerald-900 uppercase">
                  Açık Eksik Bulunmamaktadır
                </h3>
                <p className="text-xs sm:text-sm text-emerald-800 font-medium">
                  Bu asansöre ait tüm uygunsuzluklar 2. kontrol ekibi tarafından kapatılmıştır.
                </p>
              </section>
            ) : (
              <>
                {/* Bilgilendirme Şeridi */}
                <div className="bg-blue-50 border border-blue-300 rounded-xl p-3 text-xs text-blue-950 flex items-start gap-2">
                  <Wrench className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    Aşağıda yalnızca <strong>bu asansöre ait açık eksikler</strong> listelenmektedir.
                    Tamamladığınız maddelerde <strong>&quot;Yaptım / Tamamlandı&quot;</strong> butonuna basın,
                    gerekirse açıklama yazın ve en alttaki kaydet butonuna dokunun.
                  </p>
                </div>

                {/* Başarı Bildirimi */}
                {submitSuccess && (
                  <div className="bg-emerald-600 text-white rounded-2xl p-4 shadow-lg border-2 border-emerald-300 space-y-2">
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-6 h-6 text-emerald-100 shrink-0 mt-0.5" />
                      <div>
                        <h3 className="text-sm sm:text-base font-black">
                          Bilgileriniz Buluta (Drive) Kaydedildi!
                        </h3>
                        <p className="text-xs text-emerald-50 mt-0.5">
                          Son güncelleme: <strong>{submitSuccess.updatedAt}</strong> &bull; İşaretlenen:{' '}
                          <strong>
                            {submitSuccess.doneCount}/{submitSuccess.totalCount} madde
                          </strong>
                        </p>
                      </div>
                    </div>
                    <div className="bg-emerald-800/60 rounded-xl p-2.5 text-xs flex items-center gap-2 border border-emerald-400/50">
                      <PhoneCall className="w-4 h-4 text-amber-300 shrink-0" />
                      <span>
                        İşiniz bittiğinde kontrol ekibimize telefonla bilgi vermeniz yeterlidir; 2. kontrolde notlarınız ve işaretleriniz doğrudan ekranda görülecektir.
                      </span>
                    </div>
                  </div>
                )}

                {/* Hata Bildirimi */}
                {submitError && (
                  <div className="bg-rose-50 border-2 border-rose-400 text-rose-900 rounded-xl p-3 text-xs font-bold flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{submitError}</span>
                  </div>
                )}

                {/* Eksik Maddeler Listesi */}
                <div className="space-y-3">
                  {task.items.map((item, idx) => {
                    const draft = drafts[item.id] || {
                      contractorDone: !!item.contractorDone,
                      contractorNote: item.contractorNote || '',
                    };
                    const isDone = draft.contractorDone;

                    return (
                      <article
                        key={item.id}
                        className={`rounded-2xl border-2 p-3.5 shadow-sm transition-all ${
                          isDone
                            ? 'bg-emerald-50/90 border-emerald-400'
                            : 'bg-white border-slate-300'
                        }`}
                      >
                        {/* Üst Satır: Sıra + Kategori + Kat + Başlık */}
                        <div className="flex items-start gap-2.5">
                          <span
                            className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center shrink-0 mt-0.5 ${
                              isDone ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                            }`}
                          >
                            {idx + 1}
                          </span>

                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                                {item.category}
                              </span>
                              {item.floorLabel && (
                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-300">
                                  Kat: {item.floorLabel}
                                </span>
                              )}
                              {item.contractorUpdatedAt && (
                                <span className="text-[10px] font-bold text-slate-500 ml-auto">
                                  Son kayıt: {item.contractorUpdatedAt}
                                </span>
                              )}
                            </div>

                            <h3 className="text-sm sm:text-base font-black text-slate-900 leading-snug break-words">
                              {item.title}
                            </h3>
                          </div>
                        </div>

                        {/* 1. Kontrol Tespit Edilen Eksiklik (Salt Okunur) */}
                        <div className="mt-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200">
                          <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 block mb-1">
                            1. Kontrol Tespit Edilen Eksiklik:
                          </span>
                          <p className="text-xs sm:text-sm font-medium text-slate-800 whitespace-pre-wrap break-words border-l-2 border-rose-500 pl-2">
                            {item.description || 'Uygunsuzluk olarak işaretlendi.'}
                          </p>
                        </div>

                        {/* Usta Aksiyon Alanı */}
                        <div className="mt-3 space-y-2.5">
                          <button
                            type="button"
                            onClick={() => handleToggleDone(item.id)}
                            className={`w-full min-h-[46px] px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 border-2 transition-all cursor-pointer active:scale-[0.99] ${
                              isDone
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700 shadow-md'
                                : 'bg-slate-100 hover:bg-emerald-50 text-slate-800 border-slate-300 hover:border-emerald-400'
                            }`}
                          >
                            <Check className={`w-4 h-4 stroke-[3] ${isDone ? 'text-white' : 'text-slate-500'}`} />
                            <span>
                              {isDone ? 'Yaptım / Tamamlandı ✓' : 'Yaptım / Tamamlandı Olarak İşaretle'}
                            </span>
                          </button>

                          <div>
                            <label
                              htmlFor={`note-${item.id}`}
                              className="text-[11px] font-bold text-slate-600 flex items-center gap-1 mb-1"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                              <span>Usta Notu / Açıklama (İsteğe Bağlı):</span>
                            </label>
                            <textarea
                              id={`note-${item.id}`}
                              rows={2}
                              value={draft.contractorNote}
                              onChange={(e) => handleNoteChange(item.id, e.target.value)}
                              placeholder="Örn: Parça yenilendi, bağlantı sıkıldı, ayar yapıldı..."
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#0A2647] bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-hidden resize-y"
                            />
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
      </main>

      {/* Sabit Alt Kaydet Çubuğu */}
      {!isLoading && !loadError && task && task.items.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-xs border-t-2 border-slate-300 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] p-3">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <div className="hidden sm:block text-xs text-slate-600 shrink-0">
              <span className="font-black text-[#0A2647]">
                {doneCount}/{task.items.length}
              </span>{' '}
              madde yapıldı işaretli
            </div>
            <button
              type="button"
              id="btn-contractor-submit"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="flex-1 min-h-[48px] px-4 py-3 bg-[#0A2647] hover:bg-blue-950 disabled:opacity-70 text-white rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all active:scale-[0.99]"
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
              ) : (
                <Send className="w-4 h-4 text-amber-300" />
              )}
              <span>
                {isSubmitting
                  ? "Drive'a Kaydediliyor..."
                  : "Yaptıklarımı Kaydet ve Drive'a Gönder"}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
