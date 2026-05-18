declare module "pdf-parse" {
  type PdfParseResult = {
    text: string;
    numpages?: number;
    info?: Record<string, unknown>;
    metadata?: unknown;
    version?: string;
  };

  function pdfParse(buffer: Buffer | Uint8Array): Promise<PdfParseResult>;
  export default pdfParse;
}
