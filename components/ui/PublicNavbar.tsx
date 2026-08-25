"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useUser } from '@auth0/nextjs-auth0/client';

export default function PublicNavbar() {
  const pathname = usePathname();
  const { user, isLoading } = useUser();

  // Ocultar Navbar en estas rutas específicas
  if (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/business" ||
    pathname.startsWith("/business/") ||
    pathname === "/marketplace"
  ) {
    return null;
  }

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center">
              <Image
                src="/logo.png"
                alt="Carvexio Logo"
                width={130}
                height={32}
                className="h-8 w-auto object-contain"
                style={{ width: 'auto' }}
                priority
              />
            </Link>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/#home" className="text-gray-700 hover:text-blue-900 transition-colors text-sm font-medium">Home</Link>
            <Link href="/#funcionalidades" className="text-gray-700 hover:text-blue-900 transition-colors text-sm font-medium">Funcionalidades</Link>
            <Link href="/marketplace" className="text-orange-600 hover:text-orange-700 transition-colors text-sm font-bold">
              Marketplace
            </Link>
            <Link href="/#precios" className="text-gray-700 hover:text-blue-900 transition-colors text-sm font-medium">Precios</Link>
            <Link href="/#contacto" className="text-gray-700 hover:text-blue-900 transition-colors text-sm font-medium">Contacto</Link>

            {!isLoading && (
              user ? (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">Hola, {user.name}</span>
                  <button
                    type="button"
                    onClick={() => { window.location.href = "/api/auth/logout"; }}
                    className="px-5 py-2.5 rounded-lg border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition"
                  >
                    Salir
                  </button>
                </div>
              ) : (
                <a href="/api/auth/login">
                  <button type="button" className="px-5 py-2.5 rounded-lg bg-blue-900 text-white text-sm font-semibold hover:bg-blue-800 transition">
                    Ingresar
                  </button>
                </a>
              )
            )}
          </nav>
          {/* Mobile */}
          {!isLoading && (
            <button
              type="button"
              onClick={() => { window.location.href = user ? "/api/auth/logout" : "/api/auth/login"; }}
              className="md:hidden px-4 py-2 rounded-lg bg-blue-900 text-white text-sm font-semibold"
            >
              {user ? "Salir" : "Ingresar"}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
