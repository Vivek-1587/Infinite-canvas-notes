import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { ServiceWorkerRegister } from "@/app/service-worker-register";
import "./globals.css";

export const metadata: Metadata = {
  title: "Infinite Canvas Notes",
  description:
    "A local-first infinite canvas for markdown notes and visual knowledge graphs.",
  applicationName: "Infinite Canvas Notes",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Canvas Notes",
    statusBarStyle: "black-translucent"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" }
  ]
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
