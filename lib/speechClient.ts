import type { PracticeResult, SpeechLocale } from "./types";
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
  playbackRate = 1,
): Promise<void> {
  const sdk = await import("microsoft-cognitiveservices-speech-sdk");
  const { token, region } = await getToken();
  const speechConfig = baseSpeechConfig(sdk, token, region);
  speechConfig.speechSynthesisVoiceName = VOICE_BY_LOCALE[locale];
  speechConfig.speechSynthesisOutputFormat =
    sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;

  const synthesizer = new sdk.SpeechSynthesizer(speechConfig, null as never);
  try {
    const result = await new Promise<import("microsoft-cognitiveservices-speech-sdk").SpeechSynthesisResult>(
      (resolve, reject) => {
        synthesizer.speakTextAsync(text, (r) => resolve(r), (err) => reject(err));
      },
    );

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
