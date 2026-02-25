"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";

export default function Admin() {
  const supabase = getSupabase();

  const [categories, setCategories] = useState<any[]>([]);
  const [processes, setProcesses] = useState<any[]>([]);

  const [categoryName, setCategoryName] = useState("");
  const [categoryIcon, setCategoryIcon] = useState("");

  const [title, setTitle] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [steps, setSteps] = useState<
    { content: string; file: File | null }[]
  >([]);

  const [selectedProcessForQuestion, setSelectedProcessForQuestion] =
    useState("");
  const [question, setQuestion] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [correctOption, setCorrectOption] = useState("");

  useEffect(() => {
    if (!supabase) return;

    loadCategories();
    loadProcesses();
  }, [supabase]);

  const loadCategories = async () => {
    if (!supabase) return;

    const { data } = await supabase.from("categories").select("*");
    if (data) setCategories(data);
  };

  const loadProcesses = async () => {
    if (!supabase) return;

    const { data } = await supabase
      .from("processes")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setProcesses(data);
  };

  const createCategory = async () => {
    if (!supabase) return;

    await supabase.from("categories").insert({
      name: categoryName,
      badge_icon: categoryIcon,
    });

    setCategoryName("");
    setCategoryIcon("");
    loadCategories();
  };

  const addStep = () => {
    setSteps([...steps, { content: "", file: null }]);
  };

  const updateStep = (
    index: number,
    field: "content" | "file",
    value: any
  ) => {
    const updated = [...steps];
    updated[index][field] = value;
    setSteps(updated);
  };

  const createProcess = async () => {
    if (!supabase) return;

    const { data: newProcess } = await supabase
      .from("processes")
      .insert({
        title,
        category_id: selectedCategory,
      })
      .select()
      .single();

    if (!newProcess) return;

    for (let i = 0; i < steps.length; i++) {
      let mediaUrl = null;

      if (steps[i].file) {
        const fileName = `${Date.now()}-${steps[i].file!.name}`;

        await supabase.storage
          .from("process-media")
          .upload(fileName, steps[i].file!);

        const { data } = supabase.storage
          .from("process-media")
          .getPublicUrl(fileName);

        mediaUrl = data.publicUrl;
      }

      await supabase.from("process_steps").insert({
        process_id: newProcess.id,
        step_order: i + 1,
        content: steps[i].content,
        media_url: mediaUrl,
      });
    }

    setTitle("");
    setSteps([]);
    setSelectedCategory("");
    loadProcesses();
  };

  const togglePublish = async (id: string, current: boolean) => {
    if (!supabase) return;

    await supabase
      .from("processes")
      .update({ published: !current })
      .eq("id", id);

    loadProcesses();
  };

  const deleteProcess = async (id: string) => {
    if (!supabase) return;

    await supabase.from("processes").delete().eq("id", id);
    loadProcesses();
  };

  const createQuestion = async () => {
    if (!supabase) return;

    await supabase.from("questions").insert({
      process_id: selectedProcessForQuestion,
      question,
      option_a: optionA,
      option_b: optionB,
      option_c: optionC,
      correct_option: correctOption,
    });

    setQuestion("");
    setOptionA("");
    setOptionB("");
    setOptionC("");
    setCorrectOption("");
  };

  return (
    <main className="p-10 space-y-16">
      <h1 className="text-3xl font-bold">
        ⚙️ Panel Admin Completo
      </h1>

      {/* CATEGORÍAS */}
      <div className="bg-white p-6 rounded-2xl shadow space-y-4">
        <h2 className="font-bold text-xl">
          📂 Crear Categoría
        </h2>

        <input
          placeholder="Nombre"
          value={categoryName}
          onChange={(e) => setCategoryName(e.target.value)}
          className="w-full p-3 border rounded-xl"
        />

        <input
          placeholder="Icono (Ej: 🧠)"
          value={categoryIcon}
          onChange={(e) => setCategoryIcon(e.target.value)}
          className="w-full p-3 border rounded-xl"
        />

        <button
          onClick={createCategory}
          className="bg-indigo-600 text-white px-6 py-2 rounded-xl"
        >
          Crear Categoría
        </button>
      </div>

      {/* CREAR PROCESO */}
      <div className="bg-white p-6 rounded-2xl shadow space-y-6">
        <h2 className="font-bold text-xl">
          📚 Crear Proceso
        </h2>

        <input
          placeholder="Título"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-3 border rounded-xl"
        />

        <select
          value={selectedCategory}
          onChange={(e) =>
            setSelectedCategory(e.target.value)
          }
          className="w-full p-3 border rounded-xl"
        >
          <option value="">
            Selecciona categoría
          </option>
          {categories.map((cat: any) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        {steps.map((step, index) => (
          <div
            key={index}
            className="bg-gray-100 p-4 rounded-xl"
          >
            <textarea
              placeholder={`Paso ${index + 1}`}
              value={step.content}
              onChange={(e) =>
                updateStep(
                  index,
                  "content",
                  e.target.value
                )
              }
              className="w-full p-3 border rounded-xl"
            />
            <input
              type="file"
              onChange={(e) =>
                updateStep(
                  index,
                  "file",
                  e.target.files?.[0] || null
                )
              }
            />
          </div>
        ))}

        <button
          onClick={addStep}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl"
        >
          + Agregar Paso
        </button>

        <button
          onClick={createProcess}
          className="bg-green-600 text-white px-6 py-2 rounded-xl"
        >
          Crear Proceso
        </button>
      </div>

      {/* LISTA PROCESOS */}
      <div className="space-y-4">
        <h2 className="font-bold text-xl">
          📄 Procesos
        </h2>

        {processes.map((p: any) => (
          <div
            key={p.id}
            className="bg-white p-4 rounded-xl shadow flex justify-between"
          >
            <div>
              <p className="font-bold">
                {p.title}
              </p>
              <p className="text-sm text-gray-500">
                {p.published
                  ? "Publicado"
                  : "Borrador"}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() =>
                  togglePublish(
                    p.id,
                    p.published
                  )
                }
                className="bg-yellow-500 text-white px-3 py-1 rounded-lg"
              >
                {p.published
                  ? "Despublicar"
                  : "Publicar"}
              </button>

              <button
                onClick={() =>
                  deleteProcess(p.id)
                }
                className="bg-red-600 text-white px-3 py-1 rounded-lg"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* PREGUNTAS */}
      <div className="bg-white p-6 rounded-2xl shadow space-y-4">
        <h2 className="font-bold text-xl">
          🧠 Agregar Pregunta
        </h2>

        <select
          value={selectedProcessForQuestion}
          onChange={(e) =>
            setSelectedProcessForQuestion(
              e.target.value
            )
          }
          className="w-full p-3 border rounded-xl"
        >
          <option value="">
            Selecciona proceso
          </option>
          {processes.map((p: any) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>

        <input
          placeholder="Pregunta"
          value={question}
          onChange={(e) =>
            setQuestion(e.target.value)
          }
          className="w-full p-3 border rounded-xl"
        />

        <input
          placeholder="Opción A"
          value={optionA}
          onChange={(e) =>
            setOptionA(e.target.value)
          }
          className="w-full p-3 border rounded-xl"
        />

        <input
          placeholder="Opción B"
          value={optionB}
          onChange={(e) =>
            setOptionB(e.target.value)
          }
          className="w-full p-3 border rounded-xl"
        />

        <input
          placeholder="Opción C"
          value={optionC}
          onChange={(e) =>
            setOptionC(e.target.value)
          }
          className="w-full p-3 border rounded-xl"
        />

        <select
          value={correctOption}
          onChange={(e) =>
            setCorrectOption(e.target.value)
          }
          className="w-full p-3 border rounded-xl"
        >
          <option value="">
            Correcta
          </option>
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="C">C</option>
        </select>

        <button
          onClick={createQuestion}
          className="bg-purple-600 text-white px-6 py-2 rounded-xl"
        >
          Crear Pregunta
        </button>
      </div>
    </main>
  );
}