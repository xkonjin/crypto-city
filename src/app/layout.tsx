import type { Metadata, Viewport } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { getLocale } from "gt-next/server";
import { GTProvider } from "gt-next";
import { SoundProvider } from "@/context/SoundContext";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://crypto-city.com"),
  title: {
    default: "CryptoCity — Build Your DeFi Empire",
    template: "CryptoCity — %s",
  },
  description:
    "An isometric city builder with real-time crypto data integration. Build DeFi towers, exchange buildings, and meme coin factories. Watch your city economy react to real market conditions.",
  openGraph: {
    title: "CryptoCity — Build Your DeFi Empire",
    description:
      "An isometric city builder with real-time crypto data integration. Build DeFi towers, exchange buildings, and meme coin factories. Watch your city economy react to real market conditions.",
    type: "website",
    siteName: "CryptoCity",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1179,
        height: 1406,
        type: "image/png",
        alt: "CryptoCity - Isometric crypto city builder game screenshot",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/opengraph-image.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CryptoCity",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0f1219",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      className={`dark ${playfair.variable} ${dmSans.variable}`}
      lang={await getLocale()}
    >
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/assets/buildings/residential.png" />
        {/* Preload critical game assets - WebP for browsers that support it */}
        <link
          rel="preload"
          href="/assets/sprites_red_water_new.webp"
          as="image"
          type="image/webp"
        />

        <link
          rel="preload"
          href="/assets/water.webp"
          as="image"
          type="image/webp"
        />
      </head>
      <body className="bg-background text-foreground antialiased font-sans overflow-hidden">
        <GTProvider>
          <SoundProvider>
            {children}
          </SoundProvider>
          <Analytics />
        </GTProvider>
      </body>
    </html>
  );
}
