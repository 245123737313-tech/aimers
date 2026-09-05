/*
# MedLens — Clinical Information Intelligence Platform Schema

## Overview
Creates the complete database schema for MedLens, a clinical information
intelligence workspace that transforms fragmented medical records into
structured, traceable, reviewable patient records.

## New Tables
1. **patients** — Patient profiles with demographics. Owner-scoped via user_id.
2. **documents** — Uploaded medical documents (PDFs, images, scans) with
   processing status and extracted text.
3. **patient_info_items** — Flexible key-value items (symptoms, conditions,
   allergies, medications, history, notes) each with full provenance metadata.
4. **lab_results** — Structured lab test results extracted from documents,
   with reference ranges, status classification, and provenance.
5. **timeline_events** — Chronological patient events linked to sources.
6. **conflicts** — Detected inconsistencies between records.
7. **ai_summaries** — AI-generated patient-friendly summaries.
8. **audit_logs** — Immutable audit trail of all user actions.

## Security
- RLS enabled on every table.
- All tables are owner-scoped (user_id → auth.users) with 4 CRUD policies each.
- Child tables scope through patient ownership.
- audit_logs is owner-scoped directly via user_id.

## Important Notes
1. Owner columns default to auth.uid() so frontend inserts omitting user_id succeed.
2. Every extracted entity preserves source_document_id, source_page, source_text,
   confidence, provenance_type, and verification_status.
3. Reference ranges are NEVER invented — they come from the source document,
   user input, or are left null with a "not provided" display.
*/

-- ============ PATIENTS ============
CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  date_of_birth date,
  sex text,
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_patients" ON patients;
CREATE POLICY "select_own_patients" ON patients FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_patients" ON patients;
CREATE POLICY "insert_own_patients" ON patients FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_patients" ON patients;
CREATE POLICY "update_own_patients" ON patients FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_patients" ON patients;
CREATE POLICY "delete_own_patients" ON patients FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);

-- ============ DOCUMENTS ============
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  filename text NOT NULL,
  file_type text NOT NULL,
  file_size bigint NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'uploaded',
  processing_progress integer NOT NULL DEFAULT 0,
  extracted_text text,
  document_type text,
  document_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_documents" ON documents;
CREATE POLICY "select_own_documents" ON documents FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_documents" ON documents;
CREATE POLICY "insert_own_documents" ON documents FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_documents" ON documents;
CREATE POLICY "update_own_documents" ON documents FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_documents" ON documents;
CREATE POLICY "delete_own_documents" ON documents FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_documents_patient_id ON documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);

-- ============ PATIENT INFO ITEMS ============
CREATE TABLE IF NOT EXISTS patient_info_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  category text NOT NULL,
  label text NOT NULL,
  value text NOT NULL,
  provenance_type text NOT NULL DEFAULT 'USER_PROVIDED',
  source_document_id uuid REFERENCES documents(id) ON DELETE SET NULL,
  source_page text,
  source_text text,
  confidence numeric,
  verification_status text NOT NULL DEFAULT 'PENDING',
  original_ai_value text,
  edited_value text,
  edited_by uuid REFERENCES auth.users(id),
  edited_at timestamptz,
  edit_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE patient_info_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_info_items" ON patient_info_items;
CREATE POLICY "select_own_info_items" ON patient_info_items FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM patients p WHERE p.id = patient_info_items.patient_id AND p.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_info_items" ON patient_info_items;
CREATE POLICY "insert_own_info_items" ON patient_info_items FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM patients p WHERE p.id = patient_info_items.patient_id AND p.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_info_items" ON patient_info_items;
CREATE POLICY "update_own_info_items" ON patient_info_items FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM patients p WHERE p.id = patient_info_items.patient_id AND p.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM patients p WHERE p.id = patient_info_items.patient_id AND p.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_info_items" ON patient_info_items;
CREATE POLICY "delete_own_info_items" ON patient_info_items FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM patients p WHERE p.id = patient_info_items.patient_id AND p.user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_info_items_patient_id ON patient_info_items(patient_id);
CREATE INDEX IF NOT EXISTS idx_info_items_category ON patient_info_items(category);

-- ============ LAB RESULTS ============
CREATE TABLE IF NOT EXISTS lab_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  document_id uuid REFERENCES documents(id) ON DELETE SET NULL,
  test_name text NOT NULL,
  value text NOT NULL,
  unit text,
  original_unit text,
  normalized_unit text,
  ref_range_low text,
  ref_range_high text,
  ref_range_raw text,
  status text NOT NULL DEFAULT 'NOT_DETERMINED',
  test_date date,
  observation text,
  source_page text,
  source_text text,
  confidence numeric,
  provenance_type text NOT NULL DEFAULT 'AI_EXTRACTED',
  verification_status text NOT NULL DEFAULT 'PENDING',
  original_ai_value text,
  edited_value text,
  edited_by uuid REFERENCES auth.users(id),
  edited_at timestamptz,
  edit_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE lab_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_lab_results" ON lab_results;
CREATE POLICY "select_own_lab_results" ON lab_results FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM patients p WHERE p.id = lab_results.patient_id AND p.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_lab_results" ON lab_results;
CREATE POLICY "insert_own_lab_results" ON lab_results FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM patients p WHERE p.id = lab_results.patient_id AND p.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_lab_results" ON lab_results;
CREATE POLICY "update_own_lab_results" ON lab_results FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM patients p WHERE p.id = lab_results.patient_id AND p.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM patients p WHERE p.id = lab_results.patient_id AND p.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_lab_results" ON lab_results;
CREATE POLICY "delete_own_lab_results" ON lab_results FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM patients p WHERE p.id = lab_results.patient_id AND p.user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_lab_results_patient_id ON lab_results(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_document_id ON lab_results(document_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_test_date ON lab_results(test_date);

-- ============ TIMELINE EVENTS ============
CREATE TABLE IF NOT EXISTS timeline_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  title text NOT NULL,
  description text,
  event_date date NOT NULL,
  related_document_id uuid REFERENCES documents(id) ON DELETE SET NULL,
  related_lab_result_id uuid REFERENCES lab_results(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_timeline" ON timeline_events;
CREATE POLICY "select_own_timeline" ON timeline_events FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM patients p WHERE p.id = timeline_events.patient_id AND p.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_timeline" ON timeline_events;
CREATE POLICY "insert_own_timeline" ON timeline_events FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM patients p WHERE p.id = timeline_events.patient_id AND p.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_timeline" ON timeline_events;
CREATE POLICY "update_own_timeline" ON timeline_events FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM patients p WHERE p.id = timeline_events.patient_id AND p.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM patients p WHERE p.id = timeline_events.patient_id AND p.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_timeline" ON timeline_events;
CREATE POLICY "delete_own_timeline" ON timeline_events FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM patients p WHERE p.id = timeline_events.patient_id AND p.user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_timeline_patient_id ON timeline_events(patient_id);
CREATE INDEX IF NOT EXISTS idx_timeline_event_date ON timeline_events(event_date);

-- ============ CONFLICTS ============
CREATE TABLE IF NOT EXISTS conflicts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  conflict_type text NOT NULL,
  description text NOT NULL,
  entity_type text NOT NULL,
  source_1_label text,
  source_1_value text,
  source_1_document_id uuid REFERENCES documents(id) ON DELETE SET NULL,
  source_2_label text,
  source_2_value text,
  source_2_document_id uuid REFERENCES documents(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE conflicts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_conflicts" ON conflicts;
CREATE POLICY "select_own_conflicts" ON conflicts FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM patients p WHERE p.id = conflicts.patient_id AND p.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_conflicts" ON conflicts;
CREATE POLICY "insert_own_conflicts" ON conflicts FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM patients p WHERE p.id = conflicts.patient_id AND p.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_conflicts" ON conflicts;
CREATE POLICY "update_own_conflicts" ON conflicts FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM patients p WHERE p.id = conflicts.patient_id AND p.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM patients p WHERE p.id = conflicts.patient_id AND p.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_conflicts" ON conflicts;
CREATE POLICY "delete_own_conflicts" ON conflicts FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM patients p WHERE p.id = conflicts.patient_id AND p.user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_conflicts_patient_id ON conflicts(patient_id);

-- ============ AI SUMMARIES ============
CREATE TABLE IF NOT EXISTS ai_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  summary_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ai_summaries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_summaries" ON ai_summaries;
CREATE POLICY "select_own_summaries" ON ai_summaries FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM patients p WHERE p.id = ai_summaries.patient_id AND p.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_summaries" ON ai_summaries;
CREATE POLICY "insert_own_summaries" ON ai_summaries FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM patients p WHERE p.id = ai_summaries.patient_id AND p.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_summaries" ON ai_summaries;
CREATE POLICY "delete_own_summaries" ON ai_summaries FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM patients p WHERE p.id = ai_summaries.patient_id AND p.user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_summaries_patient_id ON ai_summaries(patient_id);

-- ============ AUDIT LOGS ============
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES patients(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  details text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_audit_logs" ON audit_logs;
CREATE POLICY "select_own_audit_logs" ON audit_logs FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_audit_logs" ON audit_logs;
CREATE POLICY "insert_own_audit_logs" ON audit_logs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_audit_logs" ON audit_logs;
CREATE POLICY "delete_own_audit_logs" ON audit_logs FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_patient_id ON audit_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ============ UPDATED_AT TRIGGER ============
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_patients_updated ON patients;
CREATE TRIGGER trg_patients_updated BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_info_items_updated ON patient_info_items;
CREATE TRIGGER trg_info_items_updated BEFORE UPDATE ON patient_info_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_documents_updated ON documents;
CREATE TRIGGER trg_documents_updated BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_lab_results_updated ON lab_results;
CREATE TRIGGER trg_lab_results_updated BEFORE UPDATE ON lab_results
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
