"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

export default function EditProcess() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [supabase, setSupabase] = useState<any>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sb = getSupabase();
    setSupabase(sb);

    const load = async () => {
      const { data: stepsData } = await sb
        .from("process_steps")
        .select("*")
        .eq("process_id", id)
        .order("step_order");

      setSteps(stepsData || []);
      setLoading(false);
    };

    load();
  }, [id]);

  // ✏️ editar texto del paso
  const updateStep = (index: number, value: string) => {
    const newSteps = [...steps];
    newSteps[index].content = value;
    setSteps(newSteps);
  };

  // 🗑 eliminar paso
  const deleteStep = async (stepId: string) => {
    if (!confirm("¿Eliminar este paso?")) return;

    await supabase
      .from("process_steps")
      .delete()
      .eq("id", stepId);

    setSteps((prev) =>
      prev.filter((step) => step.id !== stepId)
    );
  };

  // ➕ agregar paso nuevo
  const addStep = () => {
    const newStep = {
      id: crypto.randomUUID(),
      content: "",
      step_order: steps.length + 1,
      isNew: true,
    };

    setSteps([...steps, newStep]);
  };

  // 💾 guardar cambios
  const save = async () => {

    for (const step of steps) {

      // nuevo paso
      if (step.isNew) {
        await supabase.from("process_steps").insert({
          process_id: id,
          content: step.content,
          step_order: step.step_order,
        });
      }

      // paso existente
      else {
        await supabase
          .from("process_steps")
          .update({
            content: step.content,
            step_order: step.step_order,
          })
          .eq("id", step.id);
      }
    }

    alert("Proceso actualizado 🎉");

    router.push(`/process/${id}`);
  };

  if (loading) return <p className="p-10">Cargando...</p>;

  return (
    <main className="p-10 max-w-4xl mx-auto space-y-8">

      <h1 className="text-3xl font-bold">
        Editar proceso
      </h1>

      <div className="space-y-6">

        {steps.map((step, index) => (
          <div
            key={step.id}
            className="bg-white p-6 rounded-2xl shadow space-y-4"
          >

            <div className="flex justify-between items-center">

              <p className="font-semibold">
                Paso {index + 1}
              </p>

              <button
                onClick={() => deleteStep(step.id)}
                className="text-red-600 hover:text-red-800 font-semibold"
              >
                🗑 Eliminar
              </button>

            </div>

            <textarea
              value={step.content}
              onChange={(e) =>
                updateStep(index, e.target.value)
              }
              className="w-full p-3 border rounded-lg"
              placeholder="Contenido del paso..."
            />

          </div>
        ))}

      </div>

      {/* ➕ agregar paso */}
      <button
        onClick={addStep}
        className="bg-blue-600 text-white px-5 py-2 rounded-xl hover:bg-blue-700"
      >
        ➕ Agregar paso
      </button>

      {/* guardar */}
      <button
        onClick={save}
        className="bg-purple-600 text-white px-6 py-3 rounded-xl hover:bg-purple-700"
      >
        Guardar cambios
      </button>

    </main>
  );
}