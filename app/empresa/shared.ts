export type Tab = "dashboard" | "citas" | "servicios" | "clientes" | "inventario" | "reportes";

export type Business = {
  id: number;
  name?: string | null;
  category?: string | null;
  department?: string | null;
  province?: string | null;
  district?: string | null;
  address?: string | null;
  phone?: string | null;
  description?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  photoUrl?: string | null;
  logoUrl?: string | null;
  status?: string | null;
  planId?: number | null;
  planName?: string | null;
  hasCrm?: boolean | null;
};

export type Plan = {
  id: number;
  name?: string | null;
  description?: string | null;
  price?: number | null;
  commission?: number | null;
  hasMarketplace?: boolean | null;
  hasCrm?: boolean | null;
  hasInventory?: boolean | null;
  hasReports?: boolean | null;
  hasWhatsapp?: boolean | null;
};

export type Branch = {
  id: number;
  name?: string | null;
  address?: string | null;
  phone?: string | null;
  district?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  active?: boolean | null;
  businessId?: number | null;
  createdAt?: string | null;
};

export type BranchAvailability = {
  id?: number | null;
  branchId?: number | null;
  businessId?: number | null;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  capacity: number;
  enabled?: boolean;
};

export type Booking = {
  id: number;
  serviceName?: string | null;
  businessName?: string | null;
  clientName?: string | null;
  date?: string | null;
  time?: string | null;
  status?: string | null;
  notes?: string | null;
  localId?: number | null;
  branchName?: string | null;
  localName?: string | null;
  servicePrice?: number | null;
  createdAt?: string | null;
  vehicle?: Vehicle | null;
};

export type Vehicle = { id: number; vehicleType: string; plate: string; vin: string; mileage: number; yearsOfUse: number; };

export type Service = {
  id: number;
  name?: string | null;
  description?: string | null;
  category?: string | null;
  price?: number | null;
  duration?: number | null;
  active?: boolean | null;
  localId?: number | null;
};

export type Product = {
  id: number;
  name?: string | null;
  category?: string | null;
  brand?: string | null;
  price?: number | null;
  stock?: number | null;
  supplier?: string | null;
  photoUrl?: string | null;
  igv?: boolean | null;
  deliveryAvailable?: boolean | null;
  localId?: number | null;
};

export type ClientSummary = {
  id: number;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  totalReservas?: number | null;
  totalPedidos?: number | null;
  montoTotalServicios?: number | null;
  montoTotalProductos?: number | null;
  montoTotalTotal?: number | null;
  ultimaVisita?: string | null;
  vehicles?: Vehicle[];
};

export type ClientHistory = {
  clientId: number;
  clientName?: string | null;
  clientPhone?: string | null;
  historialReservas?: Booking[];
  historialPedidos?: Order[];
  vehicles?: Vehicle[];
};

export type DashboardData = {
  reservasHoy: number;
  reservasPendientes: number;
  reservasCompletadas: number;
  pedidosTotales?: number;
  pedidosPendientes?: number;
  pedidosCompletados?: number;
  ingresosServicios?: number;
  ventasProductosBrutas?: number;
  comisionMarketplace?: number;
  ingresosProductos?: number;
  ingresosTotal: number;
  commissionRate?: number;
  clientesTotal: number;
  servicioMasSolicitado: string;
  productoMasVendido?: string;
};

export type PlatformNotification = {
  id: number;
  message: string;
  commissionRate?: number | null;
  createdAt: string;
  dismissed: boolean;
};


export type Report = {
  totalReservas: number;
  reservasCompletadas: number;
  reservasCanceladas: number;
  ingresosPeriodo: number;
  serviciosMasSolicitados: { nombre: string; total: number }[];
  clientesFrecuentes: { clientId: number; nombre: string; totalReservas: number }[];
};

export type Order = {
  id: number;
  clientId: number;
  clientName: string;
  businessId: number;
  businessName: string;
  totalAmount: number;
  discountAmount?: number;
  paidAmount?: number;
  status: string;
  deliveryMethod?: "DELIVERY" | "PICKUP";
  address: string;
  phone: string;
  notes: string;
  createdAt: string;
  items: OrderItem[];
};

export type OrderItem = {
  id: number;
  productId: number;
  productName: string;
  priceAtPurchase: number;
  quantity: number;
  subtotal: number;
};

export function statusColor(status: string | null | undefined) {
  switch (status?.toUpperCase()) {
    case "CONFIRMED": return "bg-emerald-100 text-emerald-700";
    case "PENDING":   return "bg-amber-100 text-amber-700";
    case "CANCELLED": return "bg-rose-100 text-rose-700";
    case "COMPLETED": return "bg-slate-100 text-slate-600";
    default:          return "bg-slate-100 text-slate-500";
  }
}

export function statusLabel(status: string | null | undefined) {
  switch (status?.toUpperCase()) {
    case "CONFIRMED": return "Confirmada";
    case "PENDING":   return "Pendiente";
    case "CANCELLED": return "Cancelada";
    case "COMPLETED": return "Completada";
    default:          return status ?? "-";
  }
}
