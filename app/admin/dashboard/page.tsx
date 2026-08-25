"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../../lib/api";
import { useUser } from "@auth0/nextjs-auth0/client";
import { AdminUser, AdminBusiness, KPIs, normalizeRoleLabel } from "../shared";
import { StatCard } from "../components/StatCard";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useUser();

  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [businesses, setBusinesses] = useState<AdminBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyBizId, setBusyBizId] = useState<number | null>(null);

  const totals = useMemo(() => {
    const total = users.length;
    const byRole = users.reduce((acc, u) => {
      const r = normalizeRoleLabel(u.role);
      acc[r] = (acc[r] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return { total, byRole };
  }, [users]);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/api/auth/login");
      return;
    }

    // Verificar si tiene el rol de ADMIN
    const roles = (user["https://api.carvexio.com/roles"] as string[]) || [];
    if (!roles.includes("ADMIN")) {
      router.replace("/");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setLoading(true); setError(null);
        // Nota: El backend ahora validará el token de Auth0 automáticamente
        // apiFetch debe ser actualizado para incluir el token de la sesión de Auth0
        const [kpiData, userData, bizData] = await Promise.all([
          apiFetch<KPIs>("/admin/dashboard"),
          apiFetch<AdminUser[]>("/admin/users"),
          apiFetch<AdminBusiness[]>("/admin/businesses"),
        ]);
        if (cancelled) return;
        setKpis(kpiData);
        setUsers(Array.isArray(userData) ? userData : []);
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

  if (isLoading || !user) {
    return <div className="p-10 text-center">Cargando sesión...</div>;
  }

  // Datos del gráfico de tendencia mensual (año actual)
  const monthlyData = kpis?.tendenciaMensual ?? [];
  const maxMonthly = Math.max(...monthlyData.map(m => m.totalRevenue), 0) || 1;

  // Parámetros de dimensiones para el gráfico SVG
  const chartWidth = 500;
  const chartHeight = 150;
  const points = monthlyData.map((m, idx) => {
    const x = (idx * (chartWidth - 65)) / 11 + 50;
    const y = chartHeight - (m.totalRevenue / maxMonthly) * (chartHeight - 45) - 20;
    return { x, y, label: m.monthName, val: m.totalRevenue };
  });

  const pathD = points.length > 0
    ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ")
    : "";

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${chartHeight - 15} L ${points[0].x} ${chartHeight - 15} Z`
    : "";

  return (
    <>
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard Admin</h1>
          <p className="mt-0.5 text-sm text-slate-500">KPIs globales (Auth0 Connected)</p>
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

      {/* Tarjetas principales KPI */}
      <section className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Total usuarios" tone="blue"
          value={loading ? "—" : String(kpis?.totalUsuarios ?? totals.total)}
          helper={`Admin: ${totals.byRole.ADMIN ?? 0} · Empresa: ${kpis?.totalEmpresas ?? 0} · Cliente: ${kpis?.totalClientes ?? 0}`}
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2 a4 4 0 0 0 -4 -4H5 a4 4 0 0 0 -4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2 a4 4 0 0 0 -3 -3.87" /><path d="M16 3.13 a4 4 0 0 1 0 7.75" /></svg>}
        />
        <StatCard title="Negocios" tone="orange"
          value={loading ? "—" : String(kpis?.totalNegocios ?? 0)}
          helper="Registrados en la plataforma"
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18" /><path d="M5 21V7 l8 -4 8 4v14" /></svg>}
        />
        <StatCard title="Reservas" tone="green"
          value={loading ? "—" : String(kpis?.totalReservas ?? 0)}
          helper="Total en la plataforma"
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>}
        />
        <StatCard title="Ingresos totales" tone="purple"
          value={loading ? "—" : `S/ ${(kpis?.ingresosTotales ?? 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}`}
          helper="De reservas completadas"
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>}
        />
      </section>

      {/* Sección de Ingresos y Tendencias */}
      <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Desglose de ingresos y comisiones */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-1 flex flex-col justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-900 mb-4">Desglose de Ingresos</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Hoy</div>
                <div className="text-sm font-bold text-slate-800 mt-1">
                  S/ {(kpis?.ingresosHoy ?? 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Últimos 7 días</div>
                <div className="text-sm font-bold text-slate-800 mt-1">
                  S/ {(kpis?.ingresosSieteDias ?? 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Este Mes</div>
                <div className="text-sm font-bold text-slate-800 mt-1">
                  S/ {(kpis?.ingresosMes ?? 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Este Año</div>
                <div className="text-sm font-bold text-slate-800 mt-1">
                  S/ {(kpis?.ingresosAnio ?? 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 border-t border-slate-100 pt-4">
            <div className="text-xs font-semibold text-slate-900 mb-2">Modelo de Comisión (Plataforma 10%)</div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Monto Bruto Total:</span>
                <span className="font-semibold text-slate-800">S/ {(kpis?.ingresosTotales ?? 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Ganancia Admin (10%):</span>
                <span className="font-semibold text-violet-600">S/ {(kpis?.gananciaAdmin ?? 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Pago a Negocios (90%):</span>
                <span className="font-semibold text-orange-600">S/ {(kpis?.pagoNegocios ?? 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}</span>
              </div>
              {/* Barra de progreso de comisión */}
              <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden flex mt-2">
                <div className="h-full bg-violet-500" style={{ width: "10%" }} title="Comisión Admin (10%)" />
                <div className="h-full bg-orange-500" style={{ width: "90%" }} title="Pago a Negocios (90%)" />
              </div>
            </div>
          </div>
        </div>

        {/* Gráfico de Tendencia Mensual */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-semibold text-slate-900">Tendencia Mensual de Ingresos</div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{new Date().getFullYear()}</span>
            </div>
            {monthlyData.length === 0 ? (
              <div className="h-[150px] flex items-center justify-center text-slate-400 text-xs">No hay datos históricos mensuales</div>
            ) : (
              <div className="w-full relative">
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto">
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Grid Lines */}
                  <line x1="45" y1={chartHeight - 15} x2={chartWidth - 15} y2={chartHeight - 15} stroke="#f8fafc" strokeWidth="1" />
                  <line x1="45" y1={chartHeight - 55} x2={chartWidth - 15} y2={chartHeight - 55} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="45" y1={chartHeight - 100} x2={chartWidth - 15} y2={chartHeight - 100} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />

                  {/* Area under the line */}
                  {areaD && <path d={areaD} fill="url(#chartGrad)" />}

                  {/* The Trend Line */}
                  {pathD && <path d={pathD} fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}

                  {/* Data Points */}
                  {points.map((p, idx) => (
                    <g key={idx} className="group">
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r="3.5"
                        className="fill-white stroke-violet-500 stroke-[2] transition hover:r-5 cursor-pointer"
                      />
                      <title>{`${p.label}: S/ ${p.val.toFixed(2)}`}</title>
                    </g>
                  ))}

                  {/* X Axis Labels */}
                  {points.map((p, idx) => (
                    <text
                      key={idx}
                      x={p.x}
                      y={chartHeight - 2}
                      textAnchor="middle"
                      className="text-[9px] font-semibold fill-slate-400 font-sans"
                    >
                      {p.label}
                    </text>
                  ))}

                  {/* Y Axis Labels */}
                  <text x="38" y={chartHeight - 11} textAnchor="end" className="text-[8px] font-bold fill-slate-400">S/ 0</text>
                  <text x="38" y={chartHeight - 51} textAnchor="end" className="text-[8px] font-bold fill-slate-400">S/ {(maxMonthly / 2).toFixed(0)}</text>
                  <text x="38" y={chartHeight - 96} textAnchor="end" className="text-[8px] font-bold fill-slate-400">S/ {maxMonthly.toFixed(0)}</text>
                </svg>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Sección de Recursos, Top Ventas y Moderación */}
      <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Métricas del Sistema */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-900">Métricas del Sistema</div>
            <div className="mt-4 space-y-3">
              {[
                { label: "Clientes", value: kpis?.totalClientes ?? 0, color: "bg-blue-500" },
                { label: "Empresas", value: kpis?.totalEmpresas ?? 0, color: "bg-orange-500" },
                { label: "Productos", value: kpis?.totalProductos ?? 0, color: "bg-violet-500" },
              ].map(item => {
                const maxVal = Math.max(kpis?.totalClientes ?? 0, kpis?.totalEmpresas ?? 0, kpis?.totalProductos ?? 0) || 1;
                const pct = Math.round((item.value / maxVal) * 100);
                return (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>{item.label}</span><span className="font-semibold text-slate-800">{item.value}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100">
                      <div className={`h-2 rounded-full ${item.color} transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Top Negocios y Servicios */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-900 mb-3">Top Negocios y Servicios</div>

            <div className="space-y-4">
              <div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2">Talleres Líderes</div>
                <div className="space-y-2">
                  {kpis?.topNegocios && kpis.topNegocios.length > 0 ? (
                    kpis.topNegocios.slice(0, 2).map((biz, idx) => (
                      <div key={idx} className="flex flex-col text-xs">
                        <div className="flex justify-between text-slate-700 font-medium mb-1">
                          <span className="truncate max-w-[150px]">{idx + 1}. {biz.businessName}</span>
                          <span className="font-semibold text-slate-800">S/ {biz.totalRevenue.toLocaleString("es-PE", { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="h-1 w-full rounded-full bg-slate-100">
                          <div className="h-1 rounded-full bg-blue-500 transition-all" style={{ width: `${Math.min((biz.totalRevenue / (kpis?.ingresosTotales || 1)) * 100, 100)}%` }} />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 text-[10px]">Sin datos de ingresos</p>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2">Servicios más Rentables</div>
                <div className="space-y-2">
                  {kpis?.ingresosPorCategoria && kpis.ingresosPorCategoria.length > 0 ? (
                    kpis.ingresosPorCategoria.slice(0, 2).map((srv, idx) => (
                      <div key={idx} className="flex flex-col text-xs">
                        <div className="flex justify-between text-slate-700 font-medium mb-1">
                          <span className="truncate max-w-[150px]">{idx + 1}. {srv.categoryName}</span>
                          <span className="font-semibold text-slate-800">S/ {srv.totalRevenue.toLocaleString("es-PE", { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="h-1 w-full rounded-full bg-slate-100">
                          <div className="h-1 rounded-full bg-violet-500 transition-all" style={{ width: `${Math.min((srv.totalRevenue / (kpis?.ingresosTotales || 1)) * 100, 100)}%` }} />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 text-[10px]">Sin datos de ingresos</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Negocios pendientes de moderación */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-900 mb-3">Pendientes de moderación</div>
            <div className="space-y-3">
              {loading ? (
                <p className="text-sm text-slate-400">Cargando...</p>
              ) : businesses.filter(b => b.status === "PENDING").length === 0 ? (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                  Todo al día
                </div>
              ) : (
                businesses.filter(b => b.status === "PENDING").slice(0, 2).map(b => (
                  <div key={b.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-900 truncate">{b.name ?? "-"}</div>
                      <div className="text-[10px] text-slate-400 truncate">{b.category ?? "-"}</div>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <button type="button" onClick={() => moderateBiz(b.id, "approve")} disabled={busyBizId === b.id}
                        className="rounded-lg bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-emerald-500 disabled:opacity-60">
                        Aprobar
                      </button>
                      <button type="button" onClick={() => moderateBiz(b.id, "reject")} disabled={busyBizId === b.id}
                        className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-60">
                        Rechazar
                      </button>
                    </div>
                  </div>
                ))
              )}
              {businesses.filter(b => b.status === "PENDING").length > 2 && (
                <button type="button" onClick={() => router.push("/admin/negocios")}
                  className="text-[10px] font-semibold text-orange-600 hover:underline">
                  Ver todos los pendientes &rarr;
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
