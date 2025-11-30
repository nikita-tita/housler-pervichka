import Link from "next/link";

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="py-24 md:py-32 text-center">
        <div className="container">
          <h1 className="text-4xl md:text-6xl font-semibold tracking-tight leading-tight mb-4">
            Квартиры в новостройках СПб.
          </h1>
          <p className="text-xl md:text-2xl font-light mb-6">
            Актуальные цены от застройщиков
          </p>
          <p className="text-lg text-[var(--color-text-light)] mb-12 max-w-2xl mx-auto">
            12 000+ квартир, ежедневное обновление данных, все районы города
          </p>
          <div className="flex gap-4 justify-center flex-col sm:flex-row">
            <Link href="/offers" className="btn btn-primary">
              Смотреть квартиры
            </Link>
            <Link href="/complexes" className="btn btn-secondary">
              Жилые комплексы
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Filters */}
      <section className="section section-gray">
        <div className="container">
          <h2 className="section-title">Быстрый поиск</h2>
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Link
                href="/offers?rooms=1"
                className="card p-6 text-center hover:translate-y-[-2px]"
              >
                <div className="text-2xl font-semibold mb-2">1</div>
                <div className="text-[var(--color-text-light)] text-sm">комната</div>
              </Link>
              <Link
                href="/offers?rooms=2"
                className="card p-6 text-center hover:translate-y-[-2px]"
              >
                <div className="text-2xl font-semibold mb-2">2</div>
                <div className="text-[var(--color-text-light)] text-sm">комнаты</div>
              </Link>
              <Link
                href="/offers?rooms=3"
                className="card p-6 text-center hover:translate-y-[-2px]"
              >
                <div className="text-2xl font-semibold mb-2">3</div>
                <div className="text-[var(--color-text-light)] text-sm">комнаты</div>
              </Link>
              <Link
                href="/offers?is_studio=true"
                className="card p-6 text-center hover:translate-y-[-2px]"
              >
                <div className="text-2xl font-semibold mb-2">S</div>
                <div className="text-[var(--color-text-light)] text-sm">студии</div>
              </Link>
            </div>

            {/* Price Range Buttons */}
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                href="/offers?price_max=5000000"
                className="btn btn-secondary btn-sm"
              >
                до 5 млн
              </Link>
              <Link
                href="/offers?price_min=5000000&price_max=10000000"
                className="btn btn-secondary btn-sm"
              >
                5–10 млн
              </Link>
              <Link
                href="/offers?price_min=10000000&price_max=15000000"
                className="btn btn-secondary btn-sm"
              >
                10–15 млн
              </Link>
              <Link
                href="/offers?price_min=15000000"
                className="btn btn-secondary btn-sm"
              >
                от 15 млн
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">Что вы получаете</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="card p-8">
              <h3 className="text-lg font-semibold mb-3">Только первичка</h3>
              <p className="text-[var(--color-text-light)] text-[15px] leading-relaxed">
                Все квартиры напрямую от застройщиков, без посредников и наценок.
              </p>
            </div>
            <div className="card p-8">
              <h3 className="text-lg font-semibold mb-3">Актуальные данные</h3>
              <p className="text-[var(--color-text-light)] text-[15px] leading-relaxed">
                Цены и наличие обновляются ежедневно из официальных фидов застройщиков.
              </p>
            </div>
            <div className="card p-8">
              <h3 className="text-lg font-semibold mb-3">Удобные фильтры</h3>
              <p className="text-[var(--color-text-light)] text-[15px] leading-relaxed">
                Евро-планировки, метро, районы, отделка — все параметры под рукой.
              </p>
            </div>
            <div className="card p-8">
              <h3 className="text-lg font-semibold mb-3">Без регистрации</h3>
              <p className="text-[var(--color-text-light)] text-[15px] leading-relaxed">
                Смотрите цены и планировки без обязательной регистрации и звонков.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section section-gray text-center">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-6">
            Готовы начать поиск?
          </h2>
          <p className="text-lg text-[var(--color-text-light)] mb-10 max-w-xl mx-auto">
            Найдите идеальную квартиру в новостройке за несколько минут
          </p>
          <Link href="/offers" className="btn btn-primary btn-lg">
            Перейти к поиску
          </Link>
        </div>
      </section>
    </>
  );
}
