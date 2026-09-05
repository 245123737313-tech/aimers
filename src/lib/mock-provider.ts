import type { ExtractionResult, LabResult, PatientInfoItem } from './types';
import { classifyResult, normalizeUnit } from './utils';

interface MockReportData {
  documentType: string;
  documentDate: string;
  labResults: {
    testName: string;
    value: string;
    unit: string;
    refLow: string | null;
    refHigh: string | null;
    refRaw: string | null;
    observation?: string;
    confidence: number;
  }[];
  medications?: { name: string; strength: string; confidence: number }[];
  observations?: string[];
}

const MOCK_REPORTS: Record<string, MockReportData> = {
  cbc: {
    documentType: 'Complete Blood Count (CBC) Report',
    documentDate: '2026-08-21',
    labResults: [
      { testName: 'Hemoglobin', value: '13.2', unit: 'g/dL', refLow: '13.0', refHigh: '17.0', refRaw: '13.0–17.0 g/dL', confidence: 0.98 },
      { testName: 'Glucose', value: '108', unit: 'mg/dL', refLow: '70', refHigh: '100', refRaw: '70–100 mg/dL', confidence: 0.95 },
      { testName: 'White Blood Cells', value: '7.2', unit: '10^3/μL', refLow: '4.0', refHigh: '11.0', refRaw: '4.0–11.0 10^3/μL', confidence: 0.97 },
      { testName: 'Platelets', value: '245', unit: '10^3/μL', refLow: '150', refHigh: '450', refRaw: '150–450 10^3/μL', confidence: 0.96 },
      { testName: 'RBC Count', value: '4.8', unit: '10^6/μL', refLow: '4.5', refHigh: '5.5', refRaw: '4.5–5.5 10^6/μL', confidence: 0.94 },
    ],
  },
  lipid: {
    documentType: 'Lipid Profile',
    documentDate: '2026-08-23',
    labResults: [
      { testName: 'Total Cholesterol', value: '210', unit: 'mg/dL', refLow: null, refHigh: '200', refRaw: '< 200 mg/dL', confidence: 0.96 },
      { testName: 'LDL Cholesterol', value: '142', unit: 'mg/dL', refLow: null, refHigh: '130', refRaw: '< 130 mg/dL', confidence: 0.95 },
      { testName: 'HDL Cholesterol', value: '38', unit: 'mg/dL', refLow: '40', refHigh: null, refRaw: '> 40 mg/dL', confidence: 0.94 },
      { testName: 'Triglycerides', value: '180', unit: 'mg/dL', refLow: null, refHigh: '150', refRaw: '< 150 mg/dL', confidence: 0.93 },
    ],
  },
  metabolic: {
    documentType: 'Comprehensive Metabolic Panel',
    documentDate: '2026-08-25',
    labResults: [
      { testName: 'Glucose', value: '116', unit: 'mg/dL', refLow: '70', refHigh: '100', refRaw: '70–100 mg/dL', confidence: 0.97 },
      { testName: 'Sodium', value: '139', unit: 'mmol/L', refLow: '135', refHigh: '145', refRaw: '135–145 mmol/L', confidence: 0.98 },
      { testName: 'Potassium', value: '4.2', unit: 'mmol/L', refLow: '3.5', refHigh: '5.0', refRaw: '3.5–5.0 mmol/L', confidence: 0.97 },
      { testName: 'Creatinine', value: '0.9', unit: 'mg/dL', refLow: '0.7', refHigh: '1.3', refRaw: '0.7–1.3 mg/dL', confidence: 0.96 },
      { testName: 'ALT', value: '28', unit: 'U/L', refLow: '7', refHigh: '56', refRaw: '7–56 U/L', confidence: 0.95 },
    ],
  },
  prescription_500: {
    documentType: 'Prescription',
    documentDate: '2026-08-20',
    labResults: [],
    medications: [{ name: 'Metformin', strength: '500 mg', confidence: 0.99 }],
    observations: ['Patient advised to take medication with meals.'],
  },
  prescription_1000: {
    documentType: 'Prescription',
    documentDate: '2026-08-27',
    labResults: [],
    medications: [{ name: 'Metformin', strength: '1000 mg', confidence: 0.99 }],
    observations: ['Dosage adjusted per physician direction.'],
  },
};

function matchReport(text: string): MockReportData | null {
  const lower = text.toLowerCase();
  if (lower.includes('cbc') || lower.includes('complete blood count') || lower.includes('hemoglobin')) {
    return MOCK_REPORTS.cbc;
  }
  if (lower.includes('lipid') || lower.includes('cholesterol')) {
    return MOCK_REPORTS.lipid;
  }
  if (lower.includes('metabolic') || lower.includes('sodium') || lower.includes('potassium')) {
    return MOCK_REPORTS.metabolic;
  }
  if (lower.includes('metformin') || lower.includes('prescription')) {
    if (lower.includes('1000')) return MOCK_REPORTS.prescription_1000;
    return MOCK_REPORTS.prescription_500;
  }
  return null;
}

export async function mockExtract(text: string, documentId: string): Promise<ExtractionResult> {
  await new Promise((r) => setTimeout(r, 1500));

  const report = matchReport(text);
  if (!report) {
    return {
      labResults: [],
      infoItems: [],
      observations: [],
      documentType: 'Unknown Document',
      documentDate: null,
    };
  }

  const labResults: ExtractionResult['labResults'] = report.labResults.map((lr) => ({
    document_id: documentId,
    test_name: lr.testName,
    value: lr.value,
    unit: lr.unit,
    original_unit: lr.unit,
    normalized_unit: normalizeUnit(lr.unit),
    ref_range_low: lr.refLow,
    ref_range_high: lr.refHigh,
    ref_range_raw: lr.refRaw,
    status: classifyResult(lr.value, lr.refLow, lr.refHigh),
    test_date: report.documentDate,
    observation: lr.observation || null,
    source_page: '1',
    source_text: `${lr.testName} ${lr.value} ${lr.unit} Reference Range ${lr.refRaw || 'Not provided'}`,
    confidence: lr.confidence,
    provenance_type: 'AI_EXTRACTED',
    verification_status: 'PENDING',
    original_ai_value: null,
    edited_value: null,
    edited_by: null,
    edited_at: null,
    edit_reason: null,
  }));

  const infoItems: ExtractionResult['infoItems'] = [];
  if (report.medications) {
    for (const med of report.medications) {
      infoItems.push({
        category: 'medication',
        label: med.name,
        value: med.strength,
        provenance_type: 'AI_EXTRACTED',
        source_document_id: documentId,
        source_page: '1',
        source_text: `${med.name} ${med.strength}`,
        confidence: med.confidence,
        verification_status: 'PENDING',
        original_ai_value: null,
        edited_value: null,
        edited_by: null,
        edited_at: null,
        edit_reason: null,
      });
    }
  }

  const observations = (report.observations || []).map((text) => ({
    text,
    source_page: '1',
    source_text: text,
  }));

  return {
    labResults,
    infoItems,
    observations,
    documentType: report.documentType,
    documentDate: report.documentDate,
  };
}

export async function mockGenerateSummary(
  patientName: string,
  labResults: { test_name: string; value: string; unit: string | null; status: string; test_date: string | null; ref_range_raw: string | null }[],
  infoItems: { category: string; label: string; value: string }[],
  documents: { filename: string; document_date: string | null }[]
): Promise<string> {
  await new Promise((r) => setTimeout(r, 2000));

  const parts: string[] = [];

  parts.push(`Your uploaded records for ${patientName} contain ${documents.length} medical document(s).`);

  if (labResults.length > 0) {
    const dates = [...new Set(labResults.filter((l) => l.test_date).map((l) => l.test_date))];
    if (dates.length > 0) {
      parts.push(`Blood test results are available from ${dates.map((d) => new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })).join(', ')}.`);
    }
    parts.push(`The records include ${labResults.length} laboratory test result(s) covering ${new Set(labResults.map((l) => l.test_name)).size} unique test(s).`);

    const outOfRange = labResults.filter((l) => l.status === 'HIGH' || l.status === 'LOW');
    if (outOfRange.length > 0) {
      parts.push(`${outOfRange.length} result(s) are outside the reference ranges provided by the laboratory: ${outOfRange.map((l) => `${l.test_name} (${l.value}${l.unit ? ' ' + l.unit : ''}, ${l.status})`).join(', ')}.`);
    } else {
      parts.push('All results with available reference ranges fall within the reported ranges.');
    }
  }

  const medications = infoItems.filter((i) => i.category === 'medication');
  if (medications.length > 0) {
    parts.push(`Medication information found in the records: ${medications.map((m) => `${m.label} ${m.value}`).join(', ')}.`);
  }

  const conditions = infoItems.filter((i) => i.category === 'condition');
  if (conditions.length > 0) {
    parts.push(`Existing conditions noted: ${conditions.map((c) => c.value).join(', ')}.`);
  }

  const allergies = infoItems.filter((i) => i.category === 'allergy');
  if (allergies.length > 0) {
    parts.push(`Allergies recorded: ${allergies.map((a) => a.value).join(', ')}.`);
  }

  const symptoms = infoItems.filter((i) => i.category === 'symptom');
  if (symptoms.length > 0) {
    parts.push(`Symptoms documented: ${symptoms.map((s) => s.value).join(', ')}.`);
  }

  parts.push('Important: This summary is generated from the information available in your records and is not a medical diagnosis or treatment recommendation. Always consult a qualified healthcare professional for medical decisions.');

  return parts.join(' ');
}
