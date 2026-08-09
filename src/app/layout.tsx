import type { Metadata } from "next";
import { Manrope, Figtree, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/src/components/theme-provider";
import ClientLayout from "@/src/components/layout/client-layout";
import { NetworkStatusIndicator } from "@/src/components/NetworkStatusIndicator";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Medishop Admin",
  description: "Pharmacy Management System",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (!document.cookie.includes('is_logged_in=1') && location.pathname !== '/login' && !location.pathname.startsWith('/print')) {
                  document.documentElement.style.display = 'none';
                  location.replace('/login');
                }
                
                let theme = localStorage.getItem('theme');
                if (!theme) {
                  theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                }
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body
        className={`${manrope.variable} ${figtree.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <ThemeProvider>
          <NetworkStatusIndicator />
          <ClientLayout>{children}</ClientLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
