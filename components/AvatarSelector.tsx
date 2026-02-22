"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

const avatarStyles = [
  { name: "Anime Fantasía 🧚", value: "lorelei" },
  { name: "Cartoon Clásico 🎨", value: "adventurer" },
  { name: "Humano Moderno 💼", value: "personas" },
  { name: "Cute Minimal 🌸", value: "notionists" },
  { name: "Robot Gamer 🤖", value: "bottts" },
  { name: "Doodle Divertido ✏️", value: "croodles" },
  { name: "Pixel Art 🎮", value: "pixel-art" },
  { name: "Emoji Animado 😎", value: "fun-emoji" },
  { name: "Animales 🐶", value: "thumbs" },
];

export default function AvatarSelector({ userId }: any) {
  const [selectedStyle, setSelectedStyle] = useState("lorelei");

  const saveAvatar = async () => {
    const seed = Math.random().toString(36).substring(2, 10);

    await supabase
      .from("profiles")
      .update({
        avatar_style: selectedStyle,
        avatar_seed: seed,
      })
      .eq("id", userId);

    location.reload();
  };

  return (
    <div className="bg-white p-8 rounded-3xl shadow-xl space-y-6">
      <h2 className="text-2xl font-bold">
        🎨 Elige tu estilo de avatar
      </h2>

      <div className="grid md:grid-cols-3 gap-6">
        {avatarStyles.map((style) => (
          <div
            key={style.value}
            onClick={() => setSelectedStyle(style.value)}
            className={`p-4 rounded-2xl cursor-pointer transition-all border ${
              selectedStyle === style.value
                ? "border-purple-600 bg-purple-100"
                : "border-gray-200 bg-gray-50"
            }`}
          >
            <img
              src={`https://api.dicebear.com/7.x/${style.value}/svg?seed=preview`}
              className="w-20 h-20 mx-auto"
            />
            <p className="text-center mt-2 text-sm font-medium">
              {style.name}
            </p>
          </div>
        ))}
      </div>

      <button
        onClick={saveAvatar}
        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-xl"
      >
        Guardar Avatar ✨
      </button>
    </div>
  );
}