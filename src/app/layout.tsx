import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Noto_Sans_SC } from "next/font/google";
import { AuroraPerf } from "@/components/aurora-perf";
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
    "听专、荐专与红心 · 站内 Beat Hunter 帮你找可试听伴奏",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Waxlist",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#050505",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${inter.variable} ${notoSans.variable} ${jetbrains.variable} antialiased`}
    >
      <body
        className="flex min-h-dvh flex-col text-white pb-[calc(3.75rem+env(safe-area-inset-bottom,0px))] md:pb-0"
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
        <AuroraPerf />
        <Providers>
          {children}
          {/*
            文档流末尾真实占位：比只写 body padding 更稳
           （min-h-dvh 页面不会把「底部空余」吃掉）
          */}
          <div
            className="page-bottom-spacer pointer-events-none w-full shrink-0"
            aria-hidden
          />
        </Providers>
      </body>
    </html>
  );
}
