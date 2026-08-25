export type AdminUser = {
  id: number;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
};

export type AdminBusiness = {
  id: number;
  name?: string | null;
  address?: string | null;
  category?: string | null;
  phone?: string | null;
  status?: string | null;
};

export type BusinessRevenue = {
  businessName: string;
  totalRevenue: number;
};

export type CategoryRevenue = {
  categoryName: string;
  totalRevenue: number;
};

export type MonthlyRevenue = {
  monthName: string;
  totalRevenue: number;
};

export type KPIs = {
  totalUsuarios: number;
  totalClientes: number;
  totalEmpresas: number;
  totalNegocios: number;
  totalReservas: number;
  ingresosTotales: number;
  totalProductos: number;

  // Detalle de ingresos
  ingresosHoy?: number;
  ingresosSieteDias?: number;
  ingresosMes?: number;
  ingresosAnio?: number;

  // Modelo de comisión
  gananciaAdmin?: number;
  pagoNegocios?: number;

  // Desgloses
  topNegocios?: BusinessRevenue[];
  ingresosPorCategoria?: CategoryRevenue[];
  tendenciaMensual?: MonthlyRevenue[];
};

export function parseApiStatus(err: unknown): number | null {
  if (!(err instanceof Error)) return null;
  const match = err.message.match(/API error (\d{3})/);
  return match ? Number(match[1]) : null;
}

export function normalizeRoleLabel(role: string | null | undefined) {
  if (!role) return "-";
  return role.toUpperCase().replace(/^ROLE_/, "");
}

export function statusColor(status: string | null | undefined) {
  switch (status?.toUpperCase()) {
    case "APPROVED": return "bg-emerald-100 text-emerald-700";
    case "PENDING":  return "bg-amber-100 text-amber-700";
    case "REJECTED": return "bg-rose-100 text-rose-700";
    case "BLOCKED":  return "bg-slate-200 text-slate-600";
    default:         return "bg-slate-100 text-slate-500";
  }
}

export function statusLabel(status: string | null | undefined) {
  switch (status?.toUpperCase()) {
    case "APPROVED": return "Aprobado";
    case "PENDING":  return "Pendiente";
    case "REJECTED": return "Rechazado";
    case "BLOCKED":  return "Bloqueado";
    default:         return status ?? "-";
  }
}
