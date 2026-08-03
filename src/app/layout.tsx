import type { Metadata } from "next";
import { JetBrains_Mono, Noto_Sans_SC, Syne } from "next/font/google";
import "./globals.css";

const syne = Syne({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const notoSans = Noto_Sans_SC({
  variable: "--font-sans",
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
      className={`${syne.variable} ${notoSans.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans text-[var(--cream)]">
        <div className="scene-grain" aria-hidden />
        {children}
      </body>
    </html>
  );
}
