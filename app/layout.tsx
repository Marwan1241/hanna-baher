import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import Header from "@/components/Header";
import Loader from "@/components/Loader";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "800"],
});

export const metadata: Metadata = {
  title: "THE H — Hanna Baher",
  description:
    "Hanna Baher is a fashion designer exploring the balance between chaos and calm. Step into the archive of THE H.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${poppins.variable} is-loading`}>
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
