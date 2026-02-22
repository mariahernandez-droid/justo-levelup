"use client";

import { useRouter } from "next/navigation";

export default function AppHeader() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between mb-8">

      <div className="flex items-center gap-4">

        {/* Botón Volver */}
        <button
          onClick={() => router.back()}
          className="bg-white/70 backdrop-blur-md hover:bg-white text-gray-700 px-4 py-2 rounded-xl shadow transition"
        >
          ← Volver
        </button>

        {/* Botón Inicio */}
        <button
          onClick={() => router.push("/dashboard")}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl shadow transition"
        >
          🏠 Inicio
        </button>

      </div>

    </div>
  );
}
