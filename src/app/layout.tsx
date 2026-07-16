import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TokenGo AI Hub | Image Generation, Edit & Chat",
  description: "Aplikasi Web AI canggih dengan TokenGo API - Generate Gambar, Edit Gambar, & Chat Assistant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${outfit.variable} ${inter.variable}`}>
        <div className="ambient-glow" />
        <div className="app-container">
          {children}
        </div>
      </body>
    </html>
  );
}
