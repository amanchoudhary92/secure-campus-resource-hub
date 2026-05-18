import { describe, expect, it } from "vitest";
import { validateResourceFileBasics } from "../../src/lib/security/upload-policy";

function makeFile(name: string, type: string, size = 1024) {
  return { name, type, size } as File;
}

describe("upload validation", () => {
  it("allows academic document types", () => {
    const result = validateResourceFileBasics(makeFile("dbms-notes.pdf", "application/pdf"));
    expect(result.allowed).toBe(true);
  });

  it("blocks videos and archives", () => {
    expect(validateResourceFileBasics(makeFile("lecture.mp4", "video/mp4")).allowed).toBe(false);
    expect(validateResourceFileBasics(makeFile("files.zip", "application/zip")).allowed).toBe(false);
  });
});
