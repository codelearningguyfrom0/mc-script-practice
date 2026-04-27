import type { SpeechLocale } from "./types";

/** Neural voices that work well for MC-style delivery */
export const VOICE_BY_LOCALE: Record<SpeechLocale, string> = {
  "en-US": "en-US-JennyNeural",
  "zh-CN": "zh-CN-XiaoxiaoNeural",
  "zh-HK": "zh-HK-HiuMaanNeural",
};
