import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { BetaLogo } from './BetaLogo';
import { UserCheck, Shield, Sparkles, ArrowRight } from 'lucide-react';

export const InitialUserSetupModal: React.FC = () => {
  const { userName, isNameRegistered, setUserName } = useUser();
  const { isDark } = useTheme();
  const [nameInput, setNameInput] = useState('');
  const [error, setError] = useState('');

  // If name is already registered, do not show this modal
  if (isNameRegistered) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim() || nameInput.trim().length < 3) {
      setError('Lütfen en az 3 karakterden oluşan geçerli bir ad ve soyad giriniz.');
      return;
    }
    setUserName(nameInput.trim());
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div
        className={`w-full max-w-md rounded-2xl shadow-2xl border p-5 sm:p-6 transition-all ${
          isDark
            ? 'bg-slate-900 border-slate-700/80 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Logo and Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="flex justify-center mb-1">
            <BetaLogo size="md" className="shadow-md" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/30">
            <Sparkles className="w-3 h-3 text-orange-400" />
            İlk Kurulum & Kullanıcı Kaydı
          </div>
          <h2 className="text-lg sm:text-xl font-black tracking-tight">
            Beta Asansör Saha Sistemine Hoş Geldiniz
          </h2>
          <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Cihazınızda yapacağınız tüm denetimlerde (Kuyu Röleve, Ray & Kapı, Kalite Kontrol vb.)
            <strong> "Kontrolü Yapan Denetçi"</strong> olarak otomatik işlenecek adınızı belirtiniz.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="initial-username"
              className={`block text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5 ${
                isDark ? 'text-slate-300' : 'text-slate-700'
              }`}
            >
              <UserCheck className="w-4 h-4 text-orange-400" />
              Adınız ve Soyadınız <span className="text-rose-500">*</span>
            </label>
            <input
              id="initial-username"
              type="text"
              required
              autoFocus
              value={nameInput}
              onChange={(e) => {
                setNameInput(e.target.value);
                if (error) setError('');
              }}
              placeholder="Örn: AHMET SARIHAN"
              className={`w-full px-4 py-3 rounded-xl border font-bold text-sm outline-none transition-all ${
                isDark
                  ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20'
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20'
              }`}
            />
            {error && (
              <p className="mt-1.5 text-xs font-bold text-rose-500">{error}</p>
            )}
          </div>

          {/* Bilgi Kutusu */}
          <div
            className={`p-3 rounded-xl border flex items-start gap-2.5 text-[11px] leading-relaxed ${
              isDark
                ? 'bg-slate-950/60 border-slate-800 text-slate-300'
                : 'bg-amber-50/70 border-amber-200 text-amber-900'
            }`}
          >
            <Shield className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Otomatik Denetçi Sabitleme:</p>
              <p className="opacity-90">
                Girdiğiniz isim cihazınıza kilitlenir ve tüm formlara otomatik aktarılır.
                İsmi değiştirmek yalnızca <strong>Yönetici Şifresi</strong> ile mümkündür.
              </p>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 px-4 bg-orange-600 hover:bg-orange-500 active:scale-[0.99] text-white font-black text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <span>Kaydet ve Uygulamayı Başlat</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
