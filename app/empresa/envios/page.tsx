"use client";

import { useEffect, useState } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { apiFetch } from "../../../lib/api";
import { Order } from "../shared";
import { useBranch } from "../context/BranchContext";

const steps = [
  { status: "PREPARING", label: "Preparando", icon: "📦" },
  { status: "SHIPPED", label: "En camino", icon: "🚚" },
  { status: "DELIVERED", label: "Entregado", icon: "✅" },
];

export default function EmpresaEnviosPage() {
  const { user, isLoading } = useUser();
  const { selectedBranch } = useBranch();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = () => {
    const query = selectedBranch ? `?localId=${selectedBranch.id}` : "";
    setLoading(true);
    apiFetch<Order[]>(`/orders/business${query}`)
      .then(data => setOrders((Array.isArray(data) ? data : []).filter(order => order.deliveryMethod === "DELIVERY")))
      .catch(err => setError(err instanceof Error ? err.message : "No se pudieron cargar los envíos"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!isLoading && user) loadOrders();
  }, [isLoading, user, selectedBranch]);

  const confirmStep = async (orderId: number, status: string) => {
    try {
      setUpdatingId(orderId);
      setError(null);
      await apiFetch(`/orders/${orderId}/status?status=${status}`, { method: "PUT" });
      setOrders(current => current.map(order => order.id === orderId ? { ...order, status } : order));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar el envío");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-7 animate-in fade-in duration-500">
      <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-500">Logística</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">Envíos a domicilio</h1>
          <p className="mt-1 text-sm text-slate-500">Confirma cada etapa para que el cliente vea el seguimiento en tiempo real.</p>
        </div>
        <button onClick={loadOrders} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-600 shadow-sm hover:bg-slate-50">Actualizar lista</button>
      </header>

      {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-bold text-rose-700">{error}</div>}

      {loading ? <div className="py-20 text-center"><div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" /></div>
        : orders.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <div className="mb-4 text-5xl">🚚</div>
            <h2 className="text-lg font-black text-slate-900">No hay envíos a domicilio</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">Los pedidos donde el cliente elija delivery aparecerán aquí para que confirmes su avance.</p>
          </div>
        ) : (
          <div className="grid gap-5">
            {orders.map(order => {
              const currentIndex = steps.findIndex(step => step.status === order.status);
              return (
                <article key={order.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50/70 p-6 md:flex-row md:items-center md:justify-between">
                    <div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pedido #{order.id}</p><h2 className="mt-1 text-lg font-black text-slate-900">{order.clientName}</h2><p className="mt-1 text-sm font-medium text-slate-600">📍 {order.address || "Dirección pendiente"}</p></div>
                    <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-right"><p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Total</p><p className="text-xl font-black text-emerald-800">S/ {order.totalAmount.toFixed(2)}</p></div>
                  </div>
                  <div className="p-6">
                    <p className="mb-4 text-xs font-black uppercase tracking-widest text-slate-400">Confirma el avance del envío</p>
                    <div className="grid gap-3 md:grid-cols-3">
                      {steps.map((step, index) => {
                        const confirmed = currentIndex >= index || order.status === "DELIVERED";
                        const waitingForPreviousStep = index > 0 && currentIndex < index - 1;
                        const disabled = updatingId === order.id || confirmed || waitingForPreviousStep;
                        return <button key={step.status} disabled={disabled} onClick={() => confirmStep(order.id, step.status)}
                          className={`rounded-2xl border-2 p-4 text-left transition ${confirmed ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-slate-100 bg-white text-slate-600 hover:border-orange-300 hover:bg-orange-50"} disabled:cursor-default`}>
                          <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-2xl shadow-sm">{step.icon}</span><div><p className="text-sm font-black">{step.label}</p><p className={`mt-0.5 text-[11px] font-bold ${confirmed ? "text-emerald-600" : "text-slate-400"}`}>{confirmed ? "✓ Confirmado" : waitingForPreviousStep ? "Completa la etapa anterior" : "Confirmar etapa"}</p></div></div>
                        </button>;
                      })}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
    </div>
  );
}
