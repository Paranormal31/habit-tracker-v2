import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { PwaRegister } from "@/components/PwaRegister";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HabitForge",
  description: "Track daily habits and build streaks.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "HabitForge",
    statusBarStyle: "default"
  }
};

export const viewport: Viewport = {
  themeColor: "#14b8a6"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
