"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../../lib/api";
import { Booking } from "../shared";

type QuoteItem = { description: string; quantity: number; unitPrice: number; subtotal?: number };
type Quote = {
  id: number; bookingId: number; clientName: string; clientPhone?: string | null;
  serviceName?: string | null; vehicleDescription?: string | null; diagnosis: string;
  status: "DRAFT" | "APPROVED"; totalAmount: number; createdAt: string; approvedAt?: string | null;
  sentToClient?: boolean; diagnosisPhotoUrls?: string[];
  items: QuoteItem[];
};

const emptyItem = (): QuoteItem => ({ description: "", quantity: 1, unitPrice: 0 });

export default function CotizacionesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingId, setBookingId] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [items, setItems] = useState<QuoteItem[]>([emptyItem()]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const total = useMemo(() => items.reduce((sum, item) => sum + Math.max(0, item.quantity || 0) * Math.max(0, item.unitPrice || 0), 0), [items]);

  const load = async () => {
    try {
      const [quoteData, bookingData] = await Promise.all([
        apiFetch<Quote[]>("/quotations"),
        apiFetch<Booking[]>("/bookings/business"),
      ]);
      setQuotes(Array.isArray(quoteData) ? quoteData : []);
      setBookings((Array.isArray(bookingData) ? bookingData : []).filter(booking => booking.status !== "CANCELLED"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar las cotizaciones.");
    }
  };

  useEffect(() => { void load(); }, []);

  const changeItem = (index: number, field: keyof QuoteItem, value: string) => {
    setItems(previous => previous.map((item, currentIndex) => currentIndex !== index ? item : {
      ...item,
      [field]: field === "description" ? value : Number(value),
    }));
  };

  const createQuote = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null); setNotice(null); setCreating(true);
    try {
      await apiFetch<Quote>("/quotations", {
        method: "POST",
        body: JSON.stringify({ bookingId: Number(bookingId), diagnosis, diagnosisPhotoUrls: photoUrls, items }),
      });
      setBookingId(""); setDiagnosis(""); setItems([emptyItem()]); setPhotoUrls([]);
      setNotice("Cotización guardada. Cuando el cliente acepte, podrás aprobarla y generar su boleta.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la cotización.");
    } finally { setCreating(false); }
  };

  const uploadPhoto = async (file: File) => {
    if (!file.type.startsWith("image/")) { setError("Solo puedes subir fotos del diagnóstico."); return; }
    try {
      setUploadingPhoto(true); setError(null);
      const data = new FormData(); data.append("file", file);
      const result = await apiFetch<{ url: string }>("/quotations/diagnosis-photo", { method: "POST", body: data });
      setPhotoUrls(previous => [...previous, result.url]);
    } catch (err) { setError(err instanceof Error ? err.message : "No se pudo subir la foto."); }
    finally { setUploadingPhoto(false); }
  };

  const approve = async (id: number) => {
    if (!confirm("¿El cliente aprobó esta cotización? Después podrás generar la boleta PDF.")) return;
    try {
      await apiFetch<Quote>(`/quotations/${id}/approve`, { method: "POST" });
      setNotice("Cotización aprobada. Ya puedes generar la boleta PDF.");
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : "No se pudo aprobar la cotización."); }
  };

  const sendToClient = async (id: number) => {
    try {
      await apiFetch(`/quotations/${id}/send`, { method: "POST" });
      setNotice("Boleta enviada al cliente. Ya la puede ver y descargar en su panel.");
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : "No se pudo enviar la boleta."); }
  };

  return <div className="mx-auto max-w-6xl space-y-8">
    <header className="rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 px-7 py-8 text-white shadow-xl">
      <p className="text-xs font-black uppercase tracking-[.24em] text-blue-300">Taller · diagnóstico y repuestos</p>
      <h1 className="mt-2 text-3xl font-black">Cotizaciones</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-300">Registra lo encontrado durante el servicio, cotiza las piezas y genera una boleta PDF solo después de la aprobación del cliente.</p>
    </header>

    {error && <p className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700">{error}</p>}
    {notice && <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700">{notice}</p>}

    <form onSubmit={createQuote} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <div className="mb-6 flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 font-black text-blue-700">1</span><div><h2 className="font-black text-slate-900">Nueva cotización</h2><p className="text-xs text-slate-500">Vincúlala a la cita que está siendo atendida.</p></div></div>
      <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">Cita / cliente</label>
      <select required value={bookingId} onChange={event => setBookingId(event.target.value)} className="mb-6 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500">
        <option value="">Selecciona una cita</option>
        {bookings.map(booking => <option key={booking.id} value={booking.id}>#{booking.id} · {booking.clientName || "Cliente"} · {booking.serviceName || "Servicio"}{booking.vehicle?.plate ? ` · ${booking.vehicle.plate}` : ""}</option>)}
      </select>
      <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">Diagnóstico encontrado</label>
      <textarea required rows={4} value={diagnosis} onChange={event => setDiagnosis(event.target.value)} placeholder="Ej.: Se encontraron neumáticos pinchados y desgaste irregular en la suspensión." className="mb-7 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800 outline-none focus:border-blue-500" />
      <div className="mb-7 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wider text-slate-600">Fotos del diagnóstico</p><p className="mt-1 text-xs text-slate-500">Adjunta evidencias de lo encontrado en el vehículo.</p></div><label className="cursor-pointer rounded-xl bg-white px-4 py-2 text-xs font-black text-blue-700 shadow-sm ring-1 ring-slate-200 hover:bg-blue-50">{uploadingPhoto ? "Subiendo..." : "+ Subir foto"}<input type="file" accept="image/*" disabled={uploadingPhoto} className="hidden" onChange={event => { const file = event.target.files?.[0]; if (file) void uploadPhoto(file); event.currentTarget.value = ""; }} /></label></div>{photoUrls.length > 0 && <div className="mt-4 flex flex-wrap gap-3">{photoUrls.map((url, index) => <div key={url} className="relative"><img src={url} alt={`Diagnóstico ${index + 1}`} className="h-20 w-24 rounded-xl object-cover ring-1 ring-slate-200" /><button type="button" onClick={() => setPhotoUrls(previous => previous.filter((_, photoIndex) => photoIndex !== index))} className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-rose-600 text-xs font-black text-white">×</button></div>)}</div>}</div>

      <div className="mb-3 flex items-center justify-between"><div><h3 className="font-black text-slate-900">Cotización</h3><p className="text-xs text-slate-500">Piezas, mano de obra o trabajos adicionales.</p></div><button type="button" onClick={() => setItems(previous => [...previous, emptyItem()])} className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-black text-blue-700 hover:bg-blue-100">+ Agregar ítem</button></div>
      <div className="space-y-3">
        {items.map((item, index) => <div key={index} className="grid gap-3 rounded-2xl bg-slate-50 p-3 md:grid-cols-[1fr_100px_130px_115px_36px] md:items-center">
          <input required value={item.description} onChange={event => changeItem(index, "description", event.target.value)} placeholder="Ej.: Neumático 195/65 R15" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" />
          <input required min="1" type="number" value={item.quantity} onChange={event => changeItem(index, "quantity", event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" />
          <input required min="0" step="0.01" type="number" value={item.unitPrice} onChange={event => changeItem(index, "unitPrice", event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" />
          <span className="text-right text-sm font-black text-slate-700">S/ {(item.quantity * item.unitPrice).toFixed(2)}</span>
          <button type="button" disabled={items.length === 1} onClick={() => setItems(previous => previous.filter((_, itemIndex) => itemIndex !== index))} className="text-lg font-black text-rose-500 disabled:opacity-30" title="Quitar ítem">×</button>
        </div>)}
      </div>
      <div className="mt-5 flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between"><p className="text-lg font-black text-slate-900">Total cotizado: <span className="text-blue-600">S/ {total.toFixed(2)}</span></p><button disabled={creating} className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-black text-white shadow-lg hover:bg-blue-600 disabled:opacity-60">{creating ? "Guardando..." : "Guardar cotización"}</button></div>
    </form>

    <section><div className="mb-4"><h2 className="text-xl font-black text-slate-900">Cotizaciones registradas</h2><p className="text-sm text-slate-500">Aprobación y emisión de boletas.</p></div>
      <div className="grid gap-5 lg:grid-cols-2">{quotes.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-sm text-slate-500">Aún no registraste cotizaciones.</p> : quotes.map(quote => <article key={quote.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-widest text-blue-600">Cotización #{quote.id}</p><h3 className="mt-1 text-lg font-black text-slate-900">{quote.clientName}</h3><p className="text-xs text-slate-500">{quote.serviceName} {quote.vehicleDescription ? `· ${quote.vehicleDescription}` : ""}</p></div><span className={`rounded-full px-3 py-1 text-xs font-black ${quote.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{quote.status === "APPROVED" ? "APROBADA" : "PENDIENTE"}</span></div>
        <div className="mt-5 rounded-2xl bg-slate-50 p-4"><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Diagnóstico</p><p className="mt-1 text-sm text-slate-700">{quote.diagnosis}</p>{(quote.diagnosisPhotoUrls?.length ?? 0) > 0 && <div className="mt-3 flex gap-2 overflow-x-auto">{quote.diagnosisPhotoUrls?.map(url => <a key={url} href={url} target="_blank" rel="noreferrer"><img src={url} alt="Foto de diagnóstico" className="h-16 w-20 rounded-lg object-cover" /></a>)}</div>}</div>
        <div className="mt-4 space-y-2">{quote.items.map((item, index) => <div key={index} className="flex justify-between gap-4 text-sm"><span className="text-slate-600">{item.quantity}× {item.description}</span><strong className="text-slate-900">S/ {(item.subtotal ?? item.quantity * item.unitPrice).toFixed(2)}</strong></div>)}</div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4"><span className="font-black text-slate-900">Total: S/ {quote.totalAmount.toFixed(2)}</span>{quote.status === "APPROVED" ? <div className="flex gap-2"><button onClick={() => window.open(`/api/backend/quotations/${quote.id}/receipt`, "_blank", "noopener,noreferrer")} className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-black text-white hover:bg-slate-700">Ver boleta PDF</button><button disabled={quote.sentToClient} onClick={() => void sendToClient(quote.id)} className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white hover:bg-emerald-500 disabled:opacity-60">{quote.sentToClient ? "Enviada al cliente" : "Enviar boleta al cliente"}</button></div> : <button onClick={() => approve(quote.id)} className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-black text-white hover:bg-blue-500">Aprobar cotización</button>}</div>
      </article>)}</div>
    </section>
  </div>;
}
