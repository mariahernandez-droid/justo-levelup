"use client";
export const dynamic = "force-dynamic";

import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  // 🔥 Crear cliente solo en cliente
  useEffect(() => {
    const client = getSupabase();
    setSupabase(client);
  }, []);

  useEffect(() => {
    if (!supabase) return;

    const getUser = async () => {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        router.push("/login");
        return;
      }

      setEmail(data.user.email || null);
    };

    getUser();
  }, [supabase, router]);

  const logout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (!supabase) {
    return <div className="p-10">Cargando...</div>;
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100">

      {/* SIDEBAR */}
      <aside className="w-64 bg-white/70 backdrop-blur-xl border-r border-white/40 shadow-xl p-6 flex flex-col justify-between">

        <div>
          <h1 className="text-2xl font-bold mb-10">🎮 LevelUp</h1>

          <nav className="space-y-4">

            <button
              onClick={() => router.push("/dashboard")}
              className="w-full text-left px-4 py-3 rounded-xl hover:bg-indigo-100 transition"
            >
              🏠 Dashboard
            </button>

            <button
              onClick={() => router.push("/processes")}
              className="w-full text-left px-4 py-3 rounded-xl hover:bg-indigo-100 transition"
            >
              📚 Mis Procesos
            </button>

            <button
              onClick={() => router.push("/news")}
              className="w-full text-left px-4 py-3 rounded-xl hover:bg-indigo-100 transition"
            >
              🔔 Novedades
            </button>

            <button
              onClick={() => router.push("/ranking")}
              className="w-full text-left px-4 py-3 rounded-xl hover:bg-indigo-100 transition"
            >
              🏆 Ranking
            </button>

            <button
              onClick={() => router.push("/admin")}
              className="w-full text-left px-4 py-3 rounded-xl hover:bg-red-100 transition"
            >
              ⚙️ Admin
            </button>

          </nav>
        </div>

        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            {email}
          </div>

          <button
            onClick={logout}
            className="w-full bg-gray-700 hover:bg-gray-800 text-white py-2 rounded-xl transition"
          >
            Salir
          </button>
        </div>

      </aside>

      {/* CONTENIDO */}
      <main className="flex-1 p-10">
        {children}
      </main>

    </div>
  );
}