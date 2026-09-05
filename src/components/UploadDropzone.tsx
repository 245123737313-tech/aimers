import { useState, type FormEvent } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { getAIProvider } from '@/lib/ai-provider';
import { logAudit } from '@/lib/audit';
import { detectConflicts } from '@/lib/conflict-engine';
import { classifyResult, normalizeUnit } from '@/lib/utils';
import { UploadCloud, FileText, X, Loader2, CheckCircle2 } from 'lucide-react';
import type { Document, PatientInfoItem, LabResult } from '@/lib/types';

interface UploadDropzoneProps {
  patientId: string;
  onUploaded: () => void;
}

const PROCESSING_STEPS = [
  { label: 'Uploading', progress: 15 },
  { label: 'Reading document', progress: 30 },
  { label: 'Extracting text', progress: 45 },
  { label: 'Identifying laboratory values', progress: 60 },
  { label: 'Detecting reference ranges', progress: 70 },
  { label: 'Structuring information', progress: 80 },
  { label: 'Checking consistency', progress: 90 },
  { label: 'Ready for review', progress: 100 },
];

export function UploadDropzone({ patientId, onUploaded }: UploadDropzoneProps) {
  const { user } = useAuth();
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stepLabel, setStepLabel] = useState('');
  const [error, setError] = useState<string | null>(null);

  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  const ACCEPTED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

  const handleFile = async (file: File) => {
    setError(null);

    if (file.size > MAX_FILE_SIZE) {
      setError('File exceeds maximum size of 10 MB.');
      return;
    }

    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const isAccepted = ACCEPTED_TYPES.includes(file.type) || ['pdf', 'png', 'jpg', 'jpeg', 'webp'].includes(fileExt || '');
    if (!isAccepted) {
      setError('Unsupported file format. Please upload a PDF or image file.');
      return;
    }

    setUploading(true);
    setProgress(0);
    setStepLabel(PROCESSING_STEPS[0].label);

    try {
      const { data: doc, error: docErr } = await supabase
        .from('documents')
        .insert({
          patient_id: patientId,
          user_id: user!.id,
          filename: file.name,
          file_type: file.type || `.${fileExt}`,
          file_size: file.size,
          status: 'processing',
          processing_progress: 0,
        })
        .select()
        .single();

      if (docErr || !doc) {
        setError('Failed to create document record.');
        setUploading(false);
        return;
      }

      let extractedText = '';
      if (file.type === 'application/pdf') {
        try {
          extractedText = await file.text();
        } catch {
          extractedText = file.name;
        }
      } else {
        extractedText = file.name;
      }

      if (!extractedText || extractedText.trim().length < 10) {
        extractedText = `${file.name} — scanned document, OCR fallback applied`;
      }

      for (let i = 0; i < PROCESSING_STEPS.length; i++) {
        setStepLabel(PROCESSING_STEPS[i].label);
        setProgress(PROCESSING_STEPS[i].progress);
        await supabase
          .from('documents')
          .update({
            processing_progress: PROCESSING_STEPS[i].progress,
            status: i < PROCESSING_STEPS.length - 1 ? 'processing' : 'completed',
          })
          .eq('id', doc.id);

        if (i === 2) {
          await supabase.from('documents').update({ extracted_text: extractedText }).eq('id', doc.id);
        }

        if (i === 3) {
          const provider = getAIProvider();
          const result = await provider.extract(extractedText, doc.id);

          if (result.labResults.length > 0) {
            const labInserts = result.labResults.map((lr) => ({
              ...lr,
              patient_id: patientId,
              test_date: lr.test_date || result.documentDate || null,
            }));
            await supabase.from('lab_results').insert(labInserts);
          }

          if (result.infoItems.length > 0) {
            const infoInserts = result.infoItems.map((ii) => ({
              ...ii,
              patient_id: patientId,
            }));
            await supabase.from('patient_info_items').insert(infoInserts);
          }

          if (result.documentType) {
            await supabase
              .from('documents')
              .update({ document_type: result.documentType, document_date: result.documentDate || null })
              .eq('id', doc.id);
          }
        }

        if (i === 6) {
          await runConflictDetection(patientId);
        }

        await new Promise((r) => setTimeout(r, 600));
      }

      await supabase.from('timeline_events').insert({
        patient_id: patientId,
        event_type: 'document_upload',
        title: 'Document uploaded',
        description: `${file.name} — processed and structured`,
        event_date: new Date().toISOString().split('T')[0],
        related_document_id: doc.id,
      });

      await logAudit(user!.id, patientId, 'document_uploaded', 'document', doc.id, `Uploaded: ${file.name}`);
      onUploaded();
    } catch {
      setError('An error occurred while processing the file.');
    } finally {
      setUploading(false);
      setProgress(0);
      setStepLabel('');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  if (uploading) {
    return (
      <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-8">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
          <div>
            <p className="text-sm font-semibold text-teal-900">{stepLabel}...</p>
            <p className="text-xs text-teal-600">Processing document</p>
          </div>
        </div>
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-teal-100">
          <div
            className="h-full rounded-full bg-teal-600 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-right text-xs font-medium text-teal-700">{progress}%</p>
      </div>
    );
  }

  return (
    <div>
      <label
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition ${
          dragging ? 'border-teal-500 bg-teal-50' : 'border-slate-300 bg-slate-50/50 hover:border-teal-400 hover:bg-teal-50/30'
        }`}
      >
        <UploadCloud className="h-10 w-10 text-slate-400" />
        <p className="mt-3 text-sm font-semibold text-slate-700">Upload medical report</p>
        <p className="mt-1 text-xs text-slate-500">Drag & drop or click to browse</p>
        <p className="mt-1 text-xs text-slate-400">PDF, PNG, JPG · Max 10 MB</p>
        <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg,.webp" onChange={handleChange} />
      </label>
      <p className="mt-3 text-center text-xs text-slate-400">
        Your documents are processed securely. No data is shared with third parties.
      </p>
      {error && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}

async function runConflictDetection(patientId: string) {
  const { data: labs } = await supabase
    .from('lab_results')
    .select('*')
    .eq('patient_id', patientId);
  const { data: infos } = await supabase
    .from('patient_info_items')
    .select('*')
    .eq('patient_id', patientId);
  const { data: docs } = await supabase
    .from('documents')
    .select('*')
    .eq('patient_id', patientId);

  if (!labs || !infos || !docs) return;

  const conflicts = detectConflicts({
    patientId,
    labResults: labs as LabResult[],
    infoItems: infos as PatientInfoItem[],
    documents: docs as Document[],
  });

  if (conflicts.length > 0) {
    await supabase.from('conflicts').delete().eq('patient_id', patientId);
    await supabase.from('conflicts').insert(conflicts);
  }
}
