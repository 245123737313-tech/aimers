import type { ExtractionResult } from './types';

export interface AIProvider {
  name: string;
  extract(text: string, documentId: string): Promise<ExtractionResult>;
  generateSummary(
    patientName: string,
    labResults: { test_name: string; value: string; unit: string | null; status: string; test_date: string | null; ref_range_raw: string | null }[],
    infoItems: { category: string; label: string; value: string }[],
    documents: { filename: string; document_date: string | null }[]
  ): Promise<string>;
}

import { mockExtract, mockGenerateSummary } from './mock-provider';

let activeProvider: AIProvider = {
  name: 'Mock Provider (Demo Mode)',
  extract: mockExtract,
  generateSummary: mockGenerateSummary,
};

export function getAIProvider(): AIProvider {
  return activeProvider;
}

export function setAIProvider(provider: AIProvider): void {
  activeProvider = provider;
}
