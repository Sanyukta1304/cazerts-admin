import type { Metadata } from "next";
import { Poppins, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: "CAZERTS Admin",
  description: "Internal admin dashboard for CAZERTS stores.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} ${jakarta.variable} antialiased`}>
        <span className="fixed top-4 right-5 z-[9999] font-display font-extrabold text-xl text-black tracking-tight pointer-events-none select-none">
          RelogFoods
        </span>
        {children}
      </body>
    </html>
  );
}