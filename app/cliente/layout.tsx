"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@auth0/nextjs-auth0/client";
import { apiFetch } from "../../lib/api";
import { UserProfile } from "./shared";
import ClienteSidebar from "./components/ClienteSidebar";

export default function ClienteLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/api/auth/login");
      return;
    }

    setLoadingProfile(true);
    apiFetch<UserProfile>("/users/me")
      .then(p => setProfile(p))
      .catch(() => { }) // non-critical
      .finally(() => setLoadingProfile(false));
  }, [router, user, isLoading]);

  if (isLoading || loadingProfile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
          <p className="text-sm text-slate-400">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex">
        <ClienteSidebar profile={profile} email={user?.email} />
        <main className="flex-1 min-w-0 px-5 py-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );




}
