"use client";

import { useEffect, useState, useMemo } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { apiFetch } from "../../../lib/api";
import { formatPeruDate, formatPeruTime } from "../../../lib/datetime";
import { Order } from "../shared";
import { useBranch } from "../context/BranchContext";

const getStatusStyle = (status: string) => {
  switch (status) {
    case "PENDING": return "bg-amber-100 text-amber-700 border-amber-200";
    case "PAID": return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "PREPARING": return "bg-blue-100 text-blue-700 border-blue-200";
    case "SHIPPED": return "bg-indigo-100 text-indigo-700 border-indigo-200";
    case "READY_FOR_PICKUP": return "bg-purple-100 text-purple-700 border-purple-200";
    case "DELIVERED": return "bg-slate-100 text-slate-600 border-slate-200";
    case "CANCELLED": return "bg-rose-100 text-rose-700 border-rose-200";
    default: return "bg-slate-100 text-slate-500";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "PENDING": return "Pendiente de Pago";
    case "PAID": return "Pagado / Nuevo";
    case "PREPARING": return "En Preparación";
    case "SHIPPED": return "Enviado / Delivery";
    case "READY_FOR_PICKUP": return "Listo para Recojo";
    case "DELIVERED": return "Entregado";
    case "CANCELLED": return "Cancelado";
    default: return status;
  }
};

export default function EmpresaPedidosPage() {
  const { user, isLoading } = useUser();
  const { selectedBranch } = useBranch();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;

      const matchId = order.id.toString().includes(q) || `#${order.id}`.includes(q);
      const matchClient = (order.clientName?.toLowerCase() || "").includes(q);
      const matchStatus = getStatusLabel(order.status).toLowerCase().includes(q);
      const matchProducts = order.items?.some(item =>
        (item.productName?.toLowerCase() || "").includes(q)
      );

      return matchId || matchClient || matchStatus || matchProducts;
    });
  }, [orders, searchQuery]);

  useEffect(() => {
    if (isLoading || !user) return;
    setLoading(true);
    const query = selectedBranch ? `?localId=${selectedBranch.id}` : "";
    apiFetch<Order[]>(`/orders/business${query}`)
      .then(data => setOrders(Array.isArray(data) ? data : []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [user, isLoading, selectedBranch]);

  const updateStatus = async (orderId: number, newStatus: string) => {
    try {
      setUpdatingId(orderId);
      await apiFetch(`/orders/${orderId}/status?status=${newStatus}`, { method: "PUT" });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (err) {
      alert("Error al actualizar el estado");
    } finally {
      setUpdatingId(null);
    }
  };



  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Pedidos Recibidos</h1>
          <p className="mt-0.5 text-sm text-slate-500">Gestiona las ventas de productos y repuestos de tu taller</p>
        </div>

        {orders.length > 0 && (
          <div className="relative w-full md:w-72">
            <input
              type="text"
              placeholder="Buscar por cliente, pedido o producto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-4 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 text-slate-900"
            />
            <svg className="absolute left-3 top-3 text-slate-400" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="h-8 w-8 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center">
          <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          </div>
          <h3 className="text-lg font-bold text-slate-900">Sin pedidos aún</h3>
          <p className="text-slate-500 mt-1 max-w-sm mx-auto">Cuando los clientes compren tus productos en el marketplace, aparecerán aquí.</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center">
          <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
          </div>
          <h3 className="text-lg font-bold text-slate-900">No se encontraron resultados</h3>
          <p className="text-slate-500 mt-1 max-w-sm mx-auto">No hay pedidos que coincidan con tu búsqueda "{searchQuery}".</p>
          <button
            onClick={() => setSearchQuery("")}
            className="mt-4 text-sm text-orange-500 font-bold hover:underline"
          >
            Limpiar búsqueda
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredOrders.map(order => (
            <div key={order.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
              <div className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 bg-slate-900 rounded-2xl flex flex-col items-center justify-center shadow-lg">
                      <span className="text-[10px] font-black text-white/50 uppercase">Order</span>
                      <span className="text-lg font-black text-white">#{order.id}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{order.clientName}</h3>
                      <p className="text-sm text-slate-500">Fecha: {formatPeruDate(order.createdAt)} a las {formatPeruTime(order.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold border ${getStatusStyle(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                    <div className="text-2xl font-black text-slate-900">S/ {order.totalAmount.toFixed(2)}</div>
                  </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                  {/* Detalles de envío */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Datos de Entrega</h4>
                    <div className="bg-slate-50 rounded-2xl p-5 space-y-3">
                      <div className="flex items-start gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400 mt-0.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                        <span className="text-sm text-slate-700 font-medium">{order.address || "Recojo en local"}</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400 mt-0.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                        <span className="text-sm text-slate-700 font-medium">{order.phone}</span>
                      </div>
                      {order.notes && (
                        <div className="pt-2 border-t border-slate-200">
                          <p className="text-xs text-slate-400 font-bold uppercase mb-1">Notas:</p>
                          <p className="text-xs text-slate-600 italic">"{order.notes}"</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Items */}
                  <div className="lg:col-span-2">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Productos</h4>
                    <div className="overflow-hidden border border-slate-100 rounded-2xl">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                          <tr>
                            <th className="px-5 py-3">Producto</th>
                            <th className="px-5 py-3 text-center">Cant</th>
                            <th className="px-5 py-3 text-right">Precio</th>
                            <th className="px-5 py-3 text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {order.items.map(item => (
                            <tr key={item.id}>
                              <td className="px-5 py-3 font-bold text-slate-700">{item.productName}</td>
                              <td className="px-5 py-3 text-center text-slate-500 font-medium">{item.quantity}</td>
                              <td className="px-5 py-3 text-right text-slate-500">S/ {item.priceAtPurchase.toFixed(2)}</td>
                              <td className="px-5 py-3 text-right font-black text-slate-900">S/ {item.subtotal.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Acciones de estado */}
                <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap items-center gap-3">
                  <span className="text-xs font-black text-slate-400 uppercase mr-2">Actualizar Estado:</span>
                  <button 
                    onClick={() => updateStatus(order.id, "PREPARING")}
                    disabled={updatingId === order.id || order.status === "PREPARING"}
                    className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-600 hover:text-white transition-all disabled:opacity-30"
                  >
                    Preparando
                  </button>
                  {order.deliveryMethod === "DELIVERY" && <button
                    onClick={() => updateStatus(order.id, "SHIPPED")}
                    disabled={updatingId === order.id || order.status === "SHIPPED"}
                    className="px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-bold hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-30"
                  >
                    En Camino
                  </button>}
                  {order.deliveryMethod !== "DELIVERY" && <button
                    onClick={() => updateStatus(order.id, "READY_FOR_PICKUP")}
                    disabled={updatingId === order.id || order.status === "READY_FOR_PICKUP"}
                    className="px-4 py-2 rounded-xl bg-purple-50 text-purple-700 text-xs font-bold hover:bg-purple-600 hover:text-white transition-all disabled:opacity-30"
                  >
                    Listo para Recojo
                  </button>}
                  <button 
                    onClick={() => updateStatus(order.id, "DELIVERED")}
                    disabled={updatingId === order.id || order.status === "DELIVERED"}
                    className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-600 hover:text-white transition-all disabled:opacity-30"
                  >
                    Entregado
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
