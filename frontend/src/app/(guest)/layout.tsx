import { Inter } from "next/font/google";
import "../globals.css";
import { GuestProviders } from "@/components/guest/GuestProviders";
import { HeaderGuest } from "@/components/guest/HeaderGuest";
import { FooterGuest } from "@/components/guest/FooterGuest";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600"],
});

export const metadata = {
  title: "Подборка квартир",
  description: "Персональная подборка квартир от вашего агента",
};

export default function GuestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className={`${inter.className} antialiased`}>
        <GuestProviders>
          <HeaderGuest />
          <main className="min-h-[calc(100vh-200px)]">{children}</main>
          <FooterGuest />
        </GuestProviders>
      </body>
    </html>
  );
}
