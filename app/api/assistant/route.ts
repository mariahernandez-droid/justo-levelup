import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json({
        type: "error",
        content: "Mensaje vacío 😅",
      });
    }

    // Traer todos los procesos publicados
    const { data: processes, error } = await supabase
      .from("processes")
      .select("id, title, content")
      .eq("published", true);

    if (error) {
      return NextResponse.json({
        type: "error",
        content: "Error consultando procesos",
      });
    }

    if (!processes || processes.length === 0) {
      return NextResponse.json({
        type: "message",
        content: "No hay procesos disponibles.",
      });
    }

    // 🔎 Buscar coincidencias por palabras clave
    const lowerMessage = message.toLowerCase();

    const matches = processes.filter((process) =>
      process.title?.toLowerCase().includes(lowerMessage) ||
      process.content?.toLowerCase().includes(lowerMessage)
    );

    if (matches.length === 0) {
      return NextResponse.json({
        type: "message",
        content: "Lo siento 🥹 no encontré un proceso relacionado.",
      });
    }

    // Tomar el primero más relevante
    const bestMatch = matches[0];

    return NextResponse.json({
      type: "process",
      content: bestMatch,
    });

  } catch (err) {
    console.error(err);

    return NextResponse.json({
      type: "error",
      content: "Error interno del servidor 😢",
    });
  }
}