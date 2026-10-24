import type { Metadata, Viewport } from "next";
import { MotionConfig } from "framer-motion";
import { AdminProvider } from "@/components/admin-provider";
import { CustomCursor, ScrollProgress } from "@/components/motion";
import { DialogProvider } from "@/components/dialog";
import { RouteTransition } from "@/components/route-transition";
import { SiteHeader } from "@/components/site-header";
import { SiteLoader } from "@/components/site-loader";
import { StickerCollectionProvider } from "@/components/sticker-collection";
import { StickerDrawer } from "@/components/sticker-drawer";
import { getAdminContext } from "@/lib/auth";
import { getSiteContent } from "@/lib/content";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "Rashi Chugh — Graphic Designer & Motion Artist", template: "%s — Rashi Chugh" },
  description: "Graphic design, brand identities, illustration, motion graphics and video editing by Rashi Chugh, a visual designer based in Gurugram, India.",
  keywords: ["Rashi Chugh", "graphic designer", "motion graphics", "video editor", "brand identity", "Gurugram"],
  openGraph: {
    title: "Rashi Chugh — Making ideas look alive.",
    description: "Graphic design, motion and video — with colour, character and a little bit of mischief.",
    type: "website",
    images: [{ url: "/images/og-rashi.png", width: 1200, height: 630, alt: "Rashi Chugh — Making ideas look alive" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rashi Chugh — Making ideas look alive.",
    description: "Graphic design, motion and video by Rashi Chugh.",
    images: ["/images/og-rashi.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#F5F0E6",
  colorScheme: "light",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [admin, site] = await Promise.all([getAdminContext(), getSiteContent()]);
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <MotionConfig reducedMotion="user">
          <DialogProvider>
            <AdminProvider context={admin}>
              <StickerCollectionProvider>
                <SiteLoader />
                <ScrollProgress />
                <CustomCursor />
                <SiteHeader site={site} />
                <RouteTransition>{children}</RouteTransition>
                <StickerDrawer />
              </StickerCollectionProvider>
            </AdminProvider>
          </DialogProvider>
        </MotionConfig>
      </body>
    </html>
  );
}
