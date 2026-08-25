"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { apiFetch } from "../../../lib/api";
import { Branch, BranchAvailability } from "../shared";
import { geocodeAddress } from "../../../lib/peruLocations";

const LocationPickerMap = dynamic(() => import("../components/LocationPickerMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[260px] w-full bg-slate-100 rounded-2xl animate-pulse flex items-center justify-center text-slate-400 text-xs font-semibold mt-3 border border-slate-200">
      Cargando mapa interactivo de ubicación...
    </div>
  ),
});

const DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

const DAY_LABELS: Record<(typeof DAYS)[number], string> = {
  MONDAY: "Lunes",
  TUESDAY: "Martes",
  WEDNESDAY: "Miércoles",
  THURSDAY: "Jueves",
  FRIDAY: "Viernes",
  SATURDAY: "Sábado",
  SUNDAY: "Domingo",
};

type BranchAvailabilityForm = BranchAvailability & {
  enabled: boolean;
};

function createDefaultSchedule(): BranchAvailabilityForm[] {
  return DAYS.map(day => ({
    dayOfWeek: day,
    startTime: "09:00",
    endTime: "18:00",
    capacity: 1,
    enabled: false,
  }));
}

function normalizeSchedule(items: BranchAvailability[]): BranchAvailabilityForm[] {
  const base = createDefaultSchedule();
  return base.map(day => {
    const existing = items.find(item => item.dayOfWeek === day.dayOfWeek);
    if (!existing) return day;
    return {
      ...day,
      ...existing,
      enabled: existing.enabled ?? true,
      startTime: existing.startTime?.slice(0, 5) ?? day.startTime,
      endTime: existing.endTime?.slice(0, 5) ?? day.endTime,
      capacity: existing.capacity ?? day.capacity,
    };
  });
}

type BranchWithAvailability = Branch & {
  activeDaysCount?: number;
};

export default function EmpresaLocalesPage() {
  const [branches, setBranches] = useState<BranchWithAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [district, setDistrict] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodedSuccess, setGeocodedSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  // Geocodificación automática cuando cambia la dirección o el distrito
  const handleAutoGeocode = useCallback(async () => {
    if (!address.trim()) return;
    setIsGeocoding(true);
    setGeocodedSuccess(false);
    try {
      const coords = await geocodeAddress(address, district, null, "Lima");
      if (coords) {
        setLatitude(coords.lat.toFixed(6));
        setLongitude(coords.lng.toFixed(6));
        setGeocodedSuccess(true);
        setTimeout(() => setGeocodedSuccess(false), 4000);
      }
    } finally {
      setIsGeocoding(false);
    }
  }, [address, district]);

  // Debounce automático para la dirección
  useEffect(() => {
    const timer = setTimeout(() => {
      if (address.trim().length >= 4) {
        handleAutoGeocode();
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [address, district, handleAutoGeocode]);

  const [availabilityBranch, setAvailabilityBranch] = useState<Branch | null>(null);
  const [availabilityForm, setAvailabilityForm] = useState<BranchAvailabilityForm[]>(createDefaultSchedule());
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilitySaving, setAvailabilitySaving] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [businessAvailabilityForm, setBusinessAvailabilityForm] = useState<BranchAvailabilityForm[]>(createDefaultSchedule());
  const [businessAvailabilityLoading, setBusinessAvailabilityLoading] = useState(false);
  const [businessAvailabilitySaving, setBusinessAvailabilitySaving] = useState(false);
  const [businessAvailabilityError, setBusinessAvailabilityError] = useState<string | null>(null);

  const activeDays = useMemo(
    () => availabilityForm.filter(item => item.enabled).length,
    [availabilityForm],
  );

  const loadBranches = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<Branch[]>("/branches/me");
      const branchList = Array.isArray(data) ? data : [];
      
      const listWithAvailability = await Promise.all(
        branchList.map(async (branch) => {
          try {
            const availData = await apiFetch<BranchAvailability[]>(
              `/branches/me/${branch.id}/availability`
            );
            const activeDaysCount = Array.isArray(availData)
              ? availData.filter(d => d.enabled).length
              : 0;
            return { ...branch, activeDaysCount };
          } catch {
            return { ...branch, activeDaysCount: 0 };
          }
        })
      );
      setBranches(listWithAvailability);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar los locales");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  useEffect(() => {
    if (loading || branches.length > 0) return;

    let cancelled = false;
    (async () => {
      try {
        setBusinessAvailabilityLoading(true);
        setBusinessAvailabilityError(null);
        const data = await apiFetch<BranchAvailability[]>("/business/me/availability");
        if (!cancelled) {
          setBusinessAvailabilityForm(normalizeSchedule(Array.isArray(data) ? data : []));
        }
      } catch (err) {
        if (!cancelled) {
          setBusinessAvailabilityError(err instanceof Error ? err.message : "No se pudo cargar el horario general");
          setBusinessAvailabilityForm(createDefaultSchedule());
        }
      } finally {
        if (!cancelled) setBusinessAvailabilityLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [branches.length, loading]);

  useEffect(() => {
    if (!availabilityBranch) return;

    let cancelled = false;
    (async () => {
      try {
        setAvailabilityLoading(true);
        setAvailabilityError(null);
        const data = await apiFetch<BranchAvailability[]>(
          `/branches/me/${availabilityBranch.id}/availability`,
        );
        if (!cancelled) {
          setAvailabilityForm(normalizeSchedule(Array.isArray(data) ? data : []));
        }
      } catch (err) {
        if (!cancelled) {
          setAvailabilityError(err instanceof Error ? err.message : "No se pudo cargar la disponibilidad");
          setAvailabilityForm(createDefaultSchedule());
        }
      } finally {
        if (!cancelled) setAvailabilityLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [availabilityBranch]);

  const resetForm = () => {
    setName("");
    setAddress("");
    setPhone("");
    setDistrict("");
    setLatitude("");
    setLongitude("");
    setEditingId(null);
    setShowForm(false);
    setError(null);
  };

  const openEdit = (b: Branch) => {
    setName(b.name ?? "");
    setAddress(b.address ?? "");
    setPhone(b.phone ?? "");
    setDistrict(b.district ?? "");
    setLatitude(b.latitude != null ? b.latitude.toString() : "");
    setLongitude(b.longitude != null ? b.longitude.toString() : "");
    setEditingId(b.id);
    setShowForm(true);
    setError(null);
  };

  const saveBranch = async () => {
    if (!name.trim()) {
      setError("El nombre del local es obligatorio.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const parsedLat = latitude.trim() !== "" ? parseFloat(latitude) : null;
      const parsedLng = longitude.trim() !== "" ? parseFloat(longitude) : null;
      const body = JSON.stringify({
        name,
        address,
        phone,
        district,
        latitude: parsedLat,
        longitude: parsedLng
      });
      if (editingId) {
        await apiFetch(`/branches/me/${editingId}`, { method: "PUT", body });
      } else {
        await apiFetch("/branches/me", { method: "POST", body });
      }
      resetForm();
      await loadBranches();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el local");
    } finally {
      setSaving(false);
    }
  };

  const deleteBranch = async (id: number) => {
    if (!confirm("¿Eliminar este local? Esta acción no se puede deshacer.")) return;
    try {
      await apiFetch(`/branches/me/${id}`, { method: "DELETE" });
      setBranches(prev => prev.filter(b => b.id !== id));
    } catch {
      setError("No se pudo eliminar el local");
    }
  };

  const openAvailability = (branch: Branch) => {
    setAvailabilityBranch(branch);
    setAvailabilityForm(createDefaultSchedule());
    setAvailabilityError(null);
  };

  const closeAvailability = () => {
    if (availabilitySaving) return;
    setAvailabilityBranch(null);
    setAvailabilityForm(createDefaultSchedule());
    setAvailabilityError(null);
  };

  const updateAvailability = (dayOfWeek: string, patch: Partial<BranchAvailabilityForm>) => {
    setAvailabilityForm(prev =>
      prev.map(item => (item.dayOfWeek === dayOfWeek ? { ...item, ...patch } : item)),
    );
  };

  const saveAvailability = async () => {
    if (!availabilityBranch) return;

    setAvailabilitySaving(true);
    setAvailabilityError(null);
    try {
      const payload = availabilityForm.map(({ enabled, ...item }) => ({
        ...item,
        enabled,
      }));
      await apiFetch(`/branches/me/${availabilityBranch.id}/availability`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      
      const activeCount = availabilityForm.filter(item => item.enabled).length;
      setBranches(prev =>
        prev.map(b => (b.id === availabilityBranch.id ? { ...b, activeDaysCount: activeCount } : b))
      );
      
      setAvailabilityBranch(null);
      setAvailabilityForm(createDefaultSchedule());
    } catch (err) {
      setAvailabilityError(err instanceof Error ? err.message : "No se pudo guardar la disponibilidad");
    } finally {
      setAvailabilitySaving(false);
    }
  };

  const updateBusinessAvailability = (dayOfWeek: string, patch: Partial<BranchAvailabilityForm>) => {
    setBusinessAvailabilityForm(prev =>
      prev.map(item => (item.dayOfWeek === dayOfWeek ? { ...item, ...patch } : item)),
    );
  };

  const saveBusinessAvailability = async () => {
    setBusinessAvailabilitySaving(true);
    setBusinessAvailabilityError(null);
    try {
      const payload = businessAvailabilityForm.map(({ enabled, ...item }) => ({
        ...item,
        enabled,
      }));
      await apiFetch("/business/me/availability", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    } catch (err) {
      setBusinessAvailabilityError(err instanceof Error ? err.message : "No se pudo guardar el horario general");
    } finally {
      setBusinessAvailabilitySaving(false);
    }
  };

  return (
    <>
      <header className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Mis Locales</h1>
          <p className="mt-0.5 text-sm text-slate-500">Gestiona las sucursales de tu negocio</p>
        </div>
        {!showForm && (
          <button
            id="btn-nuevo-local"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" x2="12" y1="5" y2="19" />
              <line x1="5" x2="19" y1="12" y2="12" />
            </svg>
            Nuevo Local
          </button>
        )}
      </header>

      {error && (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={resetForm} />

          <div className="relative bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl z-10 border border-slate-100 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={resetForm}
              className="absolute top-4 right-4 h-9 w-9 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition font-bold text-sm"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="h-10 w-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-lg shrink-0">
                📍
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  {editingId ? "Editar Local / Sede" : "Agregar Nuevo Local"}
                </h2>
                <p className="text-xs text-slate-500">Registra una nueva sucursal para la atención de tus clientes</p>
              </div>
            </div>

            {error && (
              <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 mb-6">
              <div>
                <label htmlFor="local-name" className="mb-1.5 block text-xs font-semibold text-slate-600">Nombre del local *</label>
                <input
                  id="local-name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ej: Sede Los Olivos"
                  className="w-full h-10 rounded-xl border border-slate-200 px-4 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-orange-400 bg-slate-50"
                />
              </div>
              <div>
                <label htmlFor="local-district" className="mb-1.5 block text-xs font-semibold text-slate-600">Distrito</label>
                <input
                  id="local-district"
                  type="text"
                  value={district}
                  onChange={e => setDistrict(e.target.value)}
                  placeholder="Ej: Los Olivos"
                  className="w-full h-10 rounded-xl border border-slate-200 px-4 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-orange-400 bg-slate-50"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="local-address" className="mb-1.5 block text-xs font-semibold text-slate-600">Dirección Exacta</label>
                <input
                  id="local-address"
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Ej: Av. Universitaria 1234"
                  className="w-full h-10 rounded-xl border border-slate-200 px-4 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-orange-400 bg-slate-50"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="local-phone" className="mb-1.5 block text-xs font-semibold text-slate-600">Teléfono de Contacto</label>
                <input
                  id="local-phone"
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="Ej: 01-123-4567"
                  className="w-full h-10 rounded-xl border border-slate-200 px-4 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-orange-400 bg-slate-50"
                />
              </div>

              {geocodedSuccess && (
                <div className="sm:col-span-2 text-[11px] text-emerald-600 font-semibold animate-fade-in flex items-center gap-1">
                  <span>✓ Ubicación detectada en el mapa según la dirección ingresada.</span>
                </div>
              )}

              {isGeocoding && (
                <div className="sm:col-span-2 text-[11px] text-slate-500 font-semibold animate-fade-in flex items-center gap-1.5">
                  <span className="h-3 w-3 border-2 border-orange-500 border-t-transparent animate-spin rounded-full" />
                  Buscando dirección en el mapa...
                </div>
              )}

              <div className="sm:col-span-2">
                <LocationPickerMap
                  lat={latitude ? parseFloat(latitude) : null}
                  lng={longitude ? parseFloat(longitude) : null}
                  onChange={(newLat, newLng) => {
                    setLatitude(newLat.toFixed(6));
                    setLongitude(newLng.toFixed(6));
                  }}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                id="btn-guardar-local"
                onClick={saveBranch}
                disabled={saving}
                className="flex-1 py-3 rounded-2xl bg-orange-500 text-sm font-bold text-white transition hover:bg-orange-600 disabled:opacity-50 shadow-lg shadow-orange-500/20"
              >
                {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Crear local"}
              </button>
              <button
                id="btn-cancelar-local"
                onClick={resetForm}
                className="px-5 py-3 rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-400 border-t-transparent" />
        </div>
      ) : branches.length === 0 ? (
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white py-16 text-center shadow-sm">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-slate-700">No tienes locales registrados</p>
            <p className="mt-1 max-w-xs text-xs text-slate-400">
              Aun así puedes definir el horario y los días de atención general de tu negocio.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-slate-800">Horario general de atención</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Este horario se usará para agendar citas cuando tu empresa todavía no tenga sedes.
                </p>
              </div>
            </div>

            {businessAvailabilityError && (
              <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {businessAvailabilityError}
              </div>
            )}

            {businessAvailabilityLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-400 border-t-transparent" />
              </div>
            ) : (
              <div className="space-y-4">
                {businessAvailabilityForm.map(item => (
                  <div
                    key={item.dayOfWeek}
                    className={`grid gap-3 rounded-2xl border p-4 md:grid-cols-[1.2fr_1fr_1fr_0.8fr] ${
                      item.enabled ? "border-orange-200 bg-orange-50/30" : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={item.enabled}
                        onChange={e => updateBusinessAvailability(item.dayOfWeek, { enabled: e.target.checked })}
                        className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                      />
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{DAY_LABELS[item.dayOfWeek as keyof typeof DAY_LABELS]}</div>
                        <div className="text-xs text-slate-500">{item.dayOfWeek}</div>
                      </div>
                    </label>

                    <div>
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Inicio</label>
                      <input
                        type="time"
                        step={1800}
                        value={item.startTime}
                        disabled={!item.enabled}
                        onChange={e => updateBusinessAvailability(item.dayOfWeek, { startTime: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-orange-400 disabled:bg-slate-100"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Fin</label>
                      <input
                        type="time"
                        step={1800}
                        value={item.endTime}
                        disabled={!item.enabled}
                        onChange={e => updateBusinessAvailability(item.dayOfWeek, { endTime: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-orange-400 disabled:bg-slate-100"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Capacidad</label>
                      <input
                        type="number"
                        min={1}
                        value={item.capacity}
                        disabled={!item.enabled}
                        onChange={e => updateBusinessAvailability(item.dayOfWeek, { capacity: Number(e.target.value) || 1 })}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-orange-400 disabled:bg-slate-100"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Días activos: <span className="font-semibold text-slate-900">{businessAvailabilityForm.filter(item => item.enabled).length}</span>
              </p>
              <button
                onClick={saveBusinessAvailability}
                disabled={businessAvailabilitySaving || businessAvailabilityLoading}
                className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50"
              >
                {businessAvailabilitySaving ? "Guardando..." : "Guardar horario"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {branches.map(branch => (
            <div key={branch.id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    id={`btn-configurar-horarios-${branch.id}`}
                    onClick={() => openAvailability(branch)}
                    className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5 text-[11px] font-semibold text-orange-700 transition hover:bg-orange-100"
                  >
                    Configurar Horarios
                  </button>
                  <button
                    id={`btn-editar-local-${branch.id}`}
                    onClick={() => openEdit(branch)}
                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    title="Editar"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button
                    id={`btn-eliminar-local-${branch.id}`}
                    onClick={() => deleteBranch(branch.id)}
                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500"
                    title="Eliminar"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                  </button>
                </div>
              </div>
              <h3 className="truncate text-sm font-semibold text-slate-800">{branch.name}</h3>
              {branch.district && <p className="mt-0.5 text-xs font-medium text-orange-500">{branch.district}</p>}
              {branch.address && <p className="mt-1 text-xs leading-relaxed text-slate-500">{branch.address}</p>}
              {branch.phone && <p className="mt-1 text-xs text-slate-400">{branch.phone}</p>}
              <div className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
                Horarios activos: {branch.activeDaysCount ?? 0}
              </div>
            </div>
          ))}
        </div>
      )}

      {availabilityBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeAvailability} />

          <div className="relative z-10 w-full max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
            <div className="border-b border-slate-100 bg-slate-950 px-6 py-5 text-white md:px-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-300">Configuración de horarios</p>
                  <h2 className="mt-1 text-2xl font-bold">{availabilityBranch.name}</h2>
                  <p className="mt-1 text-sm text-slate-300">
                    Define qué días atiende tu sucursal, el rango horario y cuántos vehículos puede aceptar por bloque.
                  </p>
                </div>
                <button
                  onClick={closeAvailability}
                  className="rounded-full bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
                >
                  Cerrar
                </button>
              </div>
            </div>

            <div className="max-h-[72vh] overflow-y-auto p-6 md:p-8">
              {availabilityError && (
                <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {availabilityError}
                </div>
              )}

              {availabilityLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-400 border-t-transparent" />
                </div>
              ) : (
                <div className="space-y-4">
                  {availabilityForm.map(item => (
                    <div
                      key={item.dayOfWeek}
                      className={`grid gap-3 rounded-2xl border p-4 md:grid-cols-[1.2fr_1fr_1fr_0.8fr] ${
                        item.enabled ? "border-orange-200 bg-orange-50/30" : "border-slate-200 bg-slate-50"
                      }`}
                    >
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={item.enabled}
                          onChange={e => updateAvailability(item.dayOfWeek, { enabled: e.target.checked })}
                          className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                        />
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{DAY_LABELS[item.dayOfWeek as keyof typeof DAY_LABELS]}</div>
                          <div className="text-xs text-slate-500">{item.dayOfWeek}</div>
                        </div>
                      </label>

                      <div>
                        <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Inicio</label>
                        <input
                          type="time"
                          step={1800}
                          value={item.startTime}
                          disabled={!item.enabled}
                          onChange={e => updateAvailability(item.dayOfWeek, { startTime: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-orange-400 disabled:bg-slate-100"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Fin</label>
                        <input
                          type="time"
                          step={1800}
                          value={item.endTime}
                          disabled={!item.enabled}
                          onChange={e => updateAvailability(item.dayOfWeek, { endTime: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-orange-400 disabled:bg-slate-100"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Capacidad</label>
                        <input
                          type="number"
                          min={1}
                          value={item.capacity}
                          disabled={!item.enabled}
                          onChange={e => updateAvailability(item.dayOfWeek, { capacity: Number(e.target.value) || 1 })}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-orange-400 disabled:bg-slate-100"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">
                  Días activos: <span className="font-semibold text-slate-900">{activeDays}</span>
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={closeAvailability}
                    className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={saveAvailability}
                    disabled={availabilitySaving || availabilityLoading}
                    className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50"
                  >
                    {availabilitySaving ? "Guardando..." : "Guardar horarios"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
