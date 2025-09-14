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
  description: "A personal collection of daily diary comics, beautifully organized and displayed chronologically.",
  keywords: ["diary", "comics", "art", "daily", "journal", "visual", "gallery"],
  authors: [{ name: "Xinrui Chen" }],
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    title: "xyn's diary",
    description: "A personal collection of daily diary comics, beautifully organized and displayed chronologically.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "xyn's diary",
    description: "A personal collection of daily diary comics, beautifully organized and displayed chronologically.",
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
      <body
        className={`${inter.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
