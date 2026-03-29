import type { Metadata, Viewport } from "next";
import { Lexend } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/AuthGuard";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { DialogProvider } from "@/contexts/DialogContext";
import { AppShell } from "@/components/AppShell";

const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0d9488',
};

export const metadata: Metadata = {
  title: "Rusydani Niken Apps",
  description: "Aplikasi pencatatan keuangan pasangan",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-192.svg",
    apple: "/icon-192.svg",
  },
  openGraph: {
    title: 'Rusydani Niken Apps',
    description: 'Catat. Pantau. Kelola planningmu lebih cerdas dengan Rusydani Niken Apps.',
    url: 'https://rusydani-niken.vercel.app',
    siteName: 'RN Apps',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Rusydani Niken Apps Preview',
      },
    ],
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Rusydani Niken Apps',
    description: 'Catat. Pantau. Kelola planningmu lebih cerdas.',
    images: ['/og-image.png'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'RN Apps',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icon-192.svg" />
      </head>
      <body className={`${lexend.variable} font-sans antialiased`}>
        <ThemeProvider>
          <DialogProvider>
            <AuthProvider>
              <AuthGuard>
                <AppShell>{children}</AppShell>
              </AuthGuard>
            </AuthProvider>
          </DialogProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
