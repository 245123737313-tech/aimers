import type { ConfidenceLevel, LabStatus } from './types';

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function getConfidenceLevel(confidence: number | null): ConfidenceLevel | null {
  if (confidence === null || confidence === undefined) return null;
  if (confidence >= 0.85) return 'HIGH';
  if (confidence >= 0.6) return 'MEDIUM';
  return 'LOW';
}

export function getConfidenceColor(level: ConfidenceLevel | null): string {
  switch (level) {
    case 'HIGH':
      return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    case 'MEDIUM':
      return 'text-amber-700 bg-amber-50 border-amber-200';
    case 'LOW':
      return 'text-red-700 bg-red-50 border-red-200';
    default:
      return 'text-slate-600 bg-slate-50 border-slate-200';
  }
}

export function getStatusColor(status: LabStatus): string {
  switch (status) {
    case 'LOW':
      return 'text-blue-700 bg-blue-50 border-blue-200';
    case 'NORMAL':
      return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    case 'HIGH':
      return 'text-amber-700 bg-amber-50 border-amber-200';
    case 'NOT_DETERMINED':
      return 'text-slate-500 bg-slate-50 border-slate-200';
  }
}

export function getStatusIcon(status: LabStatus): string {
  switch (status) {
    case 'LOW':
      return '▼';
    case 'NORMAL':
      return '●';
    case 'HIGH':
      return '▲';
    case 'NOT_DETERMINED':
      return '?';
  }
}

export function getVerificationColor(status: string): string {
  switch (status) {
    case 'VERIFIED':
    case 'VERIFIED_BY_USER':
      return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    case 'EDITED':
      return 'text-blue-700 bg-blue-50 border-blue-200';
    case 'REJECTED':
      return 'text-red-700 bg-red-50 border-red-200';
    case 'PENDING':
    default:
      return 'text-amber-700 bg-amber-50 border-amber-200';
  }
}

export function getProvenanceColor(type: string): string {
  switch (type) {
    case 'USER_PROVIDED':
      return 'text-slate-700 bg-slate-100 border-slate-300';
    case 'AI_EXTRACTED':
    case 'IMPORTED_FROM_DOCUMENT':
      return 'text-indigo-700 bg-indigo-50 border-indigo-200';
    case 'AI_GENERATED':
      return 'text-purple-700 bg-purple-50 border-purple-200';
    case 'VERIFIED_BY_USER':
      return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    default:
      return 'text-slate-600 bg-slate-50 border-slate-200';
  }
}

export function getProvenanceLabel(type: string): string {
  switch (type) {
    case 'USER_PROVIDED':
      return 'User Provided';
    case 'AI_EXTRACTED':
      return 'AI Extracted';
    case 'AI_GENERATED':
      return 'AI Generated';
    case 'VERIFIED_BY_USER':
      return 'Verified';
    case 'IMPORTED_FROM_DOCUMENT':
      return 'Imported';
    default:
      return type;
  }
}

export function classifyResult(value: string, low: string | null, high: string | null): LabStatus {
  if (!low && !high) return 'NOT_DETERMINED';
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return 'NOT_DETERMINED';
  const numLow = low ? parseFloat(low) : null;
  const numHigh = high ? parseFloat(high) : null;
  if (numLow !== null && numValue < numLow) return 'LOW';
  if (numHigh !== null && numValue > numHigh) return 'HIGH';
  if (numLow !== null && numHigh !== null && numValue >= numLow && numValue <= numHigh) return 'NORMAL';
  return 'NOT_DETERMINED';
}

export function formatDate(date: string | null): string {
  if (!date) return 'Not provided';
  try {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return date;
  }
}

export function formatDateTime(date: string | null): string {
  if (!date) return 'Not provided';
  try {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return date;
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function normalizeUnit(unit: string): string {
  return unit.toLowerCase().replace(/\s+/g, '');
}

export function normalizeTestName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function calculateAge(dateOfBirth: string | null): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}
