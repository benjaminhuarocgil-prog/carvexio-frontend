"use client";

import { useEffect, useMemo, useState } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { apiFetch } from "../../../lib/api";
import { Booking, statusColor, statusLabel } from "../shared";
import { useBranch } from "../context/BranchContext";

type ViewMode = "list" | "calendar";

const WEEKDAYS = ["D", "L", "M", "M", "J", "V", "S"];
const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function toIsoDateLocal(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMonthGrid(date: Date) {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const startOffset = firstDay.getDay();
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - startOffset);

  return Array.from({ length: 42 }, (_, idx) => {
    const cell = new Date(start);
    cell.setDate(start.getDate() + idx);
    return cell;
  });
}

export default function EmpresaCitasPage() {
  const { user, isLoading } = useUser();
  const { selectedBranch } = useBranch();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [monthCursor, setMonthCursor] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading || !user) return;

    const loadData = async () => {
      try {
        setLoading(true);
        const query = selectedBranch ? `?localId=${selectedBranch.id}` : "";
        const bookingData = await apiFetch<Booking[]>(`/bookings/business${query}`);
        setBookings(Array.isArray(bookingData) ? bookingData : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar citas");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, isLoading, selectedBranch]);

  const monthLabel = useMemo(
    () => `${MONTHS[monthCursor.getMonth()]} de ${monthCursor.getFullYear()}`,
    [monthCursor],
  );

  const calendarCells = useMemo(() => getMonthGrid(monthCursor), [monthCursor]);

  const selectedDayBookings = useMemo(
    () => bookings.filter(b => b.date === selectedDate),
    [bookings, selectedDate],
  );

  const bookingsByDate = useMemo(() => {
    return bookings.reduce<Record<string, Booking[]>>((acc, booking) => {
      if (!booking.date) return acc;
      acc[booking.date] = acc[booking.date] ?? [];
      acc[booking.date].push(booking);
      return acc;
    }, {});
  }, [bookings]);

  const changeMonth = (offset: number) => {
    setMonthCursor(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
    setSelectedDate(null);
  };

  const confirmBooking = async (id: number) => {
    try {
      await apiFetch(`/bookings/${id}/confirm`, { method: "PUT" });
      setBookings(prev => prev.map(b => (b.id === id ? { ...b, status: "CONFIRMED" } : b)));
    } catch {
      setError("No se pudo confirmar");
    }
  };

  const completeBooking = async (id: number) => {
    try {
      await apiFetch(`/bookings/${id}/complete`, { method: "PUT" });
      setBookings(prev => prev.map(b => (b.id === id ? { ...b, status: "COMPLETED" } : b)));
    } catch {
      setError("No se pudo completar");
    }
  };

  const cancelBooking = async (id: number) => {
    if (!confirm("¿Cancelar esta reserva?")) return;
    try {
      await apiFetch(`/bookings/${id}/cancel-business`, { method: "PUT" });
      setBookings(prev => prev.map(b => (b.id === id ? { ...b, status: "CANCELLED" } : b)));
    } catch {
      setError("No se pudo cancelar");
    }
  };

  return (
    <>
      <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Agenda de Citas</h1>
          <p className="mt-0.5 text-sm text-slate-500">Gestiona reservas y horarios</p>
        </div>

        <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${viewMode === "list" ? "bg-slate-900 text-white shadow" : "text-slate-500 hover:text-slate-900"
              }`}
          >
            Vista Lista
          </button>
          <button
            type="button"
            onClick={() => setViewMode("calendar")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${viewMode === "calendar" ? "bg-slate-900 text-white shadow" : "text-slate-500 hover:text-slate-900"
              }`}
          >
            Vista Calendario
          </button>
        </div>
      </header>

      {error && (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      {viewMode === "list" ? (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50">
                <tr>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Hora</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Cliente</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Servicio</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Sede</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Fecha</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Notas</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Estado</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-8 text-sm text-slate-400">Cargando...</td>
                  </tr>
                ) : bookings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-8 text-sm text-slate-400">No hay reservas aún.</td>
                  </tr>
                ) : (
                  bookings.map(b => (
                    <tr key={b.id} className="transition hover:bg-slate-50">
                      <td className="px-5 py-3.5 font-mono text-sm text-slate-700">{b.time?.slice(0, 5) ?? "-"}</td>
                      <td className="px-5 py-3.5 font-medium text-slate-900">{b.clientName ?? "Cliente Anónimo"}</td>
                      <td className="px-5 py-3.5 font-medium text-slate-900">{b.serviceName ?? "-"}</td>
                      <td className="px-5 py-3.5 text-xs font-semibold text-slate-600">
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-slate-700">
                          {b.branchName || b.localName || (selectedBranch ? selectedBranch.name : "Sede Principal")}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500">{b.date ?? "-"}</td>
                      <td className="max-w-[160px] px-5 py-3.5 text-xs text-slate-400 truncate" title={b.notes ?? ""}>{b.notes ?? "-"}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor(b.status)}`}>
                          {statusLabel(b.status)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex gap-2">
                          {b.status === "PENDING" && (
                            <button
                               type="button"
                              onClick={() => confirmBooking(b.id)}
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500"
                            >
                              Confirmar
                            </button>
                          )}
                          {b.status === "CONFIRMED" && (
                            <button
                              type="button"
                              onClick={() => completeBooking(b.id)}
                              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-500"
                            >
                              Completar
                            </button>
                          )}
                          {(b.status === "PENDING" || b.status === "CONFIRMED") && (
                            <button
                              type="button"
                              onClick={() => cancelBooking(b.id)}
                              className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                            >
                              Cancelar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[1.6fr_0.9fr]">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 capitalize">{monthLabel}</h2>
                <p className="text-sm text-slate-500">Haz clic en un día para ver sus reservas</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => changeMonth(-1)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={() => changeMonth(1)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Siguiente
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {WEEKDAYS.map(day => (
                <div key={day} className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {day}
                </div>
              ))}

              {calendarCells.map(cell => {
                const iso = toIsoDateLocal(cell);
                const inMonth = cell.getMonth() === monthCursor.getMonth();
                const bookingCount = bookingsByDate[iso]?.length ?? 0;
                const isToday = iso === toIsoDateLocal(new Date());
                const isSelected = selectedDate === iso;

                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => setSelectedDate(iso)}
                    className={`min-h-[110px] rounded-2xl border p-3 text-left transition ${isSelected
                        ? "border-orange-400 bg-orange-50 shadow-md"
                        : inMonth
                          ? "border-slate-100 bg-white hover:border-orange-200 hover:bg-orange-50/40"
                          : "border-slate-100 bg-slate-50 text-slate-300"
                      } ${isToday ? "ring-2 ring-slate-900/5" : ""}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-sm font-semibold ${inMonth ? "text-slate-900" : "text-slate-300"}`}>
                        {cell.getDate()}
                      </span>
                      {bookingCount > 0 && (
                        <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold text-white">
                          {bookingCount}
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {bookingCount > 0 ? (
                        Array.from({ length: Math.min(3, bookingCount) }).map((_, idx) => (
                          <span key={idx} className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                        ))
                      ) : (
                        <span className="text-xs text-slate-400">Libre</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <aside className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {selectedDate ? `Reservas del ${selectedDate}` : "Selecciona un día"}
                </h3>
                <p className="text-sm text-slate-500">
                  {selectedDate ? `${selectedDayBookings.length} reserva(s) para esta fecha` : "El panel mostrará el detalle del día seleccionado"}
                </p>
              </div>
              {selectedDate && (
                <button
                  type="button"
                  onClick={() => setSelectedDate(null)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Limpiar
                </button>
              )}
            </div>

            {!selectedDate ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                Haz clic en un día con reservas para ver el detalle.
              </div>
            ) : selectedDayBookings.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                No hay reservas para este día.
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDayBookings
                  .slice()
                  .sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""))
                  .map(booking => (
                    <div key={booking.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{booking.serviceName ?? "-"}</div>
                          <div className="mt-1 text-xs text-slate-500">
                            {booking.time?.slice(0, 5) ?? "--:--"} · {booking.notes ?? "Sin notas"}
                          </div>
                        </div>
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor(booking.status)}`}>
                          {statusLabel(booking.status)}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {booking.status === "PENDING" && (
                          <button
                            type="button"
                            onClick={() => confirmBooking(booking.id)}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500"
                          >
                            Confirmar
                          </button>
                        )}
                        {booking.status === "CONFIRMED" && (
                          <button
                            type="button"
                            onClick={() => completeBooking(booking.id)}
                            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-500"
                          >
                            Completar
                          </button>
                        )}
                        {(booking.status === "PENDING" || booking.status === "CONFIRMED") && (
                          <button
                            type="button"
                            onClick={() => cancelBooking(booking.id)}
                            className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </aside>
        </div>
      )}
    </>
  );
}
