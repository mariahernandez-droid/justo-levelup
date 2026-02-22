"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";

export default function Exam() {
  const { id } = useParams();
  const router = useRouter();

  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        router.push("/login");
        return;
      }

      setUser(userData.user);

      const { data } = await supabase
        .from("questions")
        .select("*")
        .eq("process_id", id);

      if (data) setQuestions(data);

      setLoading(false);
    };

    init();
  }, [id]);

  const handleSelect = (questionId: string, option: string) => {
    setAnswers({ ...answers, [questionId]: option });
  };

  const finishExam = async () => {
    let correct = 0;

    questions.forEach((q) => {
      if (answers[q.id] === q.correct_option) {
        correct++;
      }
    });

    const score = Math.round((correct / questions.length) * 100);

    // 🔹 Guardar resultado
    await supabase.from("results").insert({
      user_email: user.email,
      process_id: id,
      score,
    });

    if (score >= 60) {

      // 🔹 Guardar completion (evitar duplicados)
      const { data: existingCompletion } = await supabase
        .from("process_completions")
        .select("*")
        .eq("user_id", user.id)
        .eq("process_id", id)
        .single();

      if (!existingCompletion) {
        await supabase.from("process_completions").insert({
          user_id: user.id,
          process_id: id,
        });
      }

      // 🔹 Actualizar racha
      const today = new Date().toISOString().split("T")[0];

      const { data: profile } = await supabase
        .from("profiles")
        .select("streak, last_activity")
        .eq("id", user.id)
        .single();

      if (profile) {
        let newStreak = profile.streak || 0;

        if (!profile.last_activity) {
          newStreak = 1;
        } else {
          const lastDate = new Date(profile.last_activity);
          const diffDays =
            (new Date(today).getTime() - lastDate.getTime()) /
            (1000 * 60 * 60 * 24);

          if (diffDays === 1) newStreak += 1;
          else if (diffDays > 1) newStreak = 1;
        }

        await supabase.from("profiles").update({
          streak: newStreak,
          last_activity: today,
        }).eq("id", user.id);
      }

      // 🔹 Verificar categoría
      const { data: process } = await supabase
        .from("processes")
        .select("category_id")
        .eq("id", id)
        .single();

      if (process?.category_id) {

        const { data: categoryProcesses } = await supabase
          .from("processes")
          .select("id")
          .eq("category_id", process.category_id);

        const processIds = categoryProcesses?.map(p => p.id) || [];

        const { data: completions } = await supabase
          .from("process_completions")
          .select("process_id")
          .eq("user_id", user.id);

        const completedIds = completions?.map(c => c.process_id) || [];

        const completedCount = processIds.filter(id =>
          completedIds.includes(id)
        ).length;

        if (completedCount === processIds.length) {

          // 🔹 Evitar duplicar insignia
          const { data: existingBadge } = await supabase
            .from("user_badges")
            .select("*")
            .eq("user_id", user.id)
            .eq("category_id", process.category_id)
            .single();

          if (!existingBadge) {
            await supabase.from("user_badges").insert({
              user_id: user.id,
              category_id: process.category_id,
            });
          }
        }
      }
    }

    alert(`Tu puntaje fue: ${score}%`);
    router.push("/dashboard");
  };

  if (loading) {
    return <p className="p-10">Cargando examen...</p>;
  }

  return (
    <main className="p-10 min-h-screen">

      <div className="max-w-3xl mx-auto space-y-8">

        <h1 className="text-3xl font-bold">
          🧠 Mini Examen
        </h1>

        {questions.map((q, index) => (
          <div
            key={q.id}
            className="bg-white p-6 rounded-2xl shadow-md"
          >
            <p className="font-semibold mb-4">
              {index + 1}. {q.question}
            </p>

            {["A", "B", "C"].map((option) => (
              <button
                key={option}
                onClick={() => handleSelect(q.id, option)}
                className={`block w-full text-left p-3 rounded-xl mb-2 border ${
                  answers[q.id] === option
                    ? "bg-purple-200 border-purple-500"
                    : "bg-gray-50"
                }`}
              >
                {q[`option_${option.toLowerCase()}`]}
              </button>
            ))}
          </div>
        ))}

        <button
          onClick={finishExam}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-2xl"
        >
          Finalizar Examen
        </button>

      </div>

    </main>
  );
}
