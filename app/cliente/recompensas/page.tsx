"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../../lib/api";

type Rewards = { points: number; activeDiscountPercent: number };
const options = [{ percent: 5, cost: 400, minimum: 200, cap: 20 }, { percent: 10, cost: 1100, minimum: 500, cap: 50 }];

export default function RecompensasPage() {
  const [rewards, setRewards] = useState<Rewards | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState<number | null>(null);
  const load = () => apiFetch<Rewards>("/rewards/me").then(setRewards);
  useEffect(() => { void load(); }, []);
  const redeem = async (percent: number) => {
    try { setLoading(percent); const next = await apiFetch<Rewards>("/rewards/redeem", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ discountPercent: percent }) }); setRewards(next); setMessage(`Reclamaste el descuento del ${percent}%. Se aplicará automáticamente en tu próxima compra.`); }
    catch (err) { setMessage(err instanceof Error ? err.message : "No se pudo reclamar la recompensa."); }
    finally { setLoading(null); }
  };
  const points = rewards?.points ?? 0;
  return <div className="mx-auto max-w-4xl space-y-6">
    <div className="rounded-[2rem] bg-gradient-to-br from-indigo-700 to-blue-600 p-8 text-white shadow-xl"><p className="text-xs font-black uppercase tracking-[.2em] text-blue-200">Programa Carvex</p><h1 className="mt-2 text-3xl font-black">Tus recompensas</h1><p className="mt-2 text-sm text-blue-100">Los puntos dependen del precio de cada producto pagado: de 5 a 120 puntos por unidad.</p><div className="mt-6 inline-flex rounded-2xl bg-white/15 px-5 py-3 text-2xl font-black">✦ {points.toLocaleString()} puntos</div>{(rewards?.activeDiscountPercent ?? 0) > 0 && <p className="mt-4 rounded-xl bg-emerald-400/20 px-4 py-2 text-sm font-bold text-emerald-100">Tienes {rewards?.activeDiscountPercent}% de descuento activo para tu próxima compra.</p>}</div>
    {message && <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-800">{message}</div>}
    <div className="grid gap-5 md:grid-cols-2">{options.map(option => <div key={option.percent} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-xs font-black uppercase tracking-widest text-amber-500">Recompensa</p><h2 className="mt-2 text-4xl font-black text-slate-900">{option.percent}% OFF</h2><p className="mt-2 text-sm text-slate-500">Canjea {option.cost.toLocaleString()} puntos. Compra mínima S/ {option.minimum}; descuento máximo S/ {option.cap}. El taller recibe el valor completo.</p><button disabled={points < option.cost || !!rewards?.activeDiscountPercent || loading !== null} onClick={() => redeem(option.percent)} className="mt-6 w-full rounded-xl bg-slate-900 py-3 text-sm font-black text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-40">{loading === option.percent ? "Reclamando..." : `Reclamar ${option.percent}%`}</button></div>)}</div>
  </div>;
}
