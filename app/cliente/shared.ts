export type Tab = "perfil" | "autos" | "reservas" | "carrito" | "historial";

export type Vehicle = { id: number; vehicleType: string; plate: string; vin: string; mileage: number; yearsOfUse: number; };

export type UserProfile = {
  id: number;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
};

export type Booking = {
  id: number;
  serviceName?: string | null;
  businessName?: string | null;
  branch?: { name?: string | null } | null;
  localName?: string | null;
  date?: string | null;
  time?: string | null;
  status?: string | null;
  notes?: string | null;
  servicePrice?: number | null;
  vehicle?: Vehicle | null;
};

export type CartItem = {
  id: number;
  productName?: string | null;
  businessName?: string | null;
  price?: number | null;
  quantity?: number | null;
  subtotal?: number | null;
  deliveryAvailable?: boolean | null;
};

export type Cart = {
  id: number;
  items: CartItem[];
  discount: number;
  subtotal: number;
  discountAmount: number;
  total: number;
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
