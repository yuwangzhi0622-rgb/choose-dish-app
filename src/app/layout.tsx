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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full bg-gray-50/50 text-gray-900 selection:bg-orange-100 selection:text-orange-900">
        <Nav />
        <main className="min-h-screen">
          <div className="max-w-[1024px] mx-auto px-4 sm:px-6 pt-6 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-12">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
