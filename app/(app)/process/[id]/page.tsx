"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";

export default function ProcessDetail() {
  const { id } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [process, setProcess] = useState<any>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<any>({});
  const [score, setScore] = useState<number | null>(null);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // 🔹 Traer proceso
      const { data: processData } = await supabase
        .from("processes")
        .select("*")
        .eq("id", id)
        .single();

      setProcess(processData);

      // 🔹 Traer pasos
      const { data: stepsData } = await supabase
        .from("process_steps")
        .select("*")
        .eq("process_id", id)
        .order("step_order", { ascending: true });

      setSteps(stepsData || []);

      // 🔹 Traer preguntas
      const { data: questionsData } = await supabase
        .from("questions")
        .select("*")
        .eq("process_id", id);

      setQuestions(questionsData || []);

      setLoading(false);
    };

    loadData();
  }, [id, router]);

  const handleAnswer = (questionId: string, option: string) => {
    setAnswers({
      ...answers,
      [questionId]: option,
    });
  };

  const submitExam = async () => {
    let correct = 0;

    questions.forEach((q) => {
      if (answers[q.id] === q.correct_option) {
        correct++;
      }
    });

    const finalScore = Math.round(
      (correct / questions.length) * 100
    );

    setScore(finalScore);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    // 🔹 Guardar resultado
    await supabase.from("results").insert({
      user_email: user.email,
      process_id: id,
      score: finalScore,
    });

    // 🔥 Si aprueba, completar proceso
    if (finalScore >= 60) {
      await completeProcess(user.id);
    }
  };

  const completeProcess = async (userId: string) => {
    const { data: existing } = await supabase
      .from("process_completions")
      .select("*")
      .eq("user_id", userId)
      .eq("process_id", id)
      .maybeSingle();

    if (!existing) {
      await supabase.from("process_completions").insert({
        user_id: userId,
        process_id: id,
      });

      const { data: profile } = await supabase
        .from("profiles")
        .select("points")
        .eq("id", userId)
        .single();

      const currentPoints = profile?.points || 0;

      await supabase
        .from("profiles")
        .update({ points: currentPoints + 10 })
        .eq("id", userId);
    }

    setCompleted(true);
  };

  const renderMedia = (url: string) => {
    if (!url) return null;

    const lower = url.toLowerCase();

    if (
      lower.endsWith(".mp4") ||
      lower.endsWith(".webm") ||
      lower.endsWith(".mov")
    ) {
      return (
        <video
          src={url}
          controls
          className="rounded-xl max-h-96 w-full mt-4"
        />
      );
    }

    return (
      <img
        src={url}
        alt="media"
        className="rounded-xl max-h-96 w-full mt-4 object-contain"
      />
    );
  };

  if (loading) return <p className="p-10">Cargando...</p>;

  return (
    <main className="min-h-screen p-10 bg-gray-50">
      <div className="max-w-4xl mx-auto space-y-10">

        <h1 className="text-4xl font-bold">
          {process?.title}
        </h1>

        {/* PASOS */}
        {steps.map((step, index) => (
          <div
            key={step.id}
            className="bg-white p-6 rounded-2xl shadow-md"
          >
            <h3 className="font-bold mb-2">
              Paso {index + 1}
            </h3>

            <p>{step.content}</p>

            {renderMedia(step.media_url)}
          </div>
        ))}

        {/* EXAMEN */}
        {questions.length > 0 && (
          <div className="bg-white p-6 rounded-2xl shadow-md space-y-6">
            <h2 className="text-2xl font-bold">
              🧠 Evaluación
            </h2>

            {questions.map((q) => (
              <div key={q.id}>
                <p className="font-semibold mb-2">
                  {q.question}
                </p>

                {["A", "B", "C"].map((opt) => (
                  <button
                    key={opt}
                    onClick={() =>
                      handleAnswer(q.id, opt)
                    }
                    className={`block w-full text-left p-2 rounded-lg mb-2 transition ${
                      answers[q.id] === opt
                        ? "bg-purple-200"
                        : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    {opt}){" "}
                    {q[`option_${opt.toLowerCase()}`]}
                  </button>
                ))}
              </div>
            ))}

            <button
              onClick={submitExam}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl"
            >
              Enviar Evaluación
            </button>

            {score !== null && (
              <p className="text-lg font-bold">
                Resultado: {score}%
              </p>
            )}

            {completed && (
              <p className="text-green-600 font-bold">
                ✅ Proceso completado
              </p>
            )}
          </div>
        )}

      </div>
    </main>
  );
}