import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Motion-AI — Create motion graphics with AI",
  description:
    "Motion-AI is a Windows desktop application that generates polished 2D and 3D motion graphics with AI-powered Remotion generation. ₹500 one-time — no subscription.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-ink text-bone font-body antialiased">{children}</body>
    </html>
  );
}
