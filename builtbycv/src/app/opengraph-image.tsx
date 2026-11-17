import { ImageResponse } from "next/og";

export const alt = "CV Capital: Creating Value. Licensed Arizona general contractor.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "linear-gradient(135deg,#2a2622,#161513)", color: "#f5f2ed", fontFamily: "serif" }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 44, letterSpacing: 1 }}>CV Capital</div>
          <div style={{ fontSize: 18, letterSpacing: 8, opacity: 0.6, marginTop: 8 }}>CREATING VALUE</div>
        </div>
        <div style={{ fontSize: 76, lineHeight: 1.05, maxWidth: 950 }}>Exceptional Spaces. Built to Last.</div>
        <div style={{ fontSize: 24, opacity: 0.7, fontFamily: "sans-serif" }}>Arizona ROC #368875 · KB-1 General Dual Building Contractor</div>
      </div>
    ),
    size,
  );
}
