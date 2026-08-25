"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { apiFetch } from "../../../lib/api";
import { Branch, Business } from "../shared";
import { useBranch } from "../context/BranchContext";

function NavItem({ label, icon, href, active, disabled, badge }: {
  label: string;
  icon: React.ReactNode;
  href: string;
  active?: boolean;
  disabled?: boolean;
  badge?: number;
}) {
  return (
    <Link href={href}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onClick={disabled ? (e) => e.preventDefault() : undefined}
      className={["flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition",
        active
          ? "bg-orange-500 text-white shadow-lg shadow-orange-500/25"
          : disabled
            ? "text-slate-500 opacity-50 cursor-not-allowed"
            : "text-slate-300 hover:bg-white/8 hover:text-white",
      ].join(" ")}>
      <span className="inline-flex h-5 w-5 items-center justify-center">{icon}</span>
      <span>{label}</span>
      {!!badge && <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{badge > 99 ? "99+" : badge}</span>}
      {active && !disabled && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white/70" />}
    </Link>
  );
}

export default function EmpresaSidebar({ business, email }: { business: Business | null, email: string | null | undefined }) {
  const pathname = usePathname();
  const { selectedBranch, setSelectedBranch } = useBranch();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    apiFetch<Branch[]>("/branches/me")
      .then(data => {
        setBranches(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setBranches([]);
      });
  }, []);

  useEffect(() => {
    const refresh = () => apiFetch<{ count: number }>("/messages/unread-count?mode=business").then(data => setUnread(data.count ?? 0)).catch(() => setUnread(0));
    void refresh();
    const timer = window.setInterval(refresh, 3000);
    return () => window.clearInterval(timer);
  }, []);

  const handleLogout = () => {
    window.location.href = "/api/auth/logout";
  };

  const navItems = [
    { href: "/empresa/dashboard", label: "Dashboard", icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></svg> },
    { href: "/empresa/citas", label: "Agenda de Citas", icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg> },
    { href: "/empresa/servicios", label: "Servicios", icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg> },
    { href: "/empresa/locales", label: "Mis Locales", icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg> },
    { href: "/empresa/clientes", label: "Clientes (CRM)", icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2 a4 4 0 0 0 -4 -4H5 a4 4 0 0 0 -4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2 a4 4 0 0 0 -3 -3.87" /><path d="M16 3.13 a4 4 0 0 1 0 7.75" /></svg> },
    { href: "/empresa/mensajes", label: "Mensajes", badge: unread, icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" /><path d="M8 10h.01M12 10h.01M16 10h.01" /></svg> },
    { href: "/empresa/inventario", label: "Inventario", icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg> },
    { href: "/empresa/pedidos", label: "Pedidos Recibidos", icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></svg> },
    { href: "/empresa/reportes", label: "Reportes", icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg> },
    { href: "/empresa/perfil", label: "Perfil del Negocio", icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" /></svg> },
    { href: "/empresa/plan", label: "Mi Plan", icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></svg> },
  ];

  return (
    <aside className="sticky top-0 hidden h-screen w-[260px] shrink-0 flex-col bg-slate-900 lg:flex">
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-white/8">
        {business?.logoUrl || business?.photoUrl ? (
          <div className="flex h-10 w-14 shrink-0 items-center justify-center rounded-xl overflow-hidden p-1">
            <img src={business.logoUrl || business.photoUrl || ""} alt={business.name || "Negocio"} className="h-full w-full object-contain" />
          </div>
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500 shadow-lg shadow-orange-500/30">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <path d="M14 16H9m10 0h-2M5 16H3" />
              <path d="M19 16v-3a2 2 0 0 0-2-2h-3l-1-2H7L6 11H4a2 2 0 0 0-2 2v3" />
              <circle cx="7.5" cy="16.5" r="1.5" /><circle cx="16.5" cy="16.5" r="1.5" />
            </svg>
          </div>
        )}
        <div className="min-w-0">
          <div className="text-base font-bold tracking-tight text-white truncate">{business?.name ?? "Mi Negocio"}</div>
          <div className="text-xs text-white/40 truncate">{business?.category ?? "Panel Empresa"}</div>
        </div>
      </div>

      {/* Selector de Local */}
      {branches.length > 0 && (
        <div className="px-4 py-3 border-b border-white/8">
          <label htmlFor="branch-select" className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5">
            Sede Seleccionada
          </label>
          <select
            id="branch-select"
            value={selectedBranch?.id ?? ""}
            onChange={(e) => {
              const val = e.target.value;
              if (!val) {
                setSelectedBranch(null);
              } else {
                const found = branches.find(b => b.id.toString() === val);
                setSelectedBranch(found || null);
              }
            }}
            className="w-full bg-slate-800 text-white border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition cursor-pointer"
          >
            <option value="">Todas las sedes (Global)</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <p className="mt-2 text-[11px] leading-relaxed text-white/35">
            Filtra la información por una sede específica o mantén &apos;Todas las sedes&apos; para ver el resumen global.
          </p>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(item => (
          <NavItem
            key={item.href}
            label={item.label}
            icon={item.icon}
            href={item.href}
            active={pathname.startsWith(item.href)}
            badge={item.badge}
          />
        ))}
      </nav>

      {/* User */}
      <div className="px-3 pb-4 border-t border-white/8 pt-3">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white">
            {(business?.name?.[0] ?? email?.[0] ?? "E").toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white truncate">{business?.name ?? "Empresa"}</div>
            <div className="text-xs text-white/40 truncate">{email ?? "—"}</div>
          </div>
          <button type="button" onClick={handleLogout} title="Cerrar sesión"
            className="text-white/40 hover:text-rose-400 transition">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
