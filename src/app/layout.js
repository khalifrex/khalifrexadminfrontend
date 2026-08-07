import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import MarketplaceParam from "@/component/MarketplaceParam";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Khalifrex Admin",
  description: "Khalifrex marketplace administration",
  icons: {
    icon: "https://res.cloudinary.com/khalifrex/image/upload/v1784754991/khalifrex-avatar_nwfkqg.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <MarketplaceParam />
        {children}
      </body>
    </html>
  );
}
