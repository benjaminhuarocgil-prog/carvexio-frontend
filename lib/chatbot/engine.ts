import { apiFetch } from "../api";

export type ChatOption = { label: string; value: string };
export type ChatReply = { text: string; options?: ChatOption[]; context?: ChatContext };
export type ChatContext = { awaiting?: "district" | "service-district" | "product-choice"; lastProducts?: Product[]; serviceQuery?: string };
type Product = { id: number; name?: string; price?: number; stock?: number; category?: string; brand?: string };
type Service = { name?: string; description?: string; category?: string };
type Branch = { district?: string; address?: string; name?: string };
type Business = { id: number; name?: string; description?: string; address?: string; phone?: string; category?: string; branches?: Branch[] };

const STOP = new Set(["como", "donde", "esta", "estan", "quiero", "para", "por", "del", "que", "una", "uno", "los", "las", "con", "hay", "me", "de", "el", "la", "un", "en", "mi"]);
const FIXES: Record<string, string> = { busko: "busco", prodcuto: "producto", prodcutos: "productos", presio: "precio", tallerres: "talleres", reserba: "reserva", mensage: "mensaje", inisiar: "iniciar", sesion: "sesion" };

export function normalize(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9ñ\s]/g, " ").split(/\s+/).filter(Boolean).map(w => FIXES[w] ?? w).join(" ");
}
function words(text: string) { return normalize(text).split(" ").filter(w => w && !STOP.has(w)); }
function distance(a: string, b: string) { const rows = Array.from({ length: a.length + 1 }, (_, i) => [i]); for (let j = 1; j <= b.length; j++) rows[0][j] = j; for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) rows[i][j] = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return rows[a.length][b.length]; }
function similar(a: string, b: string) { return a === b || (Math.min(a.length, b.length) > 3 && distance(a, b) <= Math.max(1, Math.floor(Math.max(a.length, b.length) * .24))); }
function score(input: string, terms: string[]) { const inputWords = words(input); return terms.reduce((total, term) => total + (normalize(input).includes(normalize(term)) ? 5 : inputWords.some(w => similar(w, normalize(term))) ? 2 : 0), 0); }
function price(value?: number) { return `S/ ${(value ?? 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}`; }

const HELP = "Puedo ayudarte a buscar productos y precios, ver stock, encontrar talleres por distrito o servicio, comprar, usar el carrito, reservas, mensajes, inicio de sesión y registro de negocio.";
const intents = [
  ["workshops", ["taller", "talleres", "negocio", "negocios", "cerca", "zona", "distrito"]],
  ["services", ["cambio aceite", "alineamiento", "frenos", "mantenimiento", "lavado", "servicio", "servicios"]],
  ["price", ["precio", "cuanto cuesta", "cuanto vale", "cuanto esta", "barato", "menos de"]],
  ["stock", ["stock", "disponible", "tienen", "hay producto", "existencia"]],
  ["products", ["producto", "productos", "repuesto", "repuestos", "buscar", "buscador"]],
  ["buy", ["comprar", "compra", "carrito", "pedido", "pagar", "checkout"]],
  ["booking", ["cita", "reserva", "agendar", "horario", "horarios"]],
  ["messages", ["mensaje", "mensajes", "contactar", "contacto", "hablar"]],
  ["account", ["registrar", "registro", "iniciar sesion", "login", "cuenta", "perfil"]],
  ["business", ["crear negocio", "registrar negocio", "empresa", "taller propio", "publicar servicio"]],
];

async function businesses() { return apiFetch<Business[]>("/business/public").catch(() => []); }
async function productSearch(query: string) { return apiFetch<Product[]>(`/products/search?name=${encodeURIComponent(query)}`).catch(() => []); }
function districtFrom(text: string, list: Business[]) { const districts = [...new Set(list.flatMap(b => b.branches ?? []).map(x => x.district).filter((x): x is string => !!x))]; return districts.find(d => normalize(text).includes(normalize(d))) ?? null; }
function productQuery(text: string) { return words(text).filter(w => !["precio", "cuesta", "vale", "esta", "stock", "disponible", "tienen", "producto", "productos", "repuesto", "repuestos", "barato", "menos", "soles"].includes(w)).join(" "); }

export async function answer(input: string, context: ChatContext = {}): Promise<ChatReply> {
  const text = normalize(input);
  if (!text) return { text: "Escribe tu pregunta y te ayudaré." };
  if (context.awaiting === "district") return findWorkshops(input);
  if (context.awaiting === "service-district") return findServices(input, context.serviceQuery ?? "");
  if (context.awaiting === "product-choice" && context.lastProducts) {
    const n = Number(text.match(/\d+/)?.[0]);
    if (n && context.lastProducts[n - 1]) { const p = context.lastProducts[n - 1]; return { text: `${p.name}: ${price(p.price)}. Stock disponible: ${p.stock ?? "no informado"}.` }; }
  }
  const ranking = intents.map(([id, terms]) => ({ id, score: score(input, terms as string[]) })).sort((a, b) => b.score - a.score);
  const intent = ranking[0]?.score >= 3 ? ranking[0].id : "help";
  if (intent === "workshops") return findWorkshops(input);
  if (intent === "services") return findServices(input);
  if (intent === "price" || intent === "stock" || intent === "products") return findProducts(input, intent);
  if (intent === "buy") return { text: "En el Marketplace abre un negocio, elige un producto y pulsa “Agregar al carrito”. Luego entra a “Mi Carrito” para confirmar tu pedido." };
  if (intent === "booking") return { text: "Entra al perfil del negocio, elige un servicio y selecciona una fecha. Solo aparecerán los horarios que el negocio configuró como disponibles." };
  if (intent === "messages") return { text: "Si ya compraste o reservaste, abre “Mensajes” en tu panel cliente, selecciona el negocio y escribe. El negocio podrá responderte desde su panel." };
  if (intent === "account") return { text: "Para iniciar sesión usa el botón “Ingresar”. Si eres nuevo, regístrate desde Auth0. En “Mi Perfil” puedes actualizar tus datos." };
  if (intent === "business") return { text: "Para registrar un negocio selecciona “Soy empresa” durante el ingreso. Completa el perfil del negocio, agrega servicios o productos y configura horarios en “Mis Locales”. El negocio se muestra en Marketplace tras la aprobación administrativa." };
  return { text: `${HELP}\n\nPuedes probar: “precio de aceite”, “talleres en Miraflores”, “cómo compro” o “cómo agendo una cita”.` };
}

async function findProducts(input: string, intent: string): Promise<ChatReply> {
  const query = productQuery(input);
  if (!query) return { text: "¿Qué producto o repuesto deseas buscar? Por ejemplo: “precio de aceite” o “hay batería disponible”." };
  let results = await productSearch(query);
  const limit = Number(normalize(input).match(/menos de\s+(\d+)/)?.[1]);
  if (limit) results = results.filter(p => (p.price ?? Infinity) <= limit);
  if (!results.length) return { text: `No encontré productos reales que coincidan con “${query}”. Prueba con otro nombre o revisa el Marketplace.` };
  const shown = results.slice(0, 5);
  const title = intent === "stock" ? "Disponibilidad encontrada:" : "Encontré estos productos:";
  return { text: `${title}\n${shown.map((p, i) => `${i + 1}. ${p.name} — ${price(p.price)}${intent === "stock" ? ` — Stock: ${p.stock ?? "no informado"}` : ""}`).join("\n")}\n\nEscribe el número de una opción para ver su detalle.`, context: { awaiting: "product-choice", lastProducts: shown } };
}

async function findWorkshops(input: string): Promise<ChatReply> {
  const list = await businesses();
  if (!list.length) return { text: "Aún no hay negocios aprobados publicados en el Marketplace." };
  const district = districtFrom(input, list);
  const asksForLocation = /\b(cerca|cercano|cercanos|zona|distrito|distritos|en)\b/.test(normalize(input));
  if (!district) {
    const districts = [...new Set(list.flatMap(b => b.branches ?? []).map(x => x.district).filter((x): x is string => !!x))].slice(0, 12);
    if (asksForLocation && districts.length) {
      return { text: "¿En qué distrito deseas buscar?", options: districts.map(d => ({ label: d, value: d })), context: { awaiting: "district" } };
    }
    if (asksForLocation && !districts.length) {
      return { text: `Estos son los negocios publicados actualmente:\n${list.slice(0, 6).map((b, i) => `${i + 1}. ${b.name}${b.address ? ` — ${b.address}` : ""}`).join("\n")}\n\nTodavía no tienen sedes con distrito configurado, por eso no puedo filtrarlos por distrito.` };
    }
    return { text: `Estos son los negocios publicados actualmente:\n${list.slice(0, 8).map((b, i) => `${i + 1}. ${b.name}${b.address ? ` — ${b.address}` : ""}${b.category ? `\n   Categoría: ${b.category}` : ""}`).join("\n")}\n\nPuedes preguntarme por talleres en un distrito cuando los negocios tengan una sede configurada.` };
  }
  const serviceWords = words(input).filter(w => !["taller", "talleres", "en", normalize(district)].includes(w));
  const candidates = list.filter(b => (b.branches ?? []).some(x => normalize(x.district ?? "") === normalize(district)));
  const withServices = await Promise.all(candidates.map(async business => ({ business, services: await apiFetch<Service[]>(`/services/public/business/${business.id}`).catch(() => []) })));
  const filtered = serviceWords.length ? withServices.filter(x => x.services.some(s => serviceWords.some(w => normalize(`${s.name} ${s.category} ${s.description}`).includes(w)))) : withServices;
  if (!filtered.length) return { text: `No encontré negocios publicados${serviceWords.length ? ` con ese servicio` : ""} en ${district}.` };
  return { text: `Negocios encontrados en ${district}:\n${filtered.slice(0, 6).map((x, i) => `${i + 1}. ${x.business.name}${x.business.address ? ` — ${x.business.address}` : ""}${x.services.length ? `\n   Servicios: ${x.services.slice(0, 3).map(s => s.name).filter(Boolean).join(", ")}` : ""}`).join("\n")}` };
}

async function findServices(input: string, savedQuery = ""): Promise<ChatReply> {
  const list = await businesses();
  if (!list.length) return { text: "Aún no hay negocios aprobados con servicios publicados." };
  const district = districtFrom(input, list);
  const districts = [...new Set(list.flatMap(b => b.branches ?? []).map(x => x.district).filter((x): x is string => !!x))].slice(0, 12);
  const query = savedQuery || words(input).filter(w => !["servicio", "servicios", "dime", "que", "hay", "quiero", "buscar", "ver", "hacer", "hacen"].includes(w)).join(" ");
  if (!district && districts.length) {
    return { text: query ? `¿En qué distrito prefieres el servicio “${query}”?` : "¿En qué distrito deseas ver los servicios disponibles?", options: districts.map(d => ({ label: d, value: d })), context: { awaiting: "service-district", serviceQuery: query } };
  }
  const candidates = district ? list.filter(b => (b.branches ?? []).some(x => normalize(x.district ?? "") === normalize(district))) : list;
  const details = await Promise.all(candidates.map(async business => ({ business, services: await apiFetch<Service[]>(`/services/public/business/${business.id}`).catch(() => []) })));
  const filtered = query ? details.map(x => ({ ...x, services: x.services.filter(s => normalize(`${s.name} ${s.category} ${s.description}`).includes(normalize(query))) })).filter(x => x.services.length) : details.filter(x => x.services.length);
  if (!filtered.length) return { text: `No encontré servicios${query ? ` que coincidan con “${query}”` : " publicados"}${district ? ` en ${district}` : ""}.` };
  return { text: `Servicios${district ? ` en ${district}` : " disponibles"}:\n${filtered.slice(0, 6).map((x, i) => `${i + 1}. ${x.business.name}\n   ${x.services.slice(0, 4).map(s => s.name).filter(Boolean).join(", ")}`).join("\n")}` };
}
