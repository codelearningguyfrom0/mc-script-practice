"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { PracticeResult, ScriptLine, SpeechLocale } from "@/lib/types";
import { assessPronunciation, speakText, stopPlayback, setPlaybackRate } from "@/lib/speechClient";
import { looksLikeChinese } from "@/lib/langDetect";
import { KuroCatFace } from "@/components/OilCat";

const LOCALES: { value: SpeechLocale; label: string }[] = [
  { value: "en-US", label: "English" },
  { value: "zh-CN", label: "Mandarin" },
  { value: "zh-HK", label: "Cantonese" },
];

const WEAK_KEY = "mc-script-weak-v1";

type WeakEntry = {
  pronunciationScore: number;
  text: string;
  locale: SpeechLocale;
  sourceLabel: string;
};

function loadWeak(): Record<string, WeakEntry> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(WEAK_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, WeakEntry>;
  } catch {
    return {};
  }
}

function saveWeak(m: Record<string, WeakEntry>) {
  localStorage.setItem(WEAK_KEY, JSON.stringify(m));
}

const fieldClass =
  "rounded-xl border border-jp-border bg-jp-surface px-3 py-3 text-base text-jp-ink focus:border-jp-sakura focus:ring-2 focus:ring-jp-sakura/20";

const chipClass =
  "flex cursor-pointer items-center gap-2 rounded-full border border-jp-border bg-jp-surface px-3 py-1.5 text-sm font-medium text-jp-ink transition hover:border-jp-sakura/40 has-[:checked]:border-jp-sakura has-[:checked]:bg-jp-sakura-soft has-[:checked]:text-jp-vermillion";

export function PracticeSession({
  lines: initialLines,
  onReset,
}: {
  lines: ScriptLine[];
  onReset: () => void;
}) {
  const [lines, setLines] = useState(initialLines);
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState<"idle" | "tts" | "rec">("idle");
  const [lastResult, setLastResult] = useState<PracticeResult | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [teleprompter, setTeleprompter] = useState(false);
  const [shadowing, setShadowing] = useState(false);
  const [shadowThreshold, setShadowThreshold] = useState(80);
  const [weakOnly, setWeakOnly] = useState(false);
  const [weakMap, setWeakMap] = useState<Record<string, WeakEntry>>({});
  const lineRef = useRef<HTMLDivElement>(null);
  const [scriptOpen, setScriptOpen] = useState(true);
  const activeOverviewRef = useRef<HTMLButtonElement>(null);
  const [chineseLang, setChineseLang] = useState<"zh-CN" | "zh-HK">("zh-HK");
  const [readingAll, setReadingAll] = useState(false);
  const stopReadingRef = useRef(false);
  const [engSpeed, setEngSpeed] = useState(0); // percentage offset: -50 to +50

  useEffect(() => {
    setWeakMap(loadWeak());
  }, []);

  useEffect(() => {
    if (!teleprompter || !lineRef.current) return;
    lineRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [index, teleprompter]);

  useEffect(() => {
    if (activeOverviewRef.current) {
      activeOverviewRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [index]);

  const weakLineIds = useMemo(
    () => new Set(Object.keys(weakMap)),
    [weakMap],
  );

  const displayLines = useMemo(() => {
    if (!weakOnly) return lines;
    return lines.filter((l) => weakLineIds.has(l.id));
  }, [lines, weakOnly, weakLineIds]);

  const current =
    displayLines.length > 0
      ? displayLines[Math.min(index, displayLines.length - 1)]
      : null;

  const setLocaleForLine = (id: string, locale: SpeechLocale) => {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, locale } : l)));
  };

  const resolveLocale = useCallback(
    (line: ScriptLine): SpeechLocale => {
      if (line.locale === "zh-CN" || line.locale === "zh-HK") return chineseLang;
      if (looksLikeChinese(line.text)) return chineseLang;
      return line.locale;
    },
    [chineseLang],
  );

  const engSpeedRef = useRef(engSpeed);
  engSpeedRef.current = engSpeed;

  const rateForLocale = useCallback(
    (locale: SpeechLocale): number => {
      if (locale !== "en-US" || engSpeedRef.current === 0) return 1;
      return 1 + engSpeedRef.current / 100;
    },
    [],
  );

  useEffect(() => {
    setPlaybackRate(1 + engSpeed / 100);
  }, [engSpeed]);

  const readAll = async (startFrom = 0) => {
    setReadingAll(true);
    stopReadingRef.current = false;
    setLastResult(null);
    setBusy("tts");
    try {
      for (let i = startFrom; i < displayLines.length; i++) {
        if (stopReadingRef.current) break;
        setIndex(i);
        const line = displayLines[i];
        const locale = resolveLocale(line);
        await speakText(line.text, locale, rateForLocale(locale));
      }
    } catch (e) {
      if (!stopReadingRef.current) {
        setErr(e instanceof Error ? e.message : "Playback failed");
      }
    } finally {
      setBusy("idle");
      setReadingAll(false);
    }
  };

  const stopReading = () => {
    stopReadingRef.current = true;
    stopPlayback();
  };

  const playModel = async () => {
    if (!current) return;
    setErr(null);
    setBusy("tts");
    try {
      await speakText(current.text, current.locale, rateForLocale(current.locale));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Playback failed");
    } finally {
      setBusy("idle");
    }
  };

  const recordOnce = async (): Promise<PracticeResult> => {
    if (!current) throw new Error("No line");
    return assessPronunciation(current.text, current.locale);
  };

  const runAssessment = async () => {
    if (!current) return;
    setErr(null);
    setBusy("rec");
    setLastResult(null);
    try {
      let result = await recordOnce();
      setLastResult(result);

      const threshold = shadowing ? shadowThreshold : 0;
      let attempts = 0;
      while (shadowing && result.pronunciationScore < threshold && attempts < 10) {
        attempts += 1;
        result = await recordOnce();
        setLastResult(result);
      }

      if (result.pronunciationScore < 75) {
        setWeakMap((prev) => {
          const next = {
            ...prev,
            [current.id]: {
              pronunciationScore: result.pronunciationScore,
              text: current.text,
              locale: current.locale,
              sourceLabel: current.sourceLabel,
            },
          };
          saveWeak(next);
          return next;
        });
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Assessment failed");
    } finally {
      setBusy("idle");
    }
  };

  const clearWeak = () => {
    setWeakMap({});
    saveWeak({});
  };

  const exportWeak = () => {
    const rows = Object.values(weakMap);
    if (rows.length === 0) return;
    const text = rows
      .map(
        (r) =>
          `[${r.locale}] ${r.sourceLabel}\n${r.text}\n(score ${r.pronunciationScore})\n`,
      )
      .join("\n---\n\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "weak-lines.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const goNext = useCallback(() => {
    setIndex((i) => Math.min(i + 1, Math.max(displayLines.length - 1, 0)));
    setLastResult(null);
  }, [displayLines.length]);

  const goPrev = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1));
    setLastResult(null);
  }, []);

  useEffect(() => {
    if (index >= displayLines.length) {
      setIndex(Math.max(0, displayLines.length - 1));
    }
  }, [displayLines.length, index]);

  if (displayLines.length === 0) {
    return (
      <div className="rounded-2xl border border-jp-border bg-jp-card/90 p-8 text-center shadow-xl shadow-jp-sakura/8 backdrop-blur-sm">
        <KuroCatFace className="mx-auto mb-3 h-12 w-12 opacity-40" />
        <p className="font-medium text-jp-muted">
          {weakOnly
            ? "No weak lines saved yet. Practice with a score under 75 to add some."
            : "No lines to practice."}
        </p>
        <button
          type="button"
          onClick={onReset}
          className="mt-5 rounded-xl border border-jp-border bg-jp-surface px-5 py-2.5 font-semibold text-jp-ink transition hover:border-jp-sakura/50"
        >
          Upload another file
        </button>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-3xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onReset}
          className="text-sm font-medium text-jp-indigo underline decoration-jp-indigo/30 underline-offset-2 hover:text-jp-indigo/80"
        >
          ← New file
        </button>
        <div className="flex flex-wrap gap-2">
          <label className={chipClass}>
            <input type="checkbox" className="accent-pink-400" checked={teleprompter} onChange={(e) => setTeleprompter(e.target.checked)} />
            Teleprompter
          </label>
          <label className={chipClass}>
            <input type="checkbox" className="accent-pink-400" checked={shadowing} onChange={(e) => setShadowing(e.target.checked)} />
            Shadowing
          </label>
          <label className={chipClass}>
            <input type="checkbox" className="accent-pink-400" checked={weakOnly} onChange={(e) => { setWeakOnly(e.target.checked); setIndex(0); }} />
            Weak only
          </label>
        </div>
      </div>

      {/* Chinese language choice + Read all */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-jp-border bg-jp-card/90 px-5 py-3 shadow-sm">
        <span className="text-sm font-semibold text-jp-ink">Chinese voice:</span>
        <label className={chipClass}>
          <input
            type="radio"
            name="chineseLang"
            className="accent-pink-400"
            checked={chineseLang === "zh-HK"}
            onChange={() => setChineseLang("zh-HK")}
          />
          Cantonese
        </label>
        <label className={chipClass}>
          <input
            type="radio"
            name="chineseLang"
            className="accent-pink-400"
            checked={chineseLang === "zh-CN"}
            onChange={() => setChineseLang("zh-CN")}
          />
          Mandarin
        </label>
        <div className="ml-auto flex flex-wrap gap-2">
          {readingAll ? (
            <button
              type="button"
              onClick={stopReading}
              className="min-h-[40px] rounded-xl bg-jp-vermillion px-4 py-2 text-sm font-semibold text-white shadow-sm"
            >
              Stop
            </button>
          ) : (
            <>
              <button
                type="button"
                disabled={busy !== "idle"}
                onClick={() => void readAll(0)}
                className="min-h-[40px] rounded-xl bg-jp-indigo px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-40"
              >
                Read all
              </button>
              <button
                type="button"
                disabled={busy !== "idle"}
                onClick={() => void readAll(index)}
                className="min-h-[40px] rounded-xl border border-jp-indigo bg-jp-surface px-4 py-2 text-sm font-semibold text-jp-indigo shadow-sm disabled:opacity-40"
              >
                Read from here
              </button>
            </>
          )}
        </div>
        <div className="flex w-full items-center gap-3 border-t border-jp-border pt-3">
          <span className="shrink-0 text-sm font-semibold text-jp-ink">English speed:</span>
          <input
            type="range"
            min={-50}
            max={50}
            step={10}
            value={engSpeed}
            onChange={(e) => setEngSpeed(Number(e.target.value))}
            className="h-2 flex-1 cursor-pointer accent-jp-indigo"
          />
          <span className="min-w-[3.5rem] text-right text-sm font-medium text-jp-muted">
            {engSpeed === 0 ? "Normal" : `${engSpeed > 0 ? "+" : ""}${engSpeed}%`}
          </span>
        </div>
      </div>

      {shadowing && (
        <label className="flex flex-wrap items-center gap-2 rounded-xl border border-jp-border bg-jp-gold-soft px-4 py-2 text-sm font-medium text-jp-ink">
          <span>Repeat until score ≥</span>
          <input
            type="number"
            min={50}
            max={100}
            value={shadowThreshold}
            onChange={(e) => setShadowThreshold(Number(e.target.value))}
            className="w-20 rounded-lg border border-jp-border bg-jp-surface px-2 py-1 text-center font-semibold"
          />
        </label>
      )}

      <div className="flex items-center justify-between text-sm font-medium text-jp-muted">
        <span>Line {index + 1} / {displayLines.length}</span>
        <span className="rounded-full border border-jp-border bg-jp-surface px-3 py-1 text-jp-ink">
          {current?.sourceLabel}
        </span>
      </div>

      {/* Script overview */}
      <details
        open={scriptOpen}
        onToggle={(e) => setScriptOpen((e.target as HTMLDetailsElement).open)}
        className="rounded-2xl border border-jp-border bg-jp-card/90 shadow-sm"
      >
        <summary className="cursor-pointer select-none px-5 py-3 text-sm font-semibold text-jp-ink hover:text-jp-vermillion">
          Script overview {scriptOpen ? "▾" : "▸"}
        </summary>
        <div className="max-h-48 overflow-y-auto border-t border-jp-border px-2 py-2 sm:max-h-64">
          {displayLines.map((line, i) => {
            const isCurrent = i === index;
            return (
              <button
                key={line.id}
                ref={isCurrent ? activeOverviewRef : undefined}
                type="button"
                onClick={() => { setIndex(i); setLastResult(null); }}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm leading-relaxed transition ${
                  isCurrent
                    ? "bg-jp-sakura-soft font-semibold text-jp-vermillion"
                    : "text-jp-ink/80 hover:bg-jp-surface"
                }`}
              >
                <span className="mr-2 inline-block min-w-[2rem] text-xs text-jp-muted">{i + 1}.</span>
                {line.text.length > 80 ? line.text.slice(0, 80) + "…" : line.text}
              </button>
            );
          })}
        </div>
      </details>

      <div
        ref={lineRef}
        className={
          teleprompter
            ? "min-h-[50vh] rounded-2xl border border-jp-border bg-[#1a1a1a] px-4 py-12 text-center text-3xl font-medium leading-relaxed text-jp-bg shadow-inner sm:text-4xl"
            : "rounded-2xl border border-jp-border bg-jp-surface p-6 text-xl font-medium leading-relaxed text-jp-ink shadow-lg shadow-jp-sakura/8 sm:p-8"
        }
      >
        {current?.text}
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-jp-ink">Language for this line</span>
        <select
          value={current?.locale ?? "en-US"}
          onChange={(e) => current && setLocaleForLine(current.id, e.target.value as SpeechLocale)}
          className={fieldClass}
        >
          {LOCALES.map((l) => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>
      </label>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={busy !== "idle"}
          onClick={() => void playModel()}
          className="min-h-[52px] min-w-[140px] rounded-xl bg-jp-moss px-4 py-3 text-base font-semibold text-white shadow-md shadow-jp-moss/20 transition hover:brightness-110 disabled:opacity-40"
        >
          {busy === "tts" ? "Playing…" : "Play model"}
        </button>
        <button
          type="button"
          disabled={busy !== "idle"}
          onClick={() => void runAssessment()}
          className="min-h-[52px] min-w-[160px] rounded-xl bg-jp-vermillion px-4 py-3 text-base font-semibold text-white shadow-md shadow-jp-vermillion/20 transition hover:brightness-110 disabled:opacity-40"
        >
          {busy === "rec" ? "Listening…" : "Record & score"}
        </button>
        <button
          type="button"
          onClick={goPrev}
          disabled={index === 0}
          className="min-h-[52px] rounded-xl border border-jp-border bg-jp-surface px-4 py-3 font-medium text-jp-ink transition hover:border-jp-sakura/40 disabled:opacity-40"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={goNext}
          disabled={index >= displayLines.length - 1}
          className="min-h-[52px] rounded-xl border border-jp-border bg-jp-surface px-4 py-3 font-medium text-jp-ink transition hover:border-jp-sakura/40 disabled:opacity-40"
        >
          Next
        </button>
      </div>

      {err && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {err}
        </p>
      )}

      {lastResult && (
        <div className="rounded-2xl border border-jp-border bg-jp-card/90 p-6 shadow-xl shadow-jp-sakura/8 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <KuroCatFace className="h-8 w-8" />
            <h3 className="text-lg font-semibold text-jp-ink">Your scores</h3>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-xl border border-jp-sakura/30 bg-jp-sakura-soft p-3">
              <dt className="text-xs font-medium text-jp-muted">Pronunciation</dt>
              <dd className="text-2xl font-bold text-jp-vermillion">{lastResult.pronunciationScore.toFixed(0)}</dd>
            </div>
            <div className="rounded-xl border border-jp-border bg-jp-surface p-3">
              <dt className="text-xs font-medium text-jp-muted">Accuracy</dt>
              <dd className="text-2xl font-bold text-jp-ink">{lastResult.accuracyScore.toFixed(0)}</dd>
            </div>
            <div className="rounded-xl border border-jp-border bg-jp-moss/8 p-3">
              <dt className="text-xs font-medium text-jp-muted">Fluency</dt>
              <dd className="text-2xl font-bold text-jp-ink">{lastResult.fluencyScore.toFixed(0)}</dd>
            </div>
            <div className="rounded-xl border border-jp-border bg-jp-gold-soft p-3">
              <dt className="text-xs font-medium text-jp-muted">Completeness</dt>
              <dd className="text-2xl font-bold text-jp-ink">{lastResult.completenessScore.toFixed(0)}</dd>
            </div>
            {lastResult.prosodyScore != null && (
              <div className="rounded-xl border border-jp-border bg-jp-indigo/8 p-3">
                <dt className="text-xs font-medium text-jp-muted">Prosody</dt>
                <dd className="text-2xl font-bold text-jp-ink">{lastResult.prosodyScore.toFixed(0)}</dd>
              </div>
            )}
          </dl>
          {lastResult.words.length > 0 && (
            <div className="mt-5">
              <p className="text-sm font-semibold text-jp-ink">Words</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {lastResult.words.map((w, i) => {
                  const low = (w.accuracyScore ?? 100) < 70 || (w.errorType && w.errorType !== "None");
                  return (
                    <li
                      key={`${w.word}-${i}`}
                      className={
                        low
                          ? "rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-sm font-medium text-amber-900"
                          : "rounded-lg border border-jp-border bg-jp-surface px-2.5 py-1 text-sm text-jp-ink"
                      }
                    >
                      {w.word}
                      {w.accuracyScore != null && (
                        <span className="ml-1 text-jp-muted">({w.accuracyScore.toFixed(0)})</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 border-t border-dashed border-jp-border pt-6">
        <button
          type="button"
          onClick={exportWeak}
          className="rounded-xl border border-jp-border bg-jp-surface px-4 py-2 text-sm font-medium text-jp-ink transition hover:border-jp-sakura/40"
        >
          Export weak lines
        </button>
        <button
          type="button"
          onClick={clearWeak}
          className="rounded-xl border border-jp-border bg-jp-surface px-4 py-2 text-sm font-medium text-jp-ink hover:border-jp-sakura/40"
        >
          Clear weak list
        </button>
        <span className="text-sm text-jp-muted">
          Lines with pronunciation under 75 are saved locally as weak.
        </span>
      </div>
    </div>
  );
}
