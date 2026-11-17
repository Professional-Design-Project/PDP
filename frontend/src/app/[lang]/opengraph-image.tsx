import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { dictionaryFor } from "@/lib/page-metadata";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export async function generateImageMetadata({ params }: { params: { lang: string } }) {
  return [{ id: "default", alt: dictionaryFor(params.lang).t.meta.imageAlt, size, contentType }];
}

const logo = readFile(join(process.cwd(), "public/brand/logo.svg"), "base64");

export default async function Image({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const { t } = dictionaryFor(lang);
  const logoData = await logo;
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#F7F9FC",
        color: "#0F1420",
        padding: 72,
      }}
    >
      <img src={`data:image/svg+xml;base64,${logoData}`} width={226} height={80} alt="" />
      <div style={{ display: "flex", flexDirection: "column", borderTop: "4px solid #0F1420" }}>
        <div
          style={{
            marginTop: 32,
            fontSize: 88,
            fontWeight: 700,
            lineHeight: 0.95,
            letterSpacing: -3,
          }}
        >
          {t.landing.title}
        </div>
        <div style={{ marginTop: 28, fontSize: 30, color: "#5E6675", maxWidth: 900 }}>
          {t.meta.description}
        </div>
      </div>
    </div>,
    size,
  );
}
