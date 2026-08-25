export const BUSINESS_CATEGORIES = [
  "VEHICULOS",
  "REPUESTOS_Y_COMPONENTES",
  "NEUMATICOS_Y_LLANTAS",
  "ACEITES_Y_LUBRICANTES",
  "ACCESORIOS_INTERIORES",
  "ACCESORIOS_EXTERIORES",
  "ILUMINACION_Y_ELECTRONICA",
  "HERRAMIENTAS_Y_EQUIPOS_DE_TALLER",
  "SEGURIDAD_Y_PROTECCION",
  "SERVICIOS_ESPECIALIZADOS",
  "OTROS",
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  VEHICULOS: "Vehiculos",
  REPUESTOS_Y_COMPONENTES: "Repuestos y componentes",
  NEUMATICOS_Y_LLANTAS: "Neumaticos y llantas",
  ACEITES_Y_LUBRICANTES: "Aceites y lubricantes",
  ACCESORIOS_INTERIORES: "Accesorios interiores",
  ACCESORIOS_EXTERIORES: "Accesorios exteriores",
  ILUMINACION_Y_ELECTRONICA: "Iluminacion y electronica",
  HERRAMIENTAS_Y_EQUIPOS_DE_TALLER: "Herramientas y equipos de taller",
  SEGURIDAD_Y_PROTECCION: "Seguridad y proteccion",
  SERVICIOS_ESPECIALIZADOS: "Servicios especializados",
  OTROS: "Otros",
  TALLER_MECANICO: "Taller mecanico",
  ELECTRICIDAD_AUTOMOTRIZ: "Electricidad automotriz",
  PINTURA_Y_CARROCERIA: "Pintura y carroceria",
  ALINEACION_Y_BALANCEO: "Alineacion y balanceo",
  LAVADO_Y_DETAILING: "Lavado y detailing",
  REPUESTOS: "Repuestos",
  NEUMATICOS: "Neumaticos",
  LUBRICENTRO: "Lubricentro",
  DIAGNOSTICO: "Diagnostico",
};

const LEGACY_CATEGORY_MAP: Record<string, string> = {
  TALLER_MECANICO: "SERVICIOS_ESPECIALIZADOS",
  ELECTRICIDAD_AUTOMOTRIZ: "SERVICIOS_ESPECIALIZADOS",
  PINTURA_Y_CARROCERIA: "SERVICIOS_ESPECIALIZADOS",
  ALINEACION_Y_BALANCEO: "NEUMATICOS_Y_LLANTAS",
  LAVADO_Y_DETAILING: "SERVICIOS_ESPECIALIZADOS",
  REPUESTOS: "REPUESTOS_Y_COMPONENTES",
  NEUMATICOS: "NEUMATICOS_Y_LLANTAS",
  LUBRICENTRO: "ACEITES_Y_LUBRICANTES",
  DIAGNOSTICO: "SERVICIOS_ESPECIALIZADOS",
  OTRO: "OTROS",
};

export function normalizeBusinessCategory(category?: string | null) {
  if (!category) return null;
  return LEGACY_CATEGORY_MAP[category] ?? category;
}

export function categoryLabel(category: string) {
  const normalized = normalizeBusinessCategory(category) ?? category;
  if (CATEGORY_LABELS[normalized]) {
    return CATEGORY_LABELS[normalized];
  }

  return normalized
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
