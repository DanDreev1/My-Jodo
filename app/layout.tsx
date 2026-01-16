import type { ReactNode } from "react";
import { Providers } from "@/providers/QueryProvider";
import "./globals.css";
import { Montserrat, Montserrat_Alternates } from "next/font/google";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-montserrat",
  display: "swap",
});

const montserratAlt = Montserrat_Alternates({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-montserrat-alt",
  display: "swap",
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${montserrat.variable} ${montserratAlt.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#ffffff" />

        {/* iOS “как приложение” */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Jodo" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>

      <body className="min-h-screen bg-[#f9f0e6] text-[#251c16]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}