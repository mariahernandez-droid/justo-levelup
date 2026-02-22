"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  };

  const handleRegister = async () => {
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
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: "http://localhost:3000/dashboard",
      },
    });
  };

  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-indigo-300 via-purple-300 to-pink-300">

      {/* Blobs decorativos */}
      <div className="absolute w-[500px] h-[500px] bg-purple-500 rounded-full blur-3xl opacity-30 -top-40 -left-40" />
      <div className="absolute w-[500px] h-[500px] bg-pink-500 rounded-full blur-3xl opacity-30 -bottom-40 -right-40" />

      <div className="relative backdrop-blur-2xl bg-white/30 p-12 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.25)] w-[440px] border border-white/40">

        {/* Título */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight">
            🎮 LevelUp
          </h1>
          <p className="text-gray-600 mt-2">
            Plataforma de capacitación interna
          </p>
        </div>

        <div className="space-y-5">

          {/* EMAIL */}
          <input
            type="email"
            placeholder="Correo corporativo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-4 rounded-xl bg-white/60 border border-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition shadow-inner"
          />

          {/* PASSWORD */}
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-4 rounded-xl bg-white/60 border border-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition shadow-inner"
          />

          {/* LOGIN */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3 rounded-xl shadow-lg transition transform hover:scale-[1.02] font-semibold"
          >
            {loading ? "Cargando..." : "Iniciar sesión"}
          </button>

          {/* REGISTER */}
          <button
            onClick={handleRegister}
            disabled={loading}
            className="w-full bg-gray-700 hover:bg-gray-800 text-white py-3 rounded-xl shadow transition font-semibold"
          >
            Crear cuenta
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 text-gray-500 text-sm">
            <div className="flex-1 h-[1px] bg-white/50"></div>
            o
            <div className="flex-1 h-[1px] bg-white/50"></div>
          </div>

          {/* GOOGLE */}
          <button
            onClick={handleGoogleLogin}
            className="w-full bg-white/80 backdrop-blur-md border border-white/50 hover:bg-white text-gray-700 py-3 rounded-xl shadow transition font-medium"
          >
            🔵 Iniciar sesión con Google
          </button>

        </div>

      </div>
    </main>
  );
}
