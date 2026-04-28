import type { SpeechLocale } from "./types";

export type VoiceOption = {
  value: string;
  label: string;
};

/** Neural voices that work well for MC-style delivery */
export const VOICE_BY_LOCALE: Record<SpeechLocale, string> = {
  "en-US": "en-US-JennyNeural",
  "zh-CN": "zh-CN-XiaoxiaoNeural",
  "zh-HK": "zh-HK-HiuMaanNeural",
};

/** Speech Studio voice names you can use directly in the app */
export const VOICE_OPTIONS_BY_LOCALE: Record<SpeechLocale, VoiceOption[]> = {
  "en-US": [
    { value: "en-US-JennyNeural", label: "Jenny (warm, natural)" },
    { value: "en-US-AriaNeural", label: "Aria (clear, professional)" },
    { value: "en-US-AvaMultilingualNeural", label: "Ava Multilingual (female, modern)" },
    { value: "en-US-EmmaMultilingualNeural", label: "Emma Multilingual (female, smooth)" },
    { value: "en-US-GuyNeural", label: "Guy (male, steady)" },
    { value: "en-US-DavisNeural", label: "Davis (male, broadcast-like)" },
    { value: "en-US-AmberNeural", label: "Amber (bright)" },
    { value: "en-US-AnaNeural", label: "Ana (friendly)" },
    { value: "en-US-AshleyNeural", label: "Ashley (neutral)" },
    { value: "en-US-BrandonNeural", label: "Brandon (male, upbeat)" },
    { value: "en-US-ChristopherNeural", label: "Christopher (male, calm)" },
    { value: "en-US-CoraNeural", label: "Cora (soft)" },
    { value: "en-US-ElizabethNeural", label: "Elizabeth (formal)" },
    { value: "en-US-EricNeural", label: "Eric (male, energetic)" },
    { value: "en-US-JacobNeural", label: "Jacob (male, clear)" },
    { value: "en-US-JaneNeural", label: "Jane (balanced)" },
    { value: "en-US-JasonNeural", label: "Jason (male, announcer-like)" },
    { value: "en-US-MichelleNeural", label: "Michelle (smooth)" },
    { value: "en-US-MonicaNeural", label: "Monica (steady)" },
    { value: "en-US-NancyNeural", label: "Nancy (natural)" },
    { value: "en-US-NovaTurboMultilingualNeural", label: "Nova Turbo Multilingual (female, expressive)" },
    { value: "en-US-RogerNeural", label: "Roger (male, neutral)" },
    { value: "en-US-SaraNeural", label: "Sara (friendly)" },
    { value: "en-US-SteffanNeural", label: "Steffan (male, deep)" },
    { value: "en-US-TonyNeural", label: "Tony (male, punchy)" },
  ],
  "zh-CN": [
    { value: "zh-CN-XiaoxiaoNeural", label: "Xiaoxiao (natural)" },
    { value: "zh-CN-XiaoyiNeural", label: "Xiaoyi (gentle)" },
    { value: "zh-CN-XiaohanNeural", label: "Xiaohan (bright)" },
    { value: "zh-CN-XiaomengNeural", label: "Xiaomeng (young)" },
    { value: "zh-CN-XiaomoNeural", label: "Xiaomo (smooth)" },
    { value: "zh-CN-XiaoqiuNeural", label: "Xiaoqiu (clear)" },
    { value: "zh-CN-XiaoruiNeural", label: "Xiaorui (soft)" },
    { value: "zh-CN-XiaoshuangNeural", label: "Xiaoshuang (neutral)" },
    { value: "zh-CN-XiaoxuanNeural", label: "Xiaoxuan (warm)" },
    { value: "zh-CN-XiaoyanNeural", label: "Xiaoyan (balanced)" },
    { value: "zh-CN-XiaoyouNeural", label: "Xiaoyou (light)" },
    { value: "zh-CN-YunxiNeural", label: "Yunxi (male, lively)" },
    { value: "zh-CN-YunjianNeural", label: "Yunjian (male, broadcaster)" },
    { value: "zh-CN-YunfengNeural", label: "Yunfeng (male, mature)" },
    { value: "zh-CN-YunhaoNeural", label: "Yunhao (male, modern)" },
    { value: "zh-CN-YunxiaNeural", label: "Yunxia (male, expressive)" },
    { value: "zh-CN-YunyangNeural", label: "Yunyang (male, firm)" },
    { value: "zh-CN-liaoning-XiaobeiNeural", label: "Xiaobei (Liaoning accent)" },
    { value: "zh-CN-shaanxi-XiaoniNeural", label: "Xiaoni (Shaanxi accent)" },
  ],
  "zh-HK": [
    { value: "zh-HK-HiuMaanNeural", label: "HiuMaan (female, clear)" },
    { value: "zh-HK-HiuGaaiNeural", label: "HiuGaai (female, bright)" },
    { value: "zh-HK-HiuYuNeural", label: "HiuYu (female, smooth)" },
    { value: "zh-HK-WanLungNeural", label: "WanLung (male, calm)" },
  ],
};
