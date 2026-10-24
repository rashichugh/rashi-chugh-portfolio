import type { Metadata } from "next";
import { About } from "@/components/about";
import { getSiteContent } from "@/lib/content";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "About", description: "Meet Rashi Chugh, a Gurugram-based graphic designer, illustrator, motion designer and video editor." };

export default async function AboutPage() {
  const site = await getSiteContent();
  return <About initialSite={site} />;
}
