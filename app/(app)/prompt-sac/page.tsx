"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";

interface Category {
  categoria: string;
  prompt: string;
  respuesta: string;
}

interface Message {
  type: "user" | "bot";
  text: string;
}

export default function PromptSacPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [categoria, setCategoria] = useState("");
  const [score, setScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [searchCategory, setSearchCategory] = useState("");

  const handleGenerate = async () => {
    if (!input.trim()) return;

    setLoading(true);

    const res = await fetch("/api/prompt-sac", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: input }),
    });

    const data = await res.json();

    if (data.type === "result") {
      setCategoria(data.categoria);
      setScore(data.score);
      setAllCategories(data.allCategories);

      setMessages([
        { type: "user", text: data.prompt },
        { type: "bot", text: data.respuesta },
      ]);
    }

    setLoading(false);
  };

  const filteredCategories = allCategories.filter((cat) =>
    cat.categoria.toLowerCase().includes(searchCategory.toLowerCase())
  );

  const handleSelectCategory = (cat: Category) => {
    setCategoria(cat.categoria);

    setMessages([
      { type: "user", text: cat.prompt },
      { type: "bot", text: cat.respuesta },
    ]);
  };

  return (
    <div className="min-h-screen p-10 bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100">
      <div className="max-w-3xl mx-auto space-y-8">

        <h1 className="text-3xl font-bold flex items-center gap-2">
          💬 Prompt SAC
        </h1>

        {/* INPUT */}
        <div className="bg-white p-6 rounded-3xl shadow-xl space-y-4">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe el caso del cliente..."
            className="w-full border rounded-2xl p-4 h-32 focus:outline-none focus:ring-2 focus:ring-purple-400"
          />

          <button
            onClick={handleGenerate}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-full hover:scale-105 transition-all"
          >
            {loading ? "Buscando..." : "Generar respuesta 💜"}
          </button>
        </div>

        {/* RESULTADO */}
        {categoria && (
          <div className="bg-white p-6 rounded-3xl shadow-xl space-y-6">

            <div className="bg-purple-100 p-4 rounded-2xl">
              <p className="font-semibold">📌 Categoría sugerida:</p>
              <p className="font-bold">{categoria}</p>
              {score !== null && (
                <p className="text-sm text-gray-600 mt-1">
                  Similitud: {score}
                </p>
              )}
            </div>

            {/* BUSCAR CATEGORÍA */}
            <div>
              <input
                type="text"
                placeholder="Buscar categoría..."
                value={searchCategory}
                onChange={(e) => setSearchCategory(e.target.value)}
                className="w-full border rounded-xl p-3 mb-3"
              />

              <div className="max-h-40 overflow-y-auto space-y-2">
                {filteredCategories.map((cat, i) => (
                  <div
                    key={i}
                    onClick={() => handleSelectCategory(cat)}
                    className="p-3 bg-gray-100 hover:bg-purple-100 cursor-pointer rounded-xl transition"
                  >
                    {cat.categoria}
                  </div>
                ))}
              </div>
            </div>

            {/* CHAT */}
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`max-w-[85%] p-4 rounded-2xl whitespace-pre-line ${
                    msg.type === "user"
                      ? "bg-purple-200 ml-auto text-right"
                      : "bg-gray-200 mr-auto"
                  }`}
                >
                  {msg.text}
                </div>
              ))}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}