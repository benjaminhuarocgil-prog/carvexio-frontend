"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../../lib/api";
import { Booking, Order } from "../shared";

type UnifiedHistoryItem = {
  id: string;
  type: "SERVICE" | "PRODUCT";
  title: string;
  businessName: string;
  date: string;
  amount?: number;
  status: string;
};

export default function ClienteHistorialPage() {
  const [historyItems, setHistoryItems] = useState<UnifiedHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [bookingData, orderData] = await Promise.all([
          apiFetch<Booking[]>("/bookings/my").catch(() => []),
          apiFetch<Order[]>("/orders/my").catch(() => [])
        ]);

        const finishedBookings: UnifiedHistoryItem[] = (Array.isArray(bookingData) ? bookingData : [])
          .filter(b => b.status === "COMPLETED" || b.status === "CANCELLED")
          .map(b => ({
            id: `booking-${b.id}`,
            type: "SERVICE",
            title: b.serviceName || "Servicio automotriz",
            businessName: b.businessName || "Taller",
            date: b.date ? `${b.date} ${b.time ? '· ' + b.time.slice(0, 5) : ''}` : "-",
            amount: b.servicePrice ?? undefined,
            status: b.status || "COMPLETED"
          }));

        const finishedOrders: UnifiedHistoryItem[] = (Array.isArray(orderData) ? orderData : [])
          .filter(o => o.status === "DELIVERED" || o.status === "CANCELLED")
          .map(o => {
            const itemNames = o.items ? o.items.map(i => `${i.quantity}x ${i.productName}`).join(", ") : `Pedido #${o.id}`;
            return {
              id: `order-${o.id}`,
              type: "PRODUCT",
              title: itemNames,
              businessName: o.businessName || "Empresa Automotriz",
              date: o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "-",
              amount: o.totalAmount,
              status: o.status
            };
          });

        const combined = [...finishedBookings, ...finishedOrders];
        setHistoryItems(combined);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar historial");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const getBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case "DELIVERED":
        return { label: "Entregado", cls: "bg-emerald-100 text-emerald-700 border border-emerald-200" };
      case "COMPLETED":
        return { label: "Completado", cls: "bg-emerald-100 text-emerald-700 border border-emerald-200" };
      case "CANCELLED":
        return { label: "Cancelado", cls: "bg-rose-100 text-rose-700 border border-rose-200" };
      default:
        return { label: status, cls: "bg-slate-100 text-slate-600 border border-slate-200" };
    }
  };

  return (
    <>
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Historial de Transacciones</h1>
          <p className="mt-0.5 text-sm text-slate-500">Servicios realizados y compras de productos entregadas</p>
        </div>
      </header>

      {error && (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Tipo</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Detalle</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Empresa / Taller</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Fecha</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Monto</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={6} className="px-5 py-8 text-sm text-slate-400 text-center">Cargando historial...</td></tr>
              ) : historyItems.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-8 text-sm text-slate-400 text-center">No hay registros en el historial aún.</td></tr>
              ) : historyItems.map(item => {
                const badge = getBadge(item.status);
                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3.5">
                      {item.type === "SERVICE" ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg">
                          🔧 Servicio
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-lg">
                          Compra Repuesto
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">{item.title}</td>
                    <td className="px-5 py-3.5 text-slate-600 font-medium">{item.businessName}</td>
                    <td className="px-5 py-3.5 text-slate-500 text-xs font-semibold">{item.date}</td>
                    <td className="px-5 py-3.5 font-black text-slate-900">
                      {item.amount !== undefined ? `S/ ${item.amount.toFixed(2)}` : "-"}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );




}
