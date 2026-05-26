const suspiciousUnicodeBlocks = [
  /[\u0400-\u04FF]/,
  /[\u0370-\u03FF]/,
  /[\u0590-\u05FF]/
]

const suspiciousAsciiLookalikes: Record<string, string[]> = {
  a: ["а", "ɑ", "α"],
  e: ["е", "℮"],
  o: ["о", "ο", "օ"],
  i: ["і", "ɩ"],
  c: ["с", "ϲ"]
}

export const hasSuspiciousUnicode = (text: string): boolean => {
  return suspiciousUnicodeBlocks.some((pattern) => pattern.test(text))
}

export const hasHomoglyphPatterns = (domain: string): boolean => {
  const lower = domain.toLowerCase()
  return Object.values(suspiciousAsciiLookalikes).some((variants) => variants.some((c) => lower.includes(c)))
}
