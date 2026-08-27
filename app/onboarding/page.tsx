"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "../../lib/api";
import { useUser } from "@auth0/nextjs-auth0/client";

export default function OnboardingPage() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selecting, setSelecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSelectRole = async (role: "CLIENTE" | "EMPRESA") => {
    try {
      setSelecting(role);
      setError(null);

      const res = await fetch("/api/auth/set-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });

      if (!res.ok) throw new Error("No se pudo guardar tu elección");
      const referralCode = searchParams.get("ref");
      if (role === "CLIENTE" && referralCode) await apiFetch(`/referrals/claim?code=${encodeURIComponent(referralCode)}`, { method: "POST" });

      // Redirigir directo al dashboard correcto (forzando re-login para refrescar el token)
      const returnTo = role === "EMPRESA" ? "/empresa/dashboard" : "/cliente/dashboard";
      window.location.href = `/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al procesar");
      setSelecting(null);
    }
  };

  const handleBack = () => {
    window.location.href = "/api/auth/logout?returnTo=" + encodeURIComponent("http://localhost:3000");
  };

  if (isLoading) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-3xl">
        {/* Botón retroceder */}
        <button
          onClick={handleBack}
          className="mb-8 flex items-center gap-2 text-sm text-slate-400 hover:text-slate-600 transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Volver al inicio
        </button>
        <div className="text-center mb-12">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 shadow-xl shadow-indigo-200 mb-6 text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">¡Bienvenido a Carvexio!</h1>
          <p className="mt-3 text-slate-500 text-lg">Para empezar, dinos cómo planeas usar la plataforma</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-center text-sm font-medium">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Opción Cliente */}
          <button
            disabled={!!selecting}
            onClick={() => handleSelectRole("CLIENTE")}
            className={`group relative flex flex-col items-center p-8 rounded-3xl border-2 transition-all duration-300 text-center ${
              selecting === "CLIENTE" 
                ? "border-blue-600 bg-blue-50/50 ring-4 ring-blue-100" 
                : "border-white bg-white hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-100"
            }`}
          >
            <div className="h-20 w-20 rounded-2xl bg-blue-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 text-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-1.1 0-2 .9-2 2v7c0 1.1.9 2 2 2h10"/><circle cx="7" cy="17" r="2"/><circle cx="15" cy="17" r="2"/></svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Soy Cliente</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Busco servicios mecánicos, quiero agendar citas y comprar repuestos para mi vehículo.
            </p>
            {selecting === "CLIENTE" && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-3xl">
                <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent animate-spin rounded-full" />
              </div>
            )}
          </button>

          {/* Opción Empresa */}
          <button
            disabled={!!selecting}
            onClick={() => handleSelectRole("EMPRESA")}
            className={`group relative flex flex-col items-center p-8 rounded-3xl border-2 transition-all duration-300 text-center ${
              selecting === "EMPRESA" 
                ? "border-orange-600 bg-orange-50/50 ring-4 ring-orange-100" 
                : "border-white bg-white hover:border-orange-200 hover:shadow-2xl hover:shadow-orange-100"
            }`}
          >
            <div className="h-20 w-20 rounded-2xl bg-orange-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 text-orange-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M5 21V7l8-4 8 4v14"/><path d="M9 9h1"/><path d="M9 13h1"/><path d="M9 17h1"/><path d="M14 9h1"/><path d="M14 13h1"/></svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Soy una Empresa</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Tengo un taller o tienda, quiero gestionar mis servicios, clientes e inventario.
            </p>
            {selecting === "EMPRESA" && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-3xl">
                <div className="h-8 w-8 border-4 border-orange-600 border-t-transparent animate-spin rounded-full" />
              </div>
            )}
          </button>
        </div>

        <p className="mt-12 text-center text-slate-400 text-sm italic">
          Esta elección configurará tu experiencia personalizada en la plataforma.
        </p>
      </div>
    </div>
  );
}
