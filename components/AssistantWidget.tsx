"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";

type ProcessStep = {
  step_order: number;
  content: string;
  media_url: string | null;
};

type Process = {
  id: string;
  title: string;
  process_steps: ProcessStep[];
};

type Message =
  | { role: "user"; text: string }
  | { role: "assistant"; text?: string; process?: Process };

// 🔗 convertir links en clickeables
function formatTextWithLinks(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  const parts = text.split(urlRegex);

  return parts.map((part, i) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline hover:text-blue-800"
        >
          {part}
        </a>
      );
    }

    return part;
  });
}

export default function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const sendQuestion = async () => {
    if (!question.trim()) return;

    const userQuestion = question;
    setQuestion("");
    setLoading(true);

    setMessages((prev) => [
      ...prev,
      { role: "user", text: userQuestion },
    ]);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userQuestion }),
      });

      if (!res.ok) {
        const errorText = await res.text();

        console.error("Error servidor:", errorText);

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: "Error del servidor 😢",
          },
        ]);

        setLoading(false);
        return;
      }

      const data = await res.json();

      console.log("Respuesta API:", data);

      if (data.type === "process") {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", process: data.content },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text:
              data.content ||
              "Lo siento 🥹 no encontré un proceso relacionado.",
          },
        ]);
      }

    } catch (error) {
      console.error("Error fetch:", error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Ocurrió un error en producción 😢",
        },
      ]);
    }

    setLoading(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white w-14 h-14 rounded-full shadow-xl hover:scale-110 transition-all z-50"
      >
        🤖
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 w-96 bg-white rounded-3xl shadow-2xl p-4 flex flex-col z-50">

          <h3 className="font-bold mb-3 text-lg">
            Asistente LevelUp
          </h3>

          <div className="flex-1 overflow-y-auto space-y-3 mb-3 max-h-96">

            {messages.map((msg, i) => {

              if (msg.role === "user") {
                return (
                  <div
                    key={i}
                    className="p-3 rounded-2xl text-sm bg-purple-100 text-right whitespace-pre-line"
                  >
                    {msg.text}
                  </div>
                );
              }

              if (msg.process) {
                return (
                  <div
                    key={i}
                    className="p-3 rounded-2xl text-sm bg-gray-100 space-y-3"
                  >
                    <p className="font-bold">
                      📘 {msg.process.title}
                    </p>

                    {msg.process.process_steps
                      ?.sort((a, b) =>
                        a.step_order - b.step_order
                      )
                      .map((step) => (
                        <div key={step.step_order} className="space-y-2">

                          <p>
                            <strong>{step.step_order}.</strong>{" "}
                            {formatTextWithLinks(step.content)}
                          </p>

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
                                  alt="Paso visual"
                                  className="rounded-xl w-full"
                                />
                              )}
                            </>
                          )}

                        </div>
                      ))}

                  </div>
                );
              }

              return (
                <div
                  key={i}
                  className="p-3 rounded-2xl text-sm bg-gray-100 whitespace-pre-line"
                >
                  {msg.text && formatTextWithLinks(msg.text)}
                </div>
              );
            })}

            {loading && (
              <div className="text-xs text-gray-400">
                Buscando...
              </div>
            )}

          </div>

          <div className="flex gap-2">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendQuestion();
              }}
              placeholder="Haz una pregunta..."
              className="flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
            <button
              onClick={sendQuestion}
              className="bg-purple-600 text-white px-4 rounded-full hover:bg-purple-700"
            >
              ➤
            </button>
          </div>

        </div>
      )}
    </>
  );
}