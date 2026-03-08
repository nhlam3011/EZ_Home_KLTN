import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { DarkModeProvider } from "./contexts/DarkModeContext";
import { SpeedInsights } from "@vercel/speed-insights/next"

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "EZ-Home - Hệ thống quản lý nhà trọ",
  description: "Hệ thống quản lý nhà trọ thông minh EZ-Home",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans text-[14px] antialiased`}
      >
        <DarkModeProvider>
          {children}
          <SpeedInsights />
        </DarkModeProvider>
      </body>
    </html>
  );
}
