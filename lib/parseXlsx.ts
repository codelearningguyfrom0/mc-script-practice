import * as XLSX from "xlsx";
import type { ExcelColumnMap, ScriptLine, SpeechLocale } from "./types";
import { columnLetterToIndex } from "./columnUtils";

const localeFor: Record<keyof Required<ExcelColumnMap>, SpeechLocale> = {
  en: "en-US",
  zhCN: "zh-CN",
  zhHK: "zh-HK",
};

const labelFor: Record<keyof Required<ExcelColumnMap>, string> = {
  en: "English",
  zhCN: "Mandarin",
  zhHK: "Cantonese",
};

function newId(): string {
  return crypto.randomUUID();
}

export function parseXlsx(
  buffer: Buffer,
  columnMap: ExcelColumnMap,
  sheetName?: string,
): ScriptLine[] {
  const wb = XLSX.read(buffer, { type: "buffer" });
  const sheet =
    sheetName && wb.SheetNames.includes(sheetName)
      ? wb.Sheets[sheetName]
      : wb.Sheets[wb.SheetNames[0]];
  if (!sheet) {
    return [];
  }

  const rows = XLSX.utils.sheet_to_json<(string | number | undefined)[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  }) as (string | number | undefined)[][];

  const entries: { key: keyof ExcelColumnMap; col: number }[] = [];
  for (const key of ["en", "zhCN", "zhHK"] as const) {
    const letter = columnMap[key]?.trim();
    if (letter) {
      entries.push({ key, col: columnLetterToIndex(letter) });
    }
  }

  if (entries.length === 0) {
    throw new Error("Map at least one column (English, Mandarin, or Cantonese).");
  }

  const lines: ScriptLine[] = [];

  rows.forEach((row, rowIdx) => {
    entries.forEach(({ key, col }) => {
      const raw = row[col];
      const text =
        raw === undefined || raw === null
          ? ""
          : String(raw)
              .replace(/\u00a0/g, " ")
              .trim();
      if (!text) return;
      lines.push({
        id: newId(),
        text,
        locale: localeFor[key],
        sourceLabel: `Row ${rowIdx + 1} · ${labelFor[key]}`,
      });
    });
  });

  return lines;
}

export function listSheetNames(buffer: Buffer): string[] {
  const wb = XLSX.read(buffer, { type: "buffer" });
  return wb.SheetNames;
}
