/** Heuristic: returns true if ≥30% of characters are CJK unified ideographs */
export function looksLikeChinese(text: string): boolean {
  const cjk = text.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g);
  if (!cjk) return false;
  const ratio = cjk.length / text.replace(/\s/g, "").length;
  return ratio >= 0.3;
}
