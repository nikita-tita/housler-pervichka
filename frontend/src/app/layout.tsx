import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

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
        {/* Navigation */}
        <nav className="py-8 border-b border-[var(--color-border)] bg-white">
          <div className="container">
            <div className="flex justify-between items-center">
              <Link href="/" className="text-xl font-semibold tracking-tight">
                HOUSLER
              </Link>
              <div className="hidden md:flex gap-10">
                <Link
                  href="/offers"
                  className="text-[15px] font-medium transition-colors hover:text-[var(--color-text-light)]"
                >
                  Квартиры
                </Link>
                <Link
                  href="/complexes"
                  className="text-[15px] font-medium transition-colors hover:text-[var(--color-text-light)]"
                >
                  Жилые комплексы
                </Link>
                <Link
                  href="/districts"
                  className="text-[15px] font-medium transition-colors hover:text-[var(--color-text-light)]"
                >
                  Районы
                </Link>
              </div>
              {/* Mobile menu button */}
              <button className="md:hidden flex flex-col gap-1.5 p-2">
                <span className="w-6 h-0.5 bg-[var(--color-text)]"></span>
                <span className="w-6 h-0.5 bg-[var(--color-text)]"></span>
                <span className="w-6 h-0.5 bg-[var(--color-text)]"></span>
              </button>
            </div>
          </div>
        </nav>

        <main className="min-h-[calc(100vh-200px)]">{children}</main>

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
      </body>
    </html>
  );
}
