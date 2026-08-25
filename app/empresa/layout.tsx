"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@auth0/nextjs-auth0/client";
import { apiFetch } from "../../lib/api";
import { Business } from "./shared";
import BusinessSetupForm from "./components/BusinessSetupForm";
import EmpresaSidebar from "./components/EmpresaSidebar";
import { BranchProvider } from "./context/BranchContext";

export default function EmpresaLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const [loadingBusiness, setLoadingBusiness] = useState(true);
  const [business, setBusiness] = useState<Business | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/api/auth/login");
      return;
    }

    // Verificar si tiene el rol de EMPRESA o ADMIN
    const roles = (user["https://api.carvexio.com/roles"] as string[]) || [];
    if (!roles.includes("EMPRESA") && !roles.includes("ADMIN")) {
      router.replace("/");
      return;
    }

    setLoadingBusiness(true);
    apiFetch<Business>("/business/me")
      .then(biz => {
        setBusiness(biz);
        setNeedsSetup(false);
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("401") || msg.includes("403")) {
          router.replace("/api/auth/login");
        } else {
          setNeedsSetup(true);
        }
      })
      .finally(() => setLoadingBusiness(false));
  }, [router, user, isLoading]);

  if (isLoading || loadingBusiness) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
          <p className="text-sm text-slate-400">Cargando...</p>
        </div>
      </div>
    );
  }

  if (needsSetup && user) {
    return (
      <BusinessSetupForm
        onCreated={(biz) => {
          setBusiness(biz);
          setNeedsSetup(false);
        }}
      />
    );
  }

  // Blocker for Rejected or Blocked businesses
  if (business && (business.status === "REJECTED" || business.status === "BLOCKED")) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full border border-slate-200 rounded-3xl p-8 text-center shadow-lg space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto text-2xl">
            {business.status === "BLOCKED" ? "🚫" : "❌"}
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900">
              {business.status === "BLOCKED" ? "Acceso Bloqueado" : "Registro Rechazado"}
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              {business.status === "BLOCKED" 
                ? "Tu cuenta de negocio ha sido bloqueada temporalmente por el administrador de la plataforma."
                : "Tu solicitud de registro de negocio no fue aprobada por el administrador."}
            </p>
            <p className="text-xs text-slate-400">
              Por favor, ponte en contacto con el soporte técnico para más información.
            </p>
          </div>
          <button
            onClick={() => { window.location.href = "/api/auth/logout"; }}
            className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-2xl hover:bg-slate-800 transition duration-300 shadow-sm"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {business?.status === "PENDING" && (
        <div className="bg-amber-50 border-b border-amber-200 px-5 py-3.5 text-amber-800 text-xs font-semibold flex items-center justify-between gap-3 shrink-0 animate-in slide-in-from-top duration-500">
          <div className="flex items-center gap-2.5">
            <span className="text-base leading-none">⏳</span>
            <span>
              Tu negocio está en revisión y pendiente de aprobación. Tus servicios y productos no serán visibles en el Marketplace público hasta que un administrador apruebe tu cuenta.
            </span>
          </div>
          <span className="bg-amber-100 text-amber-800 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0">
            Pendiente de Aprobación
          </span>
        </div>
      )}
      <BranchProvider>
        <div className="flex flex-1">
          <EmpresaSidebar business={business} email={user?.email} />
          <main className="flex-1 min-w-0 px-5 py-6 lg:px-8">
            {children}
          </main>
        </div>
      </BranchProvider>
    </div>
  );
}
