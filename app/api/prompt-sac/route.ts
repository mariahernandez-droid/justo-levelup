import { NextResponse } from "next/server";

const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vS7QAnIKwg81v2UXJWg2xn5ZOEqmqziKxrbSnFDhGLQVkjSE5rnCTPFP_Hz3ISjiLszv97A08CmBREl/pub?output=csv";

// 🔥 Normaliza texto (quita tildes y mayúsculas)
function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// 🔥 Parser CSV que respeta comillas y saltos de línea
function parseCSV(text: string) {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      currentRow.push(currentCell);
      currentCell = "";
    } else if (char === "\n" && !insideQuotes) {
      currentRow.push(currentCell);
      rows.push(currentRow);
      currentRow = [];
      currentCell = "";
    } else {
      currentCell += char;
    }
  }

  if (currentCell) currentRow.push(currentCell);
  if (currentRow.length) rows.push(currentRow);

  const headers = rows[0].map((h) =>
    h.trim().replace(/^"|"$/g, "")
  );

  return rows.slice(1).map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((header, i) => {
      obj[header] =
        row[i]?.trim().replace(/^"|"$/g, "") || "";
    });
    return obj;
  });
}

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text || text.trim() === "") {
      return NextResponse.json({
        type: "message",
        content: "Escribe algo 😊",
      });
    }

    const response = await fetch(SHEET_URL);
    const csvText = await response.text();
    const data = parseCSV(csvText);

    const input = normalize(text);

    let bestMatch: Record<string, string> | null = null;
    let bestScore = 0;

    data.forEach((row) => {
      const categoria = normalize(row["categoria"] || "");
      const prompt = normalize(row["prompt_recomendado"] || "");

      let score = 0;

      // Coincidencia directa fuerte
      if (categoria.includes(input)) score += 3;
      if (prompt.includes(input)) score += 3;

      // Coincidencia por palabra
      input.split(" ").forEach((word: string) => {
        if (categoria.includes(word)) score++;
        if (prompt.includes(word)) score++;
      });

      if (score > bestScore) {
        bestScore = score;
        bestMatch = row;
      }
    });

    if (!bestMatch || bestScore === 0) {
      return NextResponse.json({
        type: "message",
        content: "No encontré categoría relacionada 😔",
        allCategories: data.map((row) => ({
          categoria: row["categoria"],
          prompt: row["prompt_recomendado"],
          respuesta: row["respuesta_recomendada"],
        })),
      });
    }

    return NextResponse.json({
      type: "result",
      categoria: bestMatch["categoria"],
      prompt: bestMatch["prompt_recomendado"],
      respuesta: bestMatch["respuesta_recomendada"],
      score: bestScore,
      allCategories: data.map((row) => ({
        categoria: row["categoria"],
        prompt: row["prompt_recomendado"],
        respuesta: row["respuesta_recomendada"],
      })),
    });

  } catch (error) {
    console.error("Error leyendo planilla:", error);

    return NextResponse.json({
      type: "message",
      content: "Error leyendo la planilla 😔",
    });
  }
}