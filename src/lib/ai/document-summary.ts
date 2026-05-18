import { scanTextForUnsafeTerms } from "@/lib/security/content-filter";

export type DocumentSummaryResult = {
  summary: string | null;
  keywords: string[];
  extractedText: string | null;
  status: "GENERATED" | "PARTIAL" | "NO_TEXT" | "FAILED";
  reason: string;
  unsafe: boolean;
  unsafeReason?: string;
};

type SummaryInput = {
  title: string;
  description: string;
  subject: string;
  manualTags?: string;
};

const STOP_WORDS = new Set([
  "the", "and", "for", "are", "with", "that", "this", "from", "have", "has", "was", "were", "will", "can",
  "you", "your", "about", "into", "their", "there", "they", "them", "than", "then", "also", "such", "more",
  "less", "very", "each", "what", "when", "where", "which", "while", "these", "those", "been", "being",
  "of", "to", "in", "on", "at", "by", "as", "is", "it", "or", "an", "a", "be", "we", "our", "not", "if",
  "he", "she", "his", "her", "its", "all", "any", "use", "using", "used", "note", "notes", "unit", "chapter",
  "introduction", "example", "examples", "definition", "question", "questions", "answer", "answers"
]);

function normalizeText(text: string) {
  return text
    .replace(/\u0000/g, " ")
    .replace(/[\t\r]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/ {2,}/g, " ")
    .trim();
}

function splitSentences(text: string) {
  return normalizeText(text)
    .replace(/\n+/g, " ")
    .split(/(?<=[.!?])\s+|\s+-\s+|\s+•\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 35 && sentence.length <= 260)
    .slice(0, 60);
}

function extractKeywords(text: string, input: SummaryInput) {
  const base = `${input.title} ${input.description} ${input.subject} ${input.manualTags || ""} ${text}`.toLowerCase();
  const words = base.match(/[a-zA-Z][a-zA-Z0-9+#.-]{2,}/g) || [];
  const counts = new Map<string, number>();

  for (const rawWord of words) {
    const word = rawWord.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, "");
    if (!word || word.length < 3 || STOP_WORDS.has(word)) continue;
    counts.set(word, (counts.get(word) || 0) + 1);
  }

  const manual = (input.manualTags || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  const generated = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word)
    .filter((word) => !manual.some((tag) => tag.toLowerCase() === word.toLowerCase()))
    .slice(0, 8)
    .map((word) => word.replace(/\b\w/g, (char) => char.toUpperCase()));

  return [...manual, ...generated].slice(0, 12);
}

function buildSummary(text: string, input: SummaryInput, keywords: string[]) {
  const cleaned = normalizeText(text);
  const sentences = splitSentences(cleaned);

  if (!cleaned || cleaned.length < 120) {
    return null;
  }

  if (sentences.length < 2) {
    return cleaned.slice(0, 500).trim() + (cleaned.length > 500 ? "..." : "");
  }

  const keywordSet = new Set(keywords.map((word) => word.toLowerCase()));
  const scored = sentences.map((sentence, index) => {
    const lower = sentence.toLowerCase();
    let score = 0;
    for (const keyword of keywordSet) {
      if (keyword.length > 2 && lower.includes(keyword)) score += 3;
    }
    if (lower.includes(input.subject.toLowerCase())) score += 4;
    if (/important|definition|advantage|feature|model|algorithm|architecture|process|steps|types|application/.test(lower)) score += 2;
    score += Math.max(0, 4 - index * 0.15);
    return { sentence, index, score };
  });

  const selected = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .sort((a, b) => a.index - b.index)
    .map((item) => item.sentence);

  return selected.join(" ").slice(0, 900).trim();
}

async function extractFromPdf(buffer: Buffer) {
  const pdfParseModule = await import("pdf-parse");
  const pdfParse = pdfParseModule.default || pdfParseModule;
  const data = await pdfParse(buffer);
  return typeof data.text === "string" ? data.text : "";
}

async function extractFromDocx(buffer: Buffer) {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return result.value || "";
}

async function extractText(file: File, extension: string) {
  const buffer = Buffer.from(await file.arrayBuffer());

  if (extension === "txt") {
    return buffer.toString("utf8");
  }

  if (extension === "pdf") {
    return await extractFromPdf(buffer);
  }

  if (extension === "docx") {
    return await extractFromDocx(buffer);
  }

  return "";
}

export async function generateDocumentSummary(file: File, extension: string, input: SummaryInput): Promise<DocumentSummaryResult> {
  try {
    const extracted = normalizeText(await extractText(file, extension));
    const unsafeScan = scanTextForUnsafeTerms(extracted.slice(0, 8000));

    if (!unsafeScan.safe) {
      return {
        summary: null,
        keywords: [],
        extractedText: extracted.slice(0, 12000) || null,
        status: "FAILED",
        reason: "Unsafe text detected inside the document.",
        unsafe: true,
        unsafeReason: unsafeScan.reason || "Unsafe document text detected.",
      };
    }

    const keywords = extractKeywords(extracted, input);
    const summary = buildSummary(extracted, input, keywords);

    if (!extracted) {
      return {
        summary: null,
        keywords,
        extractedText: null,
        status: "NO_TEXT",
        reason: "No readable text could be extracted. Admin should manually review this file.",
        unsafe: false,
      };
    }

    if (!summary) {
      return {
        summary: extracted.slice(0, 400),
        keywords,
        extractedText: extracted.slice(0, 12000),
        status: "PARTIAL",
        reason: "Only a short text preview could be generated.",
        unsafe: false,
      };
    }

    return {
      summary,
      keywords,
      extractedText: extracted.slice(0, 12000),
      status: "GENERATED",
      reason: "Summary and keywords generated from document text.",
      unsafe: false,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Text extraction failed.";
    return {
      summary: null,
      keywords: [],
      extractedText: null,
      status: "FAILED",
      reason: `Summary generation failed: ${message}. Admin should manually review this file.`,
      unsafe: false,
    };
  }
}
