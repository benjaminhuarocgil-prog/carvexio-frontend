"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";

interface MercadoPagoButtonProps {
    orderId: number;
    title: string;
    amount: number;
    onSuccess?: () => void;
}

declare global {
    interface Window {
        MercadoPago: any;
    }
}

export default function MercadoPagoButton({ orderId, title, amount, onSuccess }: MercadoPagoButtonProps) {
    const [loading, setLoading] = useState(false);
    const [testing, setTesting] = useState(false);
    const [paymentError, setPaymentError] = useState<string | null>(null);

    const handlePayment = async () => {
        setLoading(true);
        setPaymentError(null);
        try {
            // 1. Llamamos a tu Backend para crear la preferencia
            const preferenceId = await apiFetch<string>("/payments/create-preference", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    orderId: orderId,
                    title: `Pedido #${orderId} - ${title}`,
                    quantity: 1,
                    price: amount
                })
            });

            if (!preferenceId || preferenceId.startsWith("Error")) {
                throw new Error(preferenceId || "No se pudo crear la preferencia de pago.");
            }

            // 2. Inicializamos el SDK de Mercado Pago con tu Public Key
            const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;
            if (!publicKey) {
                throw new Error("Falta configurar NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY");
            }
            if (typeof window.MercadoPago !== "function") {
                throw new Error("El sistema de pagos todavía no terminó de cargar. Actualiza la página e inténtalo nuevamente.");
            }
            const mp = new window.MercadoPago(publicKey, {
                locale: "es-PE" // o tu país
            });

            // 3. Abrimos el checkout
            mp.checkout({
                preference: { id: preferenceId },
                autoOpen: true, // Abre el modal de pago automáticamente
            });

        } catch (error) {
            console.error("Error en el pago:", error);
            setPaymentError(error instanceof Error ? error.message : "No se pudo iniciar el pago.");
        } finally {
            setLoading(false);
        }
    };

    const handleMockPayment = async () => {
        if (!confirm("¿Deseas realizar un Pago de Prueba para confirmar este pedido sin usar tarjeta real?")) return;
        setTesting(true);
        try {
            await apiFetch(`/orders/${orderId}/mock-pay`, { method: "POST" });
            alert("¡Pago de prueba realizado con éxito! Tu pedido ha sido confirmado.");
            if (onSuccess) {
                onSuccess();
            } else {
                window.location.reload();
            }
        } catch (err) {
            console.error("Error en pago de prueba:", err);
            alert(err instanceof Error ? err.message : "Error al procesar el pago de prueba");
        } finally {
            setTesting(false);
        }
    };

    return (
        <div className="mt-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
                onClick={handlePayment}
                disabled={loading || testing}
                className="flex-1 py-3 px-4 bg-[#009EE3] text-white font-bold rounded-2xl hover:bg-[#0087C3] transition shadow-md flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
                {loading ? (
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                    <>
                        <svg width="18" height="18" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M36 12H12C9.79086 12 8 13.7909 8 16V32C8 34.2091 9.79086 36 12 36H36C38.2091 36 40 34.2091 40 32V16C40 13.7909 38.2091 12 36 12Z" fill="white" />
                            <path d="M8 20H40" stroke="#009EE3" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Pagar con Mercado Pago
                    </>
                )}
            </button>

            <button
                type="button"
                onClick={handleMockPayment}
                disabled={loading || testing}
                className="py-3 px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl transition shadow-md flex items-center justify-center gap-2 text-sm disabled:opacity-50 active:scale-95 border border-emerald-500"
                title="Simular un pago exitoso para probar la app sin ingresar datos reales"
            >
                {testing ? (
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                        Pago de Prueba
                    </>
                )}
            </button>
          </div>
          {paymentError && (
            <p role="alert" className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              No se pudo iniciar el pago: {paymentError}
            </p>
          )}
        </div>
    );
}
