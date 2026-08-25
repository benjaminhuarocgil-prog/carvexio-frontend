"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "../../../lib/api";
import { useUser } from "@auth0/nextjs-auth0/client";
import { UserProfile, Booking, Cart } from "../shared";
import { StatCard } from "../components/StatCard";

export default function ClienteDashboardPage() {
  const { user, isLoading } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // form state
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading || !user) return;

    const loadData = async () => {
      try {
        setLoading(true);
        const [profileData, bookingData, cartData] = await Promise.all([
          apiFetch<UserProfile>("/users/me"),
          apiFetch<Booking[]>("/bookings/my"),
          apiFetch<Cart>("/cart"),
        ]);
        setProfile(profileData);
        setFormName(profileData.name ?? "");
        setFormPhone(profileData.phone ?? "");
        setBookings(Array.isArray(bookingData) ? bookingData : []);
        setCart(cartData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar datos");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user, isLoading]);

  const saveProfile = async () => {
    try {
      setSaving(true);
      await apiFetch("/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName, phone: formPhone }),
      });
      setSaveMsg("Perfil actualizado");
      setTimeout(() => setSaveMsg(null), 3000);
    } catch {
      setSaveMsg("Error al guardar");
    } finally { setSaving(false); }
  };

  const pendingBookings = bookings.filter(b => b.status === "PENDING" || b.status === "CONFIRMED").length;
  const completedBookings = bookings.filter(b => b.status === "COMPLETED").length;

  if (isLoading) return <div className="p-10 text-center">Cargando perfil...</div>;

  return (
    <>
      <header className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Mi Perfil</h1>
          <p className="mt-0.5 text-sm text-slate-500">Gestiona tu información personal (Auth0)</p>
        </div>
        <Link href="/business">
          <button type="button" className="hidden lg:flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 transition shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
            Buscar servicios
          </button>
        </Link>
      </header>

      {error && (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      <div className="space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Reservas activas" value={loading ? "—" : String(pendingBookings)}
            color="bg-blue-50 text-blue-600"
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>}
          />
          <StatCard label="Completados" value={loading ? "—" : String(completedBookings)}
            color="bg-emerald-50 text-emerald-600"
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12 a10 10 0 1 1 -5.93 -9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>}
          />
          <StatCard label="Items en carrito" value={loading ? "—" : String(cart?.items?.length ?? 0)}
            color="bg-orange-50 text-orange-600"
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42 a2 2 0 0 0 2 1.58 h9.78 a2 2 0 0 0 1.95 -1.57 l1.65 -7.43 H5.12" /></svg>}
          />
          <StatCard label="Total reservas" value={loading ? "—" : String(bookings.length)}
            color="bg-violet-50 text-violet-600"
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v5h5" /><path d="M3.05 13 A9 9 0 1 0 6 5.3 L3 8" /><path d="M12 7v5l4 2" /></svg>}
          />
        </div>

        {/* Profile form */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Información Personal</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Nombre completo</label>
              <input value={formName} onChange={e => setFormName(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Email</label>
              <input value={user?.email ?? ""} disabled
                className="w-full h-10 rounded-xl border border-slate-100 bg-slate-50 px-3 text-sm text-slate-400 cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Teléfono</label>
              <input value={formPhone} onChange={e => setFormPhone(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-5">
            <button type="button" onClick={saveProfile} disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 disabled:opacity-60 transition">
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
            {saveMsg && <span className="text-sm text-emerald-600 font-medium">{saveMsg}</span>}
          </div>
        </div>
      </div>
    </>
  );
}