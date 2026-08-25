"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

/* ── Catálogos ── */
const DEPARTAMENTOS = [
  "Amazonas","Áncash","Apurímac","Arequipa","Ayacucho","Cajamarca",
  "Callao","Cusco","Huancavelica","Huánuco","Ica","Junín","La Libertad",
  "Lambayeque","Lima","Loreto","Madre de Dios","Moquegua","Pasco",
  "Piura","Puno","San Martín","Tacna","Tumbes","Ucayali",
];

const TIPOS_DOCUMENTO = ["DNI", "Carné de Extranjería", "Pasaporte", "RUC"];

/* ── Styles ── */
const inputClass =
  "w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition";
const labelClass = "block text-xs font-semibold text-gray-700 mb-1";

export default function LibroReclamacionesPage() {
  const router = useRouter();
  const [esMenor, setEsMenor] = useState(false);
  const [tipoReclamo, setTipoReclamo] = useState<"reclamo" | "queja" | "">("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const hoy = new Date().toLocaleDateString("es-PE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg("");

    const form = e.currentTarget;
    const formData = new FormData(form);

    // Validar email
    const email = formData.get("email") as string;
    const emailConfirmation = formData.get("emailConfirmation") as string;
    if (email !== emailConfirmation) {
      setErrorMsg("El correo electrónico y su confirmación no coinciden.");
      return;
    }

    // Validar email del apoderado
    if (esMenor) {
      const guardianEmail = formData.get("guardianEmail") as string;
      const guardianEmailConfirmation = formData.get("guardianEmailConfirmation") as string;
      if (guardianEmail !== guardianEmailConfirmation) {
        setErrorMsg("El correo electrónico del apoderado y su confirmación no coinciden.");
        return;
      }
    }

    if (!tipoReclamo) {
      setErrorMsg("Por favor, selecciona si es un Reclamo o una Queja.");
      return;
    }

    setLoading(true);
    try {
      formData.append("isMinor", esMenor ? "true" : "false");
      formData.append("claimType", tipoReclamo.toUpperCase());
      
      const detailsText = formData.get("details") as string;
      const summaryText = detailsText ? detailsText.substring(0, 100) : "";
      formData.append("summary", summaryText);

      if (archivo) {
        formData.append("attachment", archivo);
      }

      const response = await fetch("/api/backend/reclamaciones", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || "Error al registrar el reclamo");
      }

      setEnviado(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Hubo un error al registrar tu reclamo. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Section title helper ── */
  const SectionTitle = ({ text }: { text: string }) => (
    <h3 className="text-base font-bold text-blue-900 border-b border-blue-200 pb-2 mb-4 mt-2">
      {text}
    </h3>
  );

  /* ──────────── SUCCESS STATE ──────────── */
  if (enviado) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">¡Reclamo enviado exitosamente!</h2>
          <p className="text-gray-500 text-sm mb-8">
            Hemos recibido tu reclamo. Recibirás una respuesta en un plazo máximo de 15 días hábiles.
          </p>
          <button
            onClick={() => router.push("/")}
            className="inline-block px-8 py-3 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-bold text-sm transition shadow-lg shadow-blue-200"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  /* ──────────── FORM ──────────── */
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header banner */}
      <div className="bg-blue-900 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          {/* Back button */}
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-blue-200 hover:text-white transition text-sm mb-6 group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-1 transition-transform">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Volver atrás
          </button>

          <div className="flex items-center justify-center gap-3 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
              <path d="M8 7h6" /><path d="M8 11h4" />
            </svg>
            <h1 className="text-2xl sm:text-3xl font-bold">Libro de Reclamaciones</h1>
          </div>
          <p className="text-blue-200 text-sm text-center">Hoja de Reclamación</p>
        </div>
      </div>

      {/* Form card */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <form ref={formRef} onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8 space-y-6">

          {/* Fecha */}
          <div className="flex items-center justify-between bg-blue-50 rounded-xl px-4 py-3">
            <span className="text-sm font-semibold text-blue-900">FECHA:</span>
            <span className="text-sm text-blue-800 font-medium">{hoy}</span>
          </div>

          {/* ──── SECCIÓN 1: Datos del consumidor ──── */}
          <SectionTitle text="1. Datos de la persona que presenta el reclamo" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Tipo de documento *</label>
              <select name="docType" className={inputClass} required>
                <option value="">Seleccionar</option>
                {TIPOS_DOCUMENTO.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Número de documento *</label>
              <input name="docNumber" type="text" className={inputClass} required placeholder="Ej: 70123456" />
            </div>
            <div>
              <label className={labelClass}>Primer nombre *</label>
              <input name="firstName" type="text" className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>Segundo nombre</label>
              <input name="middleName" type="text" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Primer apellido *</label>
              <input name="lastName1" type="text" className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>Segundo apellido *</label>
              <input name="lastName2" type="text" className={inputClass} required />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Dirección *</label>
              <input name="address" type="text" className={inputClass} required placeholder="Av. / Calle / Jr." />
            </div>
            <div>
              <label className={labelClass}>Departamento *</label>
              <select name="department" className={inputClass} required>
                <option value="">Seleccionar</option>
                {DEPARTAMENTOS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Provincia *</label>
              <input name="province" type="text" className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>Distrito *</label>
              <input name="district" type="text" className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>Teléfono *</label>
              <input name="phone" type="tel" className={inputClass} required placeholder="+51 9XX XXX XXX" />
            </div>
            <div>
              <label className={labelClass}>Correo electrónico *</label>
              <input name="email" type="email" className={inputClass} required placeholder="correo@ejemplo.com" />
            </div>
            <div>
              <label className={labelClass}>Confirmación de correo *</label>
              <input name="emailConfirmation" type="email" className={inputClass} required placeholder="Repetir correo" />
            </div>
          </div>

          {/* Menor de edad */}
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
            <input
              id="es-menor"
              type="checkbox"
              checked={esMenor}
              onChange={(e) => setEsMenor(e.target.checked)}
              className="w-4 h-4 accent-blue-900"
            />
            <label htmlFor="es-menor" className="text-sm text-gray-700 font-medium cursor-pointer">
              Soy menor de edad
            </label>
          </div>

          {/* Datos del apoderado */}
          {esMenor && (
            <div className="bg-blue-50/50 border border-blue-200 rounded-2xl p-5 space-y-4">
              <h4 className="text-sm font-bold text-blue-900">Datos del padre, madre o apoderado</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Tipo de documento *</label>
                  <select name="guardianDocType" className={inputClass} required={esMenor}>
                    <option value="">Seleccionar</option>
                    {TIPOS_DOCUMENTO.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Número de documento *</label>
                  <input name="guardianDocNumber" type="text" className={inputClass} required={esMenor} />
                </div>
                <div>
                  <label className={labelClass}>Primer nombre *</label>
                  <input name="guardianFirstName" type="text" className={inputClass} required={esMenor} />
                </div>
                <div>
                  <label className={labelClass}>Segundo nombre</label>
                  <input name="guardianMiddleName" type="text" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Primer apellido *</label>
                  <input name="guardianLastName1" type="text" className={inputClass} required={esMenor} />
                </div>
                <div>
                  <label className={labelClass}>Segundo apellido *</label>
                  <input name="guardianLastName2" type="text" className={inputClass} required={esMenor} />
                </div>
                <div>
                  <label className={labelClass}>Correo electrónico *</label>
                  <input name="guardianEmail" type="email" className={inputClass} required={esMenor} />
                </div>
                <div>
                  <label className={labelClass}>Confirmación de correo *</label>
                  <input name="guardianEmailConfirmation" type="email" className={inputClass} required={esMenor} />
                </div>
                <div>
                  <label className={labelClass}>Teléfono *</label>
                  <input name="guardianPhone" type="tel" className={inputClass} required={esMenor} />
                </div>
              </div>
            </div>
          )}

          {/* ──── SECCIÓN 2: Información general ──── */}
          <SectionTitle text="2. Información general" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>N° de orden de compra</label>
              <input name="orderNumber" type="text" className={inputClass} placeholder="Ej: ORD-00123" />
            </div>
            <div>
              <label className={labelClass}>Monto reclamado (S/.) *</label>
              <input name="claimedAmount" type="number" step="0.01" className={inputClass} required placeholder="0.00" />
            </div>
            <div>
              <label className={labelClass}>Tipo de bien *</label>
              <select name="productOrService" className={inputClass} required>
                <option value="">Seleccionar</option>
                <option value="PRODUCTO">Producto</option>
                <option value="SERVICIO">Servicio</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Nombre del producto o servicio *</label>
              <input name="productName" type="text" className={inputClass} required />
            </div>
          </div>

          {/* ──── SECCIÓN 3: Detalle del reclamo ──── */}
          <SectionTitle text="3. Detalle del reclamo" />

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="tipo-reclamo"
                value="reclamo"
                checked={tipoReclamo === "reclamo"}
                onChange={() => setTipoReclamo("reclamo")}
                required
                className="w-4 h-4 accent-blue-900"
              />
              <span className="text-sm font-semibold text-gray-800">Reclamo</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="tipo-reclamo"
                value="queja"
                checked={tipoReclamo === "queja"}
                onChange={() => setTipoReclamo("queja")}
                className="w-4 h-4 accent-blue-900"
              />
              <span className="text-sm font-semibold text-gray-800">Queja</span>
            </label>
          </div>

          {tipoReclamo && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-2 text-xs text-blue-700">
              {tipoReclamo === "reclamo"
                ? "Reclamo: Disconformidad relacionada a los productos o servicios."
                : "Queja: Disconformidad no relacionada a los productos o servicios; o malestar o descontento respecto a la atención al público."}
            </div>
          )}

          <div>
            <label className={labelClass}>Resumen del reclamo o queja *</label>
            <textarea
              name="details"
              className={inputClass + " min-h-[80px] resize-y"}
              required
              rows={3}
              placeholder="Describe brevemente tu reclamo o queja..."
            />
          </div>

          <div>
            <label className={labelClass}>Detalle del pedido *</label>
            <textarea
              name="pedido"
              className={inputClass + " min-h-[60px] resize-y"}
              required
              rows={2}
              placeholder="¿Qué solución solicitas?"
            />
          </div>

          {/* Adjuntar archivo */}
          <div>
            <label className={labelClass}>Adjuntar archivo (opcional)</label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={(e) => setArchivo(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-900 hover:file:bg-blue-100 transition"
            />
            {archivo && (
              <p className="text-xs text-green-600 mt-1">📎 {archivo.name}</p>
            )}
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-blue-900 hover:bg-blue-800 disabled:bg-gray-300 text-white rounded-xl font-bold text-sm transition shadow-lg shadow-blue-200 cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Enviando reclamo...
              </>
            ) : (
              "Enviar Reclamo"
            )}
          </button>

          {/* ── Disclaimer legal ── */}
          <div className="bg-gray-50 rounded-xl px-4 py-4 text-[10px] leading-relaxed text-gray-500 space-y-2">
            <p>
              GLOBAL LEARNING SOLUTIONS EIRL, con RUC N.° 20614113872, con domicilio en Calle Ramón Zavala N.° 790,
              Urb. Las Moreras, distrito de La Perla, provincia y departamento del Callao, es el titular del banco
              de datos personales de Quejas y Reclamos. GLOBAL LEARNING SOLUTIONS EIRL declara que el tratamiento
              de sus datos personales en este portal tiene por finalidad gestionar de manera adecuada su reclamo
              o queja conforme a las disposiciones legales vigentes, así como llevar un registro histórico de los
              casos presentados con el objetivo de mejorar la calidad de atención.
            </p>
            <p>
              La formulación del reclamo no impide acudir a otras vías de solución de controversias ni constituye
              requisito previo para interponer una denuncia ante el INDECOPI. El proveedor deberá brindar respuesta
              al reclamo en un plazo no mayor de quince (15) días hábiles improrrogables.
            </p>
            <p>
              Esta cuenta de correo es utilizada únicamente para el envío de constancias de recepción de reclamos,
              no siendo un medio para la recepción de los mismos; por lo que se solicita no remitir mensajes a
              dicha cuenta.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
