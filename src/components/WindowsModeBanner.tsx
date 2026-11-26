import React from 'react';
import { Lock, Unlock, KeyRound, UserPlus, Eye } from 'lucide-react';
import { useUser } from '../context/UserContext';

export const WindowsModeBanner: React.FC = () => {
  const {
    isWindowsDesktop,
    windowsUser,
    isReadOnlyMonitoringMode,
    openWindowsAuthModal,
    logoutWindowsUser,
  } = useUser();

  if (!isWindowsDesktop) {
    return null;
  }

  return (
    <div
      className={`w-full border-b px-3 sm:px-4 py-1.5 text-xs print:hidden ${
        isReadOnlyMonitoringMode
          ? 'bg-amber-950/90 border-amber-500/50 text-amber-100'
          : 'bg-emerald-950/90 border-emerald-500/50 text-emerald-100'
      }`}
    >
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
        {isReadOnlyMonitoringMode ? (
          <>
            <div className="flex items-center gap-2 min-w-0">
              <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider inline-flex items-center gap-1 shrink-0">
                <Eye className="w-3 h-3" />
                <span>Windows İzleme Modu</span>
              </span>
              <span className="text-[11px] font-semibold text-amber-200 truncate">
                Salt okunur moddasınız — değişiklik yapılamaz. Değişiklik için ad ve şifrenizle giriş yapın.
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                id="btn-win-open-login"
                onClick={() => openWindowsAuthModal('login')}
                className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] uppercase tracking-wide inline-flex items-center gap-1 cursor-pointer shadow-xs transition-colors"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Giriş Yap</span>
              </button>
              <button
                type="button"
                id="btn-win-open-register"
                onClick={() => openWindowsAuthModal('register')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 font-bold text-[11px] uppercase tracking-wide inline-flex items-center gap-1 cursor-pointer transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Şifre Oluştur</span>
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 min-w-0">
              <span className="px-2 py-0.5 rounded bg-emerald-500 text-slate-950 font-black text-[10px] uppercase tracking-wider inline-flex items-center gap-1 shrink-0">
                <Unlock className="w-3 h-3" />
                <span>Düzenleme Yetkisi Açık</span>
              </span>
              <span className="text-[11px] font-bold text-white truncate">
                Aktif Kullanıcı: <strong className="text-emerald-300">{windowsUser?.name}</strong>
              </span>
              <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-emerald-400/50 font-mono font-black text-[10px] text-emerald-300 shrink-0">
                {windowsUser?.userId}
              </span>
              <span className="hidden md:inline text-[10px] text-emerald-200/80">
                • Yapılan değişiklikler bu ID ile rapora işlenir.
              </span>
            </div>
            <button
              type="button"
              id="btn-win-lock-monitoring"
              onClick={logoutWindowsUser}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/40 font-bold text-[11px] uppercase tracking-wide inline-flex items-center gap-1 cursor-pointer shrink-0 transition-colors"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>İzleme Moduna Dön (Kilitle)</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
