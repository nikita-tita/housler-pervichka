import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/Header";
import { CompareFloatingBar } from "@/components/CompareFloatingBar";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Housler Первичка - Новостройки СПб",
  description: "Поиск квартир в новостройках Санкт-Петербурга. Актуальные цены от застройщиков, удобные фильтры.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${inter.className} antialiased`}>
        <Providers>
          <Header />
          <main className="min-h-[calc(100vh-200px)]">{children}</main>
          <CompareFloatingBar />

        {/* Footer */}
        <footer className="py-16 border-t border-[var(--color-border)]">
          <div className="container">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-8">
              <div>
                <div className="text-xl font-semibold tracking-tight mb-2">HOUSLER</div>
                <div className="text-sm text-[var(--color-text-light)]">
                  Агрегатор новостроек Санкт-Петербурга
                </div>
              </div>
              <div className="grid grid-cols-3 gap-12 text-center">
                <div>
                  <div className="text-xs font-semibold text-[var(--color-text-light)] uppercase tracking-wider mb-3">
                    EMAIL
                  </div>
                  <a
                    href="mailto:hello@housler.ru"
                    className="text-[15px] font-medium hover:text-[var(--color-accent)]"
                  >
                    hello@housler.ru
                  </a>
                </div>
                <div>
                  <div className="text-xs font-semibold text-[var(--color-text-light)] uppercase tracking-wider mb-3">
                    ТЕЛЕФОН
                  </div>
                  <a
                    href="tel:+79110295520"
                    className="text-[15px] font-medium hover:text-[var(--color-accent)]"
                  >
                    +7 (911) 029-55-20
                  </a>
                </div>
                <div>
                  <div className="text-xs font-semibold text-[var(--color-text-light)] uppercase tracking-wider mb-3">
                    TELEGRAM
                  </div>
                  <a
                    href="https://t.me/housler_spb"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[15px] font-medium hover:text-[var(--color-accent)]"
                  >
                    @housler_spb
                  </a>
                </div>
              </div>
            </div>
            <div className="pt-6 border-t border-[var(--color-border)] text-center">
              <p className="text-[13px] text-[var(--color-text-light)]">
                © {new Date().getFullYear()} Housler — Все права защищены
              </p>
            </div>
          </div>
        </footer>
        </Providers>
      </body>
    </html>
  );
}
