import { AuditFormData } from '../types';

const ACTIVE_DRAFT_KEY = 'beta_asansor_active_draft_v1';
const AUDIT_HISTORY_KEY = 'beta_asansor_audit_history_v1';

export function saveActiveDraft(data: AuditFormData): void {
  try {
    localStorage.setItem(ACTIVE_DRAFT_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Taslak kaydedilemedi:', error);
  }
}

export function loadActiveDraft(): AuditFormData | null {
  try {
    const raw = localStorage.getItem(ACTIVE_DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuditFormData;
  } catch (error) {
    console.error('Taslak okunamadı:', error);
    return null;
  }
}

export function clearActiveDraft(): void {
  try {
    localStorage.removeItem(ACTIVE_DRAFT_KEY);
  } catch (error) {
    console.error('Taslak silinemedi:', error);
  }
}

export function saveCompletedAuditToHistory(data: AuditFormData): void {
  try {
    const raw = localStorage.getItem(AUDIT_HISTORY_KEY);
    const history: AuditFormData[] = raw ? JSON.parse(raw) : [];
    history.unshift(data);
    // Keep last 30 audits
    localStorage.setItem(AUDIT_HISTORY_KEY, JSON.stringify(history.slice(0, 30)));
  } catch (error) {
    console.error('Rapor geçmişe kaydedilemedi:', error);
  }
}

export function getAuditHistory(): AuditFormData[] {
  try {
    const raw = localStorage.getItem(AUDIT_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('Geçmiş okunamadı:', error);
    return [];
  }
}
