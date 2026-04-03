import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image({
  searchParams,
}: {
  searchParams: Promise<{ title?: string }>;
}) {
  const { title } = await searchParams;
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "radial-gradient(circle at top left, rgba(45,212,191,0.25), transparent 35%), #0f172a",
          color: "white",
          padding: "56px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "18px",
            fontSize: 28,
            opacity: 0.86,
          }}
        >
          <div
            style={{
              height: 64,
              width: 64,
              borderRadius: 20,
              background: "#14b8a6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
            }}
          >
            GE
          </div>
          GlobalEcon
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.05, maxWidth: 920 }}>
            {title ?? "World economy comparisons with clarity"}
          </div>
          <div style={{ fontSize: 28, opacity: 0.86 }}>
            Official World Bank data, cleaner charts, better comparisons.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
