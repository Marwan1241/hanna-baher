import type { Metadata } from "next";
import Book from "@/components/Book";

export const metadata: Metadata = {
  title: "The Archive — THE H",
  description: "Past work Hannah Baher keeps returning to: Immersing Identity, Play, Cairona, Barraserb and Autovroom.",
};

export default function ArchivePage() {
  return <Book />;
}
