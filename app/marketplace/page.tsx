"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { apiFetch } from "../../lib/api";
import { BUSINESS_CATEGORIES, categoryLabel, normalizeBusinessCategory } from "../../lib/businessCategories";

const MarketplaceMap = dynamic(() => import("./components/MarketplaceMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[550px] w-full bg-slate-100 rounded-3xl animate-pulse flex flex-col items-center justify-center text-slate-400 gap-3 border border-slate-200">
      <div className="h-10 w-10 border-4 border-slate-300 border-t-orange-500 rounded-full animate-spin" />
      <span className="text-sm font-semibold">Cargando mapa interactivo de talleres...</span>
    </div>
  ),
});

type Business = {
  id: number;
  name?: string;
  category?: string;
  address?: string;
  phone?: string;
  photoUrl?: string;
  description?: string;
  district?: string;
  department?: string;
  latitude?: number;
  longitude?: number;
};

function getBusinessLocation(biz: Business) {
  const department = biz.department?.trim();
  const district = biz.district?.trim();
  if (department && district) return `${department} · ${district}`;
  return department || district || "";
}

export default function MarketplacePage() {
  const router = useRouter();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("TODOS");
  const [locationFilter, setLocationFilter] = useState("TODAS");
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await apiFetch<Business[]>("/business/public");
        if (!cancelled) setBusinesses(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Error al cargar los negocios");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const requestUserLocation = () => {
    if ("geolocation" in navigator) {
      setGeoLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setGeoLoading(false);
          setViewMode("map");
        },
        (err) => {
          setGeoLoading(false);
          alert("No pudimos acceder a tu ubicación. Por favor, concede permisos de geolocalización en tu navegador.");
        }
      );
    } else {
      alert("Geolocalización no soportada en tu navegador.");
    }
  };

  const categories = useMemo(() => ["TODOS", ...BUSINESS_CATEGORIES], []);
  const locations = useMemo(() => {
    const values = businesses
      .map(b => (b.department ?? b.district ?? "").trim())
      .filter((value): value is string => Boolean(value));
    return ["TODAS", ...Array.from(new Set(values))];
  }, [businesses]);

  const filtered = useMemo(() => {
    return businesses.filter(b => {
      const normalizedCategory = normalizeBusinessCategory(b.category) ?? b.category ?? "";
      const locationLabel = getBusinessLocation(b);
      const matchSearch = search
        ? (b.name?.toLowerCase().includes(search.toLowerCase()) ||
          normalizedCategory.toLowerCase().includes(search.toLowerCase()) ||
          b.description?.toLowerCase().includes(search.toLowerCase()) ||
          locationLabel.toLowerCase().includes(search.toLowerCase()))
        : true;
      const matchCat = categoryFilter === "TODOS" ? true : normalizedCategory === categoryFilter;
      const matchLocation = locationFilter === "TODAS" ? true : locationLabel === locationFilter;
      return matchSearch && matchCat && matchLocation;
    });
  }, [businesses, search, categoryFilter, locationFilter]);

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <div className="relative bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-b from-orange-500/20 to-transparent rounded-full blur-3xl opacity-50" />
          <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-t from-indigo-500/20 to-transparent rounded-full blur-3xl opacity-50" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-32">
          {/* Botón Volver */}
          <button
            onClick={() => router.back()}
            className="group flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-8 text-sm font-semibold w-fit"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 group-hover:bg-white/20 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
            </div>
            Volver atrás
          </button>

          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight mb-6">
              Encuentra la mejor <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">categoría automotriz</span> para tu vehículo
            </h1>
            <p className="text-lg md:text-xl text-slate-300 mb-10">
              Explora y reserva citas en talleres, repuestos y categorías automotrices de confianza.
            </p>

            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto flex items-center bg-white/10 backdrop-blur-md border border-white/20 p-2 rounded-2xl shadow-2xl focus-within:ring-2 focus-within:ring-orange-500/50 transition-all">
              <div className="pl-4 pr-2 text-white/50">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
              </div>
              <input
                type="text"
                placeholder="Busca por nombre, categoría o taller..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent border-none text-white placeholder-slate-400 h-12 focus:outline-none focus:ring-0 text-base sm:text-lg px-2"
              />
              <button className="bg-orange-500 hover:bg-orange-400 text-white px-6 py-3 rounded-xl font-semibold transition shadow-lg shadow-orange-500/30">
                Buscar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 -mt-16 relative z-10">

        {/* Category Filters */}
        <div className="flex bg-white rounded-2xl shadow-sm border border-slate-200 p-2 mb-10 overflow-x-auto hide-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`whitespace-nowrap px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${categoryFilter === cat
                ? "bg-slate-900 text-white shadow-md"
                : "text-slate-600 hover:bg-slate-100"
                }`}
            >
              {cat === "TODOS" ? "Todas las categorías" : categoryLabel(cat)}
            </button>
          ))}
        </div>

        {/* Header Controls Bar (Map Toggle & Geolocation) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-slate-800">
              Negocios encontrados: <span className="text-orange-600">{filtered.length}</span>
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Geolocation button */}
            <button
              onClick={requestUserLocation}
              disabled={geoLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold transition border border-indigo-200/60"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600"><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" /></svg>
              {geoLoading ? "Obteniendo ubicación..." : "Cercanos a mí"}
            </button>

            {/* View Mode Toggle */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode("grid")}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition ${viewMode === "grid"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
                  }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /></svg>
                Vista Lista
              </button>
              <button
                onClick={() => setViewMode("map")}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition ${viewMode === "map"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
                  }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.106 5.553a2 2 0 0 0-1.788 0l-7 3.5A2 2 0 0 0 4 10.837v8.326a1 1 0 0 0 1.447.894l7-3.5a2 2 0 0 0 1.106-1.788V6.447a1 1 0 0 0-1.447-.894z" /><path d="M10 5.553a2 2 0 0 1 1.788 0l7 3.5a2 2 0 0 1 1.106 1.784v8.326a1 1 0 0 1-1.447.894l-7-3.5A2 2 0 0 1 10 14.769V5.553z" /></svg>
                Vista Mapa
              </button>
            </div>
          </div>
        </div>

        {locations.length > 1 && (
          <div className="mb-10 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Ubicación</h3>
                <p className="text-xs text-slate-500">Filtra por departamento o distrito cuando esté disponible.</p>
              </div>
              <button
                type="button"
                onClick={() => setLocationFilter("TODAS")}
                className="text-xs font-semibold text-orange-600 hover:text-orange-700 hover:underline"
              >
                Limpiar
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {locations.map(loc => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setLocationFilter(loc)}
                  className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition ${locationFilter === loc
                    ? "bg-orange-500 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                >
                  {loc === "TODAS" ? "Todas las ubicaciones" : loc}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Status Indicators */}
        {loading && (
          <div className="py-20 flex flex-col items-center justify-center">
            <div className="h-12 w-12 rounded-full border-4 border-slate-200 border-t-orange-500 animate-spin mb-4" />
            <p className="text-slate-500 font-medium">Cargando los mejores negocios...</p>
          </div>
        )}

        {error && !loading && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center text-rose-700 max-w-2xl mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3 opacity-80"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
            <p className="font-semibold">{error}</p>
            <p className="text-sm mt-1 opacity-80">Por favor, intenta nuevamente más tarde.</p>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-2xl mx-auto shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No encontramos resultados</h3>
            <p className="text-slate-500">
              No hay negocios que coincidan con tu búsqueda actual. Intenta con otros términos o seleccionando otra categoría.
            </p>
            <button
              onClick={() => { setSearch(""); setCategoryFilter("TODOS"); }}
              className="mt-6 text-orange-600 font-semibold hover:text-orange-700 hover:underline"
            >
              Limpiar filtros y ver todos
            </button>
          </div>
        )}

        {/* MAP VIEW */}
        {!loading && !error && filtered.length > 0 && viewMode === "map" && (
          <div className="mb-10">
            <MarketplaceMap
              businesses={filtered}
              userLocation={userLocation}
              categoryLabel={(cat) => categoryLabel(cat)}
            />
          </div>
        )}

        {/* Business Grid VIEW */}
        {!loading && !error && filtered.length > 0 && viewMode === "grid" && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map(biz => (
              <Link key={biz.id} href={`/business/${biz.id}`} className="group flex flex-col bg-white rounded-3xl border border-slate-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 hover:border-orange-200 transition-all duration-300">
                {/* Img cover */}
                <div className="h-48 w-full bg-slate-100 relative overflow-hidden shrink-0">
                  {biz.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={biz.photoUrl}
                      alt={biz.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 mb-2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
                      <span className="text-xs text-slate-400 font-medium">Sin foto</span>
                    </div>
                  )}
                  {normalizeBusinessCategory(biz.category) && (
                    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold text-slate-800 shadow-sm border border-slate-200/50">
                      {categoryLabel(normalizeBusinessCategory(biz.category) ?? "")}
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-1 mb-2">
                    {biz.name}
                  </h3>

                  <p className="text-sm text-slate-500 line-clamp-2 mb-6 flex-1">
                    {biz.description || "Categorías y servicios automotrices profesionales."}
                  </p>

                  <div className="space-y-3 pt-4 border-t border-slate-100 shrink-0">
                    {getBusinessLocation(biz) && (
                      <div className="flex flex-wrap gap-2">
                        {biz.department?.trim() && (
                          <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700">
                            {biz.department}
                          </span>
                        )}
                        {biz.district?.trim() && (
                          <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-semibold text-orange-700">
                            {biz.district}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="flex items-start gap-3 w-full">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 mt-0.5 shrink-0"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                      <span className="text-sm text-slate-600 line-clamp-1 truncate" title={biz.address}>{biz.address || "Dirección no especificada"}</span>
                    </div>
                    <div className="flex items-start gap-3 w-full">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 mt-0.5 shrink-0"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                      <span className="text-sm text-slate-600 line-clamp-1 truncate" title={biz.phone}>{biz.phone || "Teléfono no especificado"}</span>
                    </div>
                  </div>

                  <div className="mt-6 w-full flex justify-center shrink-0">
                    <span className="w-full text-center py-2.5 rounded-xl bg-orange-50 text-orange-600 font-semibold text-sm group-hover:bg-orange-500 group-hover:text-white transition-colors duration-300">
                      Ver negocio &rarr;
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
