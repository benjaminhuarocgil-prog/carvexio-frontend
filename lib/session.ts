import { getRoleFromToken, type AppRole } from "./jwt";

const ROLE_KEY = "role";

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function setToken(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("token", token);
}

export function setRole(role: AppRole) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ROLE_KEY, role);
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
  localStorage.removeItem(ROLE_KEY);
}

export function getRole(): AppRole | null {
  const token = getToken();
  if (token) {
    const fromToken = getRoleFromToken(token);
    if (fromToken) return fromToken;
  }

  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(ROLE_KEY);
  if (!raw) return null;
  const normalized = raw.toUpperCase().replace(/^ROLE_/, "");
  if (normalized === "ADMIN" || normalized === "ADMINISTRADOR") return "ADMIN";
  if (normalized === "CLIENTE") return "CLIENTE";
  if (normalized === "EMPRESA" || normalized === "NEGOCIO" || normalized === "BUSINESS") return "EMPRESA";
  return null;
}
