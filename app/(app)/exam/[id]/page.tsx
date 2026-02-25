"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";

interface Question {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  correct_option: string;
}

interface User {
  id: string;
  email: string;
}

export default function Exam() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [supabase, setSupabase] = useState<ReturnType<typeof getSupabase> | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!id) return;

    const sb = getSupabase();
    setSupabase(sb);

    const init = async () => {
      const { data: userData } = await sb.auth.getUser();

      if (!userData.user) {
        router.push("/login");
        return;
      }

      setUser({
        id: userData.user.id,
        email: userData.user.email || "",
      });

      const { data } = await sb
        .from("questions")
        .select("*")
        .eq("process_id", id);

      if (data) {
        setQuestions(data);
      }

      setLoading(false);
    };

    init();
  }, [id, router]);

  const handleSelect = (questionId: string, option: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }));
  };

  const finishExam = async () => {
    if (!supabase || !user) return;

    let correct = 0;

    questions.forEach((q) => {
      if (answers[q.id] === q.correct_option) {
        correct++;
      }
    });

    const score =
      questions.length > 0
        ? Math.round((correct / questions.length) * 100)
        : 0;

    await supabase.from("results").insert({
      user_email: user.email,
      process_id: id,
      score,
    });

    if (score >= 60) {
      const { data: existingCompletion } = await supabase
        .from("process_completions")
        .select("*")
        .eq("user_id", user.id)
        .eq("process_id", id)
        .maybeSingle();

      if (!existingCompletion) {
        await supabase.from("process_completions").insert({
          user_id: user.id,
          process_id: id,
        });
      }

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

        await supabase
          .from("profiles")
          .update({
            streak: newStreak,
            last_activity: today,
          })
          .eq("id", user.id);
      }

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

        const processIds =
          categoryProcesses?.map((p: { id: string }) => p.id) || [];

        const { data: completions } = await supabase
          .from("process_completions")
          .select("process_id")
          .eq("user_id", user.id);

        const completedIds =
          completions?.map(
            (c: { process_id: string }) => c.process_id
          ) || [];

        const completedCount = processIds.filter((pid) =>
          completedIds.includes(pid)
        ).length;

        if (completedCount === processIds.length) {
          const { data: existingBadge } = await supabase
            .from("user_badges")
            .select("*")
            .eq("user_id", user.id)
            .eq("category_id", process.category_id)
            .maybeSingle();

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

  if (loading || !supabase) {
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
                {
                  q[
                    `option_${option.toLowerCase()}` as keyof Question
                  ] as string
                }
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