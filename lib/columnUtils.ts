/** "A" -> 0, "B" -> 1, "AA" -> 26 */
export function columnLetterToIndex(letter: string): number {
  const s = letter.trim().toUpperCase();
  if (!s || !/^[A-Z]+$/.test(s)) {
    throw new Error(`Invalid column letter: ${letter}`);
  }
  let n = 0;
  for (let i = 0; i < s.length; i++) {
    n = n * 26 + (s.charCodeAt(i) - 64);
  }
  return n - 1;
}
