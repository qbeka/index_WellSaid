import type { Metadata } from "next";
import { DM_Sans, Dancing_Script } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const dancingScript = Dancing_Script({
  variable: "--font-dancing",
  subsets: ["latin"],
  weight: ["700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ),
  title: "WellSaid",
  description:
    "A healthcare copilot ensuring language and memory are never barriers to quality care.",
  icons: {
    icon: [{ url: "/icon", type: "image/png", sizes: "192x192" }],
  },
  openGraph: {
    title: "WellSaid",
    description:
      "A healthcare copilot ensuring language and memory are never barriers to quality care.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "WellSaid",
    description:
      "A healthcare copilot ensuring language and memory are never barriers to quality care.",
  },
};

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${dancingScript.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
};

export default RootLayout;
