import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

export const runtime = "nodejs";

export const size = { width: 192, height: 192 };
export const contentType = "image/png";

export default function Icon() {
  const logoPath = join(process.cwd(), "public", "logo-new.png");
  const buffer = readFileSync(logoPath);
  const dataUrl = `data:image/png;base64,${buffer.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1a2b3c",
        }}
      >
        <img
          src={dataUrl}
          alt=""
          style={{
            width: "85%",
            height: "85%",
            objectFit: "contain",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
