"use client";

import { supabase } from "@/lib/supabase";

interface Props {
  announcement: any;
  userId: string;
  onClose: (id: string) => void;
}

export default function AnnouncementModal({
  announcement,
  userId,
  onClose,
}: Props) {

  const handleClose = async () => {

    await supabase.from("announcement_reads").insert({
      user_id: userId,
      announcement_id: announcement.id,
    });

    onClose(announcement.id);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">

      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 relative animate-fadeIn">

        {/* Cerrar */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-black text-xl"
        >
          ✖
        </button>

        {/* Título */}
        <h2 className="text-2xl font-bold mb-4">
          {announcement.title}
        </h2>

        {/* Mensaje */}
        <p className="text-gray-700 whitespace-pre-line mb-4">
          {announcement.message}
        </p>

        {/* 🖼 IMAGEN */}
        {announcement.media_type === "image" && (
          <img
            src={announcement.media_url}
            className="rounded-2xl shadow-lg max-h-96 object-cover w-full"
          />
        )}

        {/* 🎥 VIDEO */}
        {announcement.media_type === "video" && (
          <video
            controls
            className="rounded-2xl shadow-lg max-h-96 w-full"
          >
            <source src={announcement.media_url} />
          </video>
        )}

        {/* Fecha */}
        <p className="text-sm text-gray-400 mt-4">
          {new Date(announcement.created_at).toLocaleString()}
        </p>

        {/* Botón */}
        <button
          onClick={handleClose}
          className="mt-6 w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-full hover:scale-105 transition-all"
        >
          Entendido 💜
        </button>

      </div>
    </div>
  );
}