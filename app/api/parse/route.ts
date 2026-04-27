import { NextResponse } from "next/server";
import { parseDocx } from "@/lib/parseDocx";
import { listSheetNames, parseXlsx } from "@/lib/parseXlsx";
import type { ExcelColumnMap, ParseSource, SpeechLocale } from "@/lib/types";

export const runtime = "nodejs";

const MAX_BYTES = 12 * 1024 * 1024;

function bad(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

export async function POST(req: Request) {
  const ct = req.headers.get("content-type") ?? "";
  if (!ct.includes("multipart/form-data")) {
    return bad("Expected multipart/form-data");
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return bad("Invalid form data");
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return bad("Missing file");
  }

  if (file.size > MAX_BYTES) {
    return bad("File too large (max 12 MB)");
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const name = file.name.toLowerCase();

  if (name.endsWith(".docx")) {
    const defaultLocale = (form.get("docxDefaultLocale") as string) || "en-US";
    if (!["en-US", "zh-CN", "zh-HK"].includes(defaultLocale)) {
      return bad("Invalid docxDefaultLocale");
    }
    const lines = await parseDocx(buf, defaultLocale as SpeechLocale);
    if (lines.length === 0) {
      return bad("No text found in document");
    }
    return NextResponse.json({
      source: "docx" satisfies ParseSource,
      sheetNames: [] as string[],
      lines,
    });
  }

  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    const rawMap = form.get("excelColumnMap");
    let columnMap: ExcelColumnMap = {};
    if (typeof rawMap === "string" && rawMap) {
      try {
        columnMap = JSON.parse(rawMap) as ExcelColumnMap;
      } catch {
        return bad("Invalid excelColumnMap JSON");
      }
    }
    const sheetName = (form.get("sheetName") as string) || undefined;
    try {
      const lines = parseXlsx(buf, columnMap, sheetName);
      const sheetNames = listSheetNames(buf);
      return NextResponse.json({
        source: "xlsx" satisfies ParseSource,
        sheetNames,
        lines,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to parse spreadsheet";
      return bad(msg);
    }
  }

  return bad("Unsupported file type. Use .docx or .xlsx");
}
