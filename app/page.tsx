"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useRouter } from "next/navigation";
import PublicNavbar from "../components/ui/PublicNavbar";
import PublicFooter from "../components/ui/PublicFooter";

const features = [
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
    ),
    title: "Encuentra Talleres Cercanos",
    description: "Geolocalización en tiempo real para encontrar el servicio más cercano a ti.",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
    ),
    title: "Reseñas y Calificaciones",
    description: "Lee opiniones reales de otros usuarios antes de elegir.",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" /></svg>
    ),
    title: "Marketplace de Repuestos",
    description: "Compra repuestos originales y de calidad al mejor precio.",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>
    ),
    title: "Panel SaaS para Negocios",
    description: "Gestiona tu taller con CRM, inventario, citas y reportes.",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
    ),
    title: "Reservas Online",
    description: "Agenda tus servicios 24/7 sin necesidad de llamar.",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
    ),
    title: "Pagos Seguros",
    description: "Transacciones protegidas y procesamiento confiable.",
  },
];

const planesB2B = [
  {
    nombre: "Arranque",
    ideal: "Mecánicos independientes y micro-talleres (1-3 técnicos)",
    precio: "Gratis",
    descripcion: "“Empieza a digitalizarte hoy sin invertir nada y recibe clientes”",
    caracteristicas: [
      "Agenda básica de citas",
      "1 usuario en el sistema",
      "Órdenes de trabajo limitadas",
      "Perfil público en el Marketplace",
      "Historial básico de clientes"
    ],
    destacado: false,
    ctaText: "Crear cuenta",
  },
  {
    nombre: "Taller Pro",
    ideal: "Talleres pequeños y medianos (4-15 técnicos)",
    precio: "S/ 149",
    periodo: "/ mes",
    notaPrecio: "o S/ 1,290 / año",
    descripcion: "“Deja de perder clientes por mala gestión y multiplica tus citas”",
    caracteristicas: [
      "Todo lo del plan Arranque",
      "CRM de clientes completo",
      "Inventario de lubricantes y repuestos",
      "Facturación del taller",
      "Recordatorios automáticos por WhatsApp",
      "Leads prioritarios del marketplace",
      "Reportes de rentabilidad por servicio"
    ],
    destacado: true,
    ctaText: "Elegir Taller Pro",
  },
  {
    nombre: "Lubricentro & Grifo",
    ideal: "Lubricentros, grifos con área de servicio y centros de cambio rápido",
    precio: "S/ 199",
    periodo: "/ mes",
    notaPrecio: "o S/ 1,790 / año",
    descripcion: "“Control total de stock de aceites y maximiza el ticket promedio”",
    caracteristicas: [
      "Todo lo de Taller Pro",
      "Inventario especializado de lubricantes",
      "Alertas de stock mínimo por marca",
      "Control de caducidades",
      "Campañas de recompra de aceite",
      "Integración con marcas (Shell, Mobil, Castrol, etc.)",
      "Módulo de lavado/lubricación rápida"
    ],
    destacado: false,
    ctaText: "Elegir Lubricentro",
  },
  {
    nombre: "Multi-Sucursal",
    ideal: "Cadenas de talleres o grifos con 2+ locales",
    precio: "S/ 349",
    periodo: "/ mes",
    notaPrecio: "+ S/ 99 por sucursal adicional",
    descripcion: "“Gestiona tus sucursales unificando la experiencia del cliente”",
    caracteristicas: [
      "Todo lo de Lubricentro & Grifo",
      "Multi-sucursal integrada",
      "Transferencias de stock entre locales",
      "Reportes consolidados por sedes",
      "Usuarios por sede",
      "Branding unificado",
      "Leads distribuidos por cercanía"
    ],
    destacado: false,
    ctaText: "Elegir Multi-Sucursal",
  },
  {
    nombre: "Enterprise / Flotas",
    ideal: "Cadenas grandes, distribuidores y aliados estratégicos",
    precio: "Desde S/ 699",
    periodo: "/ mes",
    notaPrecio: "(Cotización personalizada)",
    descripcion: "“Convierte tu operación en un ecosistema con datos, IA y alianzas”",
    caracteristicas: [
      "Todo lo de Multi-Sucursal",
      "Acceso a API pública",
      "Marca blanca (White-label)",
      "Analytics avanzados",
      "IA de predicción de mantenimiento",
      "Integración con aseguradoras",
      "Módulo de gestión de flotas",
      "Soporte prioritario 24/7",
      "Account Manager dedicado"
    ],
    destacado: false,
    ctaText: "Contactar Ventas",
  }
];

const planesB2C = [
  {
    nombre: "Conductor Libre",
    ideal: "Cualquier dueño de auto o moto",
    precio: "Gratis",
    descripcion: "“Encuentra talleres de confianza cerca de ti y agenda en minutos”",
    caracteristicas: [
      "Búsqueda de talleres verificados",
      "Reserva online de citas",
      "Historial básico de servicios",
      "Calificaciones y fotos del trabajo"
    ],
    destacado: false,
    ctaText: "Crear cuenta",
  },
  {
    nombre: "Conductor Premium",
    ideal: "Dueños que quieren cuidar su vehículo sin dolores de cabeza",
    precio: "S/ 19.90",
    periodo: "/ mes",
    notaPrecio: "o S/ 149 / año",
    descripcion: "“Nunca más te olvides del mantenimiento y ahorra en cada servicio”",
    caracteristicas: [
      "Todo lo de Conductor Libre",
      "Recordatorios inteligentes por km/tiempo",
      "Historial completo digital",
      "Alertas de mantenimiento",
      "Descuentos exclusivos (hasta 15%)",
      "Prioridad de agenda en talleres aliados",
      "Chat directo con el taller"
    ],
    destacado: true,
    ctaText: "Elegir Premium",
  },
  {
    nombre: "Moto Rider",
    ideal: "Motociclistas (muy fuerte en Perú)",
    precio: "S/ 14.90",
    periodo: "/ mes",
    notaPrecio: "o S/ 99 / año",
    descripcion: "“Tu moto siempre lista y con talleres especializados en dos ruedas”",
    caracteristicas: [
      "Todo lo de Conductor Premium",
      "Catálogo de talleres especializados en motos",
      "Recordatorios de cadena específicos",
      "Recordatorios de aceite y frenos de moto",
      "Descuentos en lubricantes y accesorios",
      "Acceso a comunidad de riders"
    ],
    destacado: false,
    ctaText: "Elegir Moto Rider",
  },
  {
    nombre: "Flota Pyme",
    ideal: "Dueños de 3 a 20 vehículos (taxis, delivery, pymes)",
    precio: "S/ 79",
    periodo: "/ mes",
    notaPrecio: "(hasta 10 vehículos) + S/ 6 por unidad adicional",
    descripcion: "“Controla el mantenimiento de toda tu flota desde el celular”",
    caracteristicas: [
      "Gestión de multi-vehículo",
      "Panel de costos por unidad",
      "Alertas centralizadas",
      "Reportes de gastos por vehículo",
      "Agenda masiva de servicios",
      "Descuentos por volumen",
      "Priorización de flotas en talleres"
    ],
    destacado: false,
    ctaText: "Elegir Flota Pyme",
  },
  {
    nombre: "Camión & Empresarial",
    ideal: "Flotas de camiones, transporte de carga y empresas",
    precio: "Desde S/ 199",
    periodo: "/ mes",
    notaPrecio: "(Según cantidad de unidades)",
    descripcion: "“Maximiza la disponibilidad de tus camiones y reduce paradas imprevistas”",
    caracteristicas: [
      "Todo lo de Flota Pyme",
      "Módulo específico de camiones pesados",
      "Integración con historial de kilometraje",
      "Predicción de fallas por telemetría",
      "Reportes consolidados para gerencia",
      "Soporte de grúas y talleres pesados",
      "Integraciones con seguros de flota"
    ],
    destacado: false,
    ctaText: "Contactar Ventas",
  }
];

const testimonials = [
  {
    name: "Carlos Rodríguez",
    role: "Dueño de Taller Mendoza",
    initials: "CR",
    text: "AutoManage triplicó nuestros clientes en 3 meses. El marketplace nos trajo visibilidad increíble.",
    rating: 5,
  },
  {
    name: "María González",
    role: "Cliente Frecuente",
    initials: "MG",
    text: "Ahora puedo comparar precios y ver reseñas antes de elegir. ¡Me encanta la plataforma!",
    rating: 5,
  },
  {
    name: "Jorge Martínez",
    role: "Gerente de Lubricentro Express",
    initials: "JM",
    text: "El CRM y la gestión de citas nos ahorra 10 horas semanales. Totalmente recomendado.",
    rating: 5,
  },
];

const stats = [
  { numero: "12,453", label: "Usuarios Activos" },
  { numero: "287", label: "Talleres Registrados" },
  { numero: "45K+", label: "Servicios Completados" },
  { numero: "4.8★", label: "Calificación Promedio" },
];

export default function HomePage() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const [vistaPlan, setVistaPlan] = useState<"b2c" | "b2b">("b2c");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleCards, setVisibleCards] = useState(3);
  const [isHovered, setIsHovered] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(true);

  useEffect(() => {
    if (isLoading || !user) return;
    const roles = (user["https://api.carvexio.com/roles"] as string[]) || [];
    if (roles.includes("ADMIN")) router.replace("/admin/dashboard");
    else if (roles.includes("EMPRESA")) router.replace("/empresa/dashboard");
    else if (roles.includes("CLIENTE")) router.replace("/cliente/dashboard");
    else router.replace("/onboarding");
  }, [user, isLoading, router]);

  useEffect(() => {
    setCurrentIndex(0);
    setIsTransitioning(true);
  }, [vistaPlan]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setVisibleCards(1);
      } else if (window.innerWidth < 1024) {
        setVisibleCards(2);
      } else {
        setVisibleCards(3);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => prev + 1);
    }, 4000);
    return () => clearInterval(interval);
  }, [isHovered, visibleCards, vistaPlan]);

  useEffect(() => {
    if (!isTransitioning) {
      const timeout = setTimeout(() => {
        setIsTransitioning(true);
      }, 50);
      return () => clearTimeout(timeout);
    }
  }, [isTransitioning]);

  const handleTransitionEnd = () => {
    if (currentIndex >= 5) {
      setIsTransitioning(false);
      setCurrentIndex(0);
    } else if (currentIndex < 0) {
      setIsTransitioning(false);
      setCurrentIndex(4);
    }
  };

  const nextSlide = () => {
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev + 1);
  };

  const prevSlide = () => {
    if (currentIndex === 0) {
      setIsTransitioning(false);
      setCurrentIndex(5);
      setTimeout(() => {
        setIsTransitioning(true);
        setCurrentIndex(4);
      }, 50);
    } else {
      setIsTransitioning(true);
      setCurrentIndex((prev) => prev - 1);
    }
  };

  if (isLoading || user) {
    return <div className="min-h-screen bg-white" />;
  }

  return (
    <div className="min-h-screen bg-white">

      {/* ── Navbar ── */}
      <PublicNavbar />

      {/* ── Hero ── */}
      <section id="home" className="relative bg-gradient-to-br from-blue-900 to-blue-800 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-blue-400 blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-orange-400 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/20 border border-orange-400/30 text-orange-300 text-xs font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-400 animate-pulse" />
                Plataforma #1 del ecosistema automotriz
              </div>
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight">
                Gestiona tu negocio automotriz de manera profesional
              </h1>
              <p className="text-lg text-blue-100 max-w-lg">
                La plataforma todo en uno para talleres, lubricentros y lavados. Gestiona clientes, reservas, inventario y ventas.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a href="/api/auth/login?screen_hint=signup">
                  <button type="button" className="px-8 py-4 rounded-xl bg-orange-500 text-white font-bold text-lg hover:bg-orange-400 transition shadow-lg shadow-orange-500/30">
                    Comenzar gratis
                  </button>
                </a>
                <a href="#funcionalidades">
                  <button type="button" className="px-8 py-4 rounded-xl border-2 border-white/30 text-white font-semibold text-lg hover:bg-white/10 transition">
                    Ver Demo
                  </button>
                </a>
              </div>
            </div>
            <div className="relative hidden lg:block">
              <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                <img
                  src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700&q=80"
                  alt="Taller automotriz"
                  className="w-full h-[420px] object-cover"
                />
              </div>
              {/* floating badge */}
              <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl px-5 py-4">
                <div className="text-2xl font-bold text-blue-900">287+</div>
                <div className="text-xs text-gray-500 font-medium">Talleres registrados</div>
              </div>
              <div className="absolute -top-4 -right-4 bg-orange-500 rounded-2xl shadow-xl px-5 py-4 text-white">
                <div className="text-2xl font-bold">4.8★</div>
                <div className="text-xs font-medium opacity-90">Calificación</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── El Problema (Impact Banner) ── */}
      <section className="bg-white border-b border-gray-100 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="max-w-2xl">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                El historial de tu vehículo está fragmentado. <span className="text-orange-500">Y eso cuesta vidas.</span>
              </h2>
              <p className="text-lg text-gray-600">
                Un vehículo cuesta miles de dólares, pero ignorar su estado mecánico genera riesgo y sobrecostos. En Carvexio queremos intervenir <strong className="text-gray-900">antes del accidente</strong>.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 w-full lg:w-auto shrink-0">
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 text-center flex-1">
                <div className="text-4xl font-black text-gray-900 mb-1">87,172</div>
                <div className="text-sm text-gray-500 font-medium">Accidentes en 2023 (Perú)</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center flex-1 relative overflow-hidden">
                <div className="text-4xl font-black text-orange-500 mb-1">1.2%</div>
                <div className="text-sm text-gray-500 font-medium">Por fallas mecánicas</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="funcionalidades" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Funcionalidades principales</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Todo lo que necesitas para administrar tu negocio automotriz de forma eficiente
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition">
                <div className="w-14 h-14 bg-orange-50 rounded-xl flex items-center justify-center mb-4 text-orange-500">
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Carvexio AI (Bento Box) ── */}
      <section className="py-24 bg-white relative overflow-hidden">
        {/* Decoración de fondo */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-blue-50 blur-3xl opacity-50" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-orange-50 blur-3xl opacity-50" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              La Solución: Carvexio AI
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
              La innovación tecnológica con Inteligencia Artificial y Blockchain que deja obsoletos a los sistemas tradicionales de gestión automotriz.
            </p>
          </div>

          <div className="w-full">

            {/* Tarjeta Única: Safety */}
            <div className="w-full bg-gray-50 rounded-3xl p-8 lg:p-10 border border-gray-100 shadow-sm hover:shadow-md transition relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-orange-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
              <div className="flex flex-col lg:flex-row gap-8 items-center justify-between mb-10 relative z-10">
                <div className="max-w-3xl">
                  <h3 className="text-3xl font-bold text-gray-900 mb-3">Carvexio Safety (Mantenimiento Predictivo)</h3>
                  <p className="text-gray-600 text-lg">
                    <span className="font-semibold text-gray-900">Prevenir antes que reparar.</span> La Inteligencia Artificial genera alertas tempranas que salvan vidas y evitan averías sorpresa que generan sobrecostos.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:border-gray-200 hover:shadow-md transition duration-300">
                  <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-gray-700 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="M5 5l1.5 1.5" /><path d="M17.5 17.5L19 19" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="M5 19l1.5-1.5" /><path d="M17.5 6.5L19 5" /></svg>
                  </div>
                  <h4 className="font-bold text-gray-900 mb-1">Neumáticos</h4>
                  <p className="text-sm text-gray-500">Alertas de desgaste o necesidad de sustitución basada en kilometraje e IA visual.</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:border-gray-200 hover:shadow-md transition duration-300">
                  <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-gray-700 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="10" x="2" y="7" rx="2" ry="2" /><line x1="22" x2="22" y1="11" y2="13" /><line x1="6" x2="6" y1="11" y2="13" /><line x1="10" x2="10" y1="11" y2="13" /><line x1="14" x2="14" y1="11" y2="13" /></svg>
                  </div>
                  <h4 className="font-bold text-gray-900 mb-1">Batería</h4>
                  <p className="text-sm text-gray-500">Cálculo de vida útil restante y advertencia predictiva antes de falla total.</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:border-gray-200 hover:shadow-md transition duration-300">
                  <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-gray-700 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" /></svg>
                  </div>
                  <h4 className="font-bold text-gray-900 mb-1">Lubricación</h4>
                  <p className="text-sm text-gray-500">Recordatorios dinámicos para el próximo mantenimiento que priorizan la salud del motor.</p>
                </div>
                <div className="bg-orange-50 rounded-2xl p-6 border border-orange-100 hover:border-orange-200 hover:shadow-md transition duration-300 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500 rounded-bl-full opacity-10 pointer-events-none" />
                  <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-orange-500 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" x2="12" y1="9" y2="13" /><line x1="12" x2="12.01" y1="17" y2="17" /></svg>
                  </div>
                  <h4 className="font-bold text-orange-900 mb-1">Riesgos Críticos</h4>
                  <p className="text-sm text-orange-800/80">Detección temprana de anomalías en componentes mayores que comprometen la seguridad.</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="precios" className="py-20 bg-slate-50 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-orange-400 blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-96 h-96 rounded-full bg-blue-400 blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Planes diseñados para ti</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Comienza gratis y mejora según las necesidades de tu vehículo o negocio.
            </p>

            {/* Toggle Selector Premium */}
            <div className="mt-8 flex justify-center">
              <div className="relative flex items-center p-1 rounded-full bg-slate-200/80 backdrop-blur-sm border border-slate-300/40 shadow-inner">
                <button
                  type="button"
                  onClick={() => setVistaPlan("b2c")}
                  className={`relative px-6 py-2.5 rounded-full text-sm font-bold tracking-wide transition duration-300 ${vistaPlan === "b2c"
                    ? "bg-white text-slate-900 shadow-md"
                    : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                  Dueños de Vehículos (B2C)
                </button>
                <button
                  type="button"
                  onClick={() => setVistaPlan("b2b")}
                  className={`relative px-6 py-2.5 rounded-full text-sm font-bold tracking-wide transition duration-300 ${vistaPlan === "b2b"
                    ? "bg-white text-slate-900 shadow-md"
                    : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                  Talleres & Empresas (B2B)
                </button>
              </div>
            </div>
          </div>

          {/* Cards Carousel Viewport */}
          <div className="relative w-full px-0 md:px-12 mt-12">
            <div
              className="overflow-hidden w-full py-6"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <div
                className="flex items-stretch"
                onTransitionEnd={handleTransitionEnd}
                style={{
                  transform: `translateX(-${currentIndex * (100 / visibleCards)}%)`,
                  transition: isTransitioning ? 'transform 1200ms ease-in-out' : 'none',
                }}
              >
                {(() => {
                  const planesOriginales = vistaPlan === "b2c" ? planesB2C : planesB2B;
                  const planesExtendidos = [...planesOriginales, ...planesOriginales.slice(0, visibleCards)];
                  return planesExtendidos.map((plan, i) => (
                    <div
                      key={i}
                      className="w-full md:w-1/2 lg:w-1/3 shrink-0 px-3 flex animate-in fade-in duration-300"
                    >
                      <div
                        className={`relative flex flex-col justify-between bg-white rounded-3xl p-6 border-2 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-slate-200/85 w-full ${plan.destacado
                          ? "border-orange-500 shadow-xl shadow-orange-100/50 scale-[1.01] z-10"
                          : "border-slate-100 shadow-md"
                          }`}
                      >
                        {plan.destacado && (
                          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20">
                            <span className="inline-flex px-4 py-1 rounded-full bg-orange-500 text-white text-[11px] font-extrabold uppercase tracking-widest shadow-md">
                              Popular
                            </span>
                          </div>
                        )}

                        <div>
                          <div className="mb-4">
                            <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
                              {plan.ideal}
                            </span>
                            <h3 className="text-xl font-black text-slate-900 leading-none">{plan.nombre}</h3>
                          </div>

                          <p className="text-[11px] italic text-slate-500 leading-relaxed mb-5 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                            {plan.descripcion}
                          </p>

                          <div className="mb-5">
                            <div className="flex items-baseline gap-0.5">
                              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{plan.precio}</span>
                              {plan.periodo && <span className="text-slate-400 text-xs font-semibold">{plan.periodo}</span>}
                            </div>
                            {plan.notaPrecio && (
                              <span className="text-[10px] text-slate-500 block mt-1 font-medium bg-orange-50/50 border border-orange-100/40 px-2 py-0.5 rounded-md w-fit">
                                {plan.notaPrecio}
                              </span>
                            )}
                          </div>

                          {/* Divider */}
                          <div className="h-px bg-slate-100 w-full mb-5" />

                          <ul className="space-y-3 mb-6">
                            {plan.caracteristicas.map((c, j) => (
                              <li key={j} className="flex items-start gap-2 text-[11px] text-slate-600 leading-normal">
                                <svg className="shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                                <span>{c}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <a href="/api/auth/login?screen_hint=signup" className="w-full mt-auto pt-4">
                          <button
                            type="button"
                            className={`w-full py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-sm ${plan.destacado
                              ? "bg-orange-500 text-white hover:bg-orange-400 hover:shadow-lg hover:shadow-orange-200"
                              : "bg-slate-900 text-white hover:bg-slate-800"
                              }`}
                          >
                            {plan.ctaText}
                          </button>
                        </a>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* Left/Right Arrow Buttons (Desktop/Tablet only) */}
            <button
              type="button"
              onClick={prevSlide}
              className="absolute top-1/2 -translate-y-1/2 -left-2 md:-left-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white border border-slate-200 shadow-lg text-slate-700 hover:bg-slate-50 transition duration-300 hover:scale-105"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={nextSlide}
              className="absolute top-1/2 -translate-y-1/2 -right-2 md:-right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white border border-slate-200 shadow-lg text-slate-700 hover:bg-slate-50 transition duration-300 hover:scale-105"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>

            {/* Pagination Indicators (Dots) */}
            <div className="flex justify-center gap-2 mt-8">
              {[...Array(5)].map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setIsTransitioning(true);
                    setCurrentIndex(idx);
                  }}
                  className={`h-2.5 rounded-full transition-all duration-300 ${(currentIndex % 5) === idx ? "w-6 bg-orange-500" : "w-2.5 bg-slate-300"
                    }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 bg-blue-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">¿Listo para digitalizar tu negocio?</h2>
          <p className="text-blue-200 text-lg mb-8">Únete a cientos de talleres que ya usan AutoManage</p>
          <a href="/api/auth/login?screen_hint=signup">
            <button type="button" className="px-10 py-4 rounded-xl bg-orange-500 text-white font-bold text-lg hover:bg-orange-400 transition shadow-lg shadow-orange-500/30">
              Comenzar gratis ahora
            </button>
          </a>
        </div>
      </section>

      {/* ── Footer ── */}
      <PublicFooter />

    </div>
  );
}