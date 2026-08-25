"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "../../../lib/api";
import { useUser } from "@auth0/nextjs-auth0/client";
import { AdminUser, normalizeRoleLabel } from "../shared";

export default function AdminUsuariosPage() {
  const router = useRouter();
  const { user, isLoading } = useUser();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [busyUserId, setBusyUserId] = useState<number | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const totalPages = Math.ceil(users.length / itemsPerPage) || 1;

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [users.length, totalPages, currentPage]);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/api/auth/login");
      return;
    }

    const roles = (user["https://api.carvexio.com/roles"] as string[]) || [];
    if (!roles.includes("ADMIN")) {
      router.replace("/");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setLoading(true); setError(null);
        const userData = await apiFetch<AdminUser[]>("/admin/users");
        if (cancelled) return;
        setUsers(Array.isArray(userData) ? userData : []);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error al cargar datos");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [router, isLoading, user]);

  const updateRole = async (userId: number, newRole: string) => {
    try {
      setBusyUserId(userId);
      setError(null);
      setSuccessMsg(null);
      await apiFetch(`/admin/users/${userId}/role?role=${encodeURIComponent(newRole)}`, { method: "PUT" });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole as any } : u));
      
      // Mostrar el check de Auth0
      setSuccessMsg(`Rol cambiado a ${newRole}. ¡Sincronizado con Auth0 exitosamente!`);
      setTimeout(() => setSuccessMsg(null), 5000); // Ocultar después de 5 segundos
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cambiar el rol");
    } finally { setBusyUserId(null); }
  };

  const deleteUser = async (userId: number) => {
    if (!confirm("¿Eliminar este usuario?")) return;
    try {
      setBusyUserId(userId);
      setError(null);
      setSuccessMsg(null);
      await apiFetch(`/admin/users/${userId}`, { method: "DELETE" });
      setUsers(prev => prev.filter(u => u.id !== userId));
      setSuccessMsg("Usuario eliminado correctamente.");
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("409")) {
        setError("No se puede eliminar: este usuario tiene negocios o reservas asociadas.");
      } else {
        setError(msg || "No se pudo eliminar el usuario.");
      }
    } finally { setBusyUserId(null); }
  };

  if (isLoading || !user) {
    return <div className="p-10 text-center">Cargando sesión...</div>;
  }

  const indexOfLastUser = currentPage * itemsPerPage;
  const indexOfFirstUser = indexOfLastUser - itemsPerPage;
  const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);

  return (
    <>
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Usuarios</h1>
          <p className="mt-0.5 text-sm text-slate-500">Gestión de roles (Auth0 Connected)</p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
            {user.name?.[0] || "A"}
          </div>
          <span className="text-sm font-medium text-slate-700">Admin</span>
        </div>
      </header>

      {successMsg && (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 flex items-center gap-2 shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          <strong>¡Éxito!</strong> {successMsg}
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
          {error}
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">ID</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Nombre</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Email</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Rol</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="px-5 py-8 text-sm text-center text-slate-400">Cargando...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-8 text-sm text-center text-slate-400">No hay usuarios.</td></tr>
              ) : currentUsers.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 transition">
                  <td className="px-5 py-3.5 font-mono text-xs text-slate-400">#{u.id}</td>
                  <td className="px-5 py-3.5 font-medium text-slate-900">{u.name ?? "-"}</td>
                  <td className="px-5 py-3.5 text-slate-500">{u.email ?? "-"}</td>
                  <td className="px-5 py-3.5">
                    <select className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-800 shadow-sm disabled:opacity-60"
                      value={normalizeRoleLabel(u.role)}
                      onChange={e => updateRole(u.id, e.target.value)}
                      disabled={busyUserId === u.id}>
                      <option value="ADMIN">ADMIN</option>
                      <option value="EMPRESA">EMPRESA</option>
                      <option value="CLIENTE">CLIENTE</option>
                    </select>
                  </td>
                  <td className="px-5 py-3.5">
                    <button type="button" onClick={() => deleteUser(u.id)} disabled={busyUserId === u.id}
                      className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 disabled:opacity-60">
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-6 py-4">
            <div className="text-xs font-medium text-slate-500">
              Mostrando <span className="text-slate-800">{indexOfFirstUser + 1}</span> a{" "}
              <span className="text-slate-800">{Math.min(indexOfLastUser, users.length)}</span> de{" "}
              <span className="text-slate-800">{users.length}</span> usuarios
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-slate-600"
                title="Página anterior"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                const isCurrent = page === currentPage;
                return (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`flex h-8 min-w-[32px] items-center justify-center rounded-lg px-2 text-xs font-semibold transition ${
                      isCurrent
                        ? "bg-slate-900 text-white shadow-sm"
                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-slate-600"
                title="Siguiente página"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}