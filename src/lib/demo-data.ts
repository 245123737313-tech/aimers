import { supabase } from './supabase';
import { classifyResult, normalizeUnit } from './utils';
import type { Document, LabResult, PatientInfoItem, TimelineEvent, Conflict } from './types';

export async function seedDemoData(userId: string): Promise<string | null> {
  const { data: existingDemo } = await supabase
    .from('patients')
    .select('id')
    .eq('user_id', userId)
    .eq('is_demo', true)
    .maybeSingle();

  if (existingDemo) return existingDemo.id;

  const { data: patient, error: patientErr } = await supabase
    .from('patients')
    .insert({
      user_id: userId,
      name: 'John Doe',
      date_of_birth: '1984-03-15',
      sex: 'Male',
      is_demo: true,
    })
    .select()
    .single();

  if (patientErr || !patient) return null;
  const patientId = patient.id;

  const demoInfoItems: Omit<PatientInfoItem, 'id' | 'patient_id' | 'created_at' | 'updated_at'>[] = [
    { category: 'symptom', label: 'Fatigue', value: 'Reported fatigue and increased thirst', provenance_type: 'USER_PROVIDED', source_document_id: null, source_page: null, source_text: null, confidence: null, verification_status: 'VERIFIED', original_ai_value: null, edited_value: null, edited_by: null, edited_at: null, edit_reason: null },
    { category: 'condition', label: 'Type 2 Diabetes', value: 'Type 2 Diabetes Mellitus', provenance_type: 'USER_PROVIDED', source_document_id: null, source_page: null, source_text: null, confidence: null, verification_status: 'VERIFIED', original_ai_value: null, edited_value: null, edited_by: null, edited_at: null, edit_reason: null },
    { category: 'allergy', label: 'Penicillin', value: 'Penicillin allergy (rash)', provenance_type: 'USER_PROVIDED', source_document_id: null, source_page: null, source_text: null, confidence: null, verification_status: 'VERIFIED', original_ai_value: null, edited_value: null, edited_by: null, edited_at: null, edit_reason: null },
    { category: 'history', label: 'Family History', value: 'Father had Type 2 Diabetes', provenance_type: 'USER_PROVIDED', source_document_id: null, source_page: null, source_text: null, confidence: null, verification_status: 'VERIFIED', original_ai_value: null, edited_value: null, edited_by: null, edited_at: null, edit_reason: null },
    { category: 'note', label: 'General Note', value: 'Patient monitoring glucose levels regularly', provenance_type: 'USER_PROVIDED', source_document_id: null, source_page: null, source_text: null, confidence: null, verification_status: 'VERIFIED', original_ai_value: null, edited_value: null, edited_by: null, edited_at: null, edit_reason: null },
  ];

  const infoItemsToInsert = demoInfoItems.map((item) => ({ ...item, patient_id: patientId }));
  await supabase.from('patient_info_items').insert(infoItemsToInsert);

  const documents: Omit<Document, 'id' | 'patient_id' | 'user_id' | 'created_at' | 'updated_at'>[] = [
    { filename: 'CBC_Report_2026_08_21.pdf', file_type: 'application/pdf', file_size: 245000, status: 'completed', processing_progress: 100, extracted_text: 'Complete Blood Count (CBC) Report\nDate: August 21, 2026\nPatient: John Doe\n\nHemoglobin 13.2 g/dL Reference Range 13.0–17.0 g/dL\nGlucose 108 mg/dL Reference Range 70–100 mg/dL\nWhite Blood Cells 7.2 10^3/μL Reference Range 4.0–11.0 10^3/μL\nPlatelets 245 10^3/μL Reference Range 150–450 10^3/μL\nRBC Count 4.8 10^6/μL Reference Range 4.5–5.5 10^6/μL', document_type: 'Complete Blood Count (CBC) Report', document_date: '2026-08-21' },
    { filename: 'Lipid_Profile_2026_08_23.pdf', file_type: 'application/pdf', file_size: 198000, status: 'completed', processing_progress: 100, extracted_text: 'Lipid Profile\nDate: August 23, 2026\nPatient: John Doe\n\nTotal Cholesterol 210 mg/dL Reference Range < 200 mg/dL\nLDL Cholesterol 142 mg/dL Reference Range < 130 mg/dL\nHDL Cholesterol 38 mg/dL Reference Range > 40 mg/dL\nTriglycerides 180 mg/dL Reference Range < 150 mg/dL', document_type: 'Lipid Profile', document_date: '2026-08-23' },
    { filename: 'Metabolic_Panel_2026_08_25.pdf', file_type: 'application/pdf', file_size: 210000, status: 'completed', processing_progress: 100, extracted_text: 'Comprehensive Metabolic Panel\nDate: August 25, 2026\nPatient: John Doe\n\nGlucose 116 mg/dL Reference Range 70–100 mg/dL\nSodium 139 mmol/L Reference Range 135–145 mmol/L\nPotassium 4.2 mmol/L Reference Range 3.5–5.0 mmol/L\nCreatinine 0.9 mg/dL Reference Range 0.7–1.3 mg/dL\nALT 28 U/L Reference Range 7–56 U/L', document_type: 'Comprehensive Metabolic Panel', document_date: '2026-08-25' },
    { filename: 'Prescription_2026_08_20.pdf', file_type: 'application/pdf', file_size: 88000, status: 'completed', processing_progress: 100, extracted_text: 'Prescription\nDate: August 20, 2026\nPatient: John Doe\n\nMetformin 500 mg\nTake one tablet twice daily with meals', document_type: 'Prescription', document_date: '2026-08-20' },
    { filename: 'Prescription_2026_08_27.pdf', file_type: 'application/pdf', file_size: 92000, status: 'completed', processing_progress: 100, extracted_text: 'Prescription\nDate: August 27, 2026\nPatient: John Doe\n\nMetformin 1000 mg\nTake one tablet twice daily with meals', document_type: 'Prescription', document_date: '2026-08-27' },
  ];

  const docInserts = documents.map((d) => ({ ...d, patient_id: patientId, user_id: userId }));
  const { data: insertedDocs } = await supabase.from('documents').insert(docInserts).select();

  if (!insertedDocs) return patientId;

  const docMap: Record<string, string> = {};
  insertedDocs.forEach((doc, idx) => {
    const key = documents[idx].filename;
    docMap[key] = doc.id;
  });

  const labDataByDoc: Record<string, { testName: string; value: string; unit: string; refLow: string | null; refHigh: string | null; refRaw: string | null; confidence: number }[]> = {
    'CBC_Report_2026_08_21.pdf': [
      { testName: 'Hemoglobin', value: '13.2', unit: 'g/dL', refLow: '13.0', refHigh: '17.0', refRaw: '13.0–17.0 g/dL', confidence: 0.98 },
      { testName: 'Glucose', value: '108', unit: 'mg/dL', refLow: '70', refHigh: '100', refRaw: '70–100 mg/dL', confidence: 0.95 },
      { testName: 'White Blood Cells', value: '7.2', unit: '10^3/μL', refLow: '4.0', refHigh: '11.0', refRaw: '4.0–11.0 10^3/μL', confidence: 0.97 },
      { testName: 'Platelets', value: '245', unit: '10^3/μL', refLow: '150', refHigh: '450', refRaw: '150–450 10^3/μL', confidence: 0.96 },
      { testName: 'RBC Count', value: '4.8', unit: '10^6/μL', refLow: '4.5', refHigh: '5.5', refRaw: '4.5–5.5 10^6/μL', confidence: 0.94 },
    ],
    'Lipid_Profile_2026_08_23.pdf': [
      { testName: 'Total Cholesterol', value: '210', unit: 'mg/dL', refLow: null, refHigh: '200', refRaw: '< 200 mg/dL', confidence: 0.96 },
      { testName: 'LDL Cholesterol', value: '142', unit: 'mg/dL', refLow: null, refHigh: '130', refRaw: '< 130 mg/dL', confidence: 0.95 },
      { testName: 'HDL Cholesterol', value: '38', unit: 'mg/dL', refLow: '40', refHigh: null, refRaw: '> 40 mg/dL', confidence: 0.94 },
      { testName: 'Triglycerides', value: '180', unit: 'mg/dL', refLow: null, refHigh: '150', refRaw: '< 150 mg/dL', confidence: 0.93 },
    ],
    'Metabolic_Panel_2026_08_25.pdf': [
      { testName: 'Glucose', value: '116', unit: 'mg/dL', refLow: '70', refHigh: '100', refRaw: '70–100 mg/dL', confidence: 0.97 },
      { testName: 'Sodium', value: '139', unit: 'mmol/L', refLow: '135', refHigh: '145', refRaw: '135–145 mmol/L', confidence: 0.98 },
      { testName: 'Potassium', value: '4.2', unit: 'mmol/L', refLow: '3.5', refHigh: '5.0', refRaw: '3.5–5.0 mmol/L', confidence: 0.97 },
      { testName: 'Creatinine', value: '0.9', unit: 'mg/dL', refLow: '0.7', refHigh: '1.3', refRaw: '0.7–1.3 mg/dL', confidence: 0.96 },
      { testName: 'ALT', value: '28', unit: 'U/L', refLow: '7', refHigh: '56', refRaw: '7–56 U/L', confidence: 0.95 },
    ],
  };

  const allLabResults: Omit<LabResult, 'id' | 'patient_id' | 'created_at' | 'updated_at'>[] = [];
  for (const [filename, labs] of Object.entries(labDataByDoc)) {
    const docId = docMap[filename];
    const docDate = insertedDocs.find((d) => d.id === docId)?.document_date;
    for (const lab of labs) {
      allLabResults.push({
        document_id: docId,
        test_name: lab.testName,
        value: lab.value,
        unit: lab.unit,
        original_unit: lab.unit,
        normalized_unit: normalizeUnit(lab.unit),
        ref_range_low: lab.refLow,
        ref_range_high: lab.refHigh,
        ref_range_raw: lab.refRaw,
        status: classifyResult(lab.value, lab.refLow, lab.refHigh),
        test_date: docDate,
        observation: null,
        source_page: '1',
        source_text: `${lab.testName} ${lab.value} ${lab.unit} Reference Range ${lab.refRaw}`,
        confidence: lab.confidence,
        provenance_type: 'AI_EXTRACTED',
        verification_status: 'PENDING',
        original_ai_value: null,
        edited_value: null,
        edited_by: null,
        edited_at: null,
        edit_reason: null,
      });
    }
  }

  await supabase.from('lab_results').insert(allLabResults.map((lr) => ({ ...lr, patient_id: patientId })));

  const medInfoItems: Omit<PatientInfoItem, 'id' | 'patient_id' | 'created_at' | 'updated_at'>[] = [
    {
      category: 'medication', label: 'Metformin', value: '500 mg',
      provenance_type: 'AI_EXTRACTED', source_document_id: docMap['Prescription_2026_08_20.pdf'],
      source_page: '1', source_text: 'Metformin 500 mg', confidence: 0.99,
      verification_status: 'PENDING', original_ai_value: null, edited_value: null, edited_by: null, edited_at: null, edit_reason: null,
    },
    {
      category: 'medication', label: 'Metformin', value: '1000 mg',
      provenance_type: 'AI_EXTRACTED', source_document_id: docMap['Prescription_2026_08_27.pdf'],
      source_page: '1', source_text: 'Metformin 1000 mg', confidence: 0.99,
      verification_status: 'PENDING', original_ai_value: null, edited_value: null, edited_by: null, edited_at: null, edit_reason: null,
    },
  ];
  await supabase.from('patient_info_items').insert(medInfoItems.map((m) => ({ ...m, patient_id: patientId })));

  const timelineEvents: Omit<TimelineEvent, 'id' | 'patient_id' | 'created_at'>[] = [
    { event_type: 'document_upload', title: 'Prescription uploaded', description: 'Prescription_2026_08_20.pdf — Metformin 500 mg', event_date: '2026-08-20', related_document_id: docMap['Prescription_2026_08_20.pdf'], related_lab_result_id: null },
    { event_type: 'document_upload', title: 'CBC Report uploaded', description: 'Complete Blood Count report with 5 test results', event_date: '2026-08-21', related_document_id: docMap['CBC_Report_2026_08_21.pdf'], related_lab_result_id: null },
    { event_type: 'document_upload', title: 'Lipid Profile uploaded', description: 'Lipid profile with 4 test results', event_date: '2026-08-23', related_document_id: docMap['Lipid_Profile_2026_08_23.pdf'], related_lab_result_id: null },
    { event_type: 'document_upload', title: 'Metabolic Panel uploaded', description: 'Comprehensive metabolic panel with 5 test results', event_date: '2026-08-25', related_document_id: docMap['Metabolic_Panel_2026_08_25.pdf'], related_lab_result_id: null },
    { event_type: 'document_upload', title: 'Prescription uploaded', description: 'Prescription_2026_08_27.pdf — Metformin 1000 mg', event_date: '2026-08-27', related_document_id: docMap['Prescription_2026_08_27.pdf'], related_lab_result_id: null },
  ];
  await supabase.from('timeline_events').insert(timelineEvents.map((e) => ({ ...e, patient_id: patientId })));

  const conflicts: Omit<Conflict, 'id' | 'patient_id' | 'created_at'>[] = [
    {
      conflict_type: 'medication_strength',
      description: 'Different strengths found for medication "Metformin" across documents. Please verify this information with a qualified healthcare professional.',
      entity_type: 'medication',
      source_1_label: 'Metformin (Prescription_2026_08_20.pdf)',
      source_1_value: '500 mg',
      source_1_document_id: docMap['Prescription_2026_08_20.pdf'],
      source_2_label: 'Metformin (Prescription_2026_08_27.pdf)',
      source_2_value: '1000 mg',
      source_2_document_id: docMap['Prescription_2026_08_27.pdf'],
      status: 'pending',
    },
    {
      conflict_type: 'test_value',
      description: 'Different values for "Glucose" found in tests dated close together. Please verify this information with a qualified healthcare professional.',
      entity_type: 'lab_result',
      source_1_label: 'Glucose (2026-08-21)',
      source_1_value: '108 mg/dL',
      source_1_document_id: docMap['CBC_Report_2026_08_21.pdf'],
      source_2_label: 'Glucose (2026-08-25)',
      source_2_value: '116 mg/dL',
      source_2_document_id: docMap['Metabolic_Panel_2026_08_25.pdf'],
      status: 'pending',
    },
  ];
  await supabase.from('conflicts').insert(conflicts.map((c) => ({ ...c, patient_id: patientId })));

  await supabase.from('audit_logs').insert([
    { user_id: userId, patient_id: patientId, action: 'demo_data_seeded', entity_type: 'patient', entity_id: patientId, details: 'Demo patient John Doe created with 5 documents, lab results, medications, and conflicts' },
  ]);

  return patientId;
}
