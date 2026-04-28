export type SpeechLocale = "en-US" | "zh-CN" | "zh-HK";
export type TtsStyle =
  | "natural"
  | "mc"
  | "clear"
  | "slow"
  | "cheerful"
  | "friendly"
  | "serious"
  | "empathetic";

export type ScriptLine = {
  id: string;
  text: string;
  locale: SpeechLocale;
  /** Human-readable source, e.g. "Row 4 · English" */
  sourceLabel: string;
};

export type ParseSource = "docx" | "xlsx";

export type ExcelColumnKey = "en" | "zhCN" | "zhHK";

export type ExcelColumnMap = Partial<Record<ExcelColumnKey, string>>;

export type WordAssessment = {
  word: string;
  accuracyScore?: number;
  errorType?: string;
};

export type PracticeResult = {
  accuracyScore: number;
  pronunciationScore: number;
  completenessScore: number;
  fluencyScore: number;
  prosodyScore?: number;
  words: WordAssessment[];
};
