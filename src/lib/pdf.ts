/**
 * Gerador de **PDF** mínimo (sem dependências) — uma página com uma imagem.
 * Constrói um PDF 1.4 válido embutindo o **JPEG** do `<canvas>` como XObject de
 * imagem (`/DCTDecode`), com `xref` correto. Usado pelo certificado (canvas A4
 * paisagem → PDF baixável). 100% no navegador; nada vai ao servidor.
 */

/** Pontos (1/72") do A4 paisagem: 297mm × 210mm. */
export const A4_LANDSCAPE_PT = { w: 841.89, h: 595.28 };

/** Área clicável (link) sobre a imagem, em **pixels do canvas** (origem topo-esq.). */
export interface PdfLink {
  x: number;
  y: number;
  w: number;
  h: number;
  url: string;
}

/** Renderiza um canvas como PDF de 1 página (imagem preenchendo a página A4). */
export async function canvasToPdfBlob(
  canvas: HTMLCanvasElement,
  page: { w: number; h: number } = A4_LANDSCAPE_PT,
  quality = 0.95,
  links?: PdfLink[],
): Promise<Blob | null> {
  const jpegBlob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", quality));
  if (!jpegBlob) return null;
  const jpeg = new Uint8Array(await jpegBlob.arrayBuffer());
  return buildImagePdf(jpeg, canvas.width, canvas.height, page.w, page.h, links);
}

/** Escapa uma string literal de PDF (parênteses e barra invertida). */
function pdfEscape(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

/** Monta o PDF (bytes) de 1 página com um JPEG preenchendo a MediaBox.
 *  `links` (opcional) vira anotações `/Link` clicáveis; coords em px da imagem. */
export function buildImagePdf(
  jpeg: Uint8Array,
  imgW: number,
  imgH: number,
  pageW: number,
  pageH: number,
  links?: PdfLink[],
): Blob {
  const enc = new TextEncoder();
  const chunks: Uint8Array[] = [];
  let offset = 0;
  const push = (u8: Uint8Array) => { chunks.push(u8); offset += u8.length; };
  const str = (s: string) => push(enc.encode(s));

  const annots = (links || []).filter((l) => l.url && l.w > 0 && l.h > 0);
  const annotStart = 6; // primeiro obj de anotação
  const totalObjs = 5 + annots.length; // 1..5 fixos + N anotações
  const objOffsets: number[] = new Array(totalObjs + 1).fill(0);

  const round = (n: number) => Math.round(n * 100) / 100;
  const content = `q\n${round(pageW)} 0 0 ${round(pageH)} 0 0 cm\n/Im0 Do\nQ\n`;
  const contentBytes = enc.encode(content);

  /** Escreve um objeto; `stream` opcional (bytes crus, ex.: JPEG). */
  const obj = (n: number, dict: string, stream?: Uint8Array) => {
    objOffsets[n] = offset;
    str(`${n} 0 obj\n${dict}`);
    if (stream) {
      str("\nstream\n");
      push(stream);
      str("\nendstream");
    }
    str("\nendobj\n");
  };

  // Mapeia px da imagem (origem topo-esq.) → pontos do PDF (origem base-esq.).
  const sx = pageW / imgW, sy = pageH / imgH;
  const annotsRef = annots.map((_, i) => `${annotStart + i} 0 R`).join(" ");

  str("%PDF-1.4\n");
  obj(1, "<< /Type /Catalog /Pages 2 0 R >>");
  obj(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  obj(
    3,
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${round(pageW)} ${round(pageH)}] ` +
      `/Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R` +
      (annots.length ? ` /Annots [${annotsRef}]` : "") +
      ` >>`,
  );
  obj(
    4,
    `<< /Type /XObject /Subtype /Image /Width ${imgW} /Height ${imgH} ` +
      `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>`,
    jpeg,
  );
  obj(5, `<< /Length ${contentBytes.length} >>`, contentBytes);
  annots.forEach((l, i) => {
    const x0 = round(l.x * sx);
    const x1 = round((l.x + l.w) * sx);
    const y0 = round(pageH - (l.y + l.h) * sy); // base do retângulo
    const y1 = round(pageH - l.y * sy); // topo do retângulo
    obj(
      annotStart + i,
      `<< /Type /Annot /Subtype /Link /Rect [${x0} ${y0} ${x1} ${y1}] /Border [0 0 0] ` +
        `/A << /Type /Action /S /URI /URI (${pdfEscape(l.url)}) >> >>`,
    );
  });

  // Tabela xref (cada entrada tem exatamente 20 bytes).
  const xrefStart = offset;
  const pad10 = (n: number) => String(n).padStart(10, "0");
  const size = totalObjs + 1;
  let xref = `xref\n0 ${size}\n0000000000 65535 f \n`;
  for (let i = 1; i <= totalObjs; i++) xref += `${pad10(objOffsets[i])} 00000 n \n`;
  str(xref);
  str(`trailer\n<< /Size ${size} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`);

  const total = chunks.reduce((s, c) => s + c.length, 0);
  const out = new Uint8Array(total);
  let p = 0;
  for (const c of chunks) { out.set(c, p); p += c.length; }
  return new Blob([out], { type: "application/pdf" });
}
