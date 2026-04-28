import type { PracticeResult, SpeechLocale, TtsStyle } from "./types";
import { VOICE_BY_LOCALE } from "./voices";

async function getToken(): Promise<{ token: string; region: string }> {
  const res = await fetch("/api/speech/token");
  if (!res.ok) {
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(j.error ?? "Could not get speech token. Set AZURE_SPEECH_KEY and AZURE_SPEECH_REGION.");
  }
  return res.json() as Promise<{ token: string; region: string }>;
}

function baseSpeechConfig(
  sdk: typeof import("microsoft-cognitiveservices-speech-sdk"),
  token: string,
  region: string,
) {
  const c = sdk.SpeechConfig.fromAuthorizationToken(token, region);
  return c;
}

let currentAudio: HTMLAudioElement | null = null;

type SpeakOptions = {
  playbackRate?: number;
  style?: TtsStyle;
  voiceName?: string;
};

function escapeXml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function styleToSsml(locale: SpeechLocale, style: TtsStyle): { styleName?: string; rate: string } {
  if (style === "slow") return { rate: "-15.00%" };
  if (style === "mc") {
    if (locale === "en-US") return { styleName: "newscast", rate: "-2.00%" };
    return { rate: "-3.00%" };
  }
  if (style === "cheerful") {
    return { styleName: "cheerful", rate: "2.00%" };
  }
  if (style === "friendly") {
    if (locale === "en-US") return { styleName: "customerservice", rate: "0.00%" };
    return { styleName: "chat", rate: "0.00%" };
  }
  if (style === "serious") {
    if (locale === "en-US") return { styleName: "newscast", rate: "-2.00%" };
    return { rate: "-2.00%" };
  }
  if (style === "empathetic") {
    return { styleName: "empathetic", rate: "-3.00%" };
  }
  if (style === "clear") {
    if (locale === "en-US") return { styleName: "newscast", rate: "0.00%" };
    return { rate: "0.00%" };
  }
  if (locale === "en-US") return { styleName: "chat", rate: "-5.00%" };
  return { rate: "0.00%" };
}

function buildSsml(
  text: string,
  locale: SpeechLocale,
  style: TtsStyle,
  voiceName?: string,
  disableExpressStyle = false,
): string {
  const voice = voiceName ?? VOICE_BY_LOCALE[locale];
  const safe = escapeXml(text);
  const { styleName, rate } = styleToSsml(locale, style);
  const body = styleName && !disableExpressStyle
    ? `<mstts:express-as style="${styleName}">${safe}</mstts:express-as>`
    : safe;
  return [
    `<speak version="1.0" xml:lang="${locale}" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts">`,
    `<voice name="${voice}">`,
    `<prosody rate="${rate}">`,
    body,
    `</prosody>`,
    `</voice>`,
    `</speak>`,
  ].join("");
}

/** Immediately stop any TTS audio that is currently playing. */
export function stopPlayback() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
}

/** Change the playback speed of the currently-playing audio in real time. */
export function setPlaybackRate(rate: number) {
  if (currentAudio) {
    currentAudio.playbackRate = rate;
  }
}

export async function speakText(
  text: string,
  locale: SpeechLocale,
  options: SpeakOptions = {},
): Promise<void> {
  const playbackRate = options.playbackRate ?? 1;
  const style = options.style ?? "natural";
  const voiceName = options.voiceName ?? VOICE_BY_LOCALE[locale];
  const sdk = await import("microsoft-cognitiveservices-speech-sdk");
  const { token, region } = await getToken();
  const speechConfig = baseSpeechConfig(sdk, token, region);
  speechConfig.speechSynthesisVoiceName = voiceName;
  speechConfig.speechSynthesisOutputFormat =
    sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;

  const synthesizer = new sdk.SpeechSynthesizer(speechConfig, null as never);
  try {
    let ssml = buildSsml(text, locale, style, voiceName);
    let result = await new Promise<import("microsoft-cognitiveservices-speech-sdk").SpeechSynthesisResult>(
      (resolve, reject) => {
        synthesizer.speakSsmlAsync(ssml, (r) => resolve(r), (err) => reject(err));
      },
    );

    // Some voices do not support all express-as styles. Fallback gracefully.
    if (
      result.reason !== sdk.ResultReason.SynthesizingAudioCompleted &&
      result.errorDetails?.toLowerCase().includes("style")
    ) {
      ssml = buildSsml(text, locale, style, voiceName, true);
      result = await new Promise<import("microsoft-cognitiveservices-speech-sdk").SpeechSynthesisResult>(
        (resolve, reject) => {
          synthesizer.speakSsmlAsync(ssml, (r) => resolve(r), (err) => reject(err));
        },
      );
    }

    if (result.reason !== sdk.ResultReason.SynthesizingAudioCompleted) {
      throw new Error(`TTS failed: ${result.errorDetails ?? result.reason}`);
    }

    const blob = new Blob([result.audioData], { type: "audio/mpeg" });
    const url = URL.createObjectURL(blob);
    try {
      await playAudioBlob(url, playbackRate);
    } finally {
      URL.revokeObjectURL(url);
    }
  } finally {
    await synthesizer.close();
  }
}

function playAudioBlob(url: string, playbackRate: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio(url);
    audio.playbackRate = playbackRate;
    currentAudio = audio;
    audio.onended = () => { currentAudio = null; resolve(); };
    audio.onpause = () => { currentAudio = null; resolve(); };
    audio.onerror = () => { currentAudio = null; reject(new Error("Audio playback failed")); };
    audio.play().catch(reject);
  });
}

export async function assessPronunciation(
  referenceText: string,
  locale: SpeechLocale,
): Promise<PracticeResult> {
  const sdk = await import("microsoft-cognitiveservices-speech-sdk");
  const { token, region } = await getToken();
  const speechConfig = baseSpeechConfig(sdk, token, region);
  speechConfig.speechRecognitionLanguage = locale;

  const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();
  const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

  const pa = new sdk.PronunciationAssessmentConfig(
    referenceText,
    sdk.PronunciationAssessmentGradingSystem.HundredMark,
    sdk.PronunciationAssessmentGranularity.Word,
    true,
  );
  pa.applyTo(recognizer);

  try {
    const result = await new Promise<import("microsoft-cognitiveservices-speech-sdk").SpeechRecognitionResult>(
      (resolve, reject) => {
        recognizer.recognizeOnceAsync(resolve, (e) => reject(e));
      },
    );

    if (result.reason !== sdk.ResultReason.RecognizedSpeech) {
      const err = sdk.CancellationDetails.fromResult(result);
      throw new Error(err.errorDetails ?? "Could not recognize speech. Try again.");
    }

    const paResult = sdk.PronunciationAssessmentResult.fromResult(result);
    const detail = paResult.detailResult;
    const words =
      detail.Words?.map((w) => ({
        word: w.Word,
        accuracyScore: w.PronunciationAssessment?.AccuracyScore,
        errorType: w.PronunciationAssessment?.ErrorType,
      })) ?? [];

    const p = detail.PronunciationAssessment;

    return {
      accuracyScore: p?.AccuracyScore ?? paResult.accuracyScore,
      pronunciationScore: p?.PronScore ?? paResult.pronunciationScore,
      completenessScore: p?.CompletenessScore ?? paResult.completenessScore,
      fluencyScore: p?.FluencyScore ?? paResult.fluencyScore,
      prosodyScore: p?.ProsodyScore ?? paResult.prosodyScore,
      words,
    };
  } finally {
    await recognizer.close();
  }
}
