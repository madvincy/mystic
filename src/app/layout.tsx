// src/app/layout.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { Syne } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ReduxProvider } from "@/components/providers/ReduxProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { SupabaseAuthProvider } from "@/providers/SupabaseAuthProvider"; // ✅ Changed from SessionProvider
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";
import AgeVerification from "@/components/ui/AgeVerification";
import FloatingCartButton from "@/components/ui/FloatingCartButton";

const geist = Syne({ subsets: ["latin"] });
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mysticwines.co.ke";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Mystic Wines & Spirits | Premium Drinks in Kenya",
    template: "%s | Mystic Wines & Spirits",
  },
  description: "Shop wines, spirits and premium drinks in Kenya from Mystic Wines & Spirits. Browse product details, current prices and delivery options.",
  keywords: "wines, spirits, premium drinks, mystic wines",
  authors: [{ name: "Mystic Wines" }],
  openGraph: {
    title: "Mystic Wines & Spirits | Premium Drinks in Kenya",
    description: "Shop wines, spirits and premium drinks in Kenya from Mystic Wines & Spirits.",
    url: siteUrl,
    siteName: "Mystic Wines & Spirits",
    locale: "en_KE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mystic Wines & Spirits | Premium Drinks in Kenya",
    description: "Shop wines, spirits and premium drinks in Kenya from Mystic Wines & Spirits.",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: ["/favicon.ico"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={geist.className}>
        <SupabaseAuthProvider>
          {" "}
          {/* ✅ Changed from SessionProvider */}
          <ReduxProvider>
            <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
              <ErrorBoundary>
                {/* Age Verification - Always on top */}
                <AgeVerification />
                <Suspense fallback={null}>
                  <Header />
                </Suspense>
                <main className="min-h-screen pt-20">{children}</main>
                <Footer />
                <FloatingCartButton />
                <Toaster
                  position="top-right"
                  richColors
                  expand
                  closeButton
                  theme="system"
                />
              </ErrorBoundary>
            </ThemeProvider>
          </ReduxProvider>
        </SupabaseAuthProvider>
      </body>
    </html>
  );
}
