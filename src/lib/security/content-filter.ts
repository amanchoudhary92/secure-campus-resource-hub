export type ContentFilterResult = {
  safe: boolean;
  reason?: string;
  matchedTerms?: string[];
};

const SUSPICIOUS_TERMS = [
  "nude",
  "nudes",
  "naked",
  "porn",
  "porno",
  "sex",
  "sexual",
  "xxx",
  "adult",
  "vulgar",
  "erotic",
  "nsfw",
  "boobs",
  "breast",
  "explicit",
  "hot girl",
  "sexy",
];

export function scanTextForUnsafeTerms(...values: Array<string | null | undefined>): ContentFilterResult {
  const combined = values.filter(Boolean).join(" ").toLowerCase();
  const matchedTerms = SUSPICIOUS_TERMS.filter((term) => combined.includes(term));

  if (matchedTerms.length > 0) {
    return {
      safe: false,
      reason: `Unsafe/adult/vulgar text detected: ${matchedTerms.join(", ")}`,
      matchedTerms,
    };
  }

  return { safe: true };
}
