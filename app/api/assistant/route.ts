import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { question } = await req.json();

    if (!question || question.trim() === "") {
      return NextResponse.json({
        type: "message",
        content: "Escribe algo para poder ayudarte 😊"
      });
    }

    const cleanQuestion = question
      .toLowerCase()
      .replace(/[^\w\s]/gi, "");

    const words = cleanQuestion
      .split(" ")
      .filter((w: string) => w.length > 3);

    let matchedProcesses: any[] = [];

    // 🔎 Buscar coincidencias por título
    for (const word of words) {
      const { data } = await supabase
        .from("processes")
        .select("id, title")
        .ilike("title", `%${word}%`)
        .eq("published", true);

      if (data) {
        matchedProcesses = [...matchedProcesses, ...data];
      }
    }

    // Quitar duplicados
    matchedProcesses = matchedProcesses.filter(
      (v, i, a) => a.findIndex(t => t.id === v.id) === i
    );

    if (matchedProcesses.length === 0) {
      return NextResponse.json({
        type: "message",
        content: "No encontré procesos relacionados 😔 Intenta con otras palabras."
      });
    }

    // 🎯 Si solo hay uno → devolver pasos completos con multimedia
    if (matchedProcesses.length === 1) {
      const process = matchedProcesses[0];

      const { data: steps } = await supabase
        .from("process_steps")
        .select("step_order, content, media_url")
        .eq("process_id", process.id)
        .order("step_order", { ascending: true });

      return NextResponse.json({
        type: "process",
        title: process.title,
        steps: steps || []
      });
    }

    // 🧩 Si hay varios → mostrar opciones
    return NextResponse.json({
      type: "options",
      options: matchedProcesses.map(p => ({
        id: p.id,
        title: p.title
      }))
    });

  } catch (error) {
    console.error("ERROR:", error);

    return NextResponse.json({
      type: "message",
      content: "Ocurrió un error 😔"
    });
  }
}