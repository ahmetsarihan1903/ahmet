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
    <div className="max-w-xl mx-auto py-6 px-3 sm:px-4">
      {/* Intro Card */}
      <div className="bg-white rounded-xl p-5 sm:p-7 shadow-md border-2 border-slate-300">
        <div className="flex items-center gap-3 mb-5 pb-4 border-b-2 border-slate-200">
          <BetaLogo size="md" className="shadow-xs shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-orange-600 bg-orange-100 px-2 py-0.5 rounded border border-orange-300">
                ADIM 1 / 4
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-[10px] font-black uppercase text-slate-600 tracking-wider">Saha Girişi</span>
            </div>
            <h1 className="text-lg sm:text-xl font-black text-slate-950 tracking-tight mt-1">
              Karşılama ve Personel Bilgisi
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Readonly Date */}
          <div className="bg-slate-100 rounded-lg p-3 border-2 border-slate-200">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>Denetim Tarihi (Sistemden Otomatik Alındı)</span>
            </div>
            <p className="text-sm font-black text-slate-900 font-mono">{dateDisplay}</p>
          </div>

          {/* Inspector Name Input */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 uppercase tracking-wider">
              <User className="w-4 h-4 text-blue-600" />
              <span>Kontrolü Yapan Personel / Usta</span>
              <span className="text-red-600 font-black">*</span>
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
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 uppercase tracking-wider">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Müşteri / Proje / Şantiye Adı</span>
              <span className="text-red-600 font-black">*</span>
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
          <div className="pt-3">
            <button
              type="submit"
              id="btn-step1-proceed"
              disabled={!isFormValid}
              className={`w-full py-4 px-4 rounded-lg font-black uppercase tracking-wider text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
                isFormValid
                  ? 'bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white border-2 border-blue-800'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed border-2 border-slate-300'
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
