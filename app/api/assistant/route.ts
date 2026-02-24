export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { createClient } = await import("@supabase/supabase-js");

    // ✅ DEFINIR BIEN LAS VARIABLES
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { type: "error", content: "Supabase no configurado" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { message } = await req.json();

    if (!message) {
      return NextResponse.json({
        type: "error",
        content: "Mensaje vacío 😅",
      });
    }

    const { data: processes, error } = await supabase
      .from("processes")
      .select("id, title, content")
      .eq("published", true);

    if (error) throw error;

    if (!processes?.length) {
      return NextResponse.json({
        type: "message",
        content: "No hay procesos disponibles.",
      });
    }

    const lowerMessage = message.toLowerCase();

    const match = processes.find(
      (p) =>
        p.title?.toLowerCase().includes(lowerMessage) ||
        p.content?.toLowerCase().includes(lowerMessage)
    );

    if (!match) {
      return NextResponse.json({
        type: "message",
        content: "Lo siento 🥹 no encontré un proceso relacionado.",
      });
    }

    return NextResponse.json({
      type: "process",
      content: match,
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { type: "error", content: "Error interno 😢" },
      { status: 500 }
    );
  }
}