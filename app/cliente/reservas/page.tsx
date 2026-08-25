"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "../../../lib/api";
import { Booking, statusColor, statusLabel } from "../shared";

export default function ClienteReservasPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const bookingData = await apiFetch<Booking[]>("/bookings/my");
        setBookings(Array.isArray(bookingData) ? bookingData : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar reservas");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const cancelBooking = async (id: number) => {
    if (!confirm("¿Cancelar esta reserva?")) return;
    try {
      await apiFetch(`/bookings/${id}/cancel`, { method: "PUT" });
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: "CANCELLED" } : b));
    } catch { setError("No se pudo cancelar la reserva"); }
  };

  const activeBookings = bookings.filter(b => b.status === "PENDING" || b.status === "CONFIRMED");

  return (
    <>
      <header className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Mis Reservas</h1>
          <p className="mt-0.5 text-sm text-slate-500">Reservas activas y próximas citas</p>
        </div>
      </header>

      {error && (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-sm text-slate-400">Cargando...</div>
        ) : activeBookings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
            <div className="text-slate-300 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto"><rect width="18" height="18" x="3" y="4" rx="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
            </div>
            <p className="text-sm text-slate-500">No tienes reservas activas</p>
            <Link href="/business">
              <button type="button" className="mt-4 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 transition">
                Buscar servicios
              </button>
            </Link>
          </div>
        ) : activeBookings.map(b => (
          <div key={b.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
              </div>
              <div>
                <div className="font-semibold text-slate-900">{b.serviceName ?? "-"}</div>
                <div className="text-sm text-slate-500">
                  {b.businessName ?? "-"}
                  {(b.branch?.name || b.localName) && ` — ${b.branch?.name || b.localName}`}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">{b.date} · {b.time?.slice(0, 5) ?? "-"}</div>
                {b.notes && (
                  <div className="text-[11px] text-slate-400 mt-2 bg-slate-50 rounded-lg py-1 px-2 border border-slate-100 max-w-md italic truncate" title={b.notes}>
                    " {b.notes} "
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor(b.status)}`}>
                {statusLabel(b.status)}
              </span>
              <button type="button" onClick={() => cancelBooking(b.id)}
                className="px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition">
                Cancelar
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}