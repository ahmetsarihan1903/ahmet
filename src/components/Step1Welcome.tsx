import React from 'react';
import { Calendar, User, Building2, ArrowRight } from 'lucide-react';
import { SmartTextInput } from './SmartTextInput';
import { BetaLogo } from './BetaLogo';

interface Step1WelcomeProps {
  dateDisplay: string;
  inspectorName: string;
  clientProjectName: string;
  onInspectorChange: (val: string) => void;
  onClientProjectChange: (val: string) => void;
  onProceed: () => void;
}

export const Step1Welcome: React.FC<Step1WelcomeProps> = ({
  dateDisplay,
  inspectorName,
  clientProjectName,
  onInspectorChange,
  onClientProjectChange,
  onProceed,
}) => {
  const isFormValid = inspectorName.trim().length > 0 && clientProjectName.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormValid) {
      onProceed();
    }
  };

  return (
    <div className="max-w-xl mx-auto py-5 px-3 sm:px-4">
      {/* Intro Card */}
      <div className="bg-slate-900 rounded-lg p-5 sm:p-6 shadow-2xl border border-slate-800">
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-800">
          <BetaLogo size="md" className="shadow-xs shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400">
                ADIM 1 / 4
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Saha Girişi</span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-100 tracking-tight">
              Karşılama ve Personel Bilgisi
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Readonly Date */}
          <div className="bg-slate-950 rounded p-3 border border-slate-800">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Denetim Tarihi (Sistemden Otomatik Alındı)</span>
            </div>
            <p className="text-sm font-bold text-slate-200 font-mono">{dateDisplay}</p>
          </div>

          {/* Inspector Name Input */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-300 uppercase tracking-wider">
              <User className="w-3.5 h-3.5 text-blue-400" />
              <span>Kontrolü Yapan Personel / Usta</span>
              <span className="text-orange-400">*</span>
            </div>
            <SmartTextInput
              id="input-inspector-name"
              value={inspectorName}
              onChange={onInspectorChange}
              placeholder="Adınızı ve soyadınızı yazın veya söyleyin..."
              required
              helperText="Metin veya mikrofon [🎙️] ikonuna basarak sesli giriş yapabilirsiniz."
            />
          </div>

          {/* Client / Project Name Input */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-300 uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Müşteri / Proje / Şantiye Adı</span>
              <span className="text-orange-400">*</span>
            </div>
            <SmartTextInput
              id="input-project-name"
              value={clientProjectName}
              onChange={onClientProjectChange}
              placeholder="Örn: Emaar Square T4 Blok / A Blok Asansörü..."
              required
              helperText="Proje adı rapora ve arşiv kayıtlarına otomatik işlenir."
            />
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              id="btn-step1-proceed"
              disabled={!isFormValid}
              className={`w-full py-3.5 px-4 rounded font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                isFormValid
                  ? 'bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white shadow-blue-500/20'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <span>Teknik Özelliklere Geç (Adım 2)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
