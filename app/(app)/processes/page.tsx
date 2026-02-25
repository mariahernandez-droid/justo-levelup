"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface Process {
  id: string;
  title: string;
  category_id: string;
  published: boolean;
}

interface Category {
  id: string;
  name: string;
  icon?: string;
}

export default function ProcessesPage() {
  const router = useRouter();

  const [supabase, setSupabase] =
    useState<ReturnType<typeof getSupabase> | null>(null);

  const [processes, setProcesses] = useState<Process[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sb = getSupabase();
    setSupabase(sb);

    const loadData = async () => {
      const { data: userData } = await sb.auth.getUser();
      if (!userData.user) {
        router.push("/login");
        return;
      }

      const user = userData.user;

      const { data: processesData } = await sb
        .from("processes")
        .select("*")
        .eq("published", true);

      const { data: categoriesData } = await sb
        .from("categories")
        .select("*")
        .order("name");

      const { data: completions } = await sb
        .from("process_completions")
        .select("process_id")
        .eq("user_id", user.id);

      setProcesses((processesData as Process[]) || []);
      setCategories((categoriesData as Category[]) || []);
      setCompletedIds(
        completions?.map(
          (c: { process_id: string }) => c.process_id
        ) || []
      );

      setLoading(false);
    };

    loadData();
  }, [router]);

  if (loading || !supabase)
    return <p className="p-10">Cargando...</p>;

  let filteredProcesses = [...processes];

  if (search) {
    filteredProcesses = filteredProcesses.filter((p) =>
      p.title.toLowerCase().includes(search.toLowerCase())
    );
  }

  if (selectedCategory !== "all") {
    filteredProcesses = filteredProcesses.filter(
      (p) => p.category_id === selectedCategory
    );
  }

  if (statusFilter === "pending") {
    filteredProcesses = filteredProcesses.filter(
      (p) => !completedIds.includes(p.id)
    );
  }

  if (statusFilter === "completed") {
    filteredProcesses = filteredProcesses.filter(
      (p) => completedIds.includes(p.id)
    );
  }

  return (
    <main className="min-h-screen p-10 bg-gradient-to-br from-indigo-200 via-purple-200 to-pink-200">
      <div className="max-w-6xl mx-auto space-y-12">
        <h1 className="text-4xl font-bold">
          📚 Biblioteca de Procesos
        </h1>

        <div className="grid md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Buscar proceso..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="p-4 rounded-2xl shadow-md focus:outline-none focus:ring-2 focus:ring-purple-400"
          />

          <select
            value={selectedCategory}
            onChange={(e) =>
              setSelectedCategory(e.target.value)
            }
            className="p-4 rounded-2xl shadow-md"
          >
            <option value="all">
              Todas las categorías
            </option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon || "📂"} {cat.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
            className="p-4 rounded-2xl shadow-md"
          >
            <option value="all">Todos</option>
            <option value="pending">🔥 Pendientes</option>
            <option value="completed">
              ✅ Completados
            </option>
          </select>
        </div>

        {filteredProcesses.length === 0 && (
          <p className="text-gray-600">
            No se encontraron procesos.
          </p>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProcesses.map((process) => {
            const isCompleted =
              completedIds.includes(process.id);

            return (
              <div
                key={process.id}
                onClick={() =>
                  router.push(`/process/${process.id}`)
                }
                className="group cursor-pointer bg-white/70 backdrop-blur-xl rounded-3xl p-6 shadow-md hover:shadow-2xl transition-all hover:-translate-y-2"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold group-hover:text-purple-700 transition">
                      {process.title}
                    </h3>

                    <p className="text-sm text-gray-500 mt-1">
                      {
                        categories.find(
                          (c) =>
                            c.id === process.category_id
                        )?.name
                      }
                    </p>
                  </div>

                  {isCompleted ? (
                    <span className="text-green-600 text-sm font-semibold bg-green-100 px-3 py-1 rounded-full">
                      ✅
                    </span>
                  ) : (
                    <span className="text-orange-600 text-sm font-semibold bg-orange-100 px-3 py-1 rounded-full">
                      🔥
                    </span>
                  )}
                </div>

                <div className="mt-6 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      isCompleted
                        ? "bg-gradient-to-r from-green-400 to-green-600 w-full"
                        : "bg-gradient-to-r from-purple-400 to-pink-500 w-1/3"
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}