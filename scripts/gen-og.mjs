// Regenerate the Open Graph image: `node scripts/gen-og.mjs`
import sharp from "sharp";

const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#2b2119"/>
  <rect width="1200" height="14" fill="#c8ce2e"/>
  <rect x="0" y="616" width="1200" height="14" fill="#c05a3a"/>
  <text x="80" y="150" font-family="Arial, Helvetica, sans-serif" font-size="58" font-weight="700" fill="#ffffff" letter-spacing="1">RUN4BRASIL<tspan fill="#c8ce2e">AFRICA</tspan></text>
  <text x="76" y="320" font-family="Arial, Helvetica, sans-serif" font-size="96" font-weight="800" fill="#f2ede4">CORRA POR</text>
  <text x="76" y="420" font-family="Arial, Helvetica, sans-serif" font-size="96" font-weight="800" fill="#f2ede4">ALGO MAIOR.</text>
  <rect x="80" y="500" width="600" height="60" fill="#c8ce2e"/>
  <text x="104" y="540" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700" fill="#211a08">14 SET 2026 · RIO DE JANEIRO</text>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile("public/og.png");
const m = await sharp("public/og.png").metadata();
console.log("og.png:", m.width + "x" + m.height, m.format);
