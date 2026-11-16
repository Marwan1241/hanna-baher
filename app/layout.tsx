import type { Metadata } from "next";
import { Archivo, Geist_Mono } from "next/font/google";
import Header from "@/components/Header";
import Loader from "@/components/Loader";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "THE H — Hannah Baher",
  description:
    "Hannah Baher is a fashion designer exploring the balance between chaos and calm. Step into the archive of THE H.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${archivo.variable} ${geistMono.variable} is-loading`}>
      <body>
        <noscript>
          <style>{`.loader,.loader-mark{display:none!important}html.is-loading{overflow:auto}`}</style>
        </noscript>
        <Loader />
        <Header />
        {children}
      </body>
    </html>
  );
}
