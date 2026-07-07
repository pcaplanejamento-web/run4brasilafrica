import { ImageResponse } from "next/og";
import { readContentAsync } from "@/lib/content/db";
import { seedContent } from "@/lib/content/seed";

export const dynamic = "force-dynamic"; // regenerate per request from live D1
export const alt = "Run4BrasilAfrica";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Social share image (Open Graph / WhatsApp / Twitter), generated from the LIVE
 * content so it always matches Configurações — brand wordmark, main headline and
 * the date/place badge. Pure text/shapes (no external fonts/images) so it renders
 * reliably on the Worker. Falls back to the seed if the content read fails.
 */
export default async function Image() {
  let event = seedContent.event;
  try {
    const { content } = await readContentAsync();
    event = content.event ?? event;
  } catch {
    /* keep seed */
  }

  const brand = event.brandName || "Run4BrasilAfrica";
  // Split the brand so the last "Africa"-like part is gold (matches the site).
  const m = brand.match(/^(.*?)(africa)$/i);
  const brandHead = m ? m[1] : brand;
  const brandTail = m ? m[2] : "";
  const headline = event.tagline || "Corra por algo maior.";
  const badge = event.dateLabel || "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#241d14",
          padding: "70px 80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 52, fontWeight: 800, letterSpacing: -1 }}>
          <span style={{ color: "#f3efe6", textTransform: "uppercase" }}>{brandHead}</span>
          {brandTail && (
            <span style={{ color: "#c8ce2e", textTransform: "uppercase" }}>{brandTail}</span>
          )}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 28,
            marginTop: "auto",
          }}
        >
          <div
            style={{
              display: "flex",
              color: "#f3efe6",
              fontSize: 96,
              fontWeight: 800,
              lineHeight: 1.02,
              textTransform: "uppercase",
              maxWidth: 1000,
            }}
          >
            {headline}
          </div>
          {badge && (
            <div
              style={{
                display: "flex",
                alignSelf: "flex-start",
                background: "#c8ce2e",
                color: "#1a1400",
                fontSize: 34,
                fontWeight: 700,
                padding: "14px 26px",
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              {badge}
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            height: 14,
            background: "#b5502f",
            marginTop: 40,
            marginLeft: -80,
            marginRight: -80,
            marginBottom: -70,
          }}
        />
      </div>
    ),
    { ...size },
  );
}
