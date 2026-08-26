"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetch } from "../../../lib/api";
import { Business, Plan } from "../shared";

declare global {
  interface Window {
    MercadoPago: any;
  }
}

export default function EmpresaPlanPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<number | null>(null);
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [walletReady, setWalletReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const walletControllerRef = useRef<{ unmount?: () => void } | null>(null);

  const loadData = (silent = false) => {
    if (!silent) setLoading(true);
    Promise.all([
      apiFetch<Plan[]>("/plans"),
      apiFetch<Business>("/business/me"),
    ])
      .then(([plansData, businessData]) => {
        setPlans(Array.isArray(plansData) ? plansData : []);
        setBusiness(businessData);
      })
      .catch(err => {
        if (!silent) setError(err instanceof Error ? err.message : "Error cargando planes");
      })
      .finally(() => { if (!silent) setLoading(false); });
  };

  useEffect(() => {
    loadData();

    // Si el usuario cierra o cancela Mercado Pago, liberamos el botón siempre.
    // La actualización es silenciosa para no bloquear todo el panel con un spinner.
    const handleFocus = () => {
      setPayingId(null);
      void loadData(true);
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  useEffect(() => {
    if (!preferenceId) return;

    const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;
    if (!publicKey || !window.MercadoPago) {
      setCheckoutError("No se pudo cargar el pago de Mercado Pago. Inténtalo nuevamente.");
      return;
    }

    let cancelled = false;
    const renderWallet = async () => {
      try {
        const mp = new window.MercadoPago(publicKey, { locale: "es-PE" });
        const controller = await mp.bricks().create("wallet", "mercadopago-plan-wallet", {
          initialization: {
            preferenceId,
            // El flujo de Mercado Pago se abre y retorna en esta misma pestaña.
            redirectMode: "self",
          },
          callbacks: {
            onReady: () => {
              if (!cancelled) setWalletReady(true);
            },
            onError: () => {
              if (!cancelled) {
                setCheckoutError("No se pudo preparar Mercado Pago. Cierra esta ventana e inténtalo otra vez.");
              }
            },
          },
        });
        if (cancelled) controller?.unmount?.();
        else walletControllerRef.current = controller;
      } catch {
        if (!cancelled) {
          setCheckoutError("No se pudo preparar Mercado Pago. Cierra esta ventana e inténtalo otra vez.");
        }
      }
    };

    void renderWallet();
    return () => {
      cancelled = true;
      walletControllerRef.current?.unmount?.();
      walletControllerRef.current = null;
    };
  }, [preferenceId]);

  const closeCheckout = () => {
    walletControllerRef.current?.unmount?.();
    walletControllerRef.current = null;
    setPreferenceId(null);
    setWalletReady(false);
    setCheckoutError(null);
    setPayingId(null);
  };

  const handleSubscribe = async (plan: Plan) => {
    if (!plan.price || plan.price <= 0) {
      // Plan gratuito, se asigna directo sin pasar por Mercado Pago
      try {
        await apiFetch(`/plans/${plan.id}/subscribe`, { method: "PUT" });
        loadData();
      } catch (err) {
        alert(err instanceof Error ? err.message : "No se pudo activar el plan");
      }
      return;
    }

    setPayingId(plan.id);
    setCheckoutError(null);
    setWalletReady(false);
    try {
      const checkout = await apiFetch<{ preferenceId: string }>("/payments/create-plan-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id }),
      });

      if (!checkout.preferenceId) throw new Error("No se recibió la preferencia de pago de Mercado Pago.");
      setPreferenceId(checkout.preferenceId);
    } catch (err) {
      console.error("Error suscribiendo al plan:", err);
      alert(err instanceof Error ? err.message : "No se pudo iniciar el pago del plan");
    } finally {
      setPayingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Mi Plan</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Elige el plan de suscripción para tu negocio.
          {business?.planName && (
            <span className="ml-1 font-semibold text-emerald-600">Plan actual: {business.planName}</span>
          )}
        </p>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="h-8 w-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-rose-700 text-sm">{error}</div>
      ) : plans.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-10 text-center text-slate-500 text-sm">
          Aún no hay planes disponibles.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-3">
          {plans.map(plan => {
            const isCurrent = business?.planId === plan.id;
            const destacado = plan.name === "Taller Pro";
            const isPaid = !!plan.price && plan.price > 0;

            // La descripción guarda "público objetivo. límites del plan." — separamos
            // la primera frase (público objetivo) del resto (límites) para mostrarlas
            // igual que en el Home (subtítulo + recuadro de descripción).
            const [ideal, ...restoDescripcion] = (plan.description ?? "").split(". ");
            const descripcion = restoDescripcion.join(". ");

            const features = [
              plan.hasMarketplace && "Perfil público en el Marketplace",
              plan.hasCrm && "CRM de clientes completo",
              plan.hasInventory && "Inventario de productos",
              plan.hasReports && "Reportes de rentabilidad",
              plan.hasWhatsapp && "Recordatorios automáticos por WhatsApp",
            ].filter(Boolean) as string[];

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col justify-between bg-white rounded-3xl p-6 border-2 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-slate-200/85 ${isCurrent
                    ? "border-emerald-400 shadow-xl shadow-emerald-100/50"
                    : destacado
                      ? "border-orange-500 shadow-xl shadow-orange-100/50 scale-[1.01] z-10"
                      : "border-slate-100 shadow-md"
                  }`}
              >
                {destacado && !isCurrent && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20">
                    <span className="inline-flex px-4 py-1 rounded-full bg-orange-500 text-white text-[11px] font-extrabold uppercase tracking-widest shadow-md">
                      Popular
                    </span>
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20">
                    <span className="inline-flex px-4 py-1 rounded-full bg-emerald-500 text-white text-[11px] font-extrabold uppercase tracking-widest shadow-md">
                      Tu Plan
                    </span>
                  </div>
                )}

                <div>
                  <div className="mb-4">
                    {ideal && (
                      <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
                        {ideal}
                      </span>
                    )}
                    <h3 className="text-xl font-black text-slate-900 leading-none">{plan.name}</h3>
                  </div>

                  {descripcion && (
                    <p className="text-[11px] italic text-slate-500 leading-relaxed mb-5 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      {descripcion}
                    </p>
                  )}

                  <div className="mb-5">
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        {isPaid ? `S/ ${plan.price!.toFixed(2)}` : "Gratis"}
                      </span>
                      {isPaid && <span className="text-slate-400 text-xs font-semibold">/ mes</span>}
                    </div>
                  </div>

                  <div className="h-px bg-slate-100 w-full mb-5" />

                  <ul className="space-y-3 mb-6">
                    {features.map((f, j) => (
                      <li key={j} className="flex items-start gap-2 text-[11px] text-slate-600 leading-normal">
                        <svg className="shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={isCurrent || payingId === plan.id}
                  className={`w-full mt-auto py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-sm ${isCurrent
                      ? "bg-emerald-50 text-emerald-600 cursor-default"
                      : destacado
                        ? "bg-orange-500 text-white hover:bg-orange-400 hover:shadow-lg hover:shadow-orange-200"
                        : "bg-slate-900 text-white hover:bg-slate-800"
                    } disabled:opacity-60`}
                >
                  {isCurrent ? "Plan Activo" : payingId === plan.id ? "Procesando..." : "Suscribirse"}
                </button>
              </div>
            );
          })}
        </div>
      )}
      {preferenceId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4" role="dialog" aria-modal="true" aria-label="Pago de plan">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-900">Completa tu suscripción</h2>
                <p className="mt-1 text-sm text-slate-500">Serás dirigido a Mercado Pago para finalizar el pago de forma segura.</p>
              </div>
              <button onClick={closeCheckout} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Cerrar pago">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="m6 6 12 12M18 6 6 18" /></svg>
              </button>
            </div>

            {checkoutError ? (
              <p className="mt-6 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{checkoutError}</p>
            ) : (
              <div className="mt-6 min-h-12">
                {!walletReady && <div className="flex items-center gap-2 text-sm text-slate-500"><span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" /> Preparando pago seguro...</div>}
                <div id="mercadopago-plan-wallet" className={walletReady ? "block" : "invisible h-0 overflow-hidden"} />
              </div>
            )}

            <button onClick={closeCheckout} className="mt-6 w-full rounded-2xl border border-slate-200 py-3 text-xs font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-50">
              Cerrar y cancelar pago
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
