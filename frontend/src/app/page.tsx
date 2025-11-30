export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-b from-blue-50 to-white">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-blue-900 mb-4">
          Housler Pervichka
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Агрегатор первичной недвижимости Санкт-Петербурга
        </p>
        <div className="flex gap-4 justify-center">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-blue-600">12 000+</div>
            <div className="text-gray-500">квартир</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-blue-600">287</div>
            <div className="text-gray-500">жилых комплексов</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-blue-600">18</div>
            <div className="text-gray-500">районов</div>
          </div>
        </div>
        <p className="mt-8 text-sm text-gray-400">
          MVP в разработке • Данные из XML-фида
        </p>
      </div>
    </main>
  );
}
