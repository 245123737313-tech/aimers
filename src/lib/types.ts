export type ProvenanceType =
  | 'USER_PROVIDED'
  | 'AI_EXTRACTED'
  | 'AI_GENERATED'
  | 'VERIFIED_BY_USER'
  | 'IMPORTED_FROM_DOCUMENT';

export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'EDITED' | 'REJECTED';

export type LabStatus = 'LOW' | 'NORMAL' | 'HIGH' | 'NOT_DETERMINED';

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export type DocumentStatus =
  | 'uploaded'
  | 'processing'
  | 'extracting_text'
  | 'identifying_values'
  | 'detecting_ranges'
  | 'structuring'
  | 'checking_consistency'
  | 'completed'
  | 'failed';

export type InfoCategory =
  | 'symptom'
  | 'condition'
  | 'allergy'
  | 'medication'
  | 'history'
  | 'note'
  | 'demographic';

export type ConflictType =
  | 'medication_strength'
  | 'demographic'
  | 'test_value'
  | 'unit'
  | 'reference_range'
  | 'condition'
  | 'duplicate';

export interface Patient {
  id: string;
  user_id: string;
  name: string;
  date_of_birth: string | null;
  sex: string | null;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface PatientInfoItem {
  id: string;
  patient_id: string;
  category: InfoCategory | string;
  label: string;
  value: string;
  provenance_type: ProvenanceType;
  source_document_id: string | null;
  source_page: string | null;
  source_text: string | null;
  confidence: number | null;
  verification_status: VerificationStatus;
  original_ai_value: string | null;
  edited_value: string | null;
  edited_by: string | null;
  edited_at: string | null;
  edit_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  patient_id: string;
  user_id: string;
  filename: string;
  file_type: string;
  file_size: number;
  status: DocumentStatus | string;
  processing_progress: number;
  extracted_text: string | null;
  document_type: string | null;
  document_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface LabResult {
  id: string;
  patient_id: string;
  document_id: string | null;
  test_name: string;
  value: string;
  unit: string | null;
  original_unit: string | null;
  normalized_unit: string | null;
  ref_range_low: string | null;
  ref_range_high: string | null;
  ref_range_raw: string | null;
  status: LabStatus;
  test_date: string | null;
  observation: string | null;
  source_page: string | null;
  source_text: string | null;
  confidence: number | null;
  provenance_type: ProvenanceType;
  verification_status: VerificationStatus;
  original_ai_value: string | null;
  edited_value: string | null;
  edited_by: string | null;
  edited_at: string | null;
  edit_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface TimelineEvent {
  id: string;
  patient_id: string;
  event_type: string;
  title: string;
  description: string | null;
  event_date: string;
  related_document_id: string | null;
  related_lab_result_id: string | null;
  created_at: string;
}

export interface Conflict {
  id: string;
  patient_id: string;
  conflict_type: ConflictType | string;
  description: string;
  entity_type: string;
  source_1_label: string | null;
  source_1_value: string | null;
  source_1_document_id: string | null;
  source_2_label: string | null;
  source_2_value: string | null;
  source_2_document_id: string | null;
  status: string;
  created_at: string;
}

export interface AiSummary {
  id: string;
  patient_id: string;
  summary_text: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  patient_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: string | null;
  created_at: string;
}

export interface ExtractionResult {
  labResults: Omit<LabResult, 'id' | 'patient_id' | 'created_at' | 'updated_at'>[];
  infoItems: Omit<PatientInfoItem, 'id' | 'patient_id' | 'created_at' | 'updated_at'>[];
  observations: { text: string; source_page: string; source_text: string }[];
  documentType: string | null;
  documentDate: string | null;
}
