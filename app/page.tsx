export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100">
      <div className="bg-white shadow-xl rounded-2xl p-10 text-center w-[400px]">
        <h1 className="text-3xl font-bold mb-4">
          Justo SAC – LevelUp 🚀
        </h1>
        <p className="text-gray-600 mb-6">
          Plataforma interna de capacitación y crecimiento.
        </p>
        <a
          href="/dashboard"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl transition"
        >
          Entrar al sistema
        </a>
      </div>
    </main>
  );
}
