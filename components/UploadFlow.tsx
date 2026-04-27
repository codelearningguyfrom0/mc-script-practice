"use client";

import { useCallback, useState } from "react";
import type { ExcelColumnMap, ParseSource, ScriptLine, SpeechLocale } from "@/lib/types";
import { KuroCatFace } from "@/components/OilCat";

type ParseResponse = {
  source: ParseSource;
  sheetNames: string[];
  lines: ScriptLine[];
};

const LOCALES: { value: SpeechLocale; label: string }[] = [
  { value: "en-US", label: "English (US)" },
  { value: "zh-CN", label: "Mandarin" },
  { value: "zh-HK", label: "Cantonese" },
];

const inputClass =
  "rounded-xl border border-jp-border bg-jp-surface px-3 py-3 text-base text-jp-ink transition focus:border-jp-sakura focus:ring-2 focus:ring-jp-sakura/20";

export function UploadFlow({
  onParsed,
}: {
  onParsed: (lines: ScriptLine[], source: ParseSource) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [sheetName, setSheetName] = useState("");
  const [docxLocale, setDocxLocale] = useState<SpeechLocale>("en-US");
  const [colEn, setColEn] = useState("");
  const [colZhCN, setColZhCN] = useState("");
  const [colZhHK, setColZhHK] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lowerName = file?.name.toLowerCase() ?? "";
  const isXlsx = !!file && (lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls"));

  const onFile = useCallback(
    async (f: File | null) => {
      setFile(f);
      setError(null);
      setSheetNames([]);
      setSheetName("");
      if (!f) return;
      const lower = f.name.toLowerCase();
      if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
        const fd = new FormData();
        fd.set("file", f);
        const res = await fetch("/api/workbook-meta", { method: "POST", body: fd });
        const j = (await res.json()) as { sheetNames?: string[] };
        if (res.ok && j.sheetNames?.length) {
          setSheetNames(j.sheetNames);
          setSheetName(j.sheetNames[0]);
        }
      }
    },
    [],
  );

  const parse = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const lower = file.name.toLowerCase();
      if (lower.endsWith(".docx")) {
        fd.set("docxDefaultLocale", docxLocale);
      } else if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
        const map: ExcelColumnMap = {};
        if (colEn.trim()) map.en = colEn.trim();
        if (colZhCN.trim()) map.zhCN = colZhCN.trim();
        if (colZhHK.trim()) map.zhHK = colZhHK.trim();
        fd.set("excelColumnMap", JSON.stringify(map));
        if (sheetName) fd.set("sheetName", sheetName);
      }
      const res = await fetch("/api/parse", { method: "POST", body: fd });
      const j = (await res.json()) as ParseResponse & { error?: string };
      if (!res.ok) {
        throw new Error(j.error ?? "Parse failed");
      }
      onParsed(j.lines, j.source);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Parse failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-6 rounded-2xl border border-jp-border bg-jp-card/90 p-6 shadow-xl shadow-jp-sakura/8 backdrop-blur-sm sm:p-8">
      <div className="flex items-start gap-3">
        <KuroCatFace className="mt-0.5 h-9 w-9 shrink-0" />
        <div>
          <h2 className="text-xl font-semibold text-jp-ink">Upload your script</h2>
          <p className="mt-1 text-sm leading-relaxed text-jp-muted">
            Word (.docx) or Excel (.xlsx). For Excel, map which column holds each language.
          </p>
        </div>
      </div>

      <label className="flex cursor-pointer flex-col gap-2">
        <span className="text-sm font-semibold text-jp-ink">File</span>
        <input
          type="file"
          accept=".docx,.xlsx,.xls"
          className={`${inputClass} file:mr-3 file:rounded-lg file:border file:border-jp-sakura/30 file:bg-jp-sakura-soft file:px-3 file:py-2 file:text-sm file:font-medium file:text-jp-ink`}
          onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
        />
      </label>

      {file && file.name.toLowerCase().endsWith(".docx") && (
        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-jp-ink">Default language (all paragraphs)</span>
          <select
            value={docxLocale}
            onChange={(e) => setDocxLocale(e.target.value as SpeechLocale)}
            className={inputClass}
          >
            {LOCALES.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-jp-muted">You can change language per line during practice.</p>
        </label>
      )}

      {file && isXlsx && (
        <div className="flex flex-col gap-4 rounded-xl border border-jp-border bg-jp-moss/5 p-4">
          {sheetNames.length > 0 && (
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-jp-ink">Sheet</span>
              <select
                value={sheetName}
                onChange={(e) => setSheetName(e.target.value)}
                className={inputClass}
              >
                {sheetNames.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          )}
          <p className="text-sm font-semibold text-jp-ink">Column letters (A, B, …)</p>
          <p className="-mt-2 text-xs text-jp-muted">Leave blank to skip a language.</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-jp-muted">English</span>
              <input
                value={colEn}
                onChange={(e) => setColEn(e.target.value)}
                placeholder="e.g. C"
                className={`${inputClass} uppercase`}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-jp-muted">Mandarin</span>
              <input
                value={colZhCN}
                onChange={(e) => setColZhCN(e.target.value)}
                placeholder="e.g. D"
                className={`${inputClass} uppercase`}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-jp-muted">Cantonese</span>
              <input
                value={colZhHK}
                onChange={(e) => setColZhHK(e.target.value)}
                placeholder="e.g. E"
                className={`${inputClass} uppercase`}
              />
            </label>
          </div>
        </div>
      )}

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {error}
        </p>
      )}

      <button
        type="button"
        disabled={!file || loading}
        onClick={() => void parse()}
        className="min-h-[52px] rounded-xl bg-jp-indigo px-5 py-3.5 text-base font-semibold text-white shadow-md shadow-jp-indigo/20 transition hover:brightness-110 active:brightness-95 disabled:opacity-40"
      >
        {loading ? "Parsing…" : "Load script"}
      </button>
    </div>
  );
}
