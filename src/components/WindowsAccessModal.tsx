import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Unlock,
  KeyRound,
  UserPlus,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  User,
  Hash,
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { WindowsSessionUser } from '../utils/windowsAuth';

export const WindowsAccessModal: React.FC = () => {
  const {
    isWindowsDesktop,
    isWindowsAuthModalOpen,
    windowsAuthModalTab,
    windowsAuthPromptReason,
    closeWindowsAuthModal,
    loginWindowsUser,
    registerWindowsUser,
  } = useUser();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login states
  const [loginName, setLoginName] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Register states
  const [regName, setRegName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPasswordConfirm, setRegPasswordConfirm] = useState('');
  const [showRegPass, setShowRegPass] = useState(false);
  const [regError, setRegError] = useState('');
  const [createdUser, setCreatedUser] = useState<WindowsSessionUser | null>(null);

  useEffect(() => {
    if (isWindowsAuthModalOpen) {
      setActiveTab(windowsAuthModalTab);
      setLoginError('');
      setRegError('');
      setCreatedUser(null);
    }
  }, [isWindowsAuthModalOpen, windowsAuthModalTab]);

  if (!isWindowsDesktop || !isWindowsAuthModalOpen) {
    return null;
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setLoginError('');
    setIsSubmitting(true);
    try {
      const res = await loginWindowsUser(loginName, loginPassword);
      if (res.ok) {
        setLoginPassword('');
        closeWindowsAuthModal();
      } else {
        setLoginError(res.error || 'Giriş yapılamadı.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setRegError('');

    if (regPassword.trim() !== regPasswordConfirm.trim()) {
      setRegError('Girdiğiniz şifreler birbiriyle uyuşmuyor.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await registerWindowsUser(regName, regPassword);
      if (res.ok && res.user) {
        setCreatedUser(res.user);
        setLoginName(res.user.name);
      } else {
        setRegError(res.error || 'Şifre oluşturulamadı.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActivateCreatedUser = async () => {
    if (!createdUser) return;
    setIsSubmitting(true);
    try {
      await loginWindowsUser(createdUser.name, regPassword);
      setRegName('');
      setRegPassword('');
      setRegPasswordConfirm('');
      setCreatedUser(null);
      closeWindowsAuthModal();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border-2 border-slate-700 rounded-2xl shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-[#0A2647] px-4 py-3 border-b-2 border-amber-500 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black uppercase tracking-tight text-white">
                Windows Düzenleme Yetkisi
              </h2>
              <p className="text-[11px] text-slate-300">
                İzleme modundan çıkıp değişiklik yapmak için doğrulama
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeWindowsAuthModal}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
            aria-label="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-3.5">
          {windowsAuthPromptReason && (
            <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-500/50 text-xs text-amber-200 font-semibold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{windowsAuthPromptReason}</span>
            </div>
          )}

          {/* Sekmeler */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setLoginError('');
              }}
              className={`py-2 px-3 rounded-lg text-xs font-black uppercase tracking-wide flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                activeTab === 'login'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Giriş Yap</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setRegError('');
                setCreatedUser(null);
              }}
              className={`py-2 px-3 rounded-lg text-xs font-black uppercase tracking-wide flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                activeTab === 'register'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Şifre Oluştur</span>
            </button>
          </div>

          {activeTab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Adınız ve Soyadınız
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    autoFocus
                    value={loginName}
                    onChange={(e) => {
                      setLoginName(e.target.value);
                      if (loginError) setLoginError('');
                    }}
                    placeholder="Örn: Ahmet Yılmaz"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-400 text-sm font-bold text-white placeholder-slate-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Kişisel Şifreniz
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showLoginPass ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => {
                      setLoginPassword(e.target.value);
                      if (loginError) setLoginError('');
                    }}
                    placeholder="Şifrenizi giriniz..."
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-400 text-sm font-mono text-white placeholder-slate-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPass(!showLoginPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showLoginPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="p-2.5 rounded-xl bg-rose-950/70 border border-rose-500/50 text-xs font-bold text-rose-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  Değişiklik yetkisi açıldığında yaptığınız düzenlemeler{' '}
                  <strong className="text-slate-200">adınız ve benzersiz arka plan ID numaranız</strong> ile raporda gösterilir.
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all"
              >
                <Unlock className="w-4 h-4" />
                <span>{isSubmitting ? 'Doğrulanıyor...' : 'Giriş Yap ve Düzenlemeyi Aç'}</span>
              </button>
            </form>
          ) : createdUser ? (
            <div className="space-y-3 py-1">
              <div className="p-4 rounded-2xl bg-emerald-950/60 border-2 border-emerald-500/60 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h3 className="text-sm sm:text-base font-black text-white uppercase">
                  Şifreniz Başarıyla Oluşturuldu!
                </h3>
                <p className="text-xs text-emerald-200">
                  Aynı isimde başka kullanıcılar olsa bile ayırt edilebilmeniz için size özel benzersiz arka plan ID numarası tanımlandı:
                </p>

                <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/40 space-y-1">
                  <div className="text-xs text-slate-400">
                    Ad Soyad: <strong className="text-white">{createdUser.name}</strong>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 font-mono font-black text-base">
                    <Hash className="w-4 h-4" />
                    <span>{createdUser.userId}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                id="btn-win-activate-created-user"
                disabled={isSubmitting}
                onClick={handleActivateCreatedUser}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              >
                <Unlock className="w-4 h-4" />
                <span>Bu Kullanıcıyla Düzenlemeyi Başlat</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Adınız ve Soyadınız
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={regName}
                  onChange={(e) => {
                    setRegName(e.target.value);
                    if (regError) setRegError('');
                  }}
                  placeholder="Örn: Ahmet Yılmaz"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-emerald-400 text-sm font-bold text-white placeholder-slate-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Yeni Şifre Belirleyin (En az 4 karakter)
                </label>
                <div className="relative">
                  <input
                    type={showRegPass ? 'text' : 'password'}
                    required
                    value={regPassword}
                    onChange={(e) => {
                      setRegPassword(e.target.value);
                      if (regError) setRegError('');
                    }}
                    placeholder="Şifrenizi belirleyin..."
                    className="w-full px-3 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-emerald-400 text-sm font-mono text-white placeholder-slate-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPass(!showRegPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showRegPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Şifre Tekrar
                </label>
                <input
                  type={showRegPass ? 'text' : 'password'}
                  required
                  value={regPasswordConfirm}
                  onChange={(e) => {
                    setRegPasswordConfirm(e.target.value);
                    if (regError) setRegError('');
                  }}
                  placeholder="Şifrenizi tekrar yazın..."
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-emerald-400 text-sm font-mono text-white placeholder-slate-500 outline-none"
                />
              </div>

              {regError && (
                <div className="p-2.5 rounded-xl bg-rose-950/70 border border-rose-500/50 text-xs font-bold text-rose-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{regError}</span>
                </div>
              )}

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                <strong className="text-emerald-300">Otomatik Benzersiz ID:</strong> Şifre oluşturduğunuzda sistem arka planda size özel bir <strong>ID numarası (Örn: ID-482913)</strong> atar. Aynı isimdeki iki farklı kişi bu ID sayesinde birbirinden ayrılır.
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all"
              >
                <UserPlus className="w-4 h-4" />
                <span>{isSubmitting ? 'Oluşturuluyor...' : 'Şifre Oluştur ve ID Tanımla'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
