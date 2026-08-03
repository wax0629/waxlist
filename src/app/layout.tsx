import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Noto_Sans_SC } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const notoSans = Noto_Sans_SC({
  variable: "--font-cjk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Waxlist",
  description:
    "听专、荐专与口碑 · 站内 Beat Hunter 帮你找可试听伴奏",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${inter.variable} ${notoSans.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body
        className="flex min-h-full flex-col text-white"
        style={{
          fontFamily:
            "var(--font-sans), var(--font-cjk), Inter, 'Noto Sans SC', system-ui, sans-serif",
        }}
      >
        {/* Touri diagonal aurora — slanted highlight ribbons */}
        <div className="aurora-bg" aria-hidden>
          <div className="aurora-atmosphere" />
          <div className="aurora-ribbon ribbon-4" />
          <div className="aurora-ribbon ribbon-1" />
          <div className="aurora-ribbon ribbon-1-core" />
          <div className="aurora-ribbon ribbon-2" />
          <div className="aurora-ribbon ribbon-2-core" />
          <div className="aurora-ribbon ribbon-3" />
          <div className="aurora-ribbon ribbon-5" />
          <div className="aurora-vignette" />
        </div>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
