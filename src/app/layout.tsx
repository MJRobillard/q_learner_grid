import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Q-Learning Grid World | Interactive AI Learning Simulation",
  description: "Explore Q-Learning algorithms through an interactive grid world simulation. Watch an AI agent learn optimal paths while avoiding hazards and reaching goals. Perfect for understanding reinforcement learning concepts.",
  keywords: ["Q-Learning", "Reinforcement Learning", "AI", "Machine Learning", "Grid World", "Simulation", "Interactive Learning"],
  authors: [{ name: "Q-Learning Grid World" }],
  creator: "Q-Learning Grid World",
  publisher: "Q-Learning Grid World",
  robots: "index, follow",
  openGraph: {
    title: "Q-Learning Grid World | Interactive AI Learning Simulation",
    description: "Explore Q-Learning algorithms through an interactive grid world simulation. Watch an AI agent learn optimal paths while avoiding hazards and reaching goals.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Q-Learning Grid World | Interactive AI Learning Simulation",
    description: "Explore Q-Learning algorithms through an interactive grid world simulation.",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", sizes: "any", type: "image/svg+xml" },
      { url: "/icon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
