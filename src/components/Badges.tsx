import { cn } from '@/lib/utils';
import type { LabStatus, ProvenanceType, VerificationStatus, ConfidenceLevel } from '@/lib/types';
import {
  getStatusColor,
  getStatusIcon,
  getVerificationColor,
  getProvenanceColor,
  getProvenanceLabel,
  getConfidenceColor,
  getConfidenceLevel,
} from '@/lib/utils';

export function StatusBadge({ status }: { status: LabStatus }) {
  const color = getStatusColor(status);
  const icon = getStatusIcon(status);
  const label = status === 'NOT_DETERMINED' ? 'Not Determined' : status.charAt(0) + status.slice(1).toLowerCase();
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold', color)}>
      <span aria-hidden="true">{icon}</span>
      {label}
    </span>
  );
}

export function ProvenanceBadge({ type }: { type: ProvenanceType | string }) {
  const color = getProvenanceColor(type);
  const label = getProvenanceLabel(type);
  return (
    <span className={cn('inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium', color)}>
      {label}
    </span>
  );
}

export function VerificationBadge({ status }: { status: VerificationStatus | string }) {
  const color = getVerificationColor(status);
  const label = status.charAt(0) + status.slice(1).toLowerCase();
  return (
    <span className={cn('inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium', color)}>
      {label}
    </span>
  );
}

export function ConfidenceBadge({ confidence }: { confidence: number | null }) {
  if (confidence === null) return null;
  const level = getConfidenceLevel(confidence);
  const color = getConfidenceColor(level);
  const pct = Math.round(confidence * 100);
  const label = level ? `${pct}% ${level.charAt(0) + level.slice(1).toLowerCase()}` : `${pct}%`;
  return (
    <span
      className={cn('inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium', color)}
      title="Confidence indicates how reliably MedLens extracted this information from the source document. It does not indicate medical certainty."
    >
      {label}
    </span>
  );
}

export function DisclaimerBanner({ variant = 'default' }: { variant?: 'default' | 'compact' }) {
  if (variant === 'compact') {
    return (
      <p className="text-xs text-slate-500 italic">
        MedLens organizes and explains information contained in medical records. It does not provide medical diagnosis or treatment advice.
      </p>
    );
  }
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
      <p className="text-sm text-amber-900">
        <strong>MedLens</strong> organizes and explains information contained in medical records. It does not provide medical diagnosis or treatment advice. Always consult a qualified healthcare professional for medical decisions.
      </p>
    </div>
  );
}
