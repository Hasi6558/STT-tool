export type EnhancementType = "book" | "clean" | "enhance";

export interface ReportEntry {
  rawSpeechText: string;
  AIEnhancedText: string;
  enhancementType: EnhancementType;
}

export interface ReportConfig {
  entries: ReportEntry[];
  reportTitle?: string;
  generatedDate?: string;
  clientName?: string;
}
