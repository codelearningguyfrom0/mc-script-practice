"use client";

import { useState } from "react";
import { UploadFlow } from "@/components/UploadFlow";
import { PracticeSession } from "@/components/PracticeSession";
import { KuroCat } from "@/components/OilCat";
import type { ParseSource, ScriptLine } from "@/lib/types";

export default function Home() {
  const [lines, setLines] = useState<ScriptLine[] | null>(null);
  const [source, setSource] = useState<ParseSource | null>(null);

  return (
    <div className="bg-washi relative flex min-h-full flex-1 flex-col items-center px-4 py-8 sm:py-14">
      {/* watermark cats */}
      <div className="pointer-events-none absolute right-6 top-8 opacity-[0.06] sm:right-14 sm:top-12" aria-hidden>
        <KuroCat className="h-48 w-32 sm:h-56 sm:w-36" />
      </div>
      <div className="pointer-events-none absolute bottom-12 left-6 opacity-[0.04] sm:left-14" aria-hidden>
        <KuroCat className="h-36 w-24 -scale-x-100 sm:h-44 sm:w-28" />
      </div>

      <header className="relative z-10 mb-10 max-w-2xl text-center">
        <div className="mb-6 flex justify-center">
          <KuroCat className="h-28 w-20 sm:h-32 sm:w-22" />
        </div>
        <p className="text-xs font-medium tracking-[0.3em] text-jp-sakura">KURONEKO</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-jp-ink sm:text-4xl">
          MC script pronunciation
        </h1>
        <div className="mx-auto mt-3 h-px w-20 bg-gradient-to-r from-transparent via-jp-sakura/60 to-transparent" />
        <p className="mt-4 text-base leading-relaxed text-jp-muted">
          Upload your Word or Excel script, listen to the model voice, then record your reading —
          English, Mandarin, or Cantonese.
        </p>
        {source && (
          <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-jp-border bg-jp-surface px-4 py-1.5 text-sm font-medium text-jp-ink shadow-sm">
            <span className="h-2 w-2 rounded-full bg-jp-sakura" aria-hidden />
            {source === "docx" ? "Word" : "Excel"} · {lines?.length ?? 0} segments
          </p>
        )}
      </header>

      <div className="relative z-10 w-full max-w-lg sm:max-w-2xl">
        {!lines ? (
          <UploadFlow
            onParsed={(next, src) => {
              setLines(next);
              setSource(src);
            }}
          />
        ) : (
          <PracticeSession
            lines={lines}
            onReset={() => {
              setLines(null);
              setSource(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
