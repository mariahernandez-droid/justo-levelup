"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import AnnouncementModal from "@/components/AnnouncementModal";
import AssistantWidget from "@/components/AssistantWidget";

interface TeamMember {
  id: string;
  nickname: string;
  avatar_url: string | null;
  progress: number;
}

/* niveles */

function getLevel(progress: number) {

  if (progress === 100)
    return { name: "Pro SAC 👑", color: "text-yellow-600" };

  if (progress >= 81)
    return { name: "Experto 🟣", color: "text-purple-600" };

  if (progress >= 61)
    return { name: "Avanzado 🔵", color: "text-blue-600" };

  if (progress >= 41)
    return { name: "Operativo 🟠", color: "text-orange-600" };

  if (progress >= 21)
    return { name: "Junior 🟡", color: "text-yellow-500" };

  return { name: "En formación 🌱", color: "text-green-600" };

}

export default function Dashboard() {

  const router = useRouter();

  const [supabase, setSupabase] =
    useState<ReturnType<typeof getSupabase> | null>(null);

  const [loading, setLoading] = useState(true);

  const [nickname, setNickname] = useState("");
  const [avatar, setAvatar] = useState("");
  const [progress, setProgress] = useState(0);

  const [team, setTeam] = useState<TeamMember[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {

    const sb = getSupabase();
    setSupabase(sb);

    const init = async () => {

      const { data: userData } = await sb.auth.getUser();

      if (!userData.user) {
        router.push("/login");
        return;
      }

      const user = userData.user;
      setUserId(user.id);

      /* PERFIL */

      const { data: profile } = await sb
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setNickname(profile?.nickname || "");
      setAvatar(profile?.avatar_url || "");

      /* ANUNCIOS */

      const { data: allAnnouncements } = await sb
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });

      if (allAnnouncements?.length) {

        const { data: readRecords } = await sb
          .from("announcement_reads")
          .select("announcement_id")
          .eq("user_id", user.id);

        const readIds =
          readRecords?.map(
            (r: { announcement_id: string }) =>
              r.announcement_id
          ) || [];

        const unread = allAnnouncements.filter(
          (ann: { id: string }) =>
            !readIds.includes(ann.id)
        );

        setAnnouncements(unread);

      }

      /* PROCESOS */

      const { data: processes } = await sb
        .from("processes")
        .select("id")
        .eq("published", true);

      const totalProcesses = processes?.length || 0;

      const { data: completions } = await sb
        .from("process_completions")
        .select("user_id, process_id");

      const myCompletions =
        completions?.filter(
          (c) => c.user_id === user.id
        ) || [];

      const myProgress =
        totalProcesses > 0
          ? Math.round(
              (myCompletions.length / totalProcesses) * 100
            )
          : 0;

      setProgress(myProgress);

      /* LEADERBOARD */

      const { data: profiles } = await sb
        .from("profiles")
        .select("*");

      const teamWithProgress: TeamMember[] =
        profiles?.map((member: any) => {

          const memberCompletions =
            completions?.filter(
              (c) => c.user_id === member.id
            ) || [];

          const percentage =
            totalProcesses > 0
              ? Math.round(
                  (memberCompletions.length /
                    totalProcesses) *
                    100
                )
              : 0;

          return {
            ...member,
            progress: percentage
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

  if (!supabase || loading)
    return <p className="p-10">Cargando...</p>;

  const myLevel = getLevel(progress);

  return (

    <>

      <main className="min-h-screen p-10 bg-gradient-to-br from-indigo-200 via-purple-200 to-pink-200">

        <div className="max-w-6xl mx-auto space-y-12">

          {/* PERFIL */}

          <div className="bg-white/60 backdrop-blur-xl p-10 rounded-3xl shadow-2xl flex justify-between items-center">

            <div>

              <h1 className="text-4xl font-bold mb-2">
                Hola, {nickname} 👋
              </h1>

              <div className="w-80 bg-white rounded-full h-5 mt-4 overflow-hidden">

                <div
                  className="bg-gradient-to-r from-purple-600 to-pink-600 h-5 rounded-full"
                  style={{ width: `${progress}%` }}
                />

              </div>

              <p className="mt-3 font-semibold text-lg">
                {progress}% completado
              </p>

              <p className={`text-xl font-bold ${myLevel.color}`}>
                Nivel: {myLevel.name}
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

            <div className="grid md:grid-cols-2 gap-8">

              {team.map((member, index) => {

                const medal =
                  index === 0 ? "🥇" :
                  index === 1 ? "🥈" :
                  index === 2 ? "🥉" : "";

                const level = getLevel(member.progress);

                return (

                  <div
                    key={member.id}
                    className="bg-gradient-to-br from-white to-purple-50 p-6 rounded-3xl shadow-md"
                  >

                    <div className="flex items-center gap-4 mb-4">

                      <img
                        src={
                          member.avatar_url ||
                          "https://api.dicebear.com/7.x/adventurer/svg?seed=User"
                        }
                        className="w-16 h-16 rounded-full"
                      />

                      <div>

                        <p className="font-bold text-lg">
                          {medal} {member.nickname}
                        </p>

                        <p className="text-sm text-gray-500">
                          {member.progress}% completado
                        </p>

                        <p className={`text-sm font-semibold ${level.color}`}>
                          {level.name}
                        </p>

                      </div>

                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-4">

                      <div
                        className="bg-gradient-to-r from-purple-600 to-pink-600 h-4 rounded-full"
                        style={{
                          width: `${member.progress}%`
                        }}
                      />

                    </div>

                  </div>

                );

              })}

            </div>

          </div>

        </div>

      </main>

      {announcements.length > 0 &&
        userId &&
        announcements.map((ann) => (

          <AnnouncementModal
            key={ann.id}
            announcement={ann}
            userId={userId}
            onClose={(closedId: string) => {
              setAnnouncements((prev) =>
                prev.filter((a) => a.id !== closedId)
              );
            }}
          />

        ))}

      <AssistantWidget />

    </>

  );

}