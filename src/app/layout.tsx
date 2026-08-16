// src/app/layout.tsx
import "./globals.css";
import ClientLayout from "./Components/ClientLayout.js";
import { Kite_One, DM_Sans, Readex_Pro } from "next/font/google";

const readexPro = Readex_Pro({ subsets: ["latin"], variable: "--font-readexpro", weight: "400" });
const kiteOne = Kite_One({
  subsets: ["latin"], variable: "--font-kiteone",
  weight: "400"
});
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dmsans" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${readexPro.variable} ${kiteOne.variable} ${dmSans.variable}`}>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
