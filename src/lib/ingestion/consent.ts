const CONSENT_STORAGE_KEY = 'isocity-ingestion-consent';
const CONSENT_AUDIT_KEY = 'isocity-ingestion-consent-audit';

export type ConsentSource = 'settings' | 'onboarding' | 'admin' | 'system';

export type ConsentAuditEntry = {
  timestamp: number;
  consented: boolean;
  source: ConsentSource;
};

export function getIngestionConsent(): boolean {
  if (typeof window === 'undefined') return false;
  const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
  return raw === 'true';
}

export function setIngestionConsent(consented: boolean, source: ConsentSource): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CONSENT_STORAGE_KEY, String(consented));

  const audit: ConsentAuditEntry[] = readConsentAudit();
  audit.push({ timestamp: Date.now(), consented, source });
  localStorage.setItem(CONSENT_AUDIT_KEY, JSON.stringify(audit));
}

export function readConsentAudit(): ConsentAuditEntry[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(CONSENT_AUDIT_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as ConsentAuditEntry[];
  } catch {
    return [];
  }
  return [];
}
