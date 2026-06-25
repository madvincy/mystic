// src/app/layout.tsx
import type { Metadata } from "next";
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

const geist = Syne({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mystic Wines & Spirits",
  description: "Discover our exquisite collection of premium wines & spirits",
  keywords: "wines, spirits, premium drinks, mystic wines",
  authors: [{ name: "Mystic Wines" }],
  openGraph: {
    title: "Mystic Wines & Spirits",
    description: "Discover our exquisite collection of premium wines & spirits",
    url: "https://mysticwines.co.ke",
    siteName: "Mystic Wines",
    locale: "en_KE",
    type: "website",
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
                <Header />
                <main className="min-h-screen pt-20">{children}</main>
                <Footer />
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
