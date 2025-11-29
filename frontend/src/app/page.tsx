import Link from "next/link";

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <section className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-4">
          Найдите квартиру в новостройке
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          12 000+ квартир от застройщиков Санкт-Петербурга
        </p>
        <Link
          href="/offers"
          className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition"
        >
          Смотреть все квартиры
        </Link>
      </section>

      <section className="grid md:grid-cols-3 gap-8">
        <div className="p-6 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Только первичка</h3>
          <p className="text-gray-600">
            Все квартиры напрямую от застройщиков, без посредников
          </p>
        </div>
        <div className="p-6 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Актуальные данные</h3>
          <p className="text-gray-600">
            Цены и наличие обновляются ежедневно из официальных фидов
          </p>
        </div>
        <div className="p-6 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Удобные фильтры</h3>
          <p className="text-gray-600">
            Евро-планировки, метро, районы, отделка — всё под рукой
          </p>
        </div>
      </section>
    </div>
  );
}
