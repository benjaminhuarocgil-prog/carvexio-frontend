"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "../../../lib/api";
import { UserProfile } from "../shared";

function NavItem({ label, icon, href, active, badge }: {
  label: string; icon: React.ReactNode; href: string; active?: boolean; badge?: number;
}) {
  return (
    <Link href={href}
      className={["flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition",
        active
          ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
      ].join(" ")}>
      <span className="inline-flex h-5 w-5 items-center justify-center">{icon}</span>
      <span>{label}</span>
      {!!badge && <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{badge > 99 ? "99+" : badge}</span>}
      {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white/70" />}
    </Link>
  );
}

export default function ClienteSidebar({ profile, email }: { profile: UserProfile | null, email: string | null | undefined }) {
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const refresh = () => apiFetch<{ count: number }>("/messages/unread-count?mode=client").then(data => setUnread(data.count ?? 0)).catch(() => setUnread(0));
    void refresh();
    const timer = window.setInterval(refresh, 3000);
    return () => window.clearInterval(timer);
  }, []);

  const handleLogout = () => {
    window.location.href = "/api/auth/logout";
  };

  const navItems = [
    { href: "/cliente/dashboard", label: "Mi Perfil", icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="5" /><path d="M20 21 a8 8 0 0 0 -16 0" /></svg> },
    { href: "/cliente/autos", label: "Mis Autos", icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 13l2-5h14l2 5v6h-2a2 2 0 0 1-4 0H9a2 2 0 0 1-4 0H3z" /><circle cx="7" cy="17" r="1" /><circle cx="17" cy="17" r="1" /></svg> },
    { href: "/cliente/reservas", label: "Mis Reservas", icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg> },
    { href: "/cliente/historial-mantenimiento", label: "Historial de Mantenimiento", icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20v-6" /><path d="M6 20v-4" /><path d="M18 20v-9" /><path d="M4 12h4" /><path d="M10 8h4" /><path d="M16 4h4" /></svg> },
    { href: "/cliente/recompensas", label: "Recompensas", icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 2 2.5 6.5L21 9l-5 4.4L17.5 20 12 16.7 6.5 20 8 13.4 3 9l6.5-.5z" /></svg> },
    { href: "/cliente/compras", label: "Mis Compras", icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8 a2 2 0 0 0 -1 -1.73 l-7 -4 a2 2 0 0 0 -2 0 l-7 4 A2 2 0 0 0 3 8 v8 a2 2 0 0 0 1 1.73 l7 4 a2 2 0 0 0 2 0 l7 -4 A2 2 0 0 0 21 16 Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg> },
    { href: "/cliente/carrito", label: "Mi Carrito", icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42 a2 2 0 0 0 2 1.58 h9.78 a2 2 0 0 0 1.95 -1.57 l1.65 -7.43 H5.12" /></svg> },
    { href: "/cliente/historial", label: "Historial", icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v5h5" /><path d="M3.05 13 A9 9 0 1 0 6 5.3 L3 8" /><path d="M12 7v5l4 2" /></svg> },
    { href: "/cliente/mensajes", label: "Mensajes", badge: unread, icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" /><path d="M8 10h.01M12 10h.01M16 10h.01" /></svg> },
  ];

  return (
    <aside className="sticky top-0 hidden h-screen w-[260px] shrink-0 flex-col bg-white border-r border-slate-100 lg:flex shadow-sm">
      {/* Brand */}
      <div className="flex flex-col gap-1.5 px-6 py-5 border-b border-slate-100">
        <img src="/logo.png" alt="Carvexio" className="h-[26px] w-auto object-contain object-left" />
        <div className="text-[10px] text-slate-400 font-semibold tracking-widest uppercase px-0.5 mt-0.5">
          Panel Cliente
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(item => (
          <NavItem key={item.href} label={item.label} icon={item.icon} href={item.href}
            active={pathname.startsWith(item.href)} badge={item.badge} />
        ))}

        <div className="pt-4 mt-4 border-t border-slate-100">
          <Link href="/business">
            <button type="button" className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
              Ir al Marketplace
            </button>
          </Link>
        </div>
      </nav>

      {/* User */}
      <div className="px-3 pb-4 border-t border-slate-100 pt-3">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-slate-50">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
            {(profile?.name?.[0] ?? email?.[0] ?? "C").toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-slate-900 truncate">{profile?.name ?? "Cliente"}</div>
            <div className="text-xs text-slate-400 truncate">{email ?? "—"}</div>
          </div>
          <button type="button" onClick={handleLogout} title="Cerrar sesión"
            className="text-slate-400 hover:text-rose-500 transition">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
