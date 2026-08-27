"use client";

import { useEffect, useState } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../../lib/api";
import { PlatformNotification } from "../shared";

export default function AdminBusinessNotificationsPage() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [commissionRate, setCommissionRate] = useState<number | null>(null);
  const [notifications, setNotifications] = useState<PlatformNotification[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;
    const roles = (user?.["https://api.carvexio.com/roles"] as string[]) || [];
    if (!user) { router.replace("/api/auth/login"); return; }
    if (!roles.includes("ADMIN")) { router.replace("/"); return; }
    Promise.all([
      apiFetch<{ commissionRate: number }>("/admin/commission"),
      apiFetch<PlatformNotification[]>("/admin/business-notifications"),
    ]).then(([commission, history]) => {
      setCommissionRate(commission.commissionRate);
      setNotifications(Array.isArray(history) ? history : []);
    }).catch(err => setError(err instanceof Error ? err.message : "No se pudieron cargar las notificaciones."));
  }, [isLoading, router, user]);

  const send = async () => {
    if (!message.trim()) return;
    try {
      setSaving(true); setError(null);
      const notification = await apiFetch<PlatformNotification>("/admin/business-notifications", {
        method: "POST", body: JSON.stringify({ message }),
      });
      setNotifications(previous => [notification, ...previous]);
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar el aviso.");
    } finally { setSaving(false); }
  };

  return <>
    <header>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Notificaciones a negocios</h1>
      <p className="mt-1 text-sm text-slate-500">Avisa a todos los negocios aprobados antes de aplicar una nueva comisión.</p>
    </header>
    {error && <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Configurar descripción de alerta</h2>
          <p className="mt-1 text-xs text-slate-500">La comisión vigente es {commissionRate ?? "—"}%. El aviso se enviará a todos los negocios aprobados.</p>
        </div>
        <span className="rounded-full bg-violet-100 px-3 py-1.5 text-xs font-bold text-violet-700">Comisión actual: {commissionRate ?? "—"}%</span>
      </div>
      <textarea value={message} onChange={event => setMessage(event.target.value)} rows={5}
        placeholder="Ejemplo: Informamos que la comisión de la plataforma cambiará a 27% desde hoy debido a..."
        className="mt-4 w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100" />
      <div className="mt-3 flex justify-end">
        <button type="button" onClick={send} disabled={saving || !message.trim()}
          className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50">
          {saving ? "Enviando..." : "Enviar a negocios"}
        </button>
      </div>
    </section>
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-bold text-slate-900">Historial de avisos enviados</h2>
      <div className="mt-4 space-y-3">
        {notifications.length === 0 ? <p className="py-4 text-center text-sm text-slate-400">Aún no has enviado avisos.</p> : notifications.map(notification => (
          <article key={notification.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{notification.message}</p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
              <span>Comisión informada: {notification.commissionRate ?? "—"}%</span>
              <span>{new Date(notification.createdAt).toLocaleString("es-PE", { dateStyle: "long", timeStyle: "short" })}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  </>;
}
