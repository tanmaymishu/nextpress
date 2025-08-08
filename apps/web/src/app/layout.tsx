import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Express TS Starter - Web App",
  description: "Frontend for Express TypeScript Starter",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}