"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { apiFetch } from "../../../lib/api";
import { BUSINESS_CATEGORIES, categoryLabel } from "../../../lib/businessCategories";
import { Business } from "../shared";
import {
  PERU_DEPARTMENTS,
  getProvinces,
  getDistricts,
  geocodeAddress,
} from "../../../lib/peruLocations";

const LocationPickerMap = dynamic(() => import("./LocationPickerMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[260px] w-full bg-slate-800/50 rounded-2xl animate-pulse flex items-center justify-center text-slate-400 text-xs font-semibold mt-3 border border-white/10">
      Cargando mapa interactivo...
    </div>
  ),
});

export default function BusinessSetupForm({ onCreated }: { onCreated: (biz: Business) => void }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("SERVICIOS_ESPECIALIZADOS");

  // Ubicación jerárquica
  const defaultDept = PERU_DEPARTMENTS.includes("Lima" as any) ? "Lima" : PERU_DEPARTMENTS[0];
  const [department, setDepartment] = useState<string>(defaultDept);

  const initialProvinces = getProvinces(defaultDept);
  const [province, setProvince] = useState<string>(initialProvinces[0] || "");

  const initialDistricts = getDistricts(defaultDept, initialProvinces[0] || "");
  const [district, setDistrict] = useState<string>(initialDistricts[0] || "");

  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");

  // Coordenadas para el mapa
  const [latitude, setLatitude] = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodedSuccess, setGeocodedSuccess] = useState(false);
  const [gettingGps, setGettingGps] = useState(false);

  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Al cambiar departamento -> actualizar provincias y distrito
  const handleDepartmentChange = (newDept: string) => {
    setDepartment(newDept);
    const provs = getProvinces(newDept);
    const firstProv = provs[0] || "";
    setProvince(firstProv);
    const dists = getDistricts(newDept, firstProv);
    setDistrict(dists[0] || "");
  };

  // Al cambiar provincia -> actualizar distritos
  const handleProvinceChange = (newProv: string) => {
    setProvince(newProv);
    const dists = getDistricts(department, newProv);
    setDistrict(dists[0] || "");
  };

  // Geocodificación automática cuando cambia la dirección o el distrito
  const handleAutoGeocode = useCallback(async () => {
    if (!address.trim()) return;
    setIsGeocoding(true);
    setGeocodedSuccess(false);
    try {
      const coords = await geocodeAddress(address, district, province, department);
      if (coords) {
        setLatitude(coords.lat.toFixed(6));
        setLongitude(coords.lng.toFixed(6));
        setGeocodedSuccess(true);
        setTimeout(() => setGeocodedSuccess(false), 4000);
      }
    } finally {
      setIsGeocoding(false);
    }
  }, [address, district, province, department]);

  // Debounce automático para la dirección
  useEffect(() => {
    const timer = setTimeout(() => {
      if (address.trim().length >= 4) {
        handleAutoGeocode();
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [address, district, province, department, handleAutoGeocode]);

  const handleGetGps = () => {
    if ("geolocation" in navigator) {
      setGettingGps(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude.toFixed(6));
          setLongitude(pos.coords.longitude.toFixed(6));
          setGettingGps(false);
        },
        () => {
          setGettingGps(false);
          setErr("No se pudo obtener la ubicación GPS de tu dispositivo.");
        }
      );
    } else {
      setErr("Tu navegador no soporta geolocalización.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogo(file);
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim() || !phone.trim()) {
      setErr("Completa los campos obligatorios.");
      return;
    }
    try {
      setSaving(true);
      setErr(null);

      const parsedLat = latitude.trim() !== "" ? parseFloat(latitude) : null;
      const parsedLng = longitude.trim() !== "" ? parseFloat(longitude) : null;

      // 1. Crear el negocio con todos los campos de ubicación
      const biz = await apiFetch<Business>("/business/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          category,
          department,
          province,
          district,
          address,
          phone,
          description,
          latitude: parsedLat,
          longitude: parsedLng,
        }),
      });

      // 2. Auto-crear Sede Principal
      const districtStr = district ? `${district}, ${department}` : department;
      await apiFetch("/branches/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Sede Principal",
          address: address.trim(),
          phone: phone.trim(),
          district: districtStr,
          latitude: parsedLat,
          longitude: parsedLng,
        }),
      }).catch(() => { });

      // 3. Si hay foto, subirla
      if (photo) {
        const formData = new FormData();
        formData.append("file", photo);
        await apiFetch(`/business/me/photo`, {
          method: "PUT",
          body: formData,
        });
      }

      // 4. Si hay logo, subirlo
      if (logo) {
        const formData = new FormData();
        formData.append("file", logo);
        await apiFetch(`/business/me/logo`, {
          method: "PUT",
          body: formData,
        });
      }

      onCreated(biz);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error al crear el negocio");
    } finally {
      setSaving(false);
    }
  };

  const availableProvinces = getProvinces(department);
  const availableDistricts = getDistricts(department, province);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 py-8 w-full">
      <div className="w-full max-w-2xl">
        {/* Back button */}
        <button
          onClick={() => router.push("/onboarding")}
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors mb-6 group"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="group-hover:-translate-x-1 transition-transform"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          Regresar
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500 shadow-2xl shadow-orange-500/40 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <path d="M3 21h18" /><path d="M5 21V7l8-4 8 4v14" />
              <path d="M9 9h1" /><path d="M9 13h1" /><path d="M9 17h1" />
              <path d="M14 9h1" /><path d="M14 13h1" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Registra tu negocio</h1>
          <p className="mt-1.5 text-sm text-slate-400">
            Configura tu taller o empresa automotriz para empezar a gestionar reservas y clientes.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-6 sm:p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Nombre y Categoría */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nombre del negocio <span className="text-orange-400">*</span>
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="ej: Taller Mecánico Carvex"
                  className="w-full h-11 rounded-xl border border-white/10 bg-slate-800 px-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-400/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Categoría principal <span className="text-orange-400">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-11 rounded-xl border border-white/10 bg-slate-800 pl-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-400/50"
                  style={{ appearance: 'none', WebkitAppearance: 'none', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem', paddingRight: '2.5rem' }}
                >
                  {BUSINESS_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {categoryLabel(c)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Ubicación: Departamento, Provincia, Distrito */}
            <div className="pt-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                Ubicación Administrativa
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Departamento <span className="text-orange-400">*</span>
                  </label>
                  <select
                    value={department}
                    onChange={(e) => handleDepartmentChange(e.target.value)}
                    className="w-full h-11 rounded-xl border border-white/10 bg-slate-800 pl-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-orange-400/50"
                    style={{ appearance: 'none', WebkitAppearance: 'none', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem', paddingRight: '2.5rem' }}
                  >
                    {PERU_DEPARTMENTS.map((dep) => (
                      <option key={dep} value={dep}>
                        {dep}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Provincia <span className="text-orange-400">*</span>
                  </label>
                  <select
                    value={province}
                    onChange={(e) => handleProvinceChange(e.target.value)}
                    className="w-full h-11 rounded-xl border border-white/10 bg-slate-800 pl-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-orange-400/50"
                    style={{ appearance: 'none', WebkitAppearance: 'none', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem', paddingRight: '2.5rem' }}
                  >
                    {availableProvinces.map((prov) => (
                      <option key={prov} value={prov}>
                        {prov}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Distrito <span className="text-orange-400">*</span>
                  </label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full h-11 rounded-xl border border-white/10 bg-slate-800 pl-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-orange-400/50"
                    style={{ appearance: 'none', WebkitAppearance: 'none', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem', paddingRight: '2.5rem' }}
                  >
                    {availableDistricts.map((dist) => (
                      <option key={dist} value={dist}>
                        {dist}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Dirección y Teléfono */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Dirección exacta <span className="text-orange-400">*</span>
                </label>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  onBlur={handleAutoGeocode}
                  required
                  placeholder="ej: Av. Javier Prado Este 1234"
                  className="w-full h-11 rounded-xl border border-white/10 bg-slate-800 px-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-400/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Teléfono de contacto <span className="text-orange-400">*</span>
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  placeholder="987654321"
                  className="w-full h-11 rounded-xl border border-white/10 bg-slate-800 px-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-400/50"
                />
              </div>
            </div>

            {/* Mapa Interactivo con Ubicación Automática */}
            <div className="pt-2 border-t border-white/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div>
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    Mapa de Ubicación Exacta
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    La ubicación se detecta automáticamente con tu dirección. Puedes hacer clic o mover el pin en el mapa para mayor precisión.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleAutoGeocode}
                    disabled={isGeocoding || !address.trim()}
                    className="px-3 py-1.5 rounded-lg bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 text-xs font-semibold transition border border-orange-500/30 flex items-center gap-1.5 disabled:opacity-40"
                  >
                    {isGeocoding ? (
                      <>
                        <span className="h-3 w-3 border-2 border-orange-400 border-t-transparent animate-spin rounded-full" />
                        Buscando...
                      </>
                    ) : (
                      "🔍 Ubicar por dirección"
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleGetGps}
                    disabled={gettingGps}
                    className="px-3 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 text-xs font-semibold transition border border-indigo-500/30 flex items-center gap-1.5 disabled:opacity-40"
                  >
                    {gettingGps ? "GPS..." : "Usar GPS"}
                  </button>
                </div>
              </div>

              {geocodedSuccess && (
                <p className="text-[11px] text-emerald-400 font-medium animate-fade-in mb-2">
                  ✓ Ubicación detectada en el mapa según la dirección ingresada.
                </p>
              )}

              <LocationPickerMap
                lat={latitude ? parseFloat(latitude) : null}
                lng={longitude ? parseFloat(longitude) : null}
                onChange={(newLat, newLng) => {
                  setLatitude(newLat.toFixed(6));
                  setLongitude(newLng.toFixed(6));
                }}
              />
            </div>

            {/* Imagen del Negocio y Logo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Imagen del Negocio */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Imagen de Portada (Marketplace)
                </label>
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 shrink-0 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center overflow-hidden">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview Portada" className="w-full h-full object-cover" />
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
                        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                        <circle cx="9" cy="9" r="2" />
                        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                      </svg>
                    )}
                  </div>
                  <label className="flex-1">
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                    <div className="h-11 flex items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/5 text-[11px] font-medium text-slate-400 hover:bg-slate-800 hover:border-orange-400/50 cursor-pointer transition-all truncate px-2">
                      {photo ? photo.name : "Subir foto de portada..."}
                    </div>
                  </label>
                </div>
              </div>

              {/* Logo del Negocio */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Logo de la Empresa (Barra lateral)
                </label>
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 shrink-0 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center overflow-hidden">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Preview Logo" className="w-full h-full object-contain p-1 bg-white" />
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
                        <circle cx="12" cy="12" r="10" />
                        <circle cx="12" cy="10" r="3" />
                        <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
                      </svg>
                    )}
                  </div>
                  <label className="flex-1">
                    <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                    <div className="h-11 flex items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/5 text-[11px] font-medium text-slate-400 hover:bg-slate-800 hover:border-orange-400/50 cursor-pointer transition-all truncate px-2">
                      {logo ? logo.name : "Subir logo institucional..."}
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Descripción <span className="text-slate-500 font-normal">(opcional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Cuéntales a tus clientes qué servicios ofreces..."
                className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-400/50 resize-none"
              />
            </div>

            {err && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                {err}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full h-12 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-400 disabled:opacity-60 transition shadow-lg shadow-orange-500/30"
            >
              {saving ? "Registrando..." : "Registrar mi negocio →"}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-slate-500">
            Tu negocio quedará en estado <span className="text-amber-400 font-medium">Pendiente</span> hasta que un administrador lo apruebe.
          </p>
        </div>
      </div>
    </div>
  );
}
