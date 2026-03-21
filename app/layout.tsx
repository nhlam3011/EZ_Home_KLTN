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
  title: "EZ-Home - Quản lý nhà cho thuê thông minh",
  description: "Hệ thống quản lý nhà cho thuê thông minh",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head />
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
