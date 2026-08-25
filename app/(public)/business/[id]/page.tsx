"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useUser } from "@auth0/nextjs-auth0/client";
import { apiFetch } from "../../../../lib/api";

function peruTodayForDateInput() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = (type: string) => parts.find(part => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

const BranchesMap = dynamic(() => import("./components/BranchesMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[450px] w-full bg-slate-100 rounded-2xl animate-pulse flex items-center justify-center text-slate-400 text-sm font-semibold border border-slate-200">
      Cargando mapa interactivo de sedes...
    </div>
  ),
});

// ─── Interfaces ─────────────────────────────────────────────────────────────

type Service = {
  id: number;
  name: string;
  price: number;
  durationMinutes: number;
  description?: string;
  localId?: number | null;
};

type Product = {
  id: number;
  name: string;
  price: number;
  stock: number;
  description?: string;
  photoUrl?: string;
  category?: string;
  brand?: string;
  igv?: boolean;
  deliveryAvailable?: boolean;
  localId?: number | null;
};

type BranchOption = {
  id: number;
  name: string | null;
  address: string | null;
  district: string | null;
  department: string | null;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
};

type VehicleOption = { id: number; vehicleType: string; plate: string; mileage: number; yearsOfUse: number };

type ApiService = {
  id: number;
  name?: string;
  price?: number;
  duration?: number;
  durationMinutes?: number;
  description?: string;
  localId?: number | null;
};

type ApiProduct = {
  id: number;
  name?: string;
  price?: number;
  stock?: number;
  description?: string;
  photoUrl?: string;
  category?: string;
  brand?: string;
  igv?: boolean;
  localId?: number | null;
};

type BusinessDetail = {
  id: number;
  name: string;
  category: string;
  address: string;
  phone: string | null;
  photoUrl: string | null;
  description: string | null;
  services?: Service[];
  products?: Product[];
  branches?: BranchOption[];
};

type BusinessDetailApi = BusinessDetail & {
  branches?: unknown;
  locales?: unknown;
  sucursales?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function branchLabel(branch: BranchOption) {
  const name = branch.name?.trim();
  const department = branch.department?.trim();
  const district = branch.district?.trim();
  const place = department || district;

  if (name && place) return `${name} · ${place}`;
  if (name) return name;
  if (department && district) return `${department} · ${district}`;
  return department || district || `Sede ${branch.id}`;
}

function normalizeBranches(rawBranches: unknown, services: Service[]): BranchOption[] {
  const fromApi = Array.isArray(rawBranches) ? rawBranches : [];
  const normalized = fromApi
    .map((branch) => {
      if (!isRecord(branch) || typeof branch.id !== "number") return null;
      return {
        id: branch.id,
        name: typeof branch.name === "string" ? branch.name : null,
        address: typeof branch.address === "string" ? branch.address : null,
        district: typeof branch.district === "string" ? branch.district : null,
        department: typeof branch.department === "string" ? branch.department : null,
        phone: typeof branch.phone === "string" ? branch.phone : null,
        latitude: typeof branch.latitude === "number" ? branch.latitude : null,
        longitude: typeof branch.longitude === "number" ? branch.longitude : null,
      } satisfies BranchOption;
    })
    .filter((branch): branch is BranchOption => Boolean(branch));

  if (normalized.length > 0) return normalized;

  const ids = Array.from(
    new Set(services.map(service => service.localId).filter((value): value is number => typeof value === "number")),
  );

  return ids.map(id => ({
    id,
    name: `Sede ${id}`,
    address: null,
    district: null,
    department: null,
    phone: null,
    latitude: null,
    longitude: null,
  }));
}

type PageProps = {
  params: Promise<{ id: string }>;
};

// ─── Componente Principal ───────────────────────────────────────────────────

export default function BusinessDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { id: businessId } = use(params);
  const { user } = useUser();

  const [business, setBusiness] = useState<BusinessDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados interactivos
  const [activeTab, setActiveTab] = useState<"servicios" | "productos">("servicios");
  const [showMapModal, setShowMapModal] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  const handleOpenMap = () => {
    setShowMapModal(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.warn("No se pudo obtener geolocalización:", error);
        }
      );
    }
  };

  // Estado del modal de Reserva
  const [bookingModal, setBookingModal] = useState<{ service: Service; branchId: number | null } | null>(null);
  const [viewBranchId, setViewBranchId] = useState<number | null>(null);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [bookingNotes, setBookingNotes] = useState("");
  const [bookingVehicleId, setBookingVehicleId] = useState<number | null>(null);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  // Estado para toast del carrito
  const [addingProduct, setAddingProduct] = useState<number | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Estado para modal de confirmación de producto
  const [productModal, setProductModal] = useState<Product | null>(null);
  const [productQty, setProductQty] = useState(1);
  const hasBranches = (business?.branches?.length ?? 0) > 0;
  const selectedBranch = useMemo(() => {
    if (!hasBranches || !business?.branches) return null;
    if (viewBranchId == null) return null;
    return business.branches.find(branch => branch.id === viewBranchId) ?? null;
  }, [business?.branches, hasBranches, viewBranchId]);

  const visibleServices = useMemo(() => {
    const items = business?.services ?? [];
    if (!hasBranches || !selectedBranch) return items;
    return items.filter(service => service.localId == null || service.localId === selectedBranch.id);
  }, [business?.services, hasBranches, selectedBranch]);

  const visibleProducts = useMemo(() => {
    const items = business?.products ?? [];
    if (!hasBranches || !selectedBranch) return items;
    return items.filter(product => product.localId == null || product.localId === selectedBranch.id);
  }, [business?.products, hasBranches, selectedBranch]);

  const selectedBranchLabel = selectedBranch
    ? branchLabel(selectedBranch)
    : hasBranches
      ? "Selecciona una sede para ver sus servicios y productos"
      : "Horario general de la empresa";

  const resetBookingFlow = () => {
    setBookingModal(null);
    setBookingDate("");
    setBookingTime("");
    setBookingNotes("");
    setBookingVehicleId(null);
    setAvailableSlots([]);
    setSlotsError(null);
  };

  const handleBranchChange = (branchId: number | null) => {
    setViewBranchId(branchId);
    resetBookingFlow();
  };

  // 1. Cargar datos del negocio, servicios y productos
  useEffect(() => {
    let cancelled = false;
    const loadDetail = async () => {
      try {
        setLoading(true);
        // Hacemos las 3 peticiones en paralelo (Negocio, Servicios, Productos)
        const [bizData, srvData, prodData] = await Promise.all([
          apiFetch<BusinessDetailApi>(`/business/public/${businessId}`).catch(() => null),
          apiFetch<ApiService[]>(`/services/public/business/${businessId}`).catch(() => []),
          apiFetch<ApiProduct[]>(`/products/public/business/${businessId}`).catch(() => [])
        ]);

        if (!cancelled && bizData) {
          // Si el backend incluye duration en vez de durationMinutes, lo mapeamos:
          const mappedServices = srvData.map((s) => ({
            id: s.id,
            name: s.name ?? "",
            price: s.price ?? 0,
            durationMinutes: s.duration ?? s.durationMinutes ?? 60,
            description: s.description,
            localId: s.localId ?? null
          }));
          const mappedProducts = prodData.map((p) => ({
            id: p.id,
            name: p.name ?? "",
            price: p.price ?? 0,
            stock: p.stock ?? 0,
            description: p.description,
            photoUrl: p.photoUrl,
            category: p.category,
            brand: p.brand,
            igv: p.igv,
            localId: p.localId ?? null,
          }));
          const normalizedBranches = normalizeBranches(
            bizData.branches ?? bizData.locales ?? bizData.sucursales,
            mappedServices,
          );

          setBusiness({
            id: bizData.id ?? parseInt(businessId),
            name: bizData.name ?? "Negocio sin nombre",
            category: bizData.category ?? "TALLER",
            address: bizData.address ?? "Sin dirección",
            phone: bizData.phone,
            photoUrl: bizData.photoUrl,
            description: bizData.description,
            services: mappedServices,
            products: mappedProducts,
            branches: normalizedBranches,
          });
        } else if (!cancelled) {
          setError("No pudimos cargar la información de este negocio.");
        }
      } catch {
        if (!cancelled) {
          setError("Error interno de conexión.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadDetail();
    return () => { cancelled = true; };
  }, [businessId]);

  useEffect(() => {
    if (!business?.branches?.length) {
      setViewBranchId(null);
      return;
    }

    if (business.branches.length === 1) {
      setViewBranchId(business.branches[0].id);
      return;
    }

    setViewBranchId(prev => (
      prev != null && business.branches?.some(branch => branch.id === prev)
        ? prev
        : null
    ));
  }, [business?.branches]);

  useEffect(() => {
    if (!bookingModal || !user) return;
    apiFetch<VehicleOption[]>("/vehicles/my")
      .then(data => setVehicles(Array.isArray(data) ? data : []))
      .catch(() => setVehicles([]));
  }, [bookingModal, user]);

  // Mostrar mensaje temporal (toast)
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  useEffect(() => {
    let cancelled = false;

    const loadSlots = async () => {
      if (!bookingModal) return;

      if (hasBranches && !bookingModal.branchId) {
        setAvailableSlots([]);
        setSlotsError("Selecciona una sede para agendar esta cita.");
        setSlotsLoading(false);
        return;
      }

      if (!bookingDate) {
        setAvailableSlots([]);
        setSlotsError("Selecciona una fecha para ver los horarios disponibles.");
        setSlotsLoading(false);
        return;
      }

      try {
        setSlotsLoading(true);
        setSlotsError(null);
        const slotsUrl = hasBranches
          ? `/bookings/available-slots?branchId=${bookingModal.branchId}&date=${bookingDate}`
          : `/bookings/available-slots?businessId=${businessId}&date=${bookingDate}`;
        const slots = await apiFetch<string[]>(
          slotsUrl,
        );
        if (cancelled) return;
        const normalized = Array.isArray(slots) ? slots : [];
        setAvailableSlots(normalized);
        if (normalized.length === 0) {
          setSlotsError("No hay horarios disponibles para esta fecha.");
        }
        setBookingTime(prev => (normalized.includes(prev) ? prev : ""));
      } catch (err) {
        if (!cancelled) {
          setAvailableSlots([]);
          setSlotsError(err instanceof Error ? err.message : "No se pudieron cargar los horarios");
        }
      } finally {
        if (!cancelled) setSlotsLoading(false);
      }
    };

    loadSlots();

    return () => {
      cancelled = true;
    };
  }, [bookingModal, bookingDate, businessId, hasBranches]);

  const closeBookingModal = () => {
    if (bookingSuccess || submittingBooking) return;
    setBookingModal(null);
    setBookingDate("");
    setBookingTime("");
    setBookingNotes("");
    setBookingVehicleId(null);
    setAvailableSlots([]);
    setSlotsError(null);
  };

  // 2. Acción: Agendar cita
  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingModal || !bookingDate || !bookingTime) return;
    if (hasBranches && !bookingModal.branchId) {
      alert("Selecciona una sede para agendar esta cita.");
      return;
    }
    if (!availableSlots.includes(bookingTime)) {
      alert("El horario seleccionado ya no está disponible.");
      return;
    }

    try {
      setSubmittingBooking(true);
      await apiFetch("/bookings", {
        method: "POST",
        body: JSON.stringify({
          serviceId: bookingModal.service.id,
          localId: hasBranches ? bookingModal.branchId : null,
          date: bookingDate,
          time: bookingTime,
          notes: bookingNotes,
          vehicleId: bookingVehicleId,
        }),
      });
      setBookingSuccess(true);
      setTimeout(() => {
        setBookingSuccess(false);
        setBookingModal(null);
        setBookingDate("");
        setBookingTime("");
        setBookingNotes("");
        setBookingVehicleId(null);
        setAvailableSlots([]);
        setSlotsError(null);
        showToast("¡Reserva confirmada con éxito!");
      }, 2500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      if (message.includes("401")) {
        router.push("/api/auth/login");
      } else {
        alert(message || "Error al intentar hacer la reserva. Intenta de nuevo.");
      }
    } finally {
      setSubmittingBooking(false);
    }
  };

  // 3. Acción: Añadir al carrito
  const handleAddToCart = async (product: Product, quantity: number = 1) => {
    try {
      setAddingProduct(product.id);
      await apiFetch("/cart/items", {
        method: "POST",
        body: JSON.stringify({
          productId: product.id,
          quantity: quantity,
        }),
      });
      showToast(`✓ ${quantity}x ${product.name} agregado al carrito 🛒`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      if (message.includes("401")) {
        router.push("/api/auth/login");
      } else {
        alert(message || "Error al añadir el producto al carrito.");
      }
    } finally {
      setAddingProduct(null);
    }
  };

  const categoryLabel = (cat: string) => cat.replace(/_/g, " ").toUpperCase();

  // ─── Renderizado Loading & Error ───
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 rounded-full border-4 border-slate-200 border-t-orange-500 animate-spin" />
          <p className="mt-4 text-slate-500 font-medium">Cargando perfil del taller...</p>
        </div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 text-center max-w-md w-full">
          <div className="h-16 w-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Oops...</h2>
          <p className="text-slate-500 mb-6">{error || "Negocio no encontrado."}</p>
          <button onClick={() => router.back()} className="w-full bg-slate-900 text-white rounded-xl py-3 font-semibold hover:bg-slate-800 transition">
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  // ─── Interfaz Principal ───
  return (
    <div className="min-h-screen bg-slate-50 pb-20">

      {/* Toast Flotante */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-slide-up border border-slate-700">
          <div className="h-8 w-8 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          </div>
          <span className="font-semibold text-sm">{toastMsg}</span>
        </div>
      )}

      {/* Header Estilo Cover Dinámico */}
      <div className="relative h-[300px] md:h-[400px] w-full bg-slate-900 overflow-hidden isolate">
        {business.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={business.photoUrl} alt="Cover" className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-orange-900 opacity-60" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />

        {/* Botón Flotante Volver */}
        <button
          onClick={() => router.back()}
          className="absolute top-8 left-4 md:left-8 group flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm font-semibold z-10 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 hover:bg-white/20 shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
          Volver
        </button>

        <div className="absolute bottom-0 left-0 w-full p-4 md:p-8">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-end gap-6">

            {/* Logo o Imagen del Negocio */}
            <div className="h-28 w-28 md:h-36 md:w-36 bg-white shrink-0 rounded-3xl shadow-2xl flex items-center justify-center p-1 border-4 border-slate-900/10 overflow-hidden">
              <div className="w-full h-full bg-slate-100 rounded-2xl flex items-center justify-center overflow-hidden">
                {business.photoUrl ? (
                  <img src={business.photoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-black text-slate-300">
                    {business.name.substring(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            <div className="flex-1 pb-2">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <span className="bg-orange-500 text-white text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full shadow-sm">
                  {categoryLabel(business.category)}
                </span>
                <span className="flex items-center gap-1.5 text-slate-300 text-xs font-medium">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                  4.8 (120 Reseñas)
                </span>
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-3">
                {business.name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 md:gap-8 text-sm text-slate-300">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-400"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                  {business.address}
                </div>
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-400"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                  {business.phone || "Sin teléfono"}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Contenido Pestañas */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 mt-8">

        {/* Descripción corta */}
        <p className="text-slate-600 mb-8 max-w-3xl text-sm md:text-base leading-relaxed">
          {business.description || "Ofrecemos los mejores servicios automotrices con garantía y profesionalismo. Contamos con técnicos especializados para atender su vehículo con equipos de última generación."}
        </p>

        {hasBranches && (
          <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Sede</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">Elige una sede para ver sus servicios y productos</p>
              </div>
              <div className="w-full md:max-w-xl flex items-center gap-2">
                {business.branches && business.branches.length > 1 ? (
                  <div className="relative flex-1">
                    <select
                      value={viewBranchId ?? ""}
                      onChange={e => handleBranchChange(e.target.value ? Number(e.target.value) : null)}
                      className="w-full h-12 appearance-none rounded-2xl border-2 border-slate-200 bg-slate-50 pl-4 pr-10 text-slate-900 font-medium focus:border-orange-500 focus:ring-0 outline-none transition"
                    >
                      <option value="">Selecciona una sede</option>
                      {business.branches.map(branch => (
                        <option key={branch.id} value={branch.id}>
                          {branchLabel(branch)}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex h-12 items-center rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700">
                    {selectedBranchLabel}
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleOpenMap}
                  className="h-12 px-5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shrink-0 shadow-lg shadow-orange-500/20"
                  title="Ver mapa de sedes"
                >
                  Ver mapa
                </button>
              </div>
            </div>
          </div>
        )}

        {hasBranches && !selectedBranch ? (
          <div className="mb-8 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-800">Selecciona una sede</h3>
            <p className="mt-1 text-sm text-slate-500">
              Elige una sede para visualizar los servicios y productos disponibles antes de agendar.
            </p>
          </div>
        ) : null}

        {(!hasBranches || selectedBranch) && (
          <>
            {/* Tab Selector */}
            <div className="flex gap-2 p-1 bg-white rounded-2xl border border-slate-200 shadow-sm w-fit mb-8">
              <button
                onClick={() => setActiveTab("servicios")}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "servicios" ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"}`}
              >
                Nuestros Servicios
              </button>
              <button
                onClick={() => setActiveTab("productos")}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "productos" ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"}`}
              >
                Tienda / Repuestos
              </button>
            </div>

            {/* Tab: SERVICIOS */}
            {activeTab === "servicios" && (
              <div className="grid md:grid-cols-2 gap-4">
                {(!visibleServices || visibleServices.length === 0) ? (
                  <div className="col-span-2 text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-slate-300 mb-4"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
                    <h3 className="text-lg font-bold text-slate-700">Aún no hay servicios</h3>
                    <p className="text-slate-500 mt-1">Este negocio maestro aún no ha publicado sus tarifas.</p>
                  </div>
                ) : (
                  visibleServices.map(svc => (
                    <div key={svc.id} className="group bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:border-orange-200 transition-all duration-300 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-4 mb-3">
                          <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-orange-600 transition-colors">
                            {svc.name}
                          </h3>
                          <div className="bg-emerald-50 text-emerald-700 font-black text-lg px-3 py-1 rounded-xl shrink-0">
                            S/ {svc.price.toFixed(2)}
                          </div>
                        </div>
                        <p className="text-slate-500 text-sm mb-4 line-clamp-3">
                          {svc.description || "Servicio especializado brindado por mecánicos expertos con las mejores herramientas del mercado."}
                        </p>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-6">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                          Tiempo estimado: {svc.durationMinutes} min
                        </div>
                        {svc.localId && business.branches?.find(branch => branch.id === svc.localId) && (
                          <div className="mb-4 inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
                            {branchLabel(business.branches.find(branch => branch.id === svc.localId)!)}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          if (!user) {
                            router.push("/api/auth/login");
                            return;
                          }
                          const initialBranchId = hasBranches ? (selectedBranch?.id ?? svc.localId ?? business.branches?.[0]?.id ?? null) : null;
                          setBookingModal({ service: svc, branchId: initialBranchId });
                          setBookingDate("");
                          setBookingTime("");
                          setBookingNotes("");
                          setBookingSuccess(false);
                          setAvailableSlots([]);
                          setSlotsError(null);
                        }}
                        className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-2xl hover:bg-orange-600 transition-colors shadow-sm group-hover:shadow-orange-500/25"
                      >
                        Agendar Cita Ahora
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab: PRODUCTOS */}
            {activeTab === "productos" && (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {(!visibleProducts || visibleProducts.length === 0) ? (
                  <div className="col-span-full text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-slate-300 mb-4"><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" /></svg>
                    <h3 className="text-lg font-bold text-slate-700">Tienda vacía</h3>
                    <p className="text-slate-500 mt-1">Este local no vende repuestos físicamente o virtualmente.</p>
                  </div>
                ) : (
                  visibleProducts.map(prod => (
                    <div key={prod.id} className="group bg-white rounded-2xl md:rounded-3xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 flex flex-col">
                      <div className="h-40 bg-slate-100 flex items-center justify-center relative overflow-hidden">
                        {prod.photoUrl ? (
                          <img src={prod.photoUrl} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 group-hover:scale-110 transition-transform duration-500"><path d="m7.5 4.27 9 5.15" /><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg>
                        )}
                        {prod.stock < 5 && prod.stock > 0 && (
                          <span className="absolute top-2 left-2 bg-rose-500 text-white text-[9px] font-bold px-2 py-1 rounded-md uppercase tracking-wide">
                            Quedan {prod.stock}
                          </span>
                        )}
                        {prod.deliveryAvailable && (
                          <span className="absolute top-2 right-2 bg-emerald-600 text-white text-[9px] font-bold px-2 py-1 rounded-md uppercase tracking-wide">
                            🚚 Delivery
                          </span>
                        )}
                      </div>
                      <div className="p-4 md:p-5 flex-1 flex flex-col">
                        <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 text-sm md:text-base leading-snug mb-2">
                          {prod.name}
                        </h3>
                        <p className={`text-[10px] font-bold mb-2 ${prod.deliveryAvailable ? "text-emerald-600" : "text-slate-400"}`}>
                          {prod.deliveryAvailable ? "Envío a domicilio disponible" : "Solo recojo en tienda"}
                        </p>
                        <div className="mt-auto pt-4 flex items-center justify-between gap-2">
                          <div className="font-black text-slate-900 md:text-lg">S/ {prod.price.toFixed(2)}</div>
                          <button
                            onClick={() => {
                              if (!user) {
                                router.push("/api/auth/login");
                                return;
                              }
                              setProductModal(prod);
                              setProductQty(1);
                            }}
                            disabled={addingProduct === prod.id || prod.stock <= 0}
                            className="h-10 w-10 md:h-11 md:w-11 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                          >
                            {addingProduct === prod.id ? (
                              <div className="h-4 w-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}

      </div>

      {/* MODAL DE RESERVA (Aparece sobre toda la pantalla) */}
      {bookingModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeBookingModal} />

          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg max-h-[calc(100vh-2rem)] relative z-10 overflow-hidden animate-slide-up flex flex-col">

            {/* Header Modal */}
            <div className="bg-slate-900 p-6 md:p-8 text-white relative">
              {!bookingSuccess && !submittingBooking && (
                <button onClick={closeBookingModal} className="absolute top-6 right-6 h-8 w-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                </button>
              )}
              <div className="bg-orange-500 text-white text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full w-fit mb-4">
                Programando cita
              </div>
              <h2 className="text-2xl font-bold pr-10">{bookingModal.service.name}</h2>
              <div className="flex items-center gap-4 mt-4 text-slate-300 text-sm">
                <span className="flex items-center gap-1.5"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg> {bookingModal.service.durationMinutes} min</span>
                <span className="font-bold text-emerald-400">S/ {bookingModal.service.price.toFixed(2)}</span>
              </div>
            </div>

            {/* Configurar Estado Reservando Success */}
            {bookingSuccess ? (
              <div className="flex-1 overflow-y-auto p-10 text-center animate-fade-in">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">¡Reserva Confirmada!</h3>
                <p className="text-slate-500">Nos comunicaremos pronto para confirmar la hora exacta y prepararnos para recibirte.</p>
              </div>
            ) : (
              /* Cuerpo Modal - Formulario */
              <div className="flex-1 overflow-y-auto">
                <form onSubmit={handleBooking} className="p-6 md:p-8">
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Auto para el servicio</label>
                      {vehicles.length > 0 ? (
                        <select
                          value={bookingVehicleId ?? ""}
                          onChange={e => setBookingVehicleId(e.target.value ? Number(e.target.value) : null)}
                          className="w-full h-12 rounded-xl border-2 border-slate-200 bg-slate-50 px-4 text-slate-900 font-medium focus:border-orange-500 outline-none transition"
                        >
                          <option value="">Selecciona un auto (opcional)</option>
                          {vehicles.map(vehicle => <option key={vehicle.id} value={vehicle.id}>{vehicle.vehicleType} · {vehicle.plate} · {vehicle.mileage} km</option>)}
                        </select>
                      ) : (
                        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">No tienes autos registrados. Puedes registrar uno desde tu panel, en “Mis Autos”.</p>
                      )}
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Fecha (D/M/A)</label>
                        <input
                          type="date"
                          required
                          min={peruTodayForDateInput()}
                          value={bookingDate}
                          onChange={e => {
                            setBookingDate(e.target.value);
                            setBookingTime("");
                          }}
                          className="w-full h-12 rounded-xl border-2 border-slate-200 bg-slate-50 px-4 text-slate-900 font-medium focus:border-orange-500 focus:ring-0 outline-none transition"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Slots disponibles</label>
                        {slotsLoading && <span className="text-xs font-semibold text-slate-400">Cargando...</span>}
                      </div>
                      {slotsError && (
                        <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                          {slotsError}
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {availableSlots.map(slot => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setBookingTime(slot)}
                            className={`rounded-xl border px-3 py-3 text-sm font-bold transition ${bookingTime === slot
                              ? "border-orange-500 bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                              : "border-slate-200 bg-white text-slate-700 hover:border-orange-200 hover:bg-orange-50"
                              }`}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                      {!slotsLoading && bookingDate && availableSlots.length === 0 && (
                        <p className="mt-3 text-sm text-slate-500">
                          No hay bloques libres para esta fecha.
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Detalles para el Especialista (Opcional)</label>
                      <textarea
                        rows={3}
                        placeholder="Ej: Mi auto hace un ruido raro al frenar..."
                        value={bookingNotes}
                        onChange={e => setBookingNotes(e.target.value)}
                        className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 p-4 text-sm text-slate-900 focus:border-orange-500 focus:ring-0 outline-none transition resize-none"
                      />
                    </div>
                  </div>

                  <div className="mt-8">

                    <button
                      type="submit"
                      disabled={submittingBooking || slotsLoading || !bookingTime || availableSlots.length === 0 || (hasBranches && !bookingModal.branchId)}
                      className="w-full bg-orange-500 text-white font-black py-4 rounded-xl hover:bg-orange-400 transition shadow-lg shadow-orange-500/30 text-lg flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                      {submittingBooking ? (
                        <><div className="h-5 w-5 border-2 border-white border-t-transparent animate-spin rounded-full" /> Procesando...</>
                      ) : (
                        <><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg> Solicitar Cita</>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN DE PRODUCTO */}
      {productModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setProductModal(null)} />

          <div className="relative bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl z-10 border border-slate-100 animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setProductModal(null)}
              className="absolute top-4 right-4 h-9 w-9 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition font-bold text-sm"
            >
              ✕
            </button>

            {/* Header del Producto */}
            <div className="flex items-center gap-4 mb-5">
              <div className="h-20 w-20 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                {productModal.photoUrl ? (
                  <img src={productModal.photoUrl} alt={productModal.name} className="w-full h-full object-cover" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-300"><path d="m7.5 4.27 9 5.15" /><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">{productModal.category || "Repuesto"}</span>
                <h3 className="font-extrabold text-slate-900 text-base line-clamp-1">{productModal.name}</h3>
                <p className="text-xs text-slate-500 truncate">{productModal.brand ? `Marca: ${productModal.brand}` : "Repuesto para vehículo"}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                    ✓ {productModal.stock} en stock
                  </span>
                  {productModal.igv && (
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                      +IGV
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Selector de Cantidad de Unidades */}
            <div className="bg-slate-50 rounded-2xl p-4 mb-5 space-y-3 border border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Unidades a comprar</span>
                <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setProductQty(prev => Math.max(1, prev - 1))}
                    disabled={productQty <= 1}
                    className="h-8 w-8 rounded-lg bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 disabled:opacity-40 transition"
                  >
                    -
                  </button>
                  <span className="font-black text-slate-900 min-w-[24px] text-center text-sm">{productQty}</span>
                  <button
                    type="button"
                    onClick={() => setProductQty(prev => Math.min(productModal.stock, prev + 1))}
                    disabled={productQty >= productModal.stock}
                    className="h-8 w-8 rounded-lg bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 disabled:opacity-40 transition"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Precio Unitario:</span>
                <span className="text-slate-900 font-bold">S/ {productModal.price.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-base font-black">
                <span className="text-slate-900">Total a Pagar:</span>
                <span className="text-blue-600 text-lg">S/ {(productModal.price * productQty).toFixed(2)}</span>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={async () => {
                  const prod = productModal;
                  const qty = productQty;
                  setProductModal(null);
                  await handleAddToCart(prod, qty);
                }}
                disabled={addingProduct === productModal.id}
                className="flex-1 bg-slate-900 text-white font-bold py-3.5 rounded-2xl hover:bg-blue-600 transition-colors shadow-lg shadow-slate-900/20 disabled:opacity-50 text-sm flex items-center justify-center gap-2"
              >
                {addingProduct === productModal.id ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
                ) : (
                  <>🛒 Confirmar y Agregar (S/ {(productModal.price * productQty).toFixed(2)})</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL MAPA DE SEDES */}
      {showMapModal && business.branches && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowMapModal(false)} />

          <div className="relative bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl z-10 border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">🗺️</span>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">Sedes de {business.name}</h3>
                  <p className="text-xs text-slate-500">Visualiza las ubicaciones en el mapa y selecciona tu sede más conveniente.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMapModal(false)}
                className="h-9 w-9 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <BranchesMap
              branches={business.branches.map(b => ({
                id: b.id,
                name: b.name,
                address: b.address,
                district: b.district,
                phone: b.phone,
                latitude: b.latitude ?? null,
                longitude: b.longitude ?? null,
              }))}
              userCoords={userCoords}
              onSelectBranch={(branchId) => {
                handleBranchChange(branchId);
                setShowMapModal(false);
              }}
            />
          </div>
        </div>
      )}

    </div>
  );
}
