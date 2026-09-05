import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { seedDemoData } from '@/lib/demo-data';
import { logAudit } from '@/lib/audit';
import {
  Users,
  FileText,
  CheckSquare,
  AlertTriangle,
  Upload,
  Sparkles,
  Loader2,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { DisclaimerBanner } from '@/components/Badges';
import { EmptyState } from '@/components/EmptyState';
import { formatDate } from '@/lib/utils';
import { useState } from 'react';

export function Dashboard() {
  const { user } = useAuth();
  const [seeding, setSeeding] = useState(false);

  const { data: stats, refetch } = useQuery({
    queryKey: ['dashboard-stats', user?.id],
    queryFn: async () => {
      const { data: patients } = await supabase.from('patients').select('id, name, is_demo').eq('user_id', user!.id);
      const patientIds = (patients || []).map((p) => p.id);

      if (patientIds.length === 0) {
        return { patients: 0, documents: 0, pending: 0, conflicts: 0, recentDocs: [], recentActivity: [], patientsList: [] };
      }

      const { data: docs } = await supabase
        .from('documents')
        .select('id, filename, status, document_type, created_at, patient_id')
        .in('patient_id', patientIds)
        .order('created_at', { ascending: false })
        .limit(5);

      const { count: pendingCount } = await supabase
        .from('lab_results')
        .select('id', { count: 'exact', head: true })
        .in('patient_id', patientIds)
        .eq('verification_status', 'PENDING');

      const { count: conflictCount } = await supabase
        .from('conflicts')
        .select('id', { count: 'exact', head: true })
        .in('patient_id', patientIds)
        .eq('status', 'pending');

      const { data: auditLogs } = await supabase
        .from('audit_logs')
        .select('action, details, created_at')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(8);

      return {
        patients: patients?.length || 0,
        documents: docs?.length || 0,
        pending: pendingCount || 0,
        conflicts: conflictCount || 0,
        recentDocs: docs || [],
        recentActivity: auditLogs || [],
        patientsList: patients || [],
      };
    },
  });

  const handleSeedDemo = async () => {
    if (!user) return;
    setSeeding(true);
    try {
      await seedDemoData(user.id);
      await logAudit(user.id, null, 'demo_mode_activated', 'user', user.id, 'Demo mode activated from dashboard');
      refetch();
    } finally {
      setSeeding(false);
    }
  };

  const cards = [
    { label: 'Patients', value: stats?.patients ?? '—', icon: Users, color: 'text-teal-600 bg-teal-50', link: '/app/patients' },
    { label: 'Reports', value: stats?.documents ?? '—', icon: FileText, color: 'text-blue-600 bg-blue-50', link: '/app/documents' },
    { label: 'Pending Reviews', value: stats?.pending ?? '—', icon: CheckSquare, color: 'text-amber-600 bg-amber-50', link: '/app/review' },
    { label: 'Conflicts Detected', value: stats?.conflicts ?? '—', icon: AlertTriangle, color: 'text-red-600 bg-red-50', link: '/app/conflicts' },
  ];

  const isLoading = !stats;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Overview of your clinical information workspace</p>
        </div>
        <div className="flex gap-2">
          {stats && stats.patients === 0 && (
            <button
              onClick={handleSeedDemo}
              disabled={seeding}
              className="flex items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-700 transition hover:bg-teal-100 disabled:opacity-60"
            >
              {seeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {seeding ? 'Loading demo...' : 'Enter Demo Mode'}
            </button>
          )}
          <Link
            to="/app/patients"
            className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
          >
            <Upload className="h-4 w-4" />
            Quick Upload
          </Link>
        </div>
      </div>

      <DisclaimerBanner />

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        </div>
      ) : stats && stats.patients === 0 ? (
        <EmptyState
          icon={<Activity className="h-16 w-16" />}
          title="Welcome to MedLens"
          description="No patients yet. Enter demo mode to explore the full workflow with sample data, or create a patient to begin uploading medical reports."
          action={
            <button
              onClick={handleSeedDemo}
              disabled={seeding}
              className="flex items-center gap-2 rounded-lg bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:opacity-60"
            >
              {seeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {seeding ? 'Loading demo...' : 'Enter Demo Mode'}
            </button>
          }
        />
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {cards.map((card) => (
              <Link
                key={card.label}
                to={card.link}
                className="group rounded-xl border border-slate-200 bg-white p-5 transition hover:border-teal-300 hover:shadow-md"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.color}`}>
                  <card.icon className="h-5 w-5" />
                </div>
                <p className="mt-3 text-2xl font-bold text-slate-900">{card.value}</p>
                <p className="text-sm text-slate-500">{card.label}</p>
              </Link>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Recent reports */}
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-900">Recent Reports</h2>
                <Link to="/app/documents" className="text-sm font-medium text-teal-600 hover:text-teal-700">View all</Link>
              </div>
              {stats?.recentDocs && stats.recentDocs.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentDocs.map((doc) => {
                    const patient = stats.patientsList?.find((p) => p.id === doc.patient_id);
                    return (
                      <Link
                        key={doc.id}
                        to={`/app/patients/${doc.patient_id}`}
                        className="flex items-center gap-3 rounded-lg border border-slate-100 p-3 transition hover:bg-slate-50"
                      >
                        <FileText className="h-5 w-5 text-slate-400" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-900">{doc.filename}</p>
                          <p className="text-xs text-slate-500">
                            {patient?.name} · {formatDate(doc.created_at)}
                          </p>
                        </div>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          doc.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {doc.status === 'completed' ? 'Ready' : 'Processing'}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No reports uploaded yet.</p>
              )}
            </div>

            {/* Recent activity */}
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-900">Recent Activity</h2>
                <Link to="/app/settings" className="text-sm font-medium text-teal-600 hover:text-teal-700">Audit log</Link>
              </div>
              {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentActivity.map((log, i) => (
                    <div key={i} className="flex items-start gap-3 border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                      <TrendingUp className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-300" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-700">
                          {log.action.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                        </p>
                        {log.details && <p className="truncate text-xs text-slate-500">{log.details}</p>}
                        <p className="text-xs text-slate-400">{formatDate(log.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No recent activity.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
