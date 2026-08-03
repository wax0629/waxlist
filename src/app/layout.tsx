import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Noto_Sans_SC } from "next/font/google";
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
  title: "Beat Hunter — 找伴奏",
  description: "自然语言 + 参考曲链接，快速发现可试听伴奏短名单",
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
        {/* Touri aurora mesh */}
        <div className="aurora-bg" aria-hidden>
          <div className="aurora-blob blob-mesh" />
          <div className="aurora-blob blob-1" />
          <div className="aurora-blob blob-2" />
          <div className="aurora-blob blob-3" />
        </div>
        {children}
      </body>
    </html>
  );
}
