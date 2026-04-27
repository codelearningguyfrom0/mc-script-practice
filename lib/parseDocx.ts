import mammoth from "mammoth";
import type { ScriptLine } from "./types";
import type { SpeechLocale } from "./types";

function newId(): string {
  return crypto.randomUUID();
}

export async function parseDocx(
  buffer: Buffer,
  defaultLocale: SpeechLocale,
): Promise<ScriptLine[]> {
  const result = await mammoth.extractRawText({ buffer });
  const text = result.value ?? "";
  const paragraphs = text
    .split(/\r?\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return paragraphs.map((text, i) => ({
    id: newId(),
    text,
    locale: defaultLocale,
    sourceLabel: `Paragraph ${i + 1}`,
  }));
}
