import type { Metadata } from "next";
import { Contact } from "@/components/contact";
import { getSiteContent } from "@/lib/content";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Contact", description: "Send Rashi Chugh a project enquiry or schedule a Google Meet to discuss your next design, illustration, motion or video project." };

export default async function ContactPage() {
  const site = await getSiteContent();
  return <Contact site={site} />;
}
