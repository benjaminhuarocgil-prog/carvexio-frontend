"use client";

import { useRouter } from "next/navigation";
import { Fragment, useEffect, useState } from "react";
import { apiFetch } from "../../../lib/api";
import { useUser } from "@auth0/nextjs-auth0/client";
import { AdminBusiness, AdminBusinessPurchase, statusColor, statusLabel } from "../shared";
import { formatPeruDateTime } from "../../../lib/datetime";

export default function AdminNegociosPage() {
  const router = useRouter();
  const { user, isLoading } = useUser();

  const [businesses, setBusinesses] = useState<AdminBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyBizId, setBusyBizId] = useState<number | null>(null);
  const [hoveredBusinessId, setHoveredBusinessId] = useState<number | null>(null);
  const [purchasesByBusiness, setPurchasesByBusiness] = useState<Record<number, AdminBusinessPurchase[]>>({});
  const [loadingPurchasesId, setLoadingPurchasesId] = useState<number | null>(null);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/api/auth/login");
      return;
    }

    const roles = (user["https://api.carvexio.com/roles"] as string[]) || [];
    if (!roles.includes("ADMIN")) {
      router.replace("/");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setLoading(true); setError(null);
        const bizData = await apiFetch<AdminBusiness[]>("/admin/businesses");
        if (cancelled) return;
        setBusinesses(Array.isArray(bizData) ? bizData : []);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error al cargar datos");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [router, isLoading, user]);

  const moderateBiz = async (bizId: number, action: "approve" | "reject" | "block") => {
    const labels = { approve: "aprobar", reject: "rechazar", block: "bloquear" };
    if (!confirm(`¿${labels[action]} este negocio?`)) return;
    try {
      setBusyBizId(bizId);
      await apiFetch(`/admin/businesses/${bizId}/${action}`, { method: "PUT" });
      const newStatus = { approve: "APPROVED", reject: "REJECTED", block: "BLOCKED" }[action];
      setBusinesses(prev => prev.map(b => b.id === bizId ? { ...b, status: newStatus } : b));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al moderar negocio");
    } finally { setBusyBizId(null); }
  };

  const deleteBiz = async (bizId: number) => {
    if (!confirm("¿Eliminar este negocio POR COMPLETO? Esta acción no se puede deshacer.")) return;
    try {
      setBusyBizId(bizId);
      await apiFetch(`/admin/businesses/${bizId}`, { method: "DELETE" });
      setBusinesses(prev => prev.filter(b => b.id !== bizId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar el negocio");
    } finally { setBusyBizId(null); }
  };

  const showApprovedBusinessPurchases = async (business: AdminBusiness) => {
    if (business.status !== "APPROVED") return;
    setHoveredBusinessId(business.id);
    if (purchasesByBusiness[business.id] !== undefined) return;

    try {
      setLoadingPurchasesId(business.id);
      const purchases = await apiFetch<AdminBusinessPurchase[]>(`/admin/businesses/${business.id}/purchases`);
      setPurchasesByBusiness(previous => ({
        ...previous,
        [business.id]: Array.isArray(purchases) ? purchases : [],
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar las compras del negocio");
    } finally {
      setLoadingPurchasesId(null);
    }
  };

  if (isLoading || !user) {
    return <div className="p-10 text-center">Cargando sesión...</div>;
  }

  return (
    <>
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Negocios</h1>
          <p className="mt-0.5 text-sm text-slate-500">Moderación de negocios (Auth0 Connected)</p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
            {user.name?.[0] || "A"}
          </div>
          <span className="text-sm font-medium text-slate-700">Admin</span>
        </div>
      </header>

      {error && (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Negocio</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Categoría</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Estado</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100" onMouseLeave={() => setHoveredBusinessId(null)}>
              {loading ? (
                <tr><td colSpan={4} className="px-5 py-8 text-sm text-center text-slate-400">Cargando...</td></tr>
              ) : businesses.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-8 text-sm text-center text-slate-400">No hay negocios.</td></tr>
              ) : businesses.map(b => (
                <Fragment key={b.id}>
                <tr onMouseEnter={() => showApprovedBusinessPurchases(b)} className="hover:bg-slate-50 transition">
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-slate-900">{b.name ?? "-"}</div>
                    <div className="text-xs text-slate-400">{b.address ?? "-"}</div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 text-xs">{b.category ?? "-"}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor(b.status)}`}>
                      {statusLabel(b.status)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => moderateBiz(b.id, "approve")} disabled={busyBizId === b.id || b.status === "APPROVED"}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-40">
                        Aprobar
                      </button>
                      <button type="button" onClick={() => moderateBiz(b.id, "block")} disabled={busyBizId === b.id || b.status === "BLOCKED"}
                        className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-40">
                        Bloquear
                      </button>
                      <button type="button" onClick={() => moderateBiz(b.id, "reject")} disabled={busyBizId === b.id || b.status === "REJECTED"}
                        className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-40">
                        Rechazar
                      </button>
                      <button type="button" onClick={() => deleteBiz(b.id)} disabled={busyBizId === b.id}
                        className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 disabled:opacity-40 ml-2">
                        Borrar
                      </button>
                    </div>
                  </td>
                </tr>
                {b.status === "APPROVED" && hoveredBusinessId === b.id && (
                  <tr className="bg-emerald-50/50">
                    <td colSpan={4} className="px-5 py-4">
                      <div className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div>
                            <div className="text-xs font-bold text-slate-900">Compras pagadas de {b.name ?? "este negocio"}</div>
                            <div className="mt-0.5 text-[11px] text-slate-500">Monto cobrado, reparto y fecha de cada pedido.</div>
                          </div>
                          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700">Negocio aprobado</span>
                        </div>
                        {loadingPurchasesId === b.id ? (
                          <p className="py-3 text-center text-xs text-slate-400">Cargando compras...</p>
                        ) : (purchasesByBusiness[b.id] ?? []).length === 0 ? (
                          <p className="py-3 text-center text-xs text-slate-400">Aún no hay compras pagadas para este negocio.</p>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full min-w-[680px] text-left text-xs">
                              <thead className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400">
                                <tr>
                                  <th className="pb-2 font-semibold">Pedido</th>
                                  <th className="pb-2 font-semibold">Compra</th>
                                  <th className="pb-2 font-semibold">Admin</th>
                                  <th className="pb-2 font-semibold">Taller</th>
                                  <th className="pb-2 font-semibold">Fecha y hora</th>
                                  <th className="pb-2 font-semibold">Estado</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50 text-slate-600">
                                {(purchasesByBusiness[b.id] ?? []).map(purchase => (
                                  <tr key={purchase.orderId}>
                                    <td className="py-2.5 font-semibold text-slate-800">#{purchase.orderId}</td>
                                    <td className="py-2.5">S/ {purchase.paidAmount.toLocaleString("es-PE", { minimumFractionDigits: 2 })}</td>
                                    <td className="py-2.5 font-semibold text-violet-700">S/ {purchase.adminAmount.toLocaleString("es-PE", { minimumFractionDigits: 2 })} <span className="font-normal text-slate-400">({purchase.commissionRate}%)</span></td>
                                    <td className="py-2.5 font-semibold text-emerald-700">S/ {purchase.businessAmount.toLocaleString("es-PE", { minimumFractionDigits: 2 })}</td>
                                    <td className="py-2.5">{formatPeruDateTime(purchase.createdAt)}</td>
                                    <td className="py-2.5"><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">{purchase.status}</span></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
