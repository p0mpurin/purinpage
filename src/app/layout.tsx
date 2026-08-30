import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import WallpaperBackground from "@/components/WallpaperBackground";

export const metadata: Metadata = {
  title: "WIRED/SYS",
  description: "collection of my tools and useful links",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased">
        <WallpaperBackground />
        <Navbar />
        {children}
      </body>
    </html>
  );
}
