// src/app/layout.tsx
import "./globals.css";
import ClientLayout from "./Components/ClientLayout.js";
import { Montserrat, Space_Grotesk, Share_Tech_Mono, Michroma, Kite_One, Golos_Text, DM_Sans, Cal_Sans, Readex_Pro, Varela } from "next/font/google";

// Example: load Montserrat + Space Grotesk + others
const varela = Varela({ subsets: ["latin"], variable: "--font-varela", weight: "400" });
const readexPro = Readex_Pro({ subsets: ["latin"], variable: "--font-readexpro", weight: "400" });
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });
const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-grotesk" });
const shareTech = Share_Tech_Mono({
  subsets: ["latin"], variable: "--font-sharetech",
  weight: "400"
});
const michroma = Michroma({
  subsets: ["latin"], variable: "--font-michroma",
  weight: "400"
});
const kiteOne = Kite_One({
  subsets: ["latin"], variable: "--font-kiteone",
  weight: "400"
});
const golos = Golos_Text({ subsets: ["latin"], variable: "--font-golos" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dmsans" });
const calSans = Cal_Sans({
  subsets: ["latin"], variable: "--font-calsans",
  weight: "400"
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${readexPro.variable} ${varela.variable} ${montserrat.variable} ${grotesk.variable} ${shareTech.variable} ${michroma.variable} ${kiteOne.variable} ${golos.variable} ${dmSans.variable} ${calSans.variable}`}>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
