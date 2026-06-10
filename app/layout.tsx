import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Real Estate Case Tracker",
  description: "Property transaction dashboard powered by a Bedrock Agent",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
