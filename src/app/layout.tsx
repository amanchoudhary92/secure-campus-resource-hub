import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Campus Resource Hub",
  description: "Secure academic resource sharing platform for college students.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
