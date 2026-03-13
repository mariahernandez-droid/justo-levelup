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

      const { data } = await sb
        .from("process_steps")
        .select("*")
        .eq("process_id", id)
        .order("step_order");

      setSteps(data || []);
      setLoading(false);
    };

    load();
  }, [id]);

  // editar texto
  const updateStep = (index: number, value: string) => {
    const updated = [...steps];
    updated[index].content = value;
    setSteps(updated);
  };

  // subir imagen o video
  const uploadMedia = async (index: number, file: File) => {

    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("process-media")
      .upload(fileName, file);

    if (error) {
      alert("Error subiendo archivo");
      return;
    }

    const { data } = supabase.storage
      .from("process-media")
      .getPublicUrl(fileName);

    const updated = [...steps];
    updated[index].media_url = data.publicUrl;

    setSteps(updated);
  };

  // eliminar paso
  const deleteStep = async (stepId: string) => {

    if (!confirm("¿Eliminar este paso?")) return;

    await supabase
      .from("process_steps")
      .delete()
      .eq("id", stepId);

    setSteps((prev) =>
      prev.filter((s) => s.id !== stepId)
    );
  };

  // agregar paso
  const addStep = () => {
    setSteps([
      ...steps,
      {
        id: crypto.randomUUID(),
        content: "",
        media_url: null,
        isNew: true,
        step_order: steps.length + 1,
      },
    ]);
  };

  // guardar cambios
  const save = async () => {

    for (const step of steps) {

      if (step.isNew) {

        await supabase.from("process_steps").insert({
          process_id: id,
          content: step.content,
          media_url: step.media_url,
          step_order: step.step_order,
        });

      } else {

        await supabase
          .from("process_steps")
          .update({
            content: step.content,
            media_url: step.media_url,
            step_order: step.step_order,
          })
          .eq("id", step.id);

      }
    }

    alert("Proceso actualizado");

    router.push(`/process/${id}`);
  };

  if (loading) return <p className="p-10">Cargando...</p>;

  return (
    <main className="p-10 max-w-4xl mx-auto space-y-8">

      <h1 className="text-3xl font-bold">
        Editar proceso
      </h1>

      {steps.map((step, index) => (

        <div
          key={step.id}
          className="bg-white p-6 rounded-2xl shadow space-y-4"
        >

          <div className="flex justify-between">

            <p className="font-semibold">
              Paso {index + 1}
            </p>

            <button
              onClick={() => deleteStep(step.id)}
              className="text-red-600"
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
          />

          {/* subir media */}
          <input
            type="file"
            accept="image/*,video/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadMedia(index, file);
            }}
          />

          {/* preview */}
          {step.media_url && (

            <>
              {step.media_url.endsWith(".mp4") ? (

                <video
                  src={step.media_url}
                  controls
                  className="rounded-xl w-full"
                />

              ) : (

                <img
                  src={step.media_url}
                  className="rounded-xl w-full object-contain"
                />

              )}
            </>

          )}

        </div>

      ))}

      <button
        onClick={addStep}
        className="bg-blue-600 text-white px-5 py-2 rounded-xl"
      >
        ➕ Agregar paso
      </button>

      <button
        onClick={save}
        className="bg-purple-600 text-white px-6 py-3 rounded-xl"
      >
        Guardar cambios
      </button>

    </main>
  );
}