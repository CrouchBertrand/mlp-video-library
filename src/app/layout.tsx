import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MLP Video Library",
  description: "Marketplace Literacy Project educator and facilitator resource library",
  icons: {
    icon: "/placeholder.svg"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
