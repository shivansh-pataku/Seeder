// src/app/layout.tsx
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";
import { Red_Hat_Text, Fauna_One } from "next/font/google";
import type { Metadata } from "next";

import { auth } from "@/lib/auth.js";

export const metadata: Metadata = {
  icons: {
    icon: "/favicon.png",
  },
};

const redHatText = Red_Hat_Text({ // for website UI , buttons, body text, form etc
  subsets: ["latin"],
  variable: "--font-redHatText",
  display: "swap",
});

const faunaOne = Fauna_One({ // for feed and artice reading purpose
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal"],
  variable: "--font-faunaOne",
  display: "swap",
});

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <html
      lang="en"
      data-theme="light"
      className={`${redHatText.variable} ${faunaOne.variable}`}
      suppressHydrationWarning
    >
      <body className={redHatText.className}>
        <ClientLayout session={session}>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}

