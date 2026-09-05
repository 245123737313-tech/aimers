import { useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { logAudit } from '@/lib/audit';
import { seedDemoData } from '@/lib/demo-data';
import { Users, Plus, Sparkles, Loader2, User, X } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import { formatDate, calculateAge } from '@/lib/utils';
import type { Patient } from '@/lib/types';

export function PatientsList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const { data: patients, isLoading } = useQuery({
    queryKey: ['patients', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('patients')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      return (data || []) as Patient[];
    },
  });

  const handleSeedDemo = async () => {
    if (!user) return;
    setSeeding(true);
    try {
      const id = await seedDemoData(user.id);
      await logAudit(user.id, null, 'demo_mode_activated', 'user', user.id, 'Demo mode activated from patients list');
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      if (id) navigate(`/app/patients/${id}`);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Patients</h1>
          <p className="mt-1 text-sm text-slate-500">Manage patient profiles and their medical records</p>
        </div>
        <div className="flex gap-2">
          {patients && patients.length === 0 && (
            <button
              onClick={handleSeedDemo}
              disabled={seeding}
              className="flex items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-700 transition hover:bg-teal-100 disabled:opacity-60"
            >
              {seeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {seeding ? 'Loading...' : 'Demo Mode'}
            </button>
          )}
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
          >
            <Plus className="h-4 w-4" />
            New Patient
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        </div>
      ) : patients && patients.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {patients.map((patient) => (
            <button
              key={patient.id}
              onClick={() => navigate(`/app/patients/${patient.id}`)}
              className="group rounded-xl border border-slate-200 bg-white p-5 text-left transition hover:border-teal-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                  <User className="h-6 w-6" />
                </div>
                {patient.is_demo && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                    DEMO DATA
                  </span>
                )}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">{patient.name}</h3>
              <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-500">
                {patient.date_of_birth && (
                  <span>Age {calculateAge(patient.date_of_birth)}</span>
                )}
                {patient.sex && <span>{patient.sex}</span>}
                <span>Added {formatDate(patient.created_at)}</span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Users className="h-16 w-16" />}
          title="No patients yet"
          description="Create a patient profile to begin uploading medical reports, or enter demo mode to explore with sample data."
          action={
            <div className="flex gap-3">
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 rounded-lg bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
              >
                <Plus className="h-4 w-4" />
                Create Patient
              </button>
              <button
                onClick={handleSeedDemo}
                disabled={seeding}
                className="flex items-center gap-2 rounded-lg border border-teal-200 bg-white px-6 py-3 text-sm font-semibold text-teal-700 transition hover:bg-teal-50 disabled:opacity-60"
              >
                {seeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Demo Mode
              </button>
            </div>
          }
        />
      )}

      {showForm && <NewPatientForm onClose={() => setShowForm(false)} />}
    </div>
  );
}

function NewPatientForm({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [sex, setSex] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [conditions, setConditions] = useState('');
  const [allergies, setAllergies] = useState('');
  const [medications, setMedications] = useState('');
  const [history, setHistory] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);

    const { data: patient, error: patientErr } = await supabase
      .from('patients')
      .insert({
        user_id: user.id,
        name,
        date_of_birth: dob || null,
        sex: sex || null,
      })
      .select()
      .single();

    if (patientErr || !patient) {
      setError(patientErr?.message || 'Failed to create patient');
      setSaving(false);
      return;
    }

    const infoItems: { category: string; label: string; value: string; patient_id: string; provenance_type: string; verification_status: string }[] = [];
    if (symptoms.trim()) {
      for (const s of symptoms.split('\n').filter(Boolean)) {
        infoItems.push({ category: 'symptom', label: 'Symptom', value: s.trim(), patient_id: patient.id, provenance_type: 'USER_PROVIDED', verification_status: 'VERIFIED' });
      }
    }
    if (conditions.trim()) {
      for (const c of conditions.split('\n').filter(Boolean)) {
        infoItems.push({ category: 'condition', label: 'Condition', value: c.trim(), patient_id: patient.id, provenance_type: 'USER_PROVIDED', verification_status: 'VERIFIED' });
      }
    }
    if (allergies.trim()) {
      for (const a of allergies.split('\n').filter(Boolean)) {
        infoItems.push({ category: 'allergy', label: 'Allergy', value: a.trim(), patient_id: patient.id, provenance_type: 'USER_PROVIDED', verification_status: 'VERIFIED' });
      }
    }
    if (medications.trim()) {
      for (const m of medications.split('\n').filter(Boolean)) {
        infoItems.push({ category: 'medication', label: m.split(/\s+/)[0] || 'Medication', value: m.trim(), patient_id: patient.id, provenance_type: 'USER_PROVIDED', verification_status: 'VERIFIED' });
      }
    }
    if (history.trim()) {
      for (const h of history.split('\n').filter(Boolean)) {
        infoItems.push({ category: 'history', label: 'History', value: h.trim(), patient_id: patient.id, provenance_type: 'USER_PROVIDED', verification_status: 'VERIFIED' });
      }
    }
    if (notes.trim()) {
      infoItems.push({ category: 'note', label: 'Note', value: notes.trim(), patient_id: patient.id, provenance_type: 'USER_PROVIDED', verification_status: 'VERIFIED' });
    }

    if (infoItems.length > 0) {
      await supabase.from('patient_info_items').insert(infoItems);
    }

    await supabase.from('timeline_events').insert({
      patient_id: patient.id,
      event_type: 'patient_created',
      title: 'Patient profile created',
      description: `Patient "${name}" created with initial information`,
      event_date: new Date().toISOString().split('T')[0],
    });

    await logAudit(user.id, patient.id, 'patient_created', 'patient', patient.id, `Created patient: ${name}`);

    queryClient.invalidateQueries({ queryKey: ['patients'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    setSaving(false);
    onClose();
    navigate(`/app/patients/${patient.id}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">New Patient</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">Patient Name *</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Date of Birth</label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Sex</label>
              <select
                value={sex}
                onChange={(e) => setSex(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              >
                <option value="">Not specified</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Symptoms (one per line)</label>
            <textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              placeholder="Reported fatigue and increased thirst"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Existing Conditions (one per line)</label>
            <textarea
              value={conditions}
              onChange={(e) => setConditions(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              placeholder="Type 2 Diabetes Mellitus"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Allergies (one per line)</label>
            <textarea
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              placeholder="Penicillin (rash)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Current Medications (one per line)</label>
            <textarea
              value={medications}
              onChange={(e) => setMedications(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              placeholder="Metformin 500 mg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Relevant Medical History (one per line)</label>
            <textarea
              value={history}
              onChange={(e) => setHistory(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              placeholder="Father had Type 2 Diabetes"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              placeholder="Additional notes..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Patient
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
