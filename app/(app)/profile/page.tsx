"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";

export default function ProfilePage() {
  const [supabase, setSupabase] =
    useState<ReturnType<typeof getSupabase> | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [nickname, setNickname] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const sb = getSupabase();
    setSupabase(sb);

    const loadProfile = async () => {
      const { data: userData } = await sb.auth.getUser();
      if (!userData.user) return;

      setUserId(userData.user.id);

      const { data: profile } = await sb
        .from("profiles")
        .select("nickname, avatar_url")
        .eq("id", userData.user.id)
        .single();

      if (profile) {
        setNickname(profile.nickname || "");
        setAvatar(profile.avatar_url);
      }
    };

    loadProfile();
  }, []);

  const handleUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!supabase || !userId) return;

    try {
      setUploading(true);

      if (!event.target.files) return;

      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", userId);

      setAvatar(publicUrl);
    } catch (error) {
      console.error("Error subiendo imagen:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!supabase || !userId) return;

    try {
      setSaving(true);

      await supabase
        .from("profiles")
        .update({ nickname })
        .eq("id", userId);

      alert("Perfil actualizado 💜");
    } catch (error) {
      console.error("Error guardando nickname:", error);
    } finally {
      setSaving(false);
    }
  };

  if (!supabase)
    return <p className="p-10">Cargando...</p>;

  return (
    <div className="min-h-screen p-10 bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100">
      <div className="max-w-xl mx-auto bg-white p-8 rounded-3xl shadow-xl space-y-8">
        <h1 className="text-2xl font-bold">👤 Mi Perfil</h1>

        <div className="flex flex-col items-center space-y-4">
          <img
            src={
              avatar ||
              "https://api.dicebear.com/7.x/adventurer/svg?seed=User"
            }
            className="w-32 h-32 rounded-full object-cover border-4 border-purple-300 shadow-lg"
            alt="avatar"
          />

          <label className="cursor-pointer bg-purple-600 text-white px-4 py-2 rounded-full hover:scale-105 transition">
            {uploading ? "Subiendo..." : "Cambiar foto"}
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              hidden
            />
          </label>
        </div>

        <div className="space-y-3">
          <label className="text-sm text-gray-600">
            Apodo
          </label>

          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-purple-400"
          />

          <button
            onClick={handleSave}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-full hover:scale-105 transition"
          >
            {saving ? "Guardando..." : "Guardar cambios 💜"}
          </button>
        </div>
      </div>
    </div>
  );
}