import React from 'react';
import { AuditFormData } from '../types';

interface AndroidSimulatorFrameProps {
  children: React.ReactNode;
  onLoadAudit?: (data: AuditFormData) => void;
}

export const AndroidSimulatorFrame: React.FC<AndroidSimulatorFrameProps> = ({ children }) => {
  return <>{children}</>;
};
