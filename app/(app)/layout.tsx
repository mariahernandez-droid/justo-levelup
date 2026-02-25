"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import Link from "next/link";
import type { AuthChangeEvent, Session, SupabaseClient } from "@supabase/supabase-js";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [nickname, setNickname] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    const client = getSupabase();
    setSupabase(client);
  }, []);

  useEffect(() => {
    if (!supabase) return;

    let isMounted = true;

    const init = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data?.user) {
        router.replace("/login");
        return;
      }

      const user = data.user;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, nickname, avatar_url")
        .eq("id", user.id)
        .single();

      if (isMounted) {
        setRole(profile?.role || null);
        setNickname(profile?.nickname || null);
        setAvatar(profile?.avatar_url || null);
        setLoading(false);
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        if (!session?.user) {
          router.replace("/login");
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  const logout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.replace("/login");
  };

  if (loading) {
    return <div className="p-10">Cargando...</div>;
  }

  const menu = [
    { name: "Dashboard", path: "/dashboard", icon: "🏠" },
    { name: "Procesos", path: "/processes", icon: "📚" },
    { name: "Novedades", path: "/news", icon: "🔔" },
    { name: "Prompt SAC", path: "/prompt-sac", icon: "💬" },
    { name: "Perfil", path: "/profile", icon: "👤" },
  ];

  if (role === "admin") {
    menu.push({ name: "Admin", path: "/admin", icon: "⚙️" });
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100">
      <aside className="w-64 bg-white/70 backdrop-blur-xl shadow-2xl p-6 flex flex-col justify-between rounded-r-3xl">
        <div>
          <h1 className="text-2xl font-extrabold mb-10">🎮 LevelUp</h1>

          <nav className="space-y-3">
            {menu.map((item) => (
              <Link key={item.path} href={item.path}>
                <div
                  className={`p-3 rounded-xl cursor-pointer transition ${
                    pathname === item.path
                      ? "bg-indigo-600 text-white shadow-lg"
                      : "hover:bg-indigo-100"
                  }`}
                >
                  {item.icon} {item.name}
                </div>
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-10 border-t pt-6">
          <div className="flex items-center gap-3 mb-4">
            <img
              src={
                avatar ||
                "https://api.dicebear.com/7.x/adventurer/svg?seed=User"
              }
              className="w-12 h-12 rounded-full"
              alt="avatar"
            />
            <div>
              <p className="font-bold">{nickname || "Usuario"}</p>
              <p className="text-xs text-gray-500">{role}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full bg-gray-700 hover:bg-gray-800 text-white py-2 rounded-xl transition"
          >
            Salir
          </button>
        </div>
      </aside>

      <main className="flex-1 p-10 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}