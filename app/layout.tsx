import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { DarkModeProvider } from "./contexts/DarkModeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { SpeedInsights } from "@vercel/speed-insights/next"

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | EZ-Home",
    default: "EZ-Home - Giải pháp quản lý nhà trọ và phòng cho thuê thông minh",
  },
  description: "Hệ thống quản lý nhà cho thuê, căn hộ dịch vụ và KTX với công cụ quản lý hóa đơn, hợp đồng và dịch vụ cư dân hiện đại.",
  keywords: ["quản lý nhà trọ", "quản lý toà nhà", "quản lý phòng cho thuê", "EZ-Home", "phần mềm quản lý nhà trọ", "hợp đồng điện tử", "quản lý căn hộ"],
  authors: [{ name: "EZ-Home Team" }],
  creator: "EZ-Home",
  publisher: "EZ-Home",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "EZ-Home - Quản lý nhà cho thuê thông minh",
    description: "Nền tảng giúp tối ưu hóa việc quản lý vận hành nhà cho thuê một cách chuyên nghiệp và hiệu quả.",
    url: "https://ezhome.cloud",
    siteName: "EZ-Home",
    images: [
      {
        url: "/logo_final.png",
        width: 1200,
        height: 630,
        alt: "EZ-Home Logo",
      },
    ],
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EZ-Home - Quản lý nhà cho thuê thông minh",
    description: "Nền tảng quản lý nhà trọ và căn hộ dịch vụ hiện đại.",
    images: ["/logo_final.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/logo_final.png",
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
          <AuthProvider>
            {children}
            <SpeedInsights />
          </AuthProvider>
        </DarkModeProvider>
      </body>
    </html>
  );
}
