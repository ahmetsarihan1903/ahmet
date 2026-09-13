import { AuditFormData } from '../types';

const ACTIVE_DRAFT_KEY = 'beta_asansor_active_draft_v1';
const AUDIT_HISTORY_KEY = 'beta_asansor_audit_history_v1';
const LAST_SAVED_TIME_KEY = 'beta_asansor_last_saved_time_v1';

/**
 * Checks if two audit records refer to the exact same inspection session.
 * Match criteria:
 * 1. Matching unique `auditId` (if set)
 * 2. OR matching non-empty `serialNumber` (if serial is filled)
 * 3. OR matching non-empty `clientProjectName` with same start date/time
 * 4. OR if neither has serial, matching the active in-progress draft slot
 */
function isSameAuditSession(a: AuditFormData, b: AuditFormData): boolean {
  if (a.auditId && b.auditId && a.auditId === b.auditId) {
    return true;
  }

  const serialA = a.serialNumber?.trim().toLowerCase();
  const serialB = b.serialNumber?.trim().toLowerCase();
  if (serialA && serialB && serialA === serialB) {
    return true;
  }

  const projA = a.clientProjectName?.trim().toLowerCase();
  const projB = b.clientProjectName?.trim().toLowerCase();
  if (projA && projB && projA === projB) {
    // If project names match and neither has a serial or serials match
    if (!serialA && !serialB) {
      return true;
    }
  }

  // If both are unnamed drafts created in the same session without serial/project
  if (!serialA && !serialB && !projA && !projB) {
    if (a.dateDisplay === b.dateDisplay && (a.startTimestamp === b.startTimestamp || a.startTime === b.startTime)) {
      return true;
    }
  }

  return false;
}

export function saveActiveDraft(data: AuditFormData): void {
  try {
    localStorage.setItem(ACTIVE_DRAFT_KEY, JSON.stringify(data));
    localStorage.setItem(LAST_SAVED_TIME_KEY, new Date().toLocaleTimeString('tr-TR'));
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

export function getLastSavedTime(): string {
  try {
    return localStorage.getItem(LAST_SAVED_TIME_KEY) || '';
  } catch {
    return '';
  }
}

/**
 * Manually saves the current inspection to active draft AND updates/overwrites
 * the existing record in history so duplicate rows are NEVER created for the same audit.
 */
export function saveManualAuditSnapshot(data: AuditFormData): void {
  try {
    const timeStr = new Date().toLocaleTimeString('tr-TR');
    const enrichedData: AuditFormData = {
      ...data,
      auditId: data.auditId || `audit_${data.startTimestamp || Date.now()}`,
      dateDisplay: data.dateDisplay || new Date().toLocaleDateString('tr-TR'),
      startTime: data.startTime || timeStr,
    };

    // Save active draft
    saveActiveDraft(enrichedData);

    // Update history: replace existing matching record OR insert at top if new
    const raw = localStorage.getItem(AUDIT_HISTORY_KEY);
    let history: AuditFormData[] = raw ? JSON.parse(raw) : [];

    const existingIndex = history.findIndex((item) => isSameAuditSession(item, enrichedData));

    if (existingIndex >= 0) {
      // OVERWRITE the existing record in place with the latest state and updated time
      history[existingIndex] = enrichedData;
    } else {
      // Add as new entry at the top
      history.unshift(enrichedData);
    }

    // Keep last 35 audits
    localStorage.setItem(AUDIT_HISTORY_KEY, JSON.stringify(history.slice(0, 35)));
  } catch (error) {
    console.error('Manuel taslak kaydedilemedi:', error);
  }
}

/**
 * Saves completed final report to history, overwriting any previous draft/snapshot of this audit
 */
export function saveCompletedAuditToHistory(data: AuditFormData): void {
  try {
    const enrichedData: AuditFormData = {
      ...data,
      auditId: data.auditId || `audit_${data.startTimestamp || Date.now()}`,
    };

    const raw = localStorage.getItem(AUDIT_HISTORY_KEY);
    let history: AuditFormData[] = raw ? JSON.parse(raw) : [];
    
    // Find if there is an existing draft/record of this audit
    const existingIndex = history.findIndex((item) => isSameAuditSession(item, enrichedData));

    if (existingIndex >= 0) {
      history[existingIndex] = enrichedData;
    } else {
      history.unshift(enrichedData);
    }

    // Keep last 35 audits
    localStorage.setItem(AUDIT_HISTORY_KEY, JSON.stringify(history.slice(0, 35)));
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

export function deleteAuditFromHistory(index: number): AuditFormData[] {
  try {
    const history = getAuditHistory();
    history.splice(index, 1);
    localStorage.setItem(AUDIT_HISTORY_KEY, JSON.stringify(history));
    return history;
  } catch (error) {
    console.error('Geçmiş kaydı silinemedi:', error);
    return [];
  }
}
