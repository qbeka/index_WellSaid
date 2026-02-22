import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "WellSaid - A healthcare copilot ensuring language and memory are never barriers to quality care.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function TwitterImage() {
  const logoData = await readFile(
    join(process.cwd(), "public", "logo-new.png"),
    "base64"
  );
  const logoSrc = `data:image/png;base64,${logoData}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(180deg, #e8f4fa 0%, #f0ece6 50%, #eef4f9 100%)",
          padding: 80,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <img
          src={logoSrc}
          alt=""
          style={{
            width: 220,
            height: 220,
            objectFit: "contain",
            marginBottom: 40,
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          <span
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: "#1a2b3c",
              letterSpacing: -1,
            }}
          >
            WellSaid
          </span>
          <span
            style={{
              fontSize: 28,
              color: "#6b8299",
              textAlign: "center",
              maxWidth: 800,
              lineHeight: 1.4,
            }}
          >
            A healthcare copilot ensuring language and memory are never barriers
            to quality care.
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
