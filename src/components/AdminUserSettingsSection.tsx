import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Lock,
  Unlock,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Smartphone,
  Shield,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';

export const AdminUserSettingsSection: React.FC = () => {
  const { isDark } = useTheme();
  const {
    userName,
    isAdmin,
    deviceProfile,
    setUserName,
    loginAdmin,
    logoutAdmin,
    updateAdminPassword,
  } = useUser();

  // Admin login states
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [adminLoginError, setAdminLoginError] = useState('');

  // Edit user name states
  const [editedUserName, setEditedUserName] = useState(userName);
  const [userSuccessMsg, setUserSuccessMsg] = useState('');

  // Change admin password states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState('');
  const [passwordErrorMsg, setPasswordErrorMsg] = useState('');

  useEffect(() => {
    setEditedUserName(userName);
  }, [userName]);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoginError('');
    if (!adminPasswordInput.trim()) {
      setAdminLoginError('Lütfen şifreyi giriniz.');
      return;
    }
    const success = loginAdmin(adminPasswordInput);
    if (success) {
      setAdminPasswordInput('');
      setAdminLoginError('');
      setEditedUserName(userName);
    } else {
      setAdminLoginError('Hatalı yönetici şifresi! Lütfen tekrar deneyiniz.');
    }
  };

  const handleUpdateUserName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editedUserName.trim() || editedUserName.trim().length < 3) {
      return;
    }
    setUserName(editedUserName.trim());
    setUserSuccessMsg('Kullanıcı / Denetçi ismi başarıyla güncellendi!');
    setTimeout(() => setUserSuccessMsg(''), 4000);
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrorMsg('');
    setPasswordSuccessMsg('');

    if (!newPassword.trim()) {
      setPasswordErrorMsg('Yeni şifre boş bırakılamaz.');
      return;
    }
    if (newPassword.trim() !== confirmPassword.trim()) {
      setPasswordErrorMsg('Girdiğiniz şifreler birbiriyle uyuşmuyor.');
      return;
    }
    const success = updateAdminPassword(newPassword.trim());
    if (success) {
      setPasswordSuccessMsg('Yönetici şifresi başarıyla değiştirildi!');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccessMsg(''), 4000);
    } else {
      setPasswordErrorMsg('Şifre güncellenirken bir hata oluştu.');
    }
  };

  return (
    <div className="space-y-3.5">
      {/* 1. Aktif Denetçi / Kullanıcı Profili (Kilitli Gösterim) */}
      <div
        className={`p-3.5 rounded-xl border ${
          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between mb-1.5">
          <span
            className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
              isDark ? 'text-slate-300' : 'text-slate-800'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-orange-400" />
            Kayıtlı Kullanıcı / Denetçi Profili
          </span>
          <span className="text-[10px] font-black px-2 py-0.5 rounded flex items-center gap-1 bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Lock className="w-3 h-3" />
            Kilitli
          </span>
        </div>

        <div
          className={`p-3 rounded-lg border flex items-center justify-between ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300 shadow-xs'
          }`}
        >
          <div>
            <p className="text-xs text-slate-400 font-medium">Kontrolü Yapan Personel:</p>
            <p className="text-sm font-black tracking-wide text-orange-400">
              {userName || 'Kullanıcı Tanımlanmamış'}
            </p>
          </div>
          <div
            className={`p-2 rounded-full ${
              isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
            }`}
            title="İsim denetim tutanakları için kilitlenmiştir"
          >
            <Lock className="w-4 h-4 text-amber-400" />
          </div>
        </div>

        <p className="mt-2 text-[11px] text-slate-400 leading-normal">
          Bu isim Kalite Kontrol, Ray & Kapı, Kuyu Röleve ve 2. Kontrol tutanaklarına
          <strong> "Kontrolü Yapan"</strong> olarak otomatik işlenir. Bu ismi değiştirmek için
          aşağıdaki Yönetici Girişini kullanınız.
        </p>

        {/* Cihaz Donanım Kimliği ve Kurulum Kimliği Güvenlik Kutusu */}
        <div
          className={`mt-3 p-3 rounded-lg border text-xs space-y-2.5 ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 font-bold text-[11px] text-slate-400">
              <Smartphone className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              Cihaz Donanım No (Hardware ID):
            </span>
            <span
              className={`font-mono font-black text-xs px-2 py-0.5 rounded border ${
                isDark
                  ? 'bg-slate-800 text-white border-slate-700'
                  : 'bg-slate-100 text-slate-950 border-slate-300'
              }`}
            >
              {deviceProfile.hardwareId}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 font-bold text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              Kurulum Güvenlik ID:
            </span>
            <span
              className={`font-mono font-black text-xs px-2 py-0.5 rounded border ${
                isDark
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                  : 'bg-emerald-50 text-emerald-900 border-emerald-300'
              }`}
            >
              #{deviceProfile.installationId}
            </span>
          </div>

          <div
            className={`pt-2 border-t text-[10px] leading-relaxed flex items-start gap-1.5 ${
              isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <p>
              <strong>Çifte Güvenlik Damgası:</strong> Cihaz Donanım No cihazın kalıcı mimari parmak izidir; uygulama silinse dahi bu donanımda sabit kalır. Kurulum ID'si ise her sıfır kurulumda yenilenir. Bu iki numara her resmi rapora güvenlik mührü olarak basılır.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Yönetici Girişi & Yönetici Paneli */}
      <div
        className={`p-3.5 rounded-xl border ${
          isAdmin
            ? isDark
              ? 'bg-emerald-950/20 border-emerald-800/50'
              : 'bg-emerald-50/70 border-emerald-300'
            : isDark
            ? 'bg-slate-950 border-slate-800'
            : 'bg-slate-50 border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span
            className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
              isAdmin
                ? 'text-emerald-400'
                : isDark
                ? 'text-slate-300'
                : 'text-slate-800'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            Yönetici Girişi (Admin Paneli)
          </span>

          {isAdmin ? (
            <span className="text-[10px] font-black px-2 py-0.5 rounded flex items-center gap-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              <Unlock className="w-3 h-3" />
              Yönetici Aktif
            </span>
          ) : (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-400">
              Yetki Gerekir
            </span>
          )}
        </div>

        {!isAdmin ? (
          /* Yönetici Giriş Formu */
          <form onSubmit={handleAdminLogin} className="space-y-2.5 pt-1">
            <p className="text-[11px] text-slate-400">
              Kullanıcı adını veya sistem ayarlarını güncellemek için yönetici şifresini giriniz.
            </p>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={adminPasswordInput}
                onChange={(e) => {
                  setAdminPasswordInput(e.target.value);
                  if (adminLoginError) setAdminLoginError('');
                }}
                placeholder="Yönetici Şifresi..."
                className={`w-full px-3.5 py-2.5 text-xs rounded-lg border font-mono outline-none transition pr-10 ${
                  isDark
                    ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-amber-400'
                    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-amber-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {adminLoginError && (
              <p className="text-xs font-bold text-rose-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {adminLoginError}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Yönetici Girişi Yap</span>
            </button>
          </form>
        ) : (
          /* Yönetici Paneli (Giriş Yapılmış) */
          <div className="space-y-3.5 pt-1">
            {/* 1. Kullanıcı İsmini Değiştir */}
            <form
              onSubmit={handleUpdateUserName}
              className={`p-3 rounded-lg border space-y-2 ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-orange-400" />
                  Kullanıcı / Denetçi İsmini Değiştir
                </label>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editedUserName}
                  onChange={(e) => setEditedUserName(e.target.value)}
                  placeholder="Yeni Ad Soyad..."
                  className={`flex-1 px-3 py-2 text-xs rounded-lg border font-bold outline-none ${
                    isDark
                      ? 'bg-slate-950 border-slate-700 text-white focus:border-orange-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-orange-500'
                  }`}
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-black uppercase tracking-wider cursor-pointer whitespace-nowrap transition"
                >
                  Güncelle
                </button>
              </div>
              {userSuccessMsg && (
                <p className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {userSuccessMsg}
                </p>
              )}
            </form>

            {/* 2. Yönetici Şifresini Değiştir */}
            <form
              onSubmit={handleUpdatePassword}
              className={`p-3 rounded-lg border space-y-2.5 ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'
              }`}
            >
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                Yönetici Şifresini Değiştir (Özel Yetki)
              </label>
              <p className="text-[11px] text-slate-400">
                Sistemde tanımlı şifreyi kendi belirleyeceğiniz yeni bir şifre ile değiştirebilirsiniz.
              </p>
              <div className="space-y-2">
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Yeni Yönetici Şifresi..."
                    className={`w-full px-3 py-2 text-xs rounded-lg border font-mono outline-none pr-10 ${
                      isDark
                        ? 'bg-slate-950 border-slate-700 text-white focus:border-amber-400'
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Yeni Şifre Tekrar..."
                  className={`w-full px-3 py-2 text-xs rounded-lg border font-mono outline-none ${
                    isDark
                      ? 'bg-slate-950 border-slate-700 text-white focus:border-amber-400'
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
                  }`}
                />
              </div>

              {passwordErrorMsg && (
                <p className="text-xs font-bold text-rose-500 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {passwordErrorMsg}
                </p>
              )}
              {passwordSuccessMsg && (
                <p className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {passwordSuccessMsg}
                </p>
              )}

              <button
                type="submit"
                className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-black uppercase tracking-wider cursor-pointer transition shadow-xs"
              >
                Yeni Yönetici Şifresini Kaydet
              </button>
            </form>

            {/* Yönetici Oturumunu Kapat Butonu */}
            <button
              type="button"
              onClick={logoutAdmin}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Yönetici Oturumunu Kapat</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
