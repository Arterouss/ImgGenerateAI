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
  title: "TokenGo AI Studio | Electric Bento AI Hub",
  description: "Aplikasi Web AI Futuristik dengan TokenGo API - Vector Art Generator, Image Edit, & Chat Assistant 5M Tokens",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${outfit.variable} ${inter.variable}`}>
        <div className="aurora-bg">
          <div className="aurora-blob-1" />
          <div className="aurora-blob-2" />
        </div>
        <div className="app-container">
          {children}
        </div>
      </body>
    </html>
  );
}
