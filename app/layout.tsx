import type { Metadata } from "next";
import { Roboto, Roboto_Mono } from "next/font/google";
import { TestableClerkProvider } from "@/components/testable-clerk-provider";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { getBrandConfig } from "@/lib/brand";
import "./globals.css";

const roboto = Roboto({
  weight: ['300', '400', '500', '700', '900'], // Light, Regular, Medium, Bold, Black
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: "--font-roboto-sans",
  display: 'swap'
});

const robotoMono = Roboto_Mono({
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: "--font-roboto-mono",
  display: 'swap'
});

const brand = getBrandConfig();

export const metadata: Metadata = {
  title: `${brand.name} - ${brand.tagline}`,
  description: brand.description,
  icons: {
    icon: brand.logos.favicon,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${roboto.variable} ${robotoMono.variable} antialiased`}
      >
        <TestableClerkProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem={true}
            disableTransitionOnChange={false}
          >
            {children}
            <Toaster position="top-center" />
          </ThemeProvider>
        </TestableClerkProvider>
      </body>
    </html>
  );
}
