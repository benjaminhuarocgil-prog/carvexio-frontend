"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function PublicFooter() {
  const pathname = usePathname();
  const legalLinks = [
    { href: "/politica-privacidad", label: "Política de Privacidad" },
    { href: "/politica-cookies", label: "Política de Cookies" },
    { href: "/terminos-condiciones", label: "Términos y Condiciones" },
    { href: "/politicas-devoluciones-reembolsos", label: "Políticas de Devoluciones y Reembolsos" },
  ];

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
    <footer id="contacto" className="bg-blue-900 text-white py-12 border-t border-blue-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Image
                src="/logo2.png"
                alt="Carvexio Logo"
                width={120}
                height={32}
                className="h-8 w-auto object-contain"
                style={{ width: 'auto' }}
              />
            </div>
            <p className="text-blue-200 text-sm">
              La mejor solución para gestionar tu negocio automotriz
            </p>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4">Contacto</h3>
            <ul className="space-y-2 text-blue-200 text-sm">
              <li>Email: hola@carvexio.com</li>
              <li>Teléfono: +51 972 594 948</li>
              <li>Dirección: Lima, Perú</li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4">Redes Sociales</h3>
            <div className="flex gap-4 mb-6 items-center">
              <a href="#" className="hover:opacity-80 transition hover:-translate-y-1 transform duration-300">
                <Image src="/facebook.webp" alt="Facebook" width={32} height={32} className="w-8 h-8 object-contain" />
              </a>
              <a href="#" className="hover:opacity-80 transition hover:-translate-y-1 transform duration-300">
                <Image src="/youtube.webp" alt="YouTube" width={32} height={32} className="w-8 h-8 object-contain" />
              </a>
              <a href="#" className="hover:opacity-80 transition hover:-translate-y-1 transform duration-300">
                <Image src="/instagram.webp" alt="Instagram" width={32} height={32} className="w-8 h-8 object-contain rounded-full" />
              </a>
              <a href="#" className="hover:opacity-80 transition hover:-translate-y-1 transform duration-300">
                <Image src="/linkedin.png" alt="LinkedIn" width={32} height={32} className="w-8 h-8 object-contain" />
              </a>
            </div>

            <Link
              href="/libro-reclamaciones"
              className="inline-flex items-center justify-center hover:opacity-90 transition-opacity mt-6 overflow-hidden rounded-md shadow-sm bg-white h-24 w-40"
            >
              <Image
                src="/libro-reclamaciones.jpg"
                alt="Libro de Reclamaciones"
                width={200}
                height={80}
                className="w-full h-full object-contain scale-110"
              />
            </Link>
          </div>
        </div>

        <div className="border-t border-blue-800 pt-8 flex flex-col lg:flex-row items-center justify-between gap-4 text-blue-300 text-sm">
          <p className="text-center lg:text-left">
            © {new Date().getFullYear()} carvexio. Hecho por Qoribex.
          </p>
          <nav className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 font-semibold">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hover:text-orange-400 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
