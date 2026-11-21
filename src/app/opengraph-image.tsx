import { ImageResponse } from "next/og";

import { site } from "@/lib/site";

export const alt = `${site.name}: ${site.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "#0b0c0e",
          color: "#f2f3f5",
        }}
      >
        <div style={{ fontSize: 40, letterSpacing: 12, color: "#7cc4ff", fontWeight: 700 }}>
          {site.name.toUpperCase()}
        </div>
        <div style={{ fontSize: 76, fontWeight: 800, marginTop: 24, lineHeight: 1.05 }}>
          Your DEXA scan, in 3D, in your pocket.
        </div>
        <div style={{ fontSize: 32, marginTop: 28, color: "#a3a9b4" }}>
          An iPhone and Android app for 3D body composition from DEXA.
        </div>
      </div>
    ),
    size,
  );
}
