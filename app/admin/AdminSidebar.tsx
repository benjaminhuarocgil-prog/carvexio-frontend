"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@auth0/nextjs-auth0/client";

function Brand() {
  return (
    <div className="flex flex-col gap-1.5 px-6 py-5">
      <img src="/logo.png" alt="Carvexio" className="h-[26px] w-auto object-contain object-left" />
      <div className="text-[10px] text-white/40 font-semibold tracking-widest uppercase px-0.5 mt-0.5">
        Panel Admin
      </div>
    </div>
  );
}

function NavItem({ label, icon, href, active }: {
  label: string; icon: React.ReactNode; href: string; active?: boolean;
}) {
  return (
    <Link href={href}
      className={["mx-3 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition text-left",
        active ? "bg-orange-500 text-white shadow-lg shadow-orange-500/25" : "text-white/70 hover:bg-white/8 hover:text-white",
      ].join(" ")}>
      <span className="inline-flex h-5 w-5 items-center justify-center">{icon}</span>
      <span>{label}</span>
      {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white/60" />}
    </Link>
  );
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();

  const handleLogout = () => { 
    // Redirigir al logout de Auth0
    window.location.href = "/api/auth/logout";
  };

  const navItems = [
    {
      href: "/admin/dashboard", label: "Dashboard",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="7" height="9" x="3" y="3" rx="1" />
          <rect width="7" height="5" x="14" y="3" rx="1" />
          <rect width="7" height="9" x="14" y="12" rx="1" />
          <rect width="7" height="5" x="3" y="16" rx="1" />
        </svg>
      ),
    },
    {
      href: "/admin/usuarios", label: "Usuarios",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2 a4 4 0 0 0 -4 -4H5 a4 4 0 0 0 -4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2 a4 4 0 0 0 -3 -3.87" />
          <path d="M16 3.13 a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      href: "/admin/negocios", label: "Negocios",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 21h18" />
          <path d="M5 21V7 l8 -4 8 4v14" />
          <path d="M9 9h1" />
          <path d="M9 13h1" />
          <path d="M9 17h1" />
          <path d="M14 9h1" />
          <path d="M14 13h1" />
        </svg>
      ),
    },
    {
      href: "/admin/clientes", label: "Clientes",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
    {
      href: "/admin/notificaciones-negocios", label: "Notificaciones a negocios",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      ),
    },
  ];

  return (
    <aside className="sticky top-0 hidden h-screen w-[260px] shrink-0 flex-col bg-slate-900 lg:flex">
      <Brand />
      <div className="mx-3 my-2 h-px bg-white/8" />
      <nav className="mt-2 flex flex-col gap-1 px-0">
        {navItems.map(item => (
          <NavItem key={item.href} label={item.label} icon={item.icon} href={item.href}
            active={pathname.startsWith(item.href)} />
        ))}
      </nav>
      <div className="mt-auto">
        <div className="mx-3 mb-2 h-px bg-white/8" />
        <div className="px-3 pb-4">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white">
              {(user?.name?.[0] ?? "A").toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white truncate">Admin</div>
              <div className="text-xs text-white/40 truncate">{user?.email ?? "—"}</div>
            </div>
            <button type="button" onClick={handleLogout} title="Cerrar sesión"
              className="text-white/40 hover:text-rose-400 transition">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
