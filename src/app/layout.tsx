import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "xyn's diary",
  description: "Daily autobiographical comics by Xinrui Chen @xynree",
  keywords: ["diary", "comics", "art", "daily", "journal", "visual", "gallery"],
  authors: [{ name: "Xinrui Chen" }],
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
  openGraph: {
    title: "xyn's diary",
    description: "Daily autobiographical comics by Xinrui Chen @xynree",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "xyn's diary",
    description: "Daily autobiographical comics by Xinrui Chen @xynree",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>{children}</body>
    </html>
  );
}
