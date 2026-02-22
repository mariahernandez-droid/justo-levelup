"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import AnnouncementModal from "@/components/AnnouncementModal";
import AssistantWidget from "@/components/AssistantWidget";

export default function Dashboard() {

  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [nickname, setNickname] = useState("");
  const [avatar, setAvatar] = useState("");
  const [progress, setProgress] = useState(0);
  const [team, setTeam] = useState<any[]>([]);

  // 🔔 Novedades
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {

    const init = async () => {

      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        router.push("/login");
        return;
      }

      const user = userData.user;
      setUserId(user.id);

      // 🔹 PERFIL
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setNickname(profile?.nickname || "");
      setAvatar(profile?.avatar_url || "");

      // 🔔 TRAER NOVEDADES NO LEÍDAS
      const { data: allAnnouncements } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });

      if (allAnnouncements && allAnnouncements.length > 0) {

        const { data: readRecords } = await supabase
          .from("announcement_reads")
          .select("announcement_id")
          .eq("user_id", user.id);

        const readIds =
          readRecords?.map(r => r.announcement_id) || [];

        const unread = allAnnouncements.filter(
          ann => !readIds.includes(ann.id)
        );

        setAnnouncements(unread);
      }

      // 🔥 PROCESOS PUBLICADOS
      const { data: processes } = await supabase
        .from("processes")
        .select("id, badge_icon")
        .eq("published", true);

      const totalProcesses = processes?.length || 0;
      const validIds = processes?.map(p => p.id) || [];

      let completions: any[] = [];

      if (validIds.length > 0) {
        const { data } = await supabase
          .from("process_completions")
          .select("user_id, process_id")
          .in("process_id", validIds);

        completions = data || [];
      }

      const myCompletions =
        completions.filter(c => c.user_id === user.id);

      const myProgress =
        totalProcesses > 0
          ? Math.round(
              (myCompletions.length / totalProcesses) * 100
            )
          : 0;

      setProgress(myProgress);

      // 🔥 TRAER EQUIPO
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*");

      const teamWithProgress = profiles?.map(member => {

        const memberCompletions =
          completions.filter(
            c => c.user_id === member.id
          );

        const percentage =
          totalProcesses > 0
            ? Math.round(
                (memberCompletions.length / totalProcesses) * 100
              )
            : 0;

        const memberBadges =
          processes?.filter(p =>
            memberCompletions.some(
              c => c.process_id === p.id
            )
          ) || [];

        return {
          ...member,
          progress: percentage,
          badges: memberBadges,
        };

      }) || [];

      teamWithProgress.sort(
        (a, b) => b.progress - a.progress
      );

      setTeam(teamWithProgress);
      setLoading(false);
    };

    init();

  }, [router]);

  if (loading) return <p className="p-10">Cargando...</p>;

  return (
    <>
      <main className="min-h-screen p-10 bg-gradient-to-br from-indigo-200 via-purple-200 to-pink-200">

        <div className="max-w-6xl mx-auto space-y-12">

          {/* HERO PERSONAL */}
          <div className="bg-white/60 backdrop-blur-xl p-10 rounded-3xl shadow-2xl flex justify-between items-center">

            <div>
              <h1 className="text-4xl font-bold mb-2">
                Hola, {nickname} 👋
              </h1>

              <div className="w-80 bg-white rounded-full h-5 mt-4 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-600 to-pink-600 h-5 rounded-full transition-all duration-700"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <p className="mt-3 font-semibold text-lg">
                {progress}% completado
              </p>
            </div>

            <img
              src={
                avatar ||
                "https://api.dicebear.com/7.x/adventurer/svg?seed=User"
              }
              className="w-32 h-32 rounded-full border-4 border-white shadow-lg"
            />
          </div>

          {/* LEADERBOARD */}
          <div className="bg-white rounded-3xl shadow-xl p-8">

            <h2 className="text-2xl font-bold mb-8">
              👥 Leaderboard LevelUp
            </h2>

            {team.length === 0 && (
              <p className="text-gray-500">
                No hay compañeros registrados.
              </p>
            )}

            <div className="grid md:grid-cols-2 gap-8">

              {team.map((member, index) => {

                const medal =
                  index === 0
                    ? "🥇"
                    : index === 1
                    ? "🥈"
                    : index === 2
                    ? "🥉"
                    : "";

                return (
                  <div
                    key={member.id}
                    className="bg-gradient-to-br from-white to-purple-50 p-6 rounded-3xl shadow-md hover:shadow-xl transition-all"
                  >

                    <div className="flex items-center gap-4 mb-4">

                      <img
                        src={
                          member.avatar_url ||
                          "https://api.dicebear.com/7.x/adventurer/svg?seed=User"
                        }
                        className="w-16 h-16 rounded-full border-4 border-white shadow-md"
                      />

                      <div>
                        <p className="font-bold text-lg">
                          {medal} {member.nickname}
                        </p>

                        <p className="text-sm text-gray-500">
                          {member.progress}% completado
                        </p>
                      </div>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
                      <div
                        className="bg-gradient-to-r from-purple-600 to-pink-600 h-4 rounded-full transition-all duration-700"
                        style={{ width: `${member.progress}%` }}
                      />
                    </div>

                    <div className="flex flex-wrap gap-3 text-3xl">

                      {member.badges.length === 0 && (
                        <span className="text-gray-400 text-sm">
                          Sin insignias
                        </span>
                      )}

                      {member.badges.map((badge: any, i: number) => (
                        <div
                          key={i}
                          className="bg-white p-3 rounded-2xl shadow hover:scale-110 transition-all"
                        >
                          {badge.badge_icon || "🏆"}
                        </div>
                      ))}

                    </div>

                  </div>
                );
              })}

            </div>

          </div>

        </div>

      </main>

      {/* 🔔 MODALES DE NOVEDADES */}
      {announcements.length > 0 && userId &&
        announcements.map((ann) => (
          <AnnouncementModal
            key={ann.id}
            announcement={ann}
            userId={userId}
            onClose={(closedId: string) => {
              setAnnouncements(prev =>
                prev.filter(a => a.id !== closedId)
              );
            }}
          />
        ))
      }

      {/* 🤖 BOT ASISTENTE */}
      <AssistantWidget />

    </>
  );
}