import type { Metadata } from "next";
import { Anton, Archivo, JetBrains_Mono, Newsreader, Noto_Serif_JP } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { EDITION_STORAGE_KEY } from "@/lib/edition";

const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--font-anton" });
const archivo = Archivo({ subsets: ["latin"], variable: "--font-archivo" });
const newsreader = Newsreader({ style: ["normal", "italic"], subsets: ["latin"], variable: "--font-newsreader" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" });
const notoSerifJp = Noto_Serif_JP({ weight: "900", preload: false, variable: "--font-noto-serif-jp" });

export const metadata: Metadata = {
  title: "WIRED/SYS",
  description: "collection of my tools and useful links",
};

// Runs before first paint so the saved Day / Night edition never flashes the wrong colours.
const editionScript = `try{var e=localStorage.getItem("${EDITION_STORAGE_KEY}");if(e!=="day"&&e!=="night"){e=matchMedia("(prefers-color-scheme: dark)").matches?"night":"day"}document.documentElement.dataset.edition=e}catch(_){document.documentElement.dataset.edition="day"}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${anton.variable} ${archivo.variable} ${newsreader.variable} ${jetbrainsMono.variable} ${notoSerifJp.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: editionScript }} />
      </head>
      <body className="antialiased">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
