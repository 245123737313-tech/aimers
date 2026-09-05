import { supabase } from './supabase';

export async function logAudit(
  userId: string,
  patientId: string | null,
  action: string,
  entityType?: string,
  entityId?: string,
  details?: string
): Promise<void> {
  try {
    await supabase.from('audit_logs').insert({
      user_id: userId,
      patient_id: patientId,
      action,
      entity_type: entityType || null,
      entity_id: entityId || null,
      details: details || null,
    });
  } catch {
    // Audit logging is best-effort; don't block user actions
  }
}
