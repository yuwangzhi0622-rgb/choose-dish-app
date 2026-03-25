import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import Nav from "@/components/Nav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "幸福里私房菜",
  description: "幸福里私房菜 - 点菜搭配助手",
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
        <Nav />
        <main className="pb-24 md:pb-6 md:pl-64 min-h-screen">
          <div className="max-w-4xl mx-auto px-4 pt-6">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
