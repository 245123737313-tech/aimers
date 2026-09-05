import type { LabResult, PatientInfoItem, Conflict, Document } from './types';
import { normalizeTestName, normalizeUnit } from './utils';

interface ConflictInput {
  patientId: string;
  labResults: LabResult[];
  infoItems: PatientInfoItem[];
  documents: Document[];
}

interface ConflictSeed {
  patient_id: string;
  conflict_type: string;
  description: string;
  entity_type: string;
  source_1_label: string | null;
  source_1_value: string | null;
  source_1_document_id: string | null;
  source_2_label: string | null;
  source_2_value: string | null;
  source_2_document_id: string | null;
  status: string;
}

export function detectConflicts(input: ConflictInput): ConflictSeed[] {
  const conflicts: ConflictSeed[] = [];

  conflicts.push(...detectMedicationConflicts(input));
  conflicts.push(...detectLabValueConflicts(input));
  conflicts.push(...detectUnitConflicts(input));
  conflicts.push(...detectDemographicConflicts(input));

  return conflicts;
}

function detectMedicationConflicts(input: ConflictInput): ConflictSeed[] {
  const conflicts: ConflictSeed[] = [];
  const medications = input.infoItems.filter((i) => i.category === 'medication');

  const byName: Record<string, PatientInfoItem[]> = {};
  for (const med of medications) {
    const baseName = med.label.split(/\s+/)[0].toLowerCase();
    if (!byName[baseName]) byName[baseName] = [];
    byName[baseName].push(med);
  }

  for (const [baseName, meds] of Object.entries(byName)) {
    if (meds.length < 2) continue;
    const strengths = new Set(meds.map((m) => m.value.toLowerCase()));
    if (strengths.size > 1) {
      for (let i = 1; i < meds.length; i++) {
        if (meds[i].value.toLowerCase() !== meds[0].value.toLowerCase()) {
          conflicts.push({
            patient_id: input.patientId,
            conflict_type: 'medication_strength',
            description: `Different strengths found for medication "${baseName.charAt(0).toUpperCase() + baseName.slice(1)}" across documents. Please verify this information with a qualified healthcare professional.`,
            entity_type: 'medication',
            source_1_label: meds[0].label,
            source_1_value: meds[0].value,
            source_1_document_id: meds[0].source_document_id,
            source_2_label: meds[i].label,
            source_2_value: meds[i].value,
            source_2_document_id: meds[i].source_document_id,
            status: 'pending',
          });
        }
      }
    }
  }

  return conflicts;
}

function detectLabValueConflicts(input: ConflictInput): ConflictSeed[] {
  const conflicts: ConflictSeed[] = [];
  const labs = input.labResults;

  const byTest: Record<string, LabResult[]> = {};
  for (const lab of labs) {
    const key = normalizeTestName(lab.test_name);
    if (!byTest[key]) byTest[key] = [];
    byTest[key].push(lab);
  }

  for (const [testKey, testLabs] of Object.entries(byTest)) {
    if (testLabs.length < 2) continue;
    for (let i = 1; i < testLabs.length; i++) {
      const prev = testLabs[i - 1];
      const curr = testLabs[i];
      if (prev.test_date && curr.test_date) {
        const dateDiff = Math.abs(
          new Date(prev.test_date).getTime() - new Date(curr.test_date).getTime()
        );
        const daysDiff = dateDiff / (1000 * 60 * 60 * 24);
        if (daysDiff <= 7 && prev.value !== curr.value) {
          conflicts.push({
            patient_id: input.patientId,
            conflict_type: 'test_value',
            description: `Different values for "${prev.test_name}" found in tests dated close together. Please verify this information with a qualified healthcare professional.`,
            entity_type: 'lab_result',
            source_1_label: `${prev.test_name} (${prev.test_date})`,
            source_1_value: `${prev.value} ${prev.unit || ''}`.trim(),
            source_1_document_id: prev.document_id,
            source_2_label: `${curr.test_name} (${curr.test_date})`,
            source_2_value: `${curr.value} ${curr.unit || ''}`.trim(),
            source_2_document_id: curr.document_id,
            status: 'pending',
          });
        }
      }
    }
  }

  return conflicts;
}

function detectUnitConflicts(input: ConflictInput): ConflictSeed[] {
  const conflicts: ConflictSeed[] = [];
  const labs = input.labResults;

  const byTest: Record<string, LabResult[]> = {};
  for (const lab of labs) {
    const key = normalizeTestName(lab.test_name);
    if (!byTest[key]) byTest[key] = [];
    byTest[key].push(lab);
  }

  for (const [testKey, testLabs] of Object.entries(byTest)) {
    if (testLabs.length < 2) continue;
    for (let i = 1; i < testLabs.length; i++) {
      const prev = testLabs[i - 1];
      const curr = testLabs[i];
      if (
        prev.unit &&
        curr.unit &&
        normalizeUnit(prev.unit) !== normalizeUnit(curr.unit)
      ) {
        conflicts.push({
          patient_id: input.patientId,
          conflict_type: 'unit',
          description: `Different units for "${prev.test_name}" found across documents. Please verify this information with a qualified healthcare professional.`,
          entity_type: 'lab_result',
          source_1_label: `${prev.test_name} unit`,
          source_1_value: prev.unit,
          source_1_document_id: prev.document_id,
          source_2_label: `${curr.test_name} unit`,
          source_2_value: curr.unit,
          source_2_document_id: curr.document_id,
          status: 'pending',
        });
      }
    }
  }

  return conflicts;
}

function detectDemographicConflicts(input: ConflictInput): ConflictSeed[] {
  const conflicts: ConflictSeed[] = [];
  const demographics = input.infoItems.filter((i) => i.category === 'demographic');

  const byLabel: Record<string, PatientInfoItem[]> = {};
  for (const d of demographics) {
    if (!byLabel[d.label]) byLabel[d.label] = [];
    byLabel[d.label].push(d);
  }

  for (const [label, items] of Object.entries(byLabel)) {
    if (items.length < 2) continue;
    const values = new Set(items.map((i) => i.value.toLowerCase()));
    if (values.size > 1) {
      conflicts.push({
        patient_id: input.patientId,
        conflict_type: 'demographic',
        description: `Different "${label}" values found across documents. Please verify this information with a qualified healthcare professional.`,
        entity_type: 'demographic',
        source_1_label: items[0].label,
        source_1_value: items[0].value,
        source_1_document_id: items[0].source_document_id,
        source_2_label: items[1].label,
        source_2_value: items[1].value,
        source_2_document_id: items[1].source_document_id,
        status: 'pending',
      });
    }
  }

  return conflicts;
}
