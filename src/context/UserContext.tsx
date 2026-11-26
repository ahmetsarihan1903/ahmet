import React, { createContext, useContext, useState } from 'react';
import { getDeviceSecurityProfile, DeviceSecurityProfile } from '../utils/deviceSecurity';
import {
  isWindowsDesktopApp,
  WindowsSessionUser,
  WindowsPublicAccountInfo,
  getWindowsAccountsPublicList,
  registerWindowsUserAccount,
  authenticateWindowsUserAccount,
} from '../utils/windowsAuth';

const USER_NAME_STORAGE_KEY = 'beta_asansor_user_name';
const ADMIN_PASSWORD_STORAGE_KEY = 'beta_asansor_admin_password';
const DEFAULT_ADMIN_PASSWORD = '531903';

interface UserContextType {
  userName: string;
  isNameRegistered: boolean;
  isAdmin: boolean;
  deviceProfile: DeviceSecurityProfile;
  setUserName: (name: string) => void;
  loginAdmin: (password: string) => boolean;
  logoutAdmin: () => void;
  updateAdminPassword: (newPassword: string) => boolean;

  // Windows Masaüstü İzleme Modu & Şifreli Düzenleme Yetkisi (APK'da devre dışıdır)
  isWindowsDesktop: boolean;
  windowsUser: WindowsSessionUser | null;
  isReadOnlyMonitoringMode: boolean;
  windowsAccounts: WindowsPublicAccountInfo[];
  isWindowsAuthModalOpen: boolean;
  windowsAuthModalTab: 'login' | 'register';
  windowsAuthPromptReason: string | null;
  openWindowsAuthModal: (tab?: 'login' | 'register', reason?: string) => void;
  closeWindowsAuthModal: () => void;
  loginWindowsUser: (
    name: string,
    password: string
  ) => Promise<{ ok: boolean; user?: WindowsSessionUser; error?: string }>;
  registerWindowsUser: (
    name: string,
    password: string
  ) => Promise<{ ok: boolean; user?: WindowsSessionUser; error?: string }>;
  logoutWindowsUser: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deviceProfile] = useState<DeviceSecurityProfile>(() => getDeviceSecurityProfile());
  const [isWindowsDesktop] = useState<boolean>(() => isWindowsDesktopApp());
  const [windowsUser, setWindowsUser] = useState<WindowsSessionUser | null>(null);
  const [windowsAccounts, setWindowsAccounts] = useState<WindowsPublicAccountInfo[]>(() =>
    isWindowsDesktopApp() ? getWindowsAccountsPublicList() : []
  );
  const [isWindowsAuthModalOpen, setIsWindowsAuthModalOpen] = useState(false);
  const [windowsAuthModalTab, setWindowsAuthModalTab] = useState<'login' | 'register'>('login');
  const [windowsAuthPromptReason, setWindowsAuthPromptReason] = useState<string | null>(null);

  const [userName, setUserNameState] = useState<string>(() => {
    try {
      return localStorage.getItem(USER_NAME_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });

  const [adminPassword, setAdminPasswordState] = useState<string>(() => {
    try {
      return localStorage.getItem(ADMIN_PASSWORD_STORAGE_KEY) || DEFAULT_ADMIN_PASSWORD;
    } catch {
      return DEFAULT_ADMIN_PASSWORD;
    }
  });

  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // Sync userName to localStorage
  const setUserName = (name: string) => {
    const trimmed = name.trim();
    setUserNameState(trimmed);
    try {
      localStorage.setItem(USER_NAME_STORAGE_KEY, trimmed);
    } catch (e) {
      console.error('Kullanıcı adı kaydedilemedi:', e);
    }
  };

  // Verify and login admin
  const loginAdmin = (password: string): boolean => {
    if (password.trim() === adminPassword) {
      setIsAdmin(true);
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    setIsAdmin(false);
  };

  const updateAdminPassword = (newPassword: string): boolean => {
    const trimmed = newPassword.trim();
    if (!trimmed) return false;
    setAdminPasswordState(trimmed);
    try {
      localStorage.setItem(ADMIN_PASSWORD_STORAGE_KEY, trimmed);
      return true;
    } catch (e) {
      console.error('Yönetici şifresi güncellenemedi:', e);
      return false;
    }
  };

  const openWindowsAuthModal = (tab: 'login' | 'register' = 'login', reason?: string) => {
    if (!isWindowsDesktop) return;
    setWindowsAuthModalTab(tab);
    setWindowsAuthPromptReason(reason || null);
    setWindowsAccounts(getWindowsAccountsPublicList());
    setIsWindowsAuthModalOpen(true);
  };

  const closeWindowsAuthModal = () => {
    setIsWindowsAuthModalOpen(false);
    setWindowsAuthPromptReason(null);
  };

  const loginWindowsUser = async (name: string, password: string) => {
    const res = await authenticateWindowsUserAccount(name, password);
    if (res.ok && res.user) {
      setWindowsUser(res.user);
      setWindowsAccounts(getWindowsAccountsPublicList());
    }
    return res;
  };

  const registerWindowsUser = async (name: string, password: string) => {
    const res = await registerWindowsUserAccount(name, password);
    if (res.ok && res.user) {
      setWindowsAccounts(getWindowsAccountsPublicList());
    }
    return res;
  };

  const logoutWindowsUser = () => {
    setWindowsUser(null);
  };

  const isNameRegistered = Boolean(userName && userName.trim().length > 0);
  const isReadOnlyMonitoringMode = isWindowsDesktop && !windowsUser;

  return (
    <UserContext.Provider
      value={{
        userName,
        isNameRegistered,
        isAdmin,
        deviceProfile,
        setUserName,
        loginAdmin,
        logoutAdmin,
        updateAdminPassword,
        isWindowsDesktop,
        windowsUser,
        isReadOnlyMonitoringMode,
        windowsAccounts,
        isWindowsAuthModalOpen,
        windowsAuthModalTab,
        windowsAuthPromptReason,
        openWindowsAuthModal,
        closeWindowsAuthModal,
        loginWindowsUser,
        registerWindowsUser,
        logoutWindowsUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export function useUser(): UserContextType {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
