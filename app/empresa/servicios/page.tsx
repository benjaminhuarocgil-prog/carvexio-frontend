"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../../lib/api";
import { Branch, Service } from "../shared";
import { useBranch } from "../context/BranchContext";
import { BUSINESS_CATEGORIES, categoryLabel } from "../../../lib/businessCategories";

type ParsedService = {
  name: string;
  description: string;
  category: string;
  price: number;
  duration: number;
  localId: number | null;
};

export default function EmpresaServiciosPage() {
  const { selectedBranch } = useBranch();
  const [services, setServices] = useState<Service[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [customCategoryMode, setCustomCategoryMode] = useState(false);
  const [svcName, setSvcName] = useState("");
  const [svcDesc, setSvcDesc] = useState("");
  const [svcCategory, setSvcCategory] = useState<string>(BUSINESS_CATEGORIES[0]);
  const [svcPrice, setSvcPrice] = useState("");
  const [svcDuration, setSvcDuration] = useState("");
  const [svcLocalId, setSvcLocalId] = useState<number | null>(null);
  const [savingSvc, setSavingSvc] = useState(false);

  // Estados para importar CSV
  const [showImport, setShowImport] = useState(false);
  const [importing, setImporting] = useState(false);
  const [parsedItems, setParsedItems] = useState<ParsedService[]>([]);

  useEffect(() => {
    apiFetch<Branch[]>("/branches/me")
      .then(bList => {
        const list = Array.isArray(bList) ? bList : [];
        setBranches(list);
        if (list.length > 0 && !selectedBranch) {
          setSvcLocalId(prev => (prev === null ? list[0].id : prev));
        }
      })
      .catch(() => setBranches([]));
  }, [selectedBranch]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const query = selectedBranch ? `?localId=${selectedBranch.id}` : "";
        const svcData = await apiFetch<Service[]>(`/services${query}`);
        setServices(Array.isArray(svcData) ? svcData : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar servicios");
      } finally {
        setLoading(false);
      }
    };
    loadData();

    if (selectedBranch) {
      setSvcLocalId(selectedBranch.id);
    } else if (branches.length > 0) {
      setSvcLocalId(branches[0].id);
    }
  }, [selectedBranch, branches]);

  const resetForm = () => {
    setSvcName("");
    setSvcDesc("");
    setSvcCategory(BUSINESS_CATEGORIES[0]);
    setSvcPrice("");
    setSvcDuration("");
    setSvcLocalId(selectedBranch?.id ?? (branches[0]?.id ?? null));
    setEditingId(null);
    setCustomCategoryMode(false);
    setShowServiceForm(false);
    setError(null);
  };

  const downloadServiceTemplate = () => {
    const csvContent = "Nombre;Descripcion;Precio;Duracion\nCambio de aceite;Cambio de aceite sintetico 10W40;150;45\nAlineacion y balanceo;Alineacion laser 3D y balanceo de 4 ruedas;80;60\nLavado premium;Lavado interior, exterior y encerado orbital;50;30";
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "plantilla_servicios.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/);
      if (lines.length === 0) return;

      const header = lines[0];
      const separator = header.includes(";") ? ";" : ",";
      const headers = header.split(separator).map(h => h.trim().toLowerCase().replace(/['"“”]/g, ""));

      const targetLocalId = selectedBranch
        ? selectedBranch.id
        : (svcLocalId ?? (branches[0]?.id ?? null));

      const items: ParsedService[] = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = line.split(separator).map(v => {
          let cleaned = v.trim();
          if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
            cleaned = cleaned.substring(1, cleaned.length - 1);
          }
          return cleaned;
        });

        const rowObj: Record<string, string> = {};
        headers.forEach((h, index) => {
          rowObj[h] = values[index] || "";
        });

        const name = rowObj.nombre || rowObj.name || rowObj.servicio || "";
        const description = rowObj.descripcion || rowObj.description || rowObj.descripción || "";
        const price = Number(rowObj.precio || rowObj.price || 0);
        const duration = Number(rowObj.duracion || rowObj.duration || rowObj.duración || 0);

        if (name) {
          items.push({ name, description, category: BUSINESS_CATEGORIES[0], price, duration, localId: targetLocalId });
        }
      }
      setParsedItems(items);
    };
    reader.readAsText(file, "UTF-8");
  };

  const confirmImportServices = async () => {
    if (parsedItems.length === 0) return;
    try {
      setImporting(true);
      setError(null);
      const imported = await apiFetch<Service[]>("/services/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedItems),
      });
      setServices(prev => [...prev, ...(Array.isArray(imported) ? imported : [])]);
      setShowImport(false);
      setParsedItems([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al importar servicios");
    } finally {
      setImporting(false);
    }
  };

  const openEdit = (s: Service) => {
    setSvcName(s.name ?? "");
    setSvcDesc(s.description ?? "");
    setSvcCategory(s.category ?? BUSINESS_CATEGORIES[0]);
    setSvcPrice(s.price?.toString() ?? "");
    setSvcDuration(s.duration?.toString() ?? "");
    setSvcLocalId(selectedBranch ? selectedBranch.id : (s.localId ?? (branches[0]?.id ?? null)));
    setEditingId(s.id);
    const isPredefined = BUSINESS_CATEGORIES.includes(s.category as any);
    setCustomCategoryMode(!isPredefined && !!s.category);
    setShowServiceForm(true);
    setError(null);
  };

  const deleteService = async (id: number) => {
    if (!confirm("¿Eliminar este servicio?")) return;
    try {
      await apiFetch(`/services/${id}`, { method: "DELETE" });
      setServices(prev => prev.filter(s => s.id !== id));
    } catch { setError("No se pudo eliminar"); }
  };

  const saveService = async () => {
    try {
      setSavingSvc(true);
      setError(null);

      const targetLocalId = selectedBranch
        ? selectedBranch.id
        : (svcLocalId ?? (branches[0]?.id ?? null));

      const payload = {
        name: svcName,
        description: svcDesc,
        category: svcCategory,
        price: Number(svcPrice),
        duration: Number(svcDuration),
        localId: targetLocalId,
      };

      if (editingId) {
        const updated = await apiFetch<Service>(`/services/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        setServices(prev => prev.map(s => s.id === editingId ? updated : s));
      } else {
        const svc = await apiFetch<Service>("/services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        setServices(prev => [...prev, svc]);
      }

      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : (editingId ? "No se pudo actualizar el servicio" : "No se pudo crear el servicio"));
    }
    finally { setSavingSvc(false); }
  };

  return (
    <>
      <header className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Servicios del taller</h1>
          <p className="mt-0.5 text-sm text-slate-500">Administra los servicios que tus clientes podrán reservar</p>
        </div>
      </header>

      {error && (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
        La categoría principal del negocio se define al registrar la empresa. Aquí solo administras los servicios concretos
        que aparecerán dentro del taller.
      </div>

      <div className="space-y-4">
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => { setParsedItems([]); setShowImport(prev => !prev); setShowServiceForm(false); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
            Importar CSV
          </button>
          <button type="button" onClick={() => { resetForm(); setShowServiceForm(true); setShowImport(false); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-400 transition">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="5" y2="19" /><line x1="5" x2="19" y1="12" y2="12" /></svg>
            Nuevo Servicio
          </button>
        </div>

        {showImport && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-semibold text-slate-900 mb-2">Importar Servicios</h3>
            <p className="text-xs text-slate-500 mb-4">
              Sube un archivo en formato <strong>CSV</strong> (delimitado por comas <code>,</code> o punto y coma <code>;</code>).
              Las columnas deben ser: <code>Nombre</code>, <code>Descripcion</code>, <code>Precio</code>, <code>Duracion</code>.
            </p>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <button type="button" onClick={downloadServiceTemplate}
                className="text-xs font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100/80 px-3 py-2 rounded-lg transition">
                Descargar plantilla CSV
              </button>
              <input type="file" accept=".csv" onChange={handleCSVUpload}
                className="text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200" />
            </div>
            {parsedItems.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-green-600 mb-2">✓ Se detectaron {parsedItems.length} servicios listos para importar.</p>
                <div className="max-h-40 overflow-y-auto border border-slate-100 rounded-xl p-2 bg-slate-50 text-xs">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500">
                        <th className="pb-1 font-semibold">Nombre</th>
                        <th className="pb-1 font-semibold">Precio</th>
                        <th className="pb-1 font-semibold">Duración</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedItems.map((item, idx: number) => (
                        <tr key={idx} className="text-slate-700">
                          <td className="py-1 max-w-[200px] truncate">{item.name}</td>
                          <td className="py-1">S/ {item.price}</td>
                          <td className="py-1">{item.duration} min</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            <div className="flex gap-3">
              <button type="button" onClick={confirmImportServices} disabled={parsedItems.length === 0 || importing}
                className="px-5 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-400 disabled:opacity-60 transition">
                {importing ? "Importando..." : "Confirmar Importación"}
              </button>
              <button type="button" onClick={() => { setShowImport(false); setParsedItems([]); }}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition">
                Cancelar
              </button>
            </div>
          </div>
        )}

        {showServiceForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={resetForm} />

            <div className="relative bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl z-10 border border-slate-100 animate-in zoom-in-95 duration-200">
              <button
                type="button"
                onClick={resetForm}
                className="absolute top-4 right-4 h-9 w-9 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition font-bold text-sm"
              >
                ✕
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="h-10 w-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-lg shrink-0">
                  🛠️
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">
                    {editingId ? "Editar Servicio" : "Crear Nuevo Servicio"}
                  </h3>
                  <p className="text-xs text-slate-500">Configura los detalles del servicio ofrecido en tu taller</p>
                </div>
              </div>

              {error && (
                <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
              )}

              <div className="grid gap-4 sm:grid-cols-2 mb-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Nombre</label>
                  <input value={svcName} onChange={e => setSvcName(e.target.value)}
                    placeholder="Ej: Cambio de aceite"
                    className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-400/40" />
                </div>
                 <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Categoría</label>
                  {customCategoryMode ? (
                    <div className="relative">
                      <input
                        required
                        value={svcCategory}
                        onChange={e => setSvcCategory(e.target.value)}
                        placeholder="Ej: Cambio de Bujías, Frenos"
                        className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 pl-3 pr-10 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-400/40"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSvcCategory(BUSINESS_CATEGORIES[0]);
                          setCustomCategoryMode(false);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-bold text-sm"
                        title="Volver a la lista"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <select
                      value={svcCategory}
                      onChange={e => {
                        if (e.target.value === "OTRO") {
                          setSvcCategory("");
                          setCustomCategoryMode(true);
                        } else {
                          setSvcCategory(e.target.value);
                        }
                      }}
                      className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-400/40"
                    >
                      {BUSINESS_CATEGORIES.filter(c => c !== "OTROS").map(c => (
                        <option key={c} value={c}>{categoryLabel(c)}</option>
                      ))}
                      <option value="OTRO">Otro (Escribir...)</option>
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Sede del Servicio</label>
                  {selectedBranch ? (
                    <div className="w-full h-10 rounded-xl border border-slate-200 bg-slate-100 px-3 flex items-center text-sm font-semibold text-slate-700 truncate">
                      {selectedBranch.name}
                    </div>
                  ) : (
                    <select
                      value={svcLocalId ?? (branches[0]?.id ?? "")}
                      onChange={e => setSvcLocalId(Number(e.target.value))}
                      className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-400/40"
                    >
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Precio (S/)</label>
                  <input value={svcPrice} onChange={e => setSvcPrice(e.target.value)} type="number"
                    placeholder="0.00"
                    className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-400/40" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Duración (minutos)</label>
                  <input value={svcDuration} onChange={e => setSvcDuration(e.target.value)} type="number"
                    placeholder="60"
                    className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-400/40" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Descripción</label>
                  <input value={svcDesc} onChange={e => setSvcDesc(e.target.value)}
                    placeholder="Descripción del servicio"
                    className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-400/40" />
                </div>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={saveService} disabled={savingSvc}
                  className="flex-1 py-3 rounded-2xl bg-orange-500 text-white text-sm font-bold hover:bg-orange-400 disabled:opacity-60 transition shadow-lg shadow-orange-500/20">
                  {savingSvc ? "Guardando..." : (editingId ? "Actualizar Servicio" : "Guardar Servicio")}
                </button>
                <button type="button" onClick={resetForm}
                  className="px-5 py-3 rounded-2xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Servicio</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Categoría</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Sede</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Descripción</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Precio</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Duración</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan={7} className="px-5 py-8 text-sm text-slate-400">Cargando...</td></tr>
                ) : services.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-8 text-sm text-slate-400">No hay servicios.</td></tr>
                ) : services.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-3.5 font-medium text-slate-900">{s.name}</td>
                    <td className="px-5 py-3.5 text-slate-500 text-xs">{s.category ? categoryLabel(s.category) : "-"}</td>
                    <td className="px-5 py-3.5 text-xs font-semibold text-slate-600">
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-slate-700">
                        {branches.find(b => b.id === s.localId)?.name ?? "Sede Principal"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 text-xs max-w-[200px] truncate">{s.description ?? "-"}</td>
                    <td className="px-5 py-3.5 font-semibold text-slate-900">S/ {(s.price ?? 0).toFixed(2)}</td>
                    <td className="px-5 py-3.5 text-slate-500">{s.duration} min</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => openEdit(s)} title="Editar servicio"
                          className="h-9 w-9 inline-flex items-center justify-center rounded-xl border border-transparent text-slate-300 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>
                        </button>
                        <button type="button" onClick={() => deleteService(s.id)} title="Eliminar servicio"
                          className="h-9 w-9 inline-flex items-center justify-center rounded-xl border border-transparent text-slate-300 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
