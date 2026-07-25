import type { Metadata, Viewport } from "next";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import "./globals.css";

// Hanken Grotesk: cuerpo y controles (sans operativa).
const hanken = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-hanken", display: "swap" });
// Fraunces: títulos y versículo (serif cálida, la "voz" editorial).
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap", style: ["normal", "italic"] });

export const metadata: Metadata = {
  title: "ICEA Org Interna",
  description: "Grilla de turnos de ujieres para congreso.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f1e7" },
    { media: "(prefers-color-scheme: dark)", color: "#10201c" },
  ],
};

const themeScript = `
(() => {
  try {
    const stored = window.localStorage.getItem("icea-theme");
    const theme = stored === "light" || stored === "dark" ? stored : "dark";
    document.documentElement.dataset.theme = theme;
  } catch {
    document.documentElement.dataset.theme = "dark";
  }
})();
`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${hanken.variable} ${fraunces.variable}`} suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {children}
      </body>
    </html>
  );
}
