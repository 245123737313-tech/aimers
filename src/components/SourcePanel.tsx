import { X, FileText, Check, Edit, Trash2, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { logAudit } from '@/lib/audit';
import { StatusBadge, ProvenanceBadge, ConfidenceBadge, VerificationBadge } from '@/components/Badges';
import { formatDate } from '@/lib/utils';
import type { LabResult, Document } from '@/lib/types';

interface SourcePanelProps {
  labResult: LabResult;
  documents: Document[];
  patientId: string;
  onClose: () => void;
  onUpdated: () => void;
}

export function SourcePanel({ labResult, documents, patientId, onClose, onUpdated }: SourcePanelProps) {
  const { user } = useAuth();
  const [action, setAction] = useState<'verify' | 'edit' | 'reject' | null>(null);
  const [editValue, setEditValue] = useState(labResult.value);
  const [editReason, setEditReason] = useState('');
  const [saving, setSaving] = useState(false);

  const sourceDoc = documents.find((d) => d.id === labResult.document_id);

  const handleVerify = async () => {
    setSaving(true);
    await supabase
      .from('lab_results')
      .update({ verification_status: 'VERIFIED' })
      .eq('id', labResult.id);
    await logAudit(user!.id, patientId, 'field_verified', 'lab_result', labResult.id, `Verified: ${labResult.test_name} = ${labResult.value}`);
    setSaving(false);
    setAction(null);
    onUpdated();
  };

  const handleEdit = async () => {
    setSaving(true);
    await supabase
      .from('lab_results')
      .update({
        value: editValue,
        verification_status: 'EDITED',
        original_ai_value: labResult.original_ai_value || labResult.value,
        edited_value: editValue,
        edited_by: user!.id,
        edited_at: new Date().toISOString(),
        edit_reason: editReason || null,
        status: classifyResult(editValue, labResult.ref_range_low, labResult.ref_range_high),
      })
      .eq('id', labResult.id);
    await logAudit(user!.id, patientId, 'field_edited', 'lab_result', labResult.id, `Edited: ${labResult.test_name} from "${labResult.value}" to "${editValue}"`);
    setSaving(false);
    setAction(null);
    onUpdated();
  };

  const handleReject = async () => {
    setSaving(true);
    await supabase
      .from('lab_results')
      .update({ verification_status: 'REJECTED' })
      .eq('id', labResult.id);
    await logAudit(user!.id, patientId, 'field_rejected', 'lab_result', labResult.id, `Rejected: ${labResult.test_name} = ${labResult.value}`);
    setSaving(false);
    setAction(null);
    onUpdated();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <div
        className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Source Detail</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Value */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-500">{labResult.test_name}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {labResult.value} {labResult.unit && <span className="text-lg font-normal text-slate-500">{labResult.unit}</span>}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusBadge status={labResult.status as any} />
            <ProvenanceBadge type={labResult.provenance_type} />
            <VerificationBadge status={labResult.verification_status} />
            <ConfidenceBadge confidence={labResult.confidence} />
          </div>
        </div>

        {/* Reference range */}
        <div className="mt-4 space-y-3">
          <div>
            <p className="text-xs font-medium text-slate-500">Reference Range</p>
            <p className="text-sm text-slate-900">
              {labResult.ref_range_raw || 'Reference range not provided in source.'}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Test Date</p>
            <p className="text-sm text-slate-900">{formatDate(labResult.test_date)}</p>
          </div>
          {labResult.observation && (
            <div>
              <p className="text-xs font-medium text-slate-500">Observation</p>
              <p className="text-sm text-slate-900">{labResult.observation}</p>
            </div>
          )}
        </div>

        {/* Source */}
        <div className="mt-6 rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-slate-400" />
            <p className="text-sm font-semibold text-slate-700">Source Document</p>
          </div>
          <p className="mt-2 text-sm text-slate-900">{sourceDoc?.filename || 'Unknown'}</p>
          <p className="text-xs text-slate-500">Type: {sourceDoc?.document_type || 'Not specified'}</p>
          <p className="text-xs text-slate-500">Date: {formatDate(sourceDoc?.document_date || null)}</p>
          {labResult.source_page && (
            <p className="text-xs text-slate-500">Page: {labResult.source_page}</p>
          )}
        </div>

        {/* Extracted text */}
        {labResult.source_text && (
          <div className="mt-4">
            <p className="text-xs font-medium text-slate-500">Extracted Text Snippet</p>
            <div className="mt-1 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm italic text-slate-700">"{labResult.source_text}"</p>
            </div>
          </div>
        )}

        {/* Edit history */}
        {labResult.original_ai_value && labResult.edited_value && (
          <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
            <p className="text-xs font-semibold text-blue-700">Edit History</p>
            <p className="mt-1 text-sm text-blue-900">
              Original AI value: <strong>{labResult.original_ai_value}</strong>
            </p>
            <p className="text-sm text-blue-900">
              Edited to: <strong>{labResult.edited_value}</strong>
            </p>
            {labResult.edit_reason && (
              <p className="text-sm text-blue-700">Reason: {labResult.edit_reason}</p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="mt-6">
          {action === 'edit' ? (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700">New Value</label>
                <input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Reason (optional)</label>
                <input
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                  placeholder="Why are you editing this value?"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleEdit}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Save Edit
                </button>
                <button
                  onClick={() => setAction(null)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleVerify}
                disabled={saving || labResult.verification_status === 'VERIFIED'}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Verify
              </button>
              <button
                onClick={() => setAction('edit')}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                <Edit className="h-4 w-4" />
                Edit
              </button>
              <button
                onClick={handleReject}
                disabled={saving || labResult.verification_status === 'REJECTED'}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
                Reject
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function classifyResult(value: string, low: string | null, high: string | null): string {
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
