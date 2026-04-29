import type { Metadata } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import Navbar from "@/components/layout/Navbar";
import PageWrapper from "@/components/layout/PageWrapper";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-sans",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "AI Image Studio - Generate, Edit & Manage AI Images",
  description:
    "Professional AI image generation and editing studio. Generate images with DALL-E, inpaint, remove backgrounds, and manage your gallery.",
  keywords: ["AI image generation", "DALL-E", "image editing", "inpainting", "stable diffusion"],
  openGraph: {
    title: "AI Image Studio",
    description: "Generate and edit stunning AI images",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${ibmPlexMono.variable} dark`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-black text-white antialiased font-sans">
        <Navbar />
        <main className="pt-14 min-h-screen">
          <PageWrapper>{children}</PageWrapper>
        </main>
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#111",
              border: "1px solid #2a2a2a",
              color: "#fff",
              fontFamily: "var(--font-mono)",
              fontSize: "13px",
            },
          }}
        />
      </body>
    </html>
  );
}
