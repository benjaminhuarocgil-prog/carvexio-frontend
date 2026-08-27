"use client";

import { useEffect, useState, useMemo } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { apiFetch } from "../../../lib/api";
import { formatPeruDate, formatPeruDateTime } from "../../../lib/datetime";
import { Business, ClientSummary, ClientHistory, statusColor, statusLabel } from "../shared";
import { useBranch } from "../context/BranchContext";

type FilterTab = "ALL" | "TOP_PRODUCTS" | "TOP_SERVICES" | "TOP_SPEND";

export default function EmpresaClientesPage() {
  const { user, isLoading } = useUser();
  const { selectedBranch } = useBranch();
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasCrm, setHasCrm] = useState(true);

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterTab>("ALL");

  // Modal de historial
  const [selectedClient, setSelectedClient] = useState<ClientSummary | null>(null);
  const [clientHistory, setClientHistory] = useState<ClientHistory | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyTab, setHistoryTab] = useState<"RESERVAS" | "PEDIDOS">("PEDIDOS");

  useEffect(() => {
    if (isLoading || !user) return;
    const loadData = async () => {
      try {
        setLoading(true);
        const query = selectedBranch ? `?localId=${selectedBranch.id}` : "";
        const [clientData, business] = await Promise.all([
          apiFetch<ClientSummary[]>(`/crm/clients${query}`),
          apiFetch<Business>("/business/me").catch(() => null),
        ]);
        setClients(Array.isArray(clientData) ? clientData : []);
        setHasCrm(business?.hasCrm === true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar clientes");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user, isLoading, selectedBranch]);

  const openHistoryModal = async (client: ClientSummary) => {
    setSelectedClient(client);
    setLoadingHistory(true);
    try {
      const history = await apiFetch<ClientHistory>(`/crm/clients/${client.id}`);
      setClientHistory(history);
    } catch {
      setClientHistory(null);
    } finally {
      setLoadingHistory(false);
    }
  };

  const closeModal = () => {
    setSelectedClient(null);
    setClientHistory(null);
  };

  const filteredClients = useMemo(() => {
    let list = [...clients];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c => 
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.phone && c.phone.toLowerCase().includes(q))
      );
    }

    switch (activeFilter) {
      case "TOP_PRODUCTS":
        return list.sort((a, b) => (b.montoTotalProductos ?? 0) - (a.montoTotalProductos ?? 0));
      case "TOP_SERVICES":
        return list.sort((a, b) => (b.totalReservas ?? 0) - (a.totalReservas ?? 0));
      case "TOP_SPEND":
        return list.sort((a, b) => (b.montoTotalTotal ?? 0) - (a.montoTotalTotal ?? 0));
      default:
        return list;
    }
  }, [clients, search, activeFilter]);

  return (
    <>
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Clientes (CRM)</h1>
          <p className="mt-0.5 text-sm text-slate-500">Gestión integrada de clientes, compras de productos y servicios</p>
        </div>

        {/* Buscador */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Buscar por nombre, email o tel..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-4 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-900"
          />
          <svg className="absolute left-3 top-3 text-slate-400" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        </div>
      </header>

      {error && (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      {/* Tabs de Filtro / Ordenamiento */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveFilter("ALL")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${activeFilter === "ALL" ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}
        >
          Todos los Clientes ({clients.length})
        </button>
        {hasCrm && (
        <>
        <button
          onClick={() => setActiveFilter("TOP_PRODUCTS")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${activeFilter === "TOP_PRODUCTS" ? "bg-indigo-600 text-white" : "bg-white text-indigo-600 border border-indigo-100 hover:bg-indigo-50"}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42 a2 2 0 0 0 2 1.58 h9.78 a2 2 0 0 0 1.95 -1.57 l1.65 -7.43 H5.12"/></svg>
          Top Compradores Productos
        </button>
        <button
          onClick={() => setActiveFilter("TOP_SPEND")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${activeFilter === "TOP_SPEND" ? "bg-emerald-600 text-white" : "bg-white text-emerald-600 border border-emerald-100 hover:bg-emerald-50"}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5 a3.5 3.5 0 0 0 0 7 h5 a3.5 3.5 0 0 1 0 7 H6"/></svg>
          Mayor Valor Generado
        </button>
        <button
          onClick={() => setActiveFilter("TOP_SERVICES")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${activeFilter === "TOP_SERVICES" ? "bg-blue-600 text-white" : "bg-white text-blue-600 border border-blue-100 hover:bg-blue-50"}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
          Más Citas Reservadas
        </button>
        </>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Cliente</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Contacto</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Auto</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Placa</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">VIN</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Kilometraje</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Años de uso</th>
                {hasCrm && <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Citas Reservadas</th>}
                {hasCrm && <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Pedidos Productos</th>}
                {hasCrm && <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Total Gastado</th>}
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Última Interacción</th>
                {hasCrm && <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">Acción</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={hasCrm ? 12 : 8} className="px-5 py-8 text-sm text-slate-400 text-center">Cargando clientes...</td></tr>
              ) : filteredClients.length === 0 ? (
                <tr><td colSpan={hasCrm ? 12 : 8} className="px-5 py-8 text-sm text-slate-400 text-center">No se encontraron clientes registrado.</td></tr>
              ) : filteredClients.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/70 transition">
                  <td className="px-5 py-3.5 font-medium text-slate-900">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center border border-slate-200 shrink-0">
                        {(c.name?.[0] ?? "C").toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{c.name ?? "-"}</div>
                        <div className="text-[11px] text-slate-400">ID: #{c.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-500">
                    <div>{c.email ?? "-"}</div>
                    <div className="text-slate-400">{c.phone ?? "Sin fono"}</div>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-600">{c.vehicles?.length ? c.vehicles.map(v => <div key={v.id}>{v.vehicleType}</div>) : <span className="text-slate-400">-</span>}</td>
                  <td className="px-5 py-3.5 font-mono text-xs text-slate-600">{c.vehicles?.length ? c.vehicles.map(v => <div key={v.id}>{v.plate}</div>) : <span className="text-slate-400">-</span>}</td>
                  <td className="px-5 py-3.5 font-mono text-[11px] text-slate-600">{c.vehicles?.length ? c.vehicles.map(v => <div key={v.id}>{v.vin}</div>) : <span className="text-slate-400">-</span>}</td>
                  <td className="px-5 py-3.5 text-xs text-slate-600">{c.vehicles?.length ? c.vehicles.map(v => <div key={v.id}>{v.mileage} km</div>) : <span className="text-slate-400">-</span>}</td>
                  <td className="px-5 py-3.5 text-xs text-slate-600">{c.vehicles?.length ? c.vehicles.map(v => <div key={v.id}>{v.yearsOfUse}</div>) : <span className="text-slate-400">-</span>}</td>
                  {hasCrm && (
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-700">
                      {c.totalReservas ?? 0} citas
                    </span>
                  </td>
                  )}
                  {hasCrm && (
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold bg-indigo-50 text-indigo-700">
                      {c.totalPedidos ?? 0} pedidos
                    </span>
                  </td>
                  )}
                  {hasCrm && (
                  <td className="px-5 py-3.5">
                    <div className="font-bold text-slate-900">
                      S/ {(c.montoTotalTotal ?? 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">
                      Prod: S/ {(c.montoTotalProductos ?? 0).toLocaleString("es-PE")} &middot; Serv: S/ {(c.montoTotalServicios ?? 0).toLocaleString("es-PE")}
                    </div>
                  </td>
                  )}
                  <td className="px-5 py-3.5 text-slate-400 text-xs">
                    {formatPeruDate(c.ultimaVisita, { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  {hasCrm && (
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => openHistoryModal(c)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-blue-600 hover:text-white transition"
                    >
                      Ver Historial
                    </button>
                  </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Historial Cliente */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header modal */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-lg text-slate-900">{selectedClient.name ?? "Cliente"}</h3>
                <p className="text-xs text-slate-500">{selectedClient.email ?? "-"} &middot; {selectedClient.phone ?? "Sin fono"}</p>
                {clientHistory?.vehicles?.length ? <div className="mt-2 flex flex-wrap gap-2">{clientHistory.vehicles.map(vehicle => <span key={vehicle.id} className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">{vehicle.vehicleType} / {vehicle.plate} / VIN: {vehicle.vin} / {vehicle.mileage} km / {vehicle.yearsOfUse} años</span>)}</div> : null}
              </div>
              <button
                onClick={closeModal}
                className="h-8 w-8 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Sub-Header Tabs */}
            <div className="flex border-b border-slate-100 px-6 bg-white gap-4">
              <button
                onClick={() => setHistoryTab("PEDIDOS")}
                className={`py-3 text-xs font-bold border-b-2 transition ${historyTab === "PEDIDOS" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}
              >
                Compras de Productos ({clientHistory?.historialPedidos?.length ?? 0})
              </button>
              <button
                onClick={() => setHistoryTab("RESERVAS")}
                className={`py-3 text-xs font-bold border-b-2 transition ${historyTab === "RESERVAS" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}
              >
                Historial de Reservas Citas ({clientHistory?.historialReservas?.length ?? 0})
              </button>
            </div>

            {/* Content modal */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {loadingHistory ? (
                <div className="text-center py-10 text-sm text-slate-400">Cargando historial completo...</div>
              ) : historyTab === "PEDIDOS" ? (
                !clientHistory?.historialPedidos || clientHistory.historialPedidos.length === 0 ? (
                  <div className="text-center py-8 text-sm text-slate-400">Este cliente no ha realizado pedidos de productos aún.</div>
                ) : (
                  clientHistory.historialPedidos.map(order => (
                    <div key={order.id} className="border border-slate-100 rounded-xl p-4 bg-slate-50/50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-bold text-slate-900 text-sm">Pedido #{order.id}</div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900">S/ {(order.totalAmount ?? 0).toFixed(2)}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                            {order.status}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-slate-500 mb-3">Fecha: {formatPeruDateTime(order.createdAt)}</div>
                      
                      {/* Items */}
                      <div className="space-y-1.5 border-t border-slate-100 pt-2">
                        {order.items?.map(item => (
                          <div key={item.id} className="flex items-center justify-between text-xs text-slate-700">
                            <span>{item.quantity}x {item.productName}</span>
                            <span className="font-semibold text-slate-900">S/ {(item.subtotal ?? 0).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )
              ) : (
                !clientHistory?.historialReservas || clientHistory.historialReservas.length === 0 ? (
                  <div className="text-center py-8 text-sm text-slate-400">Este cliente no tiene reservas de citas agendadas.</div>
                ) : (
                  clientHistory.historialReservas.map(b => (
                    <div key={b.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl bg-slate-50/50">
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{b.serviceName ?? "Servicio"}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{b.date ?? "-"} &middot; {b.time ?? "-"}</div>
                        {b.notes && <div className="text-xs text-slate-500 mt-1 italic">"{b.notes}"</div>}
                      </div>
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor(b.status)}`}>
                        {statusLabel(b.status)}
                      </span>
                    </div>
                  ))
                )
              )}
            </div>

            {/* Footer modal */}
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 text-right">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl text-xs transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

