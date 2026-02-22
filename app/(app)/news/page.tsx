"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function NewsPage() {

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const user = userData.user;

    // 🔥 Verificar rol
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role === "admin") {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }

    // 🔥 Traer novedades
    const { data } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });

    setAnnouncements(data || []);
    setLoading(false);
  };

  const handlePublish = async () => {

    if (!title || !message) return;

    setPublishing(true);

    let mediaUrl = null;
    let mediaType = null;

    if (file) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;

      const { error } = await supabase.storage
        .from("announcements-media")
        .upload(fileName, file);

      if (!error) {
        const { data } = supabase.storage
          .from("announcements-media")
          .getPublicUrl(fileName);

        mediaUrl = data.publicUrl;
        mediaType = file.type.startsWith("image")
          ? "image"
          : "video";
      }
    }

    await supabase.from("announcements").insert({
      title,
      message,
      media_url: mediaUrl,
      media_type: mediaType,
    });

    setTitle("");
    setMessage("");
    setFile(null);

    await loadData();
    setPublishing(false);
  };

  const handleDelete = async (announcement: any) => {

    const confirmDelete = confirm(
      "¿Seguro que deseas eliminar esta novedad?"
    );

    if (!confirmDelete) return;

    // 🔥 Si tiene archivo, eliminarlo
    if (announcement.media_url) {
      const fileName = announcement.media_url
        .split("/")
        .pop();

      await supabase.storage
        .from("announcements-media")
        .remove([fileName]);
    }

    // 🔥 Eliminar registros de lectura
    await supabase
      .from("announcement_reads")
      .delete()
      .eq("announcement_id", announcement.id);

    // 🔥 Eliminar novedad
    await supabase
      .from("announcements")
      .delete()
      .eq("id", announcement.id);

    await loadData();
  };

  if (loading)
    return <p className="p-10">Cargando...</p>;

  return (
    <main className="min-h-screen p-10 bg-gradient-to-br from-indigo-200 via-purple-200 to-pink-200">

      <div className="max-w-4xl mx-auto space-y-12">

        <h1 className="text-4xl font-bold">
          📰 Novedades
        </h1>

        {/* 🔥 FORMULARIO PARA TODOS */}
        <div className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl shadow-2xl space-y-6">

          <h2 className="text-xl font-semibold">
            Publicar nueva novedad
          </h2>

          <input
            type="text"
            placeholder="Título"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-4 rounded-2xl shadow-inner focus:outline-none focus:ring-2 focus:ring-purple-400"
          />

          <textarea
            placeholder="Mensaje"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="w-full p-4 rounded-2xl shadow-inner focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
          />

          <input
            type="file"
            accept="image/*,video/*"
            onChange={(e) =>
              setFile(e.target.files?.[0] || null)
            }
          />

          <button
            onClick={handlePublish}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-full hover:scale-105 transition-all"
          >
            {publishing ? "Publicando..." : "Publicar 🚀"}
          </button>

        </div>

        {/* 🔥 LISTA */}
        <div className="space-y-6">

          {announcements.map((ann, index) => (
            <div
              key={ann.id}
              className="relative bg-white/70 backdrop-blur-xl p-8 rounded-3xl shadow-md hover:shadow-2xl transition-all"
            >

              {index === 0 && (
                <span className="absolute top-6 right-6 text-xs px-3 py-1 bg-green-100 text-green-600 rounded-full font-semibold">
                  Nuevo
                </span>
              )}

              <h3 className="text-xl font-bold mb-2">
                {ann.title}
              </h3>

              <p className="text-gray-700 mb-4 whitespace-pre-line">
                {ann.message}
              </p>

              {ann.media_type === "image" && (
                <img
                  src={ann.media_url}
                  className="rounded-2xl shadow-lg max-h-96 object-cover w-full"
                />
              )}

              {ann.media_type === "video" && (
                <video
                  controls
                  className="rounded-2xl shadow-lg max-h-96 w-full"
                >
                  <source src={ann.media_url} />
                </video>
              )}

              <div className="flex justify-between items-center mt-4">

                <p className="text-sm text-gray-500">
                  {new Date(
                    ann.created_at
                  ).toLocaleString()}
                </p>

                {/* 🔥 SOLO ADMIN VE ELIMINAR */}
                {isAdmin && (
                  <button
                    onClick={() =>
                      handleDelete(ann)
                    }
                    className="text-red-600 hover:text-red-800 font-semibold"
                  >
                    🗑 Eliminar
                  </button>
                )}

              </div>

            </div>
          ))}

        </div>

      </div>

    </main>
  );
}