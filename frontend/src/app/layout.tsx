import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Housler Pervichka",
  description: "Агрегатор первичной недвижимости СПб",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
