import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bubble Trace - Requirements Traceability Map",
  description: "Visual requirements traceability mapping tool",
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
