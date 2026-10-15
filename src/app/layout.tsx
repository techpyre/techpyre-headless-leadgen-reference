import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { SandboxProvider } from "@/components/sandbox/SandboxProvider";
import { EdgeInspector } from "@/components/sandbox/EdgeInspector";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { Footer } from "@/components/marketing/Footer";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jetbrains",
  display: "swap",
});

const title = "Kinetix Robotics & Vision — Headless Edge & Failover Lead Queue | TechPYRE Reference Architecture #2";
const description =
  "Reference Architecture TechPYRE: landing industriale headless pre-renderizzata su Edge con configuratore ROI, outbox IndexedDB, retry con backoff esponenziale, Dead-Letter Queue e webhook CRM firmato HMAC. Azienda fittizia a scopo dimostrativo.";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#111418",
  colorScheme: "light",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://headless-demo.techpyre.eu"),
  title: { default: title, template: "%s — Kinetix X400 · TechPYRE Reference Architecture #2" },
  description,
  applicationName: "TechPYRE Reference Architecture #2",
  authors: [{ name: "Riccardo Granza", url: "https://www.techpyre.eu" }],
  creator: "TechPYRE",
  keywords: [
    "Next.js",
    "headless",
    "Edge",
    "SSG",
    "outbox pattern",
    "dead-letter queue",
    "exponential backoff",
    "HMAC",
    "Core Web Vitals",
    "lead generation B2B",
    "TechPYRE",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "it_IT",
    url: "/",
    siteName: "TechPYRE Reference Architecture",
    title: "Headless Edge & Failover Lead Queue — TechPYRE Reference Architecture #2",
    description,
  },
  twitter: {
    card: "summary",
    title: "Headless Edge & Failover Lead Queue — TechPYRE Reference Architecture #2",
    description,
  },
  robots: { index: true, follow: true },
};

/**
 * Layout radice: la sandbox (toggle chaos + outbox) e la barra TechPYRE sono condivise
 * da tutte le pagine, così la coda dei lead continua a lavorare durante la navigazione.
 * Le pagine restano prerenderizzate staticamente.
 */
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it" className={`${inter.variable} ${jetbrains.variable}`}>
      <body className="bg-paper font-sans text-ink antialiased">
        <SandboxProvider>
          <EdgeInspector />
          <SiteHeader />
          <main>{children}</main>
          <Footer />
        </SandboxProvider>
      </body>
    </html>
  );
}
