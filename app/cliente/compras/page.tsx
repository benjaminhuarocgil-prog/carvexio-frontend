"use client";

import { useEffect, useState, useMemo } from "react";
import { apiFetch } from "../../../lib/api";
import { Order } from "../shared";
import MercadoPagoButton from "../../../components/features/MercadoPagoButton";

const getStatusColor = (status: string) => {
  switch (status) {
    case "PENDING": return "bg-amber-100 text-amber-700";
    case "PAID": return "bg-emerald-100 text-emerald-700";
    case "PREPARING": return "bg-blue-100 text-blue-700";
    case "SHIPPED": return "bg-indigo-100 text-indigo-700";
    case "READY_FOR_PICKUP": return "bg-purple-100 text-purple-700";
    case "DELIVERED": return "bg-slate-100 text-slate-600";
    case "CANCELLED": return "bg-rose-100 text-rose-700";
    default: return "bg-slate-100 text-slate-500";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "PENDING": return "Pendiente de Pago";
    case "PAID": return "Pagado / Confirmado";
    case "PREPARING": return "Preparando pedido";
    case "SHIPPED": return "En camino (Delivery)";
    case "READY_FOR_PICKUP": return "Listo para recoger";
    case "DELIVERED": return "Entregado";
    case "CANCELLED": return "Cancelado";
    default: return status;
  }
};

const getTrackingSteps = (deliveryMethod?: string) => deliveryMethod === "DELIVERY"
  ? [
      { status: "PREPARING", label: "Preparando" },
      { status: "SHIPPED", label: "En camino" },
      { status: "DELIVERED", label: "Entregado" },
    ]
  : [
      { status: "PREPARING", label: "Preparando" },
      { status: "READY_FOR_PICKUP", label: "Listo para recojo" },
      { status: "DELIVERED", label: "Entregado" },
    ];

function TrackingIcon({ status }: { status: string }) {
  const shared = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (status === "PREPARING") return <svg {...shared}><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>;
  if (status === "SHIPPED") return <svg {...shared}><path d="M3 6h11v10H3z"/><path d="M14 9h4l3 3v4h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></svg>;
  if (status === "READY_FOR_PICKUP") return <svg {...shared}><path d="M3 10h18v10H3z"/><path d="M2 10 5 4h14l3 6"/><path d="M9 14h6"/></svg>;
  return <svg {...shared}><circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16.5 9"/></svg>;
}

export default function ClienteComprasPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [businessLogos, setBusinessLogos] = useState<Record<number, string>>({});
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;

      const matchId = order.id.toString().includes(q) || `#${order.id}`.includes(q);
      const matchBusiness = (order.businessName?.toLowerCase() || "").includes(q);
      const matchStatus = getStatusLabel(order.status).toLowerCase().includes(q);
      const matchProducts = order.items?.some(item =>
        (item.productName?.toLowerCase() || "").includes(q)
      );

      return matchId || matchBusiness || matchStatus || matchProducts;
    });
  }, [orders, searchQuery]);

  const loadOrders = () => {
    setLoading(true);
    apiFetch<Order[]>("/orders/my")
      .then(data => setOrders(Array.isArray(data) ? data : []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  const hideOrder = async (id: number) => {
    if (!confirm("¿Quitar este pedido de tu historial? El taller conservará el registro para su gestión.")) return;
    try {
      await apiFetch(`/orders/${id}/my-history`, { method: "DELETE" });
      setOrders(previous => previous.filter(order => order.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo quitar el pedido.");
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    if (orders.length === 0) return;
    const uniqueBizIds = Array.from(new Set(orders.map(o => o.businessId).filter(Boolean)));
    uniqueBizIds.forEach(async (id) => {
      try {
        const biz = await apiFetch<{ logoUrl?: string | null; photoUrl?: string | null }>(`/business/public/${id}`);
        const logo = biz.logoUrl || biz.photoUrl;
        if (logo) {
          setBusinessLogos(prev => ({ ...prev, [id]: logo }));
        }
      } catch (e) {
        console.error("Error al cargar logo del negocio", id, e);
      }
    });
  }, [orders]);



  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Mis Compras</h1>
          <p className="mt-0.5 text-sm text-slate-500">Sigue el estado de tus piezas y repuestos adquiridos</p>
        </div>

        {orders.length > 0 && (
          <div className="relative w-full md:w-72">
            <input
              type="text"
              placeholder="Buscar por pedido, producto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-4 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-900"
            />
            <svg className="absolute left-3 top-3 text-slate-400" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="h-8 w-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-[2rem] border border-slate-100 p-16 text-center shadow-sm">
          <div className="h-20 w-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg>
          </div>
          <h3 className="text-xl font-bold text-slate-900">Aún no has comprado nada</h3>
          <p className="text-slate-500 mt-2 max-w-sm mx-auto">Explora el marketplace y equipa tu auto con los mejores repuestos.</p>
          <a href="/business" className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-500 transition shadow-lg shadow-blue-600/20">
            Ir a comprar
          </a>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-[2rem] border border-dashed border-slate-200 p-12 text-center">
          <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
          </div>
          <h3 className="text-lg font-bold text-slate-900">No se encontraron resultados</h3>
          <p className="text-slate-500 mt-1 max-w-sm mx-auto">No hay compras que coincidan con tu búsqueda "{searchQuery}".</p>
          <button
            onClick={() => setSearchQuery("")}
            className="mt-4 text-sm text-blue-600 font-bold hover:underline"
          >
            Limpiar búsqueda
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map(order => (
            <div key={order.id} className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-300">
              {/* Card Header */}
              <div className="p-6 md:p-8 bg-slate-50/50 border-b border-slate-100">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="h-12 w-16 flex items-center justify-center shrink-0 overflow-hidden">
                      {businessLogos[order.businessId] ? (
                        <img
                          src={businessLogos[order.businessId]}
                          alt={order.businessName}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /></svg>
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Vendido por / Empresa:</span>
                      <span className="text-lg font-black text-slate-900 flex items-center gap-2">
                        {order.businessName || "Empresa Automotriz"}
                        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg">#Pedido {order.id}</span>
                      </span>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wide ${getStatusColor(order.status)}`}>{getStatusLabel(order.status)}</div>
                      <button onClick={() => void hideOrder(order.id)} title="Quitar de mi historial" className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-rose-50 hover:text-rose-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v5M14 11v5"/></svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botón de Pago (ahora con botón de prueba) */}
              {order.status === "PENDING" && (
                <div className="px-6 md:px-8 -mt-2 mb-4">
                  <MercadoPagoButton
                    orderId={order.id}
                    title={order.businessName}
                    amount={order.totalAmount}
                    onSuccess={loadOrders}
                  />
                </div>
              )}
              {/* Card Body */}
              <div className="p-6 md:p-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Items comprados</h4>
                    <div className="space-y-3">
                      {order.items.map(item => (
                        <div key={item.id} className="flex justify-between items-center text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-900">{item.quantity}x</span>
                            <span className="text-slate-600 font-medium">{item.productName}</span>
                          </div>
                          <span className="font-bold text-slate-900">S/ {item.subtotal.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-500">Total pagado</span>
                      <span className="text-xl font-black text-slate-900">S/ {(order.paidAmount ?? order.totalAmount).toFixed(2)}</span>
                    </div>
                    {(order.discountAmount ?? 0) > 0 && <p className="mt-2 text-right text-xs font-bold text-emerald-600">Recompensa Carvex aplicada: - S/ {order.discountAmount?.toFixed(2)}</p>}
                  </div>

                  <div className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100 flex flex-col justify-center">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-1 h-2 w-2 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.6)]" />
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                            {order.deliveryMethod === "DELIVERY" ? "Envío a domicilio:" : "Recojo en tienda:"}
                          </p>
                          <p className="text-sm text-slate-700 font-semibold">{order.address || "Recojo en el taller del vendedor"}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="mt-1 h-2 w-2 rounded-full bg-slate-300" />
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Contacto:</p>
                          <p className="text-sm text-slate-700 font-semibold">{order.phone}</p>
                        </div>
                      </div>
                      {order.notes && (
                        <div className="flex items-start gap-3">
                          <div className="mt-1 h-2 w-2 rounded-full bg-slate-300" />
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Tus notas:</p>
                            <p className="text-sm text-slate-500 italic">"{order.notes}"</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Seguimiento visual del pedido */}
              {order.status !== "PENDING" && order.status !== "CANCELLED" && (() => {
                const steps = getTrackingSteps(order.deliveryMethod);
                const currentIndex = steps.findIndex(step => step.status === order.status);
                return (
                  <div className="mx-6 md:mx-8 mb-8 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-white px-5 py-4">
                    <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-blue-700">Seguimiento de tu pedido</p>
                    <div className="flex items-start">
                      {steps.map((step, index) => {
                        const completed = currentIndex >= index || order.status === "DELIVERED";
                        return (
                          <div key={step.status} className="flex flex-1 items-start last:flex-none">
                            <div className="min-w-0 text-center">
                              <div className={`mx-auto flex h-9 w-9 items-center justify-center rounded-xl border-2 transition ${completed ? "border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-200" : "border-slate-200 bg-white text-slate-300"}`}>
                                <TrackingIcon status={step.status} />
                              </div>
                              <p className={`mt-2 text-[10px] font-black leading-tight ${completed ? "text-emerald-700" : "text-slate-400"}`}>{step.label}</p>
                            </div>
                            {index < steps.length - 1 && <div className={`mt-[18px] h-0.5 flex-1 mx-2 ${completed && currentIndex > index ? "bg-emerald-500" : "bg-slate-200"}`} />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
