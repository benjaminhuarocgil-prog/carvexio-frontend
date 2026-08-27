"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../../lib/api";
import { PlatformNotification } from "../shared";
import { formatPeruDateTime } from "../../../lib/datetime";

export default function EmpresaNotificationsPage() {
  const [notifications, setNotifications] = useState<PlatformNotification[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = () => apiFetch<PlatformNotification[]>("/business-notifications")
    .then(data => setNotifications(Array.isArray(data) ? data : []))
    .catch(err => setError(err instanceof Error ? err.message : "No se pudieron cargar las notificaciones."));
  useEffect(() => { load(); }, []);

  const dismiss = async (id: number) => {
    try {
      await apiFetch(`/business-notifications/${id}/dismiss`, { method: "PATCH" });
      setNotifications(previous => previous.map(item => item.id === id ? { ...item, dismissed: true } : item));
    } catch (err) { setError(err instanceof Error ? err.message : "No se pudo cerrar la notificación."); }
  };

  return <>
    <header><h1 className="text-2xl font-bold tracking-tight text-slate-900">Notificaciones</h1><p className="mt-1 text-sm text-slate-500">Avisos enviados por el administrador de la plataforma.</p></header>
    {error && <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
    <div className="mt-6 space-y-3">
      {notifications.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">No tienes notificaciones.</div> : notifications.map(notification => (
        <article key={notification.id} className={`rounded-2xl border p-5 shadow-sm ${notification.dismissed ? "border-slate-200 bg-slate-50 opacity-70" : "border-amber-200 bg-amber-50"}`}>
          <div className="flex items-start justify-between gap-4"><div><p className="text-sm font-bold text-slate-900">Notificación de la plataforma</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{notification.message}</p><p className="mt-3 text-xs text-slate-500">{formatPeruDateTime(notification.createdAt, { dateStyle: "long", timeStyle: "short" })}</p></div>
          {!notification.dismissed && <button type="button" onClick={() => dismiss(notification.id)} aria-label="Cerrar notificación" className="rounded-lg p-1 text-slate-500 hover:bg-white hover:text-slate-900">✕</button>}</div>
        </article>
      ))}
    </div>
  </>;
}
