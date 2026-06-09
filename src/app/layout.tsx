import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Logistics AI Dashboard — Shipment Tracking & Route Optimization",
  description:
    "Portfolio demo: AI-powered logistics dashboard for shipment tracking, route optimization, carrier management, and freight analytics.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
