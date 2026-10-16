import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { SupabaseRecoveryRedirect } from "@/components/auth/SupabaseRecoveryRedirect";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { MotionProvider } from "@/components/providers/MotionProvider";
import { LocaleProvider } from "@/components/providers/LocaleProvider";
import { AccountLanguageSync } from "@/components/i18n/AccountLanguageSync";
import { createMarketingMetadata, HOME_SEO } from "@/lib/marketing/seo";
import { MARKETING } from "@/lib/marketing/siteConfig";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

const homeMetadata = createMarketingMetadata(HOME_SEO);

export const metadata: Metadata = {
  metadataBase: new URL(MARKETING.siteUrl),
  ...homeMetadata,
  title: {
    default: HOME_SEO.title,
    template: "%s · HADRO",
  },
  applicationName: "HADRO",
  icons: {
    icon: [{ url: "/favicon.ico", sizes: "any" }],
    apple: [{ url: "/brand/logo-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1c1c1c" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0f0f" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className={inter.className}>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k="hadro_theme_pref";var p=localStorage.getItem(k);var d=p==="dark"||((p!=="light")&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);}catch(e){}})();(function(){try{var raw=(localStorage.getItem("hadro_locale")||"").trim().toLowerCase();var allowed=["en","fr","pt","ar","sw","es"];var locale="en";if(allowed.indexOf(raw)>=0){locale=raw;}else if(raw==="system"){var primary=((navigator.language||"").toLowerCase().split("-")[0]);if(allowed.indexOf(primary)>=0)locale=primary;}document.documentElement.lang=locale;document.documentElement.dir=locale==="ar"?"rtl":"ltr";}catch(e){}})();`,
          }}
        />
        <LocaleProvider>
          <MotionProvider>
            <AuthProvider>
              <AccountLanguageSync />
              <SupabaseRecoveryRedirect />
              <ToastProvider>{children}</ToastProvider>
            </AuthProvider>
          </MotionProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
