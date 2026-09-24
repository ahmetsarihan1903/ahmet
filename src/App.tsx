import React, { useState, useEffect } from 'react';
import { ActiveAppModule } from './types';
import { AppHubHome } from './components/AppHubHome';
import { QualityControlModule } from './modules/qualityControl/QualityControlModule';
import { CustomerPreInspectionModule } from './modules/customerPreInspection/CustomerPreInspectionModule';
import { RailDoorInspectionModule } from './modules/railDoorInspection/RailDoorInspectionModule';
import { UnderConstructionModule } from './components/UnderConstructionModule';
import { InitialUserSetupModal } from './components/InitialUserSetupModal';
import { useTheme } from './context/ThemeContext';

export default function App() {
  const [activeModule, setActiveModule] = useState<ActiveAppModule>('hub');
  const { isDark } = useTheme();

  const handleSelectModule = (mod: ActiveAppModule) => {
    if (mod !== 'hub') {
      window.history.pushState({ module: mod }, '', `#${mod}`);
    } else {
      if (window.location.hash) {
        window.history.pushState({ module: 'hub' }, '', window.location.pathname);
      }
    }
    setActiveModule(mod);
  };

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (e.state && e.state.module) {
        setActiveModule(e.state.module);
      } else {
        setActiveModule('hub');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <div
      className={`min-h-screen font-sans selection:bg-orange-500 selection:text-white transition-colors duration-150 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
      }`}
    >
      {/* İlk Kurulum / Kullanıcı Kayıt Zorunlu Modalı */}
      <InitialUserSetupModal />

      {/* 0. ANA GİRİŞ HUB PORTALI */}
      {activeModule === 'hub' && (
        <AppHubHome onSelectModule={(module) => handleSelectModule(module)} />
      )}

      {/* 1. KUYU RÖLEVE FORMU (Yapım Aşamasında) */}
      {activeModule === 'shaftSurvey' && (
        <UnderConstructionModule
          title="1. Kuyu Röleve Formu"
          moduleNumber="Adım 1: Şantiye Keşif & Ön İnceleme"
          badge="YAPIM AŞAMASINDA"
          description="Kuyu genişliği (A), derinliği (B), kuyu dibi (S), son kat tavanı (K), kapı boşlukları ve şantiye mimari keşif ölçüm modülü yapım aşamasındadır."
          accentColor="sky"
          onBackToMainMenu={() => handleSelectModule('hub')}
        />
      )}

      {/* 2. RAY & KAPI KONTROL FORMU (Aktif Tamamlandı) */}
      {activeModule === 'railDoorInspection' && (
        <RailDoorInspectionModule onBackToMainMenu={() => handleSelectModule('hub')} />
      )}

      {/* 3. KALİTE KONTROL FORMU (Nihai Kabul - Mevcut Tamamlanan Sistem) */}
      {activeModule === 'qualityControl' && (
        <QualityControlModule onBackToMainMenu={() => handleSelectModule('hub')} />
      )}

      {/* 4. YEŞİL ETİKET ÖNCESİ MÜŞTERİ İŞLERİ */}
      {activeModule === 'customerPreInspection' && (
        <CustomerPreInspectionModule onBackToMainMenu={() => handleSelectModule('hub')} />
      )}
    </div>
  );
}

