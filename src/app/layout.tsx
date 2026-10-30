import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/auth-context";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GameVerse — Premium Gaming Platform",
  description: "Challenge your friends. Compete against intelligent AI. Experience gaming without limits.",
  keywords: ["gaming", "multiplayer", "online games", "ludo", "snake and ladder", "tic tac toe", "card games", "racing"],
  openGraph: {
    title: "GameVerse — Premium Gaming Platform",
    description: "Your World. Your Games. Your Victory.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.variable} font-sans antialiased bg-black text-white`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
