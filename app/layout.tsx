import type { Metadata } from "next";
import { IBM_Plex_Sans, Lora } from "next/font/google";
import "@/styles/globals.css";

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap"
});

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-sans",
  display: "swap"
});

export const metadata: Metadata = {
  title: "OfferUp",
  description: "Practice interviews with structured feedback."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${lora.variable} ${plexSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
