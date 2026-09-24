import React from 'react';
import { X, Settings, Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { FontSizeControl } from './FontSizeControl';
import { AdminUserSettingsSection } from './AdminUserSettingsSection';

interface HubSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HubSettingsModal: React.FC<HubSettingsModalProps> = ({ isOpen, onClose }) => {
  const { setTheme, isDark } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div
        className={`rounded-2xl max-w-lg w-full p-4 sm:p-5 shadow-2xl border max-h-[90vh] flex flex-col ${
          isDark
            ? 'bg-slate-900 border-slate-800 text-slate-100'
            : 'bg-white border-slate-300 text-slate-900'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between pb-3.5 border-b mb-3.5 ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                isDark ? 'bg-orange-600/20 text-orange-400' : 'bg-orange-100 text-orange-600'
              }`}
            >
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`font-black text-sm sm:text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                SİSTEM & GÖRÜNÜM AYARLARI
              </h3>
              <p className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Ekran Teması, Punto & Yönetici Paneli
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isDark
                ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* İçerik */}
        <div className="space-y-4 overflow-y-auto pr-1">
          {/* 1. Ekran Teması */}
          <div
            className={`p-3.5 rounded-xl border ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2.5">
              <span
                className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                  isDark ? 'text-slate-300' : 'text-slate-800'
                }`}
              >
                {isDark ? (
                  <Moon className="w-3.5 h-3.5 text-blue-400" />
                ) : (
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                )}
                Ekran Teması
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-800'
                }`}
              >
                {isDark ? 'Karanlık Mod' : 'Gündüz Modu'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isDark
                    ? 'bg-blue-600 text-white border-blue-400 shadow-md font-black'
                    : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500'
                }`}
              >
                <Moon className="w-4 h-4" />
                <span>Karanlık Mod</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  !isDark
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black'
                    : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500'
                }`}
              >
                <Sun className="w-4 h-4" />
                <span>Gündüz Modu</span>
              </button>
            </div>
          </div>

          {/* 2. Yazı Boyutu & Punto Kontrolü */}
          <FontSizeControl />

          {/* 3. Aktif Denetçi & Yönetici Paneli */}
          <AdminUserSettingsSection />
        </div>

        {/* Modal Alt Kısım */}
        <div className={`mt-3.5 pt-2.5 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-black transition cursor-pointer"
          >
            Kapat / Tamam
          </button>
        </div>
      </div>
    </div>
  );
};
