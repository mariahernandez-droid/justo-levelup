"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { getSupabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";

export default function Login() {
  const router = useRouter();

  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔥 Crear cliente solo en cliente
  useEffect(() => {
    const client = getSupabase();
    setSupabase(client);
  }, []);

  const handleLogin = async () => {
    if (!supabase) return;
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    if (!data?.session) {
      alert("No se pudo crear sesión.");
      setLoading(false);
      return;
    }

    router.replace("/dashboard");
  };

  const handleRegister = async () => {
    if (!supabase) return;
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    alert("Usuario creado 🎉 Ahora inicia sesión");
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    if (!supabase) return;
    setLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      alert(error.message);
      setLoading(false);
    }
  };

  if (!supabase) {
    return <div className="p-10">Cargando...</div>;
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-300 via-purple-300 to-pink-300">
      <div className="backdrop-blur-2xl bg-white/30 p-12 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.25)] w-[440px] border border-white/40">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-gray-800">
            🎮 LevelUp
          </h1>
          <p className="text-gray-600 mt-2">
            Plataforma de capacitación interna
          </p>
        </div>

        <div className="space-y-5">
          <input
            type="email"
            placeholder="Correo corporativo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-4 rounded-xl bg-white/60 border border-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-4 rounded-xl bg-white/60 border border-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl shadow-lg font-semibold"
          >
            {loading ? "Cargando..." : "Iniciar sesión"}
          </button>

          <button
            onClick={handleRegister}
            disabled={loading}
            className="w-full bg-gray-700 text-white py-3 rounded-xl font-semibold"
          >
            Crear cuenta
          </button>

          <div className="flex items-center gap-4 text-gray-500 text-sm">
            <div className="flex-1 h-[1px] bg-white/50"></div>
            o
            <div className="flex-1 h-[1px] bg-white/50"></div>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full bg-white border border-white/50 text-gray-700 py-3 rounded-xl font-medium"
          >
            🔵 Iniciar sesión con Google
          </button>
        </div>
      </div>
    </main>
  );
}