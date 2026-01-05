import type { Metadata } from "next";
import { Cinzel, Lato } from "next/font/google"; // 👑 Royal Fonts
import "./globals.css";

// Configure Fonts
const cinzel = Cinzel({ subsets: ["latin"], variable: "--font-cinzel" });
const lato = Lato({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-lato" });

export const metadata: Metadata = {
  title: "Krishna AI",
  description: "Chat with the divine wisdom of Lord Krishna",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🪷</text></svg>"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${cinzel.variable} ${lato.variable} font-sans bg-stone-50`}>
        {children}
      </body>
    </html>
  );
}