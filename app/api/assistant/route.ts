export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json({
        type: "message",
        content: "Mensaje vacío 😅",
      });
    }

    // 🔐 Verificar variables de entorno
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ Variables de entorno faltantes");
      return NextResponse.json(
        {
          type: "message",
          content: "Error configuración servidor.",
        },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 🔎 Consultar procesos publicados
    const { data: processes, error } = await supabase
      .from("processes")
      .select(`
        id,
        title,
        process_steps (
          step_order,
          content,
          media_url
        )
      `)
      .eq("published", true);

    if (error) {
      console.error("❌ Error consultando Supabase:", error);
      return NextResponse.json(
        {
          type: "message",
          content: "Error consultando base de datos 😢",
        },
        { status: 500 }
      );
    }

    console.log("📊 Procesos encontrados:", processes?.length);

    if (!processes || processes.length === 0) {
      return NextResponse.json({
        type: "message",
        content: "No hay procesos disponibles.",
      });
    }

    // 🔎 Procesar mensaje del usuario
    const userWords = message
      .toLowerCase()
      .split(" ")
      .filter((w: string) => w.length > 2);

    let bestMatch: any = null;
    let bestScore = 0;

    for (const process of processes) {
      const title = process.title?.toLowerCase() || "";
      let score = 0;

      userWords.forEach((word: string) => {
        if (title.includes(word)) score++;
      });

      if (score > bestScore) {
        bestScore = score;
        bestMatch = process;
      }
    }

    if (!bestMatch || bestScore === 0) {
      return NextResponse.json({
        type: "message",
        content:
          "Lo siento 🥹 no encontré un proceso relacionado.",
      });
    }

    return NextResponse.json({
      type: "process",
      content: bestMatch,
    });

  } catch (err) {
    console.error("🔥 Error en assistant route:", err);
    return NextResponse.json(
      { type: "message", content: "Error interno 😢" },
      { status: 500 }
    );
  }
}