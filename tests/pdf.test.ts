import { describe, it, expect } from "vitest";
import { buildImagePdf, A4_LANDSCAPE_PT } from "@/lib/pdf";

/** Decodifica o Blob do PDF em string latin1 (bytes crus) para inspeção. */
async function toText(blob: Blob): Promise<string> {
  const buf = new Uint8Array(await blob.arrayBuffer());
  let s = "";
  for (let i = 0; i < buf.length; i++) s += String.fromCharCode(buf[i]);
  return s;
}

describe("buildImagePdf", () => {
  // JPEG mínimo fake (só para o teste de estrutura; o conteúdo binário é opaco).
  const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0xff, 0xd9]);

  it("gera um PDF de 1 página bem formado, com xref e EOF", async () => {
    const blob = buildImagePdf(jpeg, 800, 600, A4_LANDSCAPE_PT.w, A4_LANDSCAPE_PT.h);
    expect(blob.type).toBe("application/pdf");
    const txt = await toText(blob);
    expect(txt.startsWith("%PDF-1.4")).toBe(true);
    expect(txt).toContain("/Type /Catalog");
    expect(txt).toContain("/Type /Page");
    expect(txt).toContain("/Subtype /Image");
    expect(txt).toContain("/Filter /DCTDecode");
    expect(txt).toContain(`/Length ${jpeg.length}`);
    expect(txt).toContain("/Root 1 0 R");
    expect(txt.trimEnd().endsWith("%%EOF")).toBe(true);
  });

  it("o offset da xref aponta para a palavra 'xref'", async () => {
    const blob = buildImagePdf(jpeg, 10, 10, 841.89, 595.28);
    const txt = await toText(blob);
    const m = txt.match(/startxref\n(\d+)\n%%EOF$/);
    expect(m).toBeTruthy();
    const start = Number(m![1]);
    // No offset declarado deve começar a tabela xref.
    expect(txt.slice(start, start + 4)).toBe("xref");
  });

  it("declara 6 objetos (0..5) na xref", async () => {
    const blob = buildImagePdf(jpeg, 10, 10, 841.89, 595.28);
    const txt = await toText(blob);
    expect(txt).toContain("xref\n0 6\n");
    expect(txt).toContain("/Size 6");
  });
});
