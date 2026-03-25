import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import Nav from "@/components/Nav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "今天吃什么 - 点菜搭配助手",
  description: "帮你决定每天吃什么的智能点菜搭配小程序",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full bg-gray-50">
        <main className="max-w-lg mx-auto px-4 pt-6 pb-24">{children}</main>
        <Nav />
      </body>
    </html>
  );
}
