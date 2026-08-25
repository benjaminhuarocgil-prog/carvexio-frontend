"use client";

import { useEffect, useState } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { apiFetch } from "../../../lib/api";
import { Report } from "../shared";
import { KpiCard } from "../components/KpiCard";
import { useBranch } from "../context/BranchContext";

export default function EmpresaReportesPage() {
  const { user, isLoading } = useUser();
  const { selectedBranch } = useBranch();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading || !user) return;
    const loadData = async () => {
      try {
        setLoading(true);
        const today = new Date().toISOString().split("T")[0];
        const monthStart = today.slice(0, 8) + "01";
        const branchParam = selectedBranch ? `&localId=${selectedBranch.id}` : "";
        const reportData = await apiFetch<Report>(`/reports?start=${monthStart}&end=${today}${branchParam}`);
        setReport(reportData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar reportes");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user, isLoading, selectedBranch]);

  return (
    <>
      <header className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Reportes</h1>
          <p className="mt-0.5 text-sm text-slate-500">Ventas y servicios del mes actual</p>
        </div>
      </header>

      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-6 py-10 text-center">
          <p className="text-sm font-medium text-rose-700">{error}</p>
        </div>
      ) : (
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard label="Total reservas" value={loading ? "—" : String(report?.totalReservas ?? 0)}
            sub="este mes" color="bg-blue-50 text-blue-600"
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>}
          />
          <KpiCard label="Completadas" value={loading ? "—" : String(report?.reservasCompletadas ?? 0)}
            sub="servicios realizados" color="bg-emerald-50 text-emerald-600"
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
          />
          <KpiCard label="Canceladas" value={loading ? "—" : String(report?.reservasCanceladas ?? 0)}
            sub="este mes" color="bg-rose-50 text-rose-600"
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" x2="9" y1="9" y2="15"/><line x1="9" x2="15" y1="9" y2="15"/></svg>}
          />
          <KpiCard label="Ingresos del mes" value={loading ? "—" : `S/ ${(report?.ingresosPeriodo ?? 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}`}
            sub="reservas completadas" color="bg-green-50 text-green-600"
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
          />
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="text-sm font-semibold text-slate-900 mb-4">Servicios más solicitados</div>
            {!report || report.serviciosMasSolicitados.length === 0 ? (
              <p className="text-sm text-slate-400">Sin datos aún</p>
            ) : report.serviciosMasSolicitados.map((s, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-orange-600 text-xs font-bold">{i + 1}</span>
                  <span className="text-sm text-slate-900">{s.nombre}</span>
                </div>
                <span className="text-sm font-semibold text-slate-700">{s.total} veces</span>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="text-sm font-semibold text-slate-900 mb-4">Clientes frecuentes</div>
            {!report || report.clientesFrecuentes.length === 0 ? (
              <p className="text-sm text-slate-400">Sin datos aún</p>
            ) : report.clientesFrecuentes.slice(0, 5).map((c, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                    {c.nombre?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <span className="text-sm text-slate-900">{c.nombre}</span>
                </div>
                <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-700">
                  {c.totalReservas} reservas
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      )}
    </>
  );
}