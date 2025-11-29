import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "Housler - Агрегатор новостроек СПб",
  description: "Поиск квартир в новостройках Санкт-Петербурга",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${inter.className} antialiased`}>
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <a href="/" className="text-xl font-bold text-blue-600">
              Housler
            </a>
            <nav className="flex gap-4">
              <a href="/offers" className="text-gray-600 hover:text-gray-900">
                Квартиры
              </a>
              <a href="/complexes" className="text-gray-600 hover:text-gray-900">
                ЖК
              </a>
              <a href="/login" className="text-blue-600 hover:text-blue-800 font-medium">
                Войти
              </a>
            </nav>
          </div>
        </header>
        <main className="min-h-[calc(100vh-140px)]">{children}</main>
        <footer className="bg-gray-100 border-t">
          <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-500 text-sm">
            Housler © 2024 — Агрегатор новостроек Санкт-Петербурга
          </div>
        </footer>
      </body>
    </html>
  );
}
