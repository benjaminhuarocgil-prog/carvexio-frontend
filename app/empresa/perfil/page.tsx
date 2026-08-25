"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { apiFetch } from "../../../lib/api";
import { Business } from "../shared";
import { BUSINESS_CATEGORIES, categoryLabel, normalizeBusinessCategory } from "../../../lib/businessCategories";
import {
  PERU_DEPARTMENTS,
  getProvinces,
  getDistricts,
  geocodeAddress,
} from "../../../lib/peruLocations";

const LocationPickerMap = dynamic(() => import("../components/LocationPickerMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[320px] w-full bg-slate-100 rounded-2xl animate-pulse flex items-center justify-center text-slate-400 text-xs font-semibold mt-3">
      Cargando mapa interactivo de selección...
    </div>
  ),
});

type BusinessCategory = (typeof BUSINESS_CATEGORIES)[number];

export default function PerfilEmpresaPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [success, setSuccess] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [category, setCategory] = useState<BusinessCategory>(BUSINESS_CATEGORIES[0]);
  
  const defaultDept = PERU_DEPARTMENTS.includes("Lima" as any) ? "Lima" : PERU_DEPARTMENTS[0];
  const [department, setDepartment] = useState<string>(defaultDept);
  const [province, setProvince] = useState<string>("");
  const [district, setDistrict] = useState<string>("");
  
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const [latitude, setLatitude] = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");
  const [gettingGps, setGettingGps] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodedSuccess, setGeocodedSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiFetch<Business>("/business/me")
      .then((biz) => {
        setName(biz.name ?? "");
        setCategory((normalizeBusinessCategory(biz.category) ?? BUSINESS_CATEGORIES[0]) as BusinessCategory);
        
        const fetchedDept = biz.department ?? defaultDept;
        setDepartment(fetchedDept);

        const availableProvs = getProvinces(fetchedDept);
        const fetchedProv = biz.province ?? availableProvs[0] ?? "";
        setProvince(fetchedProv);

        const availableDists = getDistricts(fetchedDept, fetchedProv);
        const fetchedDist = biz.district ?? availableDists[0] ?? "";
        setDistrict(fetchedDist);

        setAddress(biz.address ?? "");
        setPhone(biz.phone ?? "");
        setDescription(biz.description ?? "");
        setLatitude(biz.latitude != null ? String(biz.latitude) : "");
        setLongitude(biz.longitude != null ? String(biz.longitude) : "");
        setPhotoUrl(biz.photoUrl ?? null);
        setLogoUrl(biz.logoUrl ?? null);
        setStatus(biz.status ?? null);
      })
      .catch(() => setErr("No se pudieron cargar los datos del negocio."))
      .finally(() => setLoading(false));
  }, []);

  const handleDepartmentChange = (newDept: string) => {
    setDepartment(newDept);
    const provs = getProvinces(newDept);
    const firstProv = provs[0] || "";
    setProvince(firstProv);
    const dists = getDistricts(newDept, firstProv);
    setDistrict(dists[0] || "");
  };

  const handleProvinceChange = (newProv: string) => {
    setProvince(newProv);
    const dists = getDistricts(department, newProv);
    setDistrict(dists[0] || "");
  };

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

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview local
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);

    // Subir inmediatamente
    try {
      setUploadingPhoto(true);
      const formData = new FormData();
      formData.append("file", file);
      const updated = await apiFetch<Business>("/business/me/photo", {
        method: "PUT",
        body: formData,
      });
      setPhotoUrl(updated.photoUrl ?? null);
    } catch {
      setErr("Error al subir la imagen.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview local
    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);

    // Subir inmediatamente
    try {
      setUploadingLogo(true);
      const formData = new FormData();
      formData.append("file", file);
      const updated = await apiFetch<Business>("/business/me/logo", {
        method: "PUT",
        body: formData,
      });
      setLogoUrl(updated.logoUrl ?? null);
    } catch {
      setErr("Error al subir el logo.");
    } finally {
      setUploadingLogo(false);
    }
  };

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
          setErr("No se pudo obtener la ubicación GPS del navegador.");
        }
      );
    } else {
      setErr("Tu navegador no soporta geolocalización.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim() || !phone.trim()) {
      setErr("Nombre, dirección y teléfono son obligatorios.");
      return;
    }
    try {
      setSaving(true);
      setErr(null);
      setSuccess(false);
      const normalizedCategory = normalizeBusinessCategory(category) ?? BUSINESS_CATEGORIES[0];
      const parsedLat = latitude.trim() !== "" ? parseFloat(latitude) : null;
      const parsedLng = longitude.trim() !== "" ? parseFloat(longitude) : null;

      await apiFetch<Business>("/business/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          category: normalizedCategory,
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
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error al actualizar el negocio.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
          <p className="text-sm text-slate-500">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  const avatarSrc = photoPreview ?? photoUrl;
  const availableProvinces = getProvinces(department);
  const availableDistricts = getDistricts(department, province);

  return (
    <div className="max-w-2xl mx-auto pb-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Perfil del Negocio</h1>
        <p className="mt-1 text-sm text-slate-500">
          Actualiza la información pública y la ubicación de tu empresa.
        </p>
      </div>

      {/* Estado del negocio */}
      {status && (
        <div
          className={`mb-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${
            status === "APPROVED"
              ? "bg-emerald-100 text-emerald-700"
              : status === "PENDING"
                ? "bg-amber-100 text-amber-700"
                : "bg-rose-100 text-rose-700"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              status === "APPROVED"
                ? "bg-emerald-500"
                : status === "PENDING"
                  ? "bg-amber-500"
                  : "bg-rose-500"
            }`}
          />
          {status === "APPROVED"
            ? "Negocio Aprobado"
            : status === "PENDING"
              ? "Pendiente de aprobación"
              : "Rechazado"}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Foto de Portada y Logo */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Foto de Portada */}
            <div>
              <h2 className="text-sm font-semibold text-slate-700 mb-3">Imagen de Portada (Marketplace)</h2>
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 shrink-0 rounded-2xl border-2 border-slate-100 overflow-hidden bg-slate-50 flex items-center justify-center">
                  {(photoPreview || photoUrl) ? (
                    <img src={photoPreview || photoUrl || ""} alt="Portada" className="w-full h-full object-cover" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                      fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                      className="text-slate-300">
                      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                      <circle cx="9" cy="9" r="2" />
                      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                    </svg>
                  )}
                  {uploadingPhoto && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                      <div className="h-5 w-5 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
                    </div>
                  )}
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-orange-300 transition disabled:opacity-50"
                  >
                    {uploadingPhoto ? "Subiendo..." : "Cambiar foto"}
                  </button>
                  <p className="mt-1 text-[10px] text-slate-400">PNG, JPG · máx. 5 MB</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            {/* Logo del Negocio */}
            <div>
              <h2 className="text-sm font-semibold text-slate-700 mb-3">Logo de la Empresa (Barra lateral)</h2>
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 shrink-0 rounded-2xl border-2 border-slate-100 overflow-hidden bg-white flex items-center justify-center p-1">
                  {(logoPreview || logoUrl) ? (
                    <img src={logoPreview || logoUrl || ""} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                      fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                      className="text-slate-300">
                      <circle cx="12" cy="12" r="10" />
                      <circle cx="12" cy="10" r="3" />
                      <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
                    </svg>
                  )}
                  {uploadingLogo && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                      <div className="h-5 w-5 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
                    </div>
                  )}
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploadingLogo}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-orange-300 transition disabled:opacity-50"
                  >
                    {uploadingLogo ? "Subiendo..." : "Cambiar logo"}
                  </button>
                  <p className="mt-1 text-[10px] text-slate-400">PNG, JPG · máx. 5 MB</p>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Datos generales */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
          <h2 className="text-sm font-semibold text-slate-700">Información General</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Nombre del negocio <span className="text-orange-500">*</span>
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Categoría <span className="text-orange-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as BusinessCategory)}
                className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 transition"
              >
                {BUSINESS_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {categoryLabel(c)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Ubicación Administrativa */}
          <div className="pt-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Ubicación Administrativa
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Departamento <span className="text-orange-500">*</span>
                </label>
                <select
                  value={department}
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                  className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 transition"
                >
                  {PERU_DEPARTMENTS.map((dep) => (
                    <option key={dep} value={dep}>
                      {dep}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Provincia <span className="text-orange-500">*</span>
                </label>
                <select
                  value={province}
                  onChange={(e) => handleProvinceChange(e.target.value)}
                  className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 transition"
                >
                  {availableProvinces.map((prov) => (
                    <option key={prov} value={prov}>
                      {prov}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Distrito <span className="text-orange-500">*</span>
                </label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 transition"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Dirección exacta <span className="text-orange-500">*</span>
              </label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onBlur={handleAutoGeocode}
                required
                className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Teléfono <span className="text-orange-500">*</span>
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 transition"
              />
            </div>
          </div>

          {/* Ubicación GPS para el mapa */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Ubicación Geográfica para el Mapa
                </h3>
                <p className="text-[11px] text-slate-400">
                  Permite que tus clientes te encuentren en el mapa interactivo del Marketplace.
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAutoGeocode}
                  disabled={isGeocoding || !address.trim()}
                  className="px-3 py-1.5 rounded-lg bg-orange-50 text-orange-700 hover:bg-orange-100 text-xs font-bold transition flex items-center gap-1.5 border border-orange-200/60 disabled:opacity-50"
                >
                  {isGeocoding ? "Buscando..." : "🔍 Ubicar por dirección"}
                </button>

                <button
                  type="button"
                  onClick={handleGetGps}
                  disabled={gettingGps}
                  className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold transition flex items-center gap-1.5 border border-indigo-200/60 disabled:opacity-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600"><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" /></svg>
                  {gettingGps ? "Obteniendo..." : "Usar GPS"}
                </button>
              </div>
            </div>

            {geocodedSuccess && (
              <p className="text-xs text-emerald-600 font-medium mb-3">
                ✓ Ubicación encontrada y posicionada en el mapa según la dirección.
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Latitud <span className="font-normal text-slate-400">(ej: -12.085421)</span>
                </label>
                <input
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="-12.085421"
                  className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Longitud <span className="font-normal text-slate-400">(ej: -77.034512)</span>
                </label>
                <input
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="-77.034512"
                  className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 transition"
                />
              </div>
            </div>

            {/* Interactive Picker Map */}
            <LocationPickerMap
              lat={latitude ? parseFloat(latitude) : null}
              lng={longitude ? parseFloat(longitude) : null}
              onChange={(newLat, newLng) => {
                setLatitude(newLat.toFixed(6));
                setLongitude(newLng.toFixed(6));
              }}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Descripción{" "}
              <span className="font-normal text-slate-400">(opcional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Cuéntales a tus clientes sobre tu negocio..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 transition resize-none"
            />
          </div>
        </div>

        {/* Feedback */}
        {err && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
            {err}
          </div>
        )}
        {success && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            Cambios guardados correctamente.
          </div>
        )}

        {/* Botón guardar */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 h-11 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-400 disabled:opacity-60 transition shadow-lg shadow-orange-500/20"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}
