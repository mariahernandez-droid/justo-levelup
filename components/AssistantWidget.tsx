"use client";

import { useState } from "react";

export default function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const sendQuestion = async () => {
    if (!question.trim()) return;

    setLoading(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question }),
      });

      const data = await res.json();

      // Usuario
      setMessages(prev => [
        ...prev,
        { role: "user", text: question }
      ]);

      // Assistant
      if (data.type === "message") {
        setMessages(prev => [
          ...prev,
          { role: "assistant", text: data.content }
        ]);
      }

      if (data.type === "process") {
        setMessages(prev => [
          ...prev,
          { role: "assistant", process: data }
        ]);
      }

      if (data.type === "options") {
        setMessages(prev => [
          ...prev,
          {
            role: "assistant",
            text:
              "Encontré estos procesos:\n\n" +
              data.options
                .map((o: any, i: number) => `${i + 1}. ${o.title}`)
                .join("\n")
          }
        ]);
      }

      setQuestion("");
    } catch (error) {
      setMessages(prev => [
        ...prev,
        { role: "assistant", text: "Ocurrió un error 😔" }
      ]);
    }

    setLoading(false);
  };

  return (
    <>
      {/* BOTÓN */}
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

          <div className="flex-1 overflow-y-auto space-y-3 mb-3 max-h-80">

            {messages.map((msg, i) => {

              // Usuario
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

              // Proceso con multimedia
              if (msg.process) {
                return (
                  <div
                    key={i}
                    className="p-3 rounded-2xl text-sm bg-gray-100 space-y-3"
                  >
                    <p className="font-bold">
                      📘 {msg.process.title}
                    </p>

                    {msg.process.steps.map((step: any) => (
                      <div key={step.step_order} className="space-y-2">
                        <p>
                          <strong>{step.step_order}.</strong> {step.content}
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

              // Mensaje normal
              return (
                <div
                  key={i}
                  className="p-3 rounded-2xl text-sm bg-gray-100 whitespace-pre-line"
                >
                  {msg.text}
                </div>
              );
            })}

            {loading && (
              <div className="text-xs text-gray-400">
                Buscando...
              </div>
            )}

          </div>

          {/* Input */}
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