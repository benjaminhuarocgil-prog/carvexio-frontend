"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "../../../lib/api";
import { useUser } from "@auth0/nextjs-auth0/client";
import { DashboardData, Booking, Product, ClientSummary, statusColor, statusLabel } from "../shared";
import { KpiCard } from "../components/KpiCard";
import { useBranch } from "../context/BranchContext";

export default function EmpresaDashboardPage() {
  const { user, isLoading } = useUser();
  const { selectedBranch } = useBranch();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading || !user) return;

    const loadData = async () => {
      try {
        setLoading(true);
        const query = selectedBranch ? `?localId=${selectedBranch.id}` : "";
        const [dashData, bookingData, clientData, productData] = await Promise.all([
          apiFetch<DashboardData>(`/dashboard${query}`),
          apiFetch<Booking[]>(`/bookings/business${query}`),
          apiFetch<ClientSummary[]>(`/crm/clients${query}`),
          apiFetch<Product[]>(`/products/my${query}`),
        ]);
        setDashboard(dashData);
        setBookings(Array.isArray(bookingData) ? bookingData : []);
        setClients(Array.isArray(clientData) ? clientData : []);
        setProducts(Array.isArray(productData) ? productData : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar el dashboard");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user, isLoading, selectedBranch]);

  const getLocalTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const isSameDay = (bookingDate?: string | null) => {
    if (!bookingDate) return false;
    const localToday = getLocalTodayStr();
    const cleanDate = bookingDate.split("T")[0].trim();
    return cleanDate === localToday;
  };

  const todayBookings = bookings.filter(b => isSameDay(b.date));
  const lowStock = products.filter(p => (p.stock ?? 0) <= 5);

  if (isLoading) return <div className="p-10 text-center">Cargando dashboard...</div>;

  return (
    <>
      <header className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard General</h1>
          <p className="mt-0.5 text-sm text-slate-500">Resumen integrado de Servicios y Ventas de Productos</p>
        </div>
      </header>

      {error && (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      <div className="space-y-5">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <KpiCard label="Reservas hoy" value={loading ? "—" : String(todayBookings.length)}
            sub="citas del día" color="bg-blue-50 text-blue-600"
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>}
          />

          <KpiCard label="Pedidos de Productos" value={loading ? "—" : String(dashboard?.pedidosTotales ?? 0)}
            sub={`${dashboard?.pedidosPendientes ?? 0} pendientes`} color="bg-amber-50 text-amber-600"
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8 a2 2 0 0 0 -1 -1.73 l-7 -4 a2 2 0 0 0 -2 0 l-7 4 A2 2 0 0 0 3 8 v8 a2 2 0 0 0 1 1.73 l7 4 a2 2 0 0 0 2 0 l7 -4 A2 2 0 0 0 21 16 Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>}
          />

          <KpiCard label="Ingresos Totales" value={loading ? "—" : `S/ ${(dashboard?.ingresosTotal ?? 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}`}
            sub={`Serv: S/ ${(dashboard?.ingresosServicios ?? 0).toLocaleString("es-PE")} | Prod: S/ ${(dashboard?.ingresosProductos ?? 0).toLocaleString("es-PE")}`}
            color="bg-emerald-50 text-emerald-600"
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5 a3.5 3.5 0 0 0 0 7 h5 a3.5 3.5 0 0 1 0 7 H6"/></svg>}
          />

          <KpiCard label="Venta Productos" value={loading ? "—" : `S/ ${(dashboard?.ingresosProductos ?? 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}`}
            sub="total acumulado" color="bg-indigo-50 text-indigo-600"
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42 a2 2 0 0 0 2 1.58 h9.78 a2 2 0 0 0 1.95 -1.57 l1.65 -7.43 H5.12"/></svg>}
          />

          <KpiCard label="Clientes únicos" value={loading ? "—" : String(dashboard?.clientesTotal ?? clients.length)}
            sub="servicios + productos" color="bg-violet-50 text-violet-600"
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2 a4 4 0 0 0 -4 -4H5 a4 4 0 0 0 -4 4 v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2 a4 4 0 0 0 -3 -3.87"/><path d="M16 3.13 a4 4 0 0 1 0 7.75"/></svg>}
          />

          <KpiCard label="Bajo stock" value={loading ? "—" : String(lowStock.length)}
            sub="productos críticos" color="bg-rose-50 text-rose-600"
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>}
          />
        </div>

        {/* Destacados Top */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="bg-gradient-to-r from-orange-500 to-amber-600 rounded-2xl p-5 text-white shadow-sm">
            <div className="text-xs font-bold uppercase tracking-wider opacity-80 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              Servicio más solicitado
            </div>
            <div className="mt-2 text-xl font-black">{dashboard?.servicioMasSolicitado ?? "Sin datos aún"}</div>
          </div>

          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-5 text-white shadow-sm">
            <div className="text-xs font-bold uppercase tracking-wider opacity-80 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              Producto más vendido
            </div>
            <div className="mt-2 text-xl font-black">{dashboard?.productoMasVendido ?? "Sin ventas aún"}</div>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {/* Citas de hoy */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-semibold text-slate-900">Citas de hoy</div>
              <Link href="/empresa/citas" className="text-xs text-orange-600 hover:underline font-medium">Ver todas &rarr;</Link>
            </div>
            {todayBookings.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">No hay citas hoy</p>
            ) : todayBookings.slice(0, 4).map(b => (
              <div key={b.id} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600 text-xs font-bold">
                    {b.time?.slice(0, 5) ?? "--"}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900">{b.serviceName ?? "-"}</div>
                    <div className="text-xs text-slate-400">{b.notes ?? "Sin notas"}</div>
                  </div>
                </div>
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${statusColor(b.status)}`}>
                  {statusLabel(b.status)}
                </span>
              </div>
            ))}
          </div>

          {/* Alertas stock */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-semibold text-slate-900">Alertas de inventario</div>
              <Link href="/empresa/inventario" className="text-xs text-orange-600 hover:underline font-medium">Ver todo &rarr;</Link>
            </div>
            {lowStock.length === 0 ? (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12 a10 10 0 1 1 -5.93 -9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                Stock en buen nivel
              </div>
            ) : lowStock.slice(0, 4).map(p => (
              <div key={p.id} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                <div>
                  <div className="text-sm font-medium text-slate-900">{p.name}</div>
                  <div className="text-xs text-slate-400">{p.brand ?? "-"} &middot; {p.category ?? "-"}</div>
                </div>
                <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold bg-rose-100 text-rose-700">
                  Stock: {p.stock}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

