import React, { useState } from 'react';
import { CustomerElevatorType, CustomerInspectionMetadata } from './customerChecklistData';
import { CustomerThemeMode } from './customerThemes';
import { BetaLogo } from '../../components/BetaLogo';
import { Shield, ArrowRight, Building, Hash, User, Calendar, CheckSquare, Sparkles, Lock } from 'lucide-react';
import { useUser } from '../../context/UserContext';

interface CustomerInspectionFormProps {
  initialData?: CustomerInspectionMetadata;
  onSubmit: (metadata: CustomerInspectionMetadata) => void;
  onCancel?: () => void;
  themeMode?: CustomerThemeMode;
}

export const CustomerInspectionForm: React.FC<CustomerInspectionFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  themeMode = 'dark',
}) => {
  const { userName, isNameRegistered } = useUser();
  const [projectName, setProjectName] = useState(initialData?.projectName || '');
  const [serialNumber, setSerialNumber] = useState(initialData?.serialNumber || '');
  const [elevatorType, setElevatorType] = useState<CustomerElevatorType>(
    initialData?.elevatorType || 'MRL'
  );
  const [auditorName, setAuditorName] = useState(() => {
    if (userName && isNameRegistered) return userName;
    return initialData?.auditorName || 'Beta Asansör Denetim Ekibi';
  });
  const [inspectionDate, setInspectionDate] = useState(
    initialData?.inspectionDate || new Date().toISOString().split('T')[0]
  );
  const [formError, setFormError] = useState<string | null>(null);

  React.useEffect(() => {
    setProjectName(initialData?.projectName || '');
    setSerialNumber(initialData?.serialNumber || '');
    setElevatorType(initialData?.elevatorType || 'MRL');
    if (userName && isNameRegistered) {
      setAuditorName(userName);
    } else {
      setAuditorName(initialData?.auditorName || 'Beta Asansör Denetim Ekibi');
    }
    setInspectionDate(initialData?.inspectionDate || new Date().toISOString().split('T')[0]);
    setFormError(null);
  }, [initialData, userName, isNameRegistered]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim() || !serialNumber.trim() || !auditorName.trim()) {
      setFormError('Lütfen zorunlu alanları (Proje Adı, Asansör Seri No ve Denetçi) doldurunuz.');
      return;
    }

    setFormError(null);
    onSubmit({
      projectName: projectName.trim(),
      serialNumber: serialNumber.trim(),
      elevatorType,
      auditorName: auditorName.trim(),
      inspectionDate,
    });
  };

  const isDark = themeMode === 'dark';

  return (
    <div className="w-full max-w-2xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <div
        className={`rounded-2xl shadow-xl border overflow-hidden transition-all duration-200 ${
          isDark
            ? 'bg-slate-900 border-slate-800 text-white'
            : 'bg-[#FFFFFF] border-amber-200/90 text-slate-900 shadow-amber-900/5'
        }`}
      >
        {/* Banner */}
        <div
          className={`p-6 sm:p-8 border-b-4 ${
            isDark
              ? 'bg-slate-950 text-white border-emerald-500'
              : 'bg-[#1E293B] text-white border-amber-500'
          }`}
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div
                className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider mb-2 border ${
                  isDark
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                Resmi Yeşil Etiket Ön Denetim Formu
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {initialData ? 'Denetim Bilgilerini Düzenle' : 'Müşteri İşleri Uygunluk Formu'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                {initialData
                  ? 'Proje adı, seri no veya asansör tipini güncelleyin.'
                  : 'Kuyu, makine dairesi ve şantiye ön şartlarını denetleyin.'}
              </p>
            </div>
            <BetaLogo size="md" />
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {/* Elevator Type Switcher */}
          <div>
            <label
              className={`block text-xs font-bold uppercase tracking-wider mb-2 ${
                isDark ? 'text-slate-300' : 'text-slate-700'
              }`}
            >
              Asansör Tipi (Tahrik Sistemi) <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setElevatorType('MRL')}
                className={`p-4 rounded-xl border-2 text-left transition-all flex flex-col justify-between cursor-pointer ${
                  elevatorType === 'MRL'
                    ? isDark
                      ? 'border-emerald-500 bg-emerald-950/40 shadow-sm'
                      : 'border-amber-500 bg-amber-50 shadow-sm'
                    : isDark
                    ? 'border-slate-800 hover:border-slate-700 bg-slate-950/60'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-xs font-black px-2 py-0.5 rounded ${
                      isDark
                        ? 'bg-slate-900 text-emerald-400'
                        : 'bg-slate-900 text-amber-400'
                    }`}
                  >
                    MRL
                  </span>
                  {elevatorType === 'MRL' && (
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        isDark ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                    />
                  )}
                </div>
                <div
                  className={`font-bold text-sm ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  Makine Dairesiz
                </div>
                <div
                  className={`text-[11px] mt-0.5 ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  16 Standart Madde
                </div>
              </button>

              <button
                type="button"
                onClick={() => setElevatorType('MR')}
                className={`p-4 rounded-xl border-2 text-left transition-all flex flex-col justify-between cursor-pointer ${
                  elevatorType === 'MR'
                    ? isDark
                      ? 'border-emerald-500 bg-emerald-950/40 shadow-sm'
                      : 'border-amber-500 bg-amber-50 shadow-sm'
                    : isDark
                    ? 'border-slate-800 hover:border-slate-700 bg-slate-950/60'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-xs font-black px-2 py-0.5 rounded ${
                      isDark
                        ? 'bg-slate-900 text-emerald-400'
                        : 'bg-slate-900 text-amber-400'
                    }`}
                  >
                    MR
                  </span>
                  {elevatorType === 'MR' && (
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        isDark ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                    />
                  )}
                </div>
                <div
                  className={`font-bold text-sm ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  Makine Daireli
                </div>
                <div
                  className={`text-[11px] mt-0.5 ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  25 Standart Madde
                </div>
              </button>
            </div>
          </div>

          {/* Project & Serial Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                className={`block text-xs font-bold mb-1 flex items-center gap-1.5 ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                <Building className="w-3.5 h-3.5 text-slate-400" />
                Şantiye / Referans / Proje Adı <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Örn: Kartal Park Evleri A Blok"
                className={`w-full px-3.5 py-2.5 text-sm rounded-xl border outline-none font-medium transition-all ${
                  isDark
                    ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100'
                }`}
              />
            </div>

            <div>
              <label
                className={`block text-xs font-bold mb-1 flex items-center gap-1.5 ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                <Hash className="w-3.5 h-3.5 text-slate-400" />
                Asansör Seri No / Kimlik <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="Örn: 2026-AS-014"
                className={`w-full px-3.5 py-2.5 text-sm rounded-xl border outline-none font-medium transition-all font-mono ${
                  isDark
                    ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100'
                }`}
              />
            </div>
          </div>

          {/* Auditor & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  className={`text-xs font-bold flex items-center gap-1.5 ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  Denetimi Yapan Denetçi / Mühendis <span className="text-rose-500">*</span>
                </label>
                {isNameRegistered && userName && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Kilitli Profil
                  </span>
                )}
              </div>

              {isNameRegistered && userName ? (
                <div
                  className={`w-full px-3.5 py-2.5 text-sm rounded-xl border font-black flex items-center justify-between shadow-xs ${
                    isDark
                      ? 'bg-slate-950 border-slate-700 text-white'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  <span>{userName}</span>
                  <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                </div>
              ) : (
                <input
                  type="text"
                  required
                  value={auditorName}
                  onChange={(e) => setAuditorName(e.target.value)}
                  placeholder="Ad Soyad"
                  className={`w-full px-3.5 py-2.5 text-sm rounded-xl border outline-none font-medium transition-all ${
                    isDark
                      ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100'
                  }`}
                />
              )}
            </div>

            <div>
              <label
                className={`block text-xs font-bold mb-1 flex items-center gap-1.5 ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Denetim Tarihi <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={inspectionDate}
                onChange={(e) => setInspectionDate(e.target.value)}
                className={`w-full px-3.5 py-2.5 text-sm rounded-xl border outline-none font-medium transition-all ${
                  isDark
                    ? 'bg-slate-950 border-slate-700 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-100'
                }`}
              />
            </div>
          </div>

          {/* Info Box */}
          <div
            className={`rounded-xl p-4 border text-xs space-y-1 ${
              isDark
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            <div className="font-bold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 shrink-0" />
              Hazır Şablon Denetim Listesi:
            </div>
            <p className="leading-relaxed opacity-90">
              Seçilen tipe göre ortak ve özel maddeler otomatik yüklenecektir. Saha kontrolünde eksik olan maddeleri tek tıkla işaretleyip sesli veya yazılı not ekleyebilirsiniz.
            </p>
          </div>

          {/* Error Message */}
          {formError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-bold flex items-center gap-2">
              <span>⚠️</span>
              <span>{formError}</span>
            </div>
          )}

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className={`w-full sm:w-auto px-5 py-3.5 rounded-xl font-bold text-sm border transition-all cursor-pointer ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                }`}
              >
                Vazgeç / Geri Dön
              </button>
            )}

            <button
              type="submit"
              className={`flex-1 w-full py-3.5 px-6 rounded-xl font-black text-sm sm:text-base shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isDark
                  ? 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white'
                  : 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950'
              }`}
            >
              <CheckSquare className="w-5 h-5" />
              <span>{initialData ? 'Bilgileri Güncelle & Listeye Dön' : 'Kontrol Listesini Başlat'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
