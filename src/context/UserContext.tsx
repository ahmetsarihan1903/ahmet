import React, { createContext, useContext, useState, useEffect } from 'react';
import { getDeviceSecurityProfile, DeviceSecurityProfile } from '../utils/deviceSecurity';

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
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deviceProfile] = useState<DeviceSecurityProfile>(() => getDeviceSecurityProfile());
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

  const isNameRegistered = Boolean(userName && userName.trim().length > 0);

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
