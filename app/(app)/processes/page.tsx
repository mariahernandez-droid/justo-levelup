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

  // 🔵 Agrupar procesos por categoría
  const groupedProcesses: Record<string, Process[]> = {};

  filteredProcesses.forEach((process) => {
    if (!groupedProcesses[process.category_id]) {
      groupedProcesses[process.category_id] = [];
    }
    groupedProcesses[process.category_id].push(process);
  });

  return (
    <main className="min-h-screen p-10 bg-gradient-to-br from-indigo-200 via-purple-200 to-pink-200">
      <div className="max-w-6xl mx-auto space-y-12">

        <h1 className="text-4xl font-bold">
          📚 Biblioteca de Procesos
        </h1>

        {/* filtros */}

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

        {/* categorías */}

        {Object.entries(groupedProcesses).map(
          ([categoryId, processes]) => {

            const category = categories.find(
              (c) => c.id === categoryId
            );

            const completedCount = processes.filter((p) =>
              completedIds.includes(p.id)
            ).length;

            const progress = Math.round(
              (completedCount / processes.length) * 100
            );

            return (
              <div
                key={categoryId}
                className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl shadow-xl"
              >

                {/* header categoría */}

                <div className="flex justify-between items-center mb-6">

                  <h2 className="text-2xl font-bold">
                    {category?.icon || "📂"} {category?.name}
                  </h2>

                  <span className="text-sm font-semibold text-purple-700">
                    {progress}%
                  </span>

                </div>

                {/* barra progreso */}

                <div className="w-full h-3 bg-gray-200 rounded-full mb-8 overflow-hidden">
                  <div
                    className="h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {/* procesos */}

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

                  {processes.map((process) => {

                    const isCompleted =
                      completedIds.includes(process.id);

                    return (
                      <div
                        key={process.id}
                        onClick={() =>
                          router.push(`/process/${process.id}`)
                        }
                        className="group cursor-pointer bg-white rounded-2xl p-5 shadow-md hover:shadow-xl transition-all hover:-translate-y-1"
                      >

                        <div className="flex justify-between items-start">

                          <h3 className="font-bold group-hover:text-purple-700">
                            {process.title}
                          </h3>

                          {isCompleted ? (
                            <span className="text-green-600 text-sm">
                              ✅
                            </span>
                          ) : (
                            <span className="text-orange-500 text-sm">
                              🔥
                            </span>
                          )}

                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }
        )}
      </div>
    </main>
  );
}