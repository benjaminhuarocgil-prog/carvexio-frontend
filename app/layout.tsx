import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Carvexio",
  description: "Marketplace de repuestos",
  icons: {
    icon: "/logo2.png",
    shortcut: "/logo2.png",
    apple: "/logo2.png",
  },
};

import { UserProvider } from '@auth0/nextjs-auth0/client';
import HelpChatbot from "../components/features/HelpChatbot";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <Script
          src="https://sdk.mercadopago.com/js/v2"
          strategy="beforeInteractive"
        />
      </head>
      <body className="antialiased">
        <UserProvider>
          {children}
          <HelpChatbot />
        </UserProvider>
      </body>
    </html>
  );
}
