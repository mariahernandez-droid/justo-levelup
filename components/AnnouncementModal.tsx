"use client";

import { getSupabase } from "@/lib/supabase";

/* 🔗 FORMATEAR LINKS + ENTER */
function formatTextWithLinks(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  return text.split("\n").map((line, index) => (
    <span key={index}>
      {line.split(urlRegex).map((part, i) =>
        part.match(urlRegex) ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline hover:text-blue-800"
          >
            {part}
          </a>
        ) : (
          part
        )
      )}
      <br />
    </span>
  ));
}

export default function AnnouncementModal({
  announcement,
  userId,
  onClose,
}: {
  announcement: any;
  userId: string;
  onClose: (id: string) => void;
}) {
  const supabase = getSupabase();

  const handleClose = async () => {
    await supabase.from("announcement_reads").upsert(
      {
        user_id: userId,
        announcement_id: announcement.id,
      },
      {
        onConflict: "user_id,announcement_id",
      }
    );

    onClose(announcement.id);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">

      <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl">

        {/* 🔥 CONTENIDO CON SCROLL */}
        <div className="p-6 overflow-y-auto space-y-4">

          <h2 className="text-2xl font-bold">
            {announcement.title}
          </h2>

          {/* 🔥 TEXTO CON LINKS */}
          <p className="text-gray-700 whitespace-pre-line">
            {formatTextWithLinks(announcement.message)}
          </p>

          {/* 🖼️ IMAGEN */}
          {announcement.media_type === "image" && (
            <img
              src={announcement.media_url}
              className="rounded-xl w-full object-contain"
            />
          )}

          {/* 🎥 VIDEO */}
          {announcement.media_type === "video" && (
            <video
              controls
              className="rounded-xl w-full max-h-96"
            >
              <source src={announcement.media_url} />
            </video>
          )}

        </div>

        {/* 🔥 BOTÓN FIJO */}
        <div className="p-4 border-t bg-white rounded-b-3xl">
          <button
            onClick={handleClose}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-full hover:scale-105 transition-all"
          >
            Entendido 💜
          </button>
        </div>

      </div>

    </div>
  );
}