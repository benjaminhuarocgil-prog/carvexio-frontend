export type JwtPayload = Record<string, unknown>;

function base64UrlDecode(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (normalized.length % 4)) % 4;
  const padded = normalized + "=".repeat(padLength);

  // atob expects standard base64 (browser only).
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function decodeJwtPayload(token: string): JwtPayload | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;

  try {
    const json = base64UrlDecode(parts[1]);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

export type AppRole = "ADMIN" | "CLIENTE" | "EMPRESA" | "NEGOCIO";

function normalizeRole(value: string): AppRole | null {
  const normalized = value.toUpperCase().replace(/^ROLE_/, "");
  if (normalized === "ADMIN" || normalized === "ADMINISTRADOR") return "ADMIN";
  if (normalized === "CLIENTE") return "CLIENTE";
  if (normalized === "EMPRESA" || normalized === "NEGOCIO" || normalized === "BUSINESS") return "EMPRESA";
  return null;
}

export function getRoleFromToken(token: string): AppRole | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;

  // Common custom claim variants.
  for (const key of ["role", "rol", "Role", "userRole", "user_role"]) {
    const value = payload[key];
    if (typeof value === "string") {
      const parsed = normalizeRole(value);
      if (parsed) return parsed;
    }
  }

  const role = payload["role"];
  if (typeof role === "string") return normalizeRole(role);

  const roles = payload["roles"];
  if (Array.isArray(roles)) {
    for (const item of roles) {
      if (typeof item === "string") {
        const parsed = normalizeRole(item);
        if (parsed) return parsed;
      }
    }
  }

  const authorities = payload["authorities"];
  if (Array.isArray(authorities)) {
    for (const item of authorities) {
      if (typeof item === "string") {
        const parsed = normalizeRole(item);
        if (parsed) return parsed;
      }
      if (item && typeof item === "object" && "authority" in item) {
        const maybe = (item as { authority?: unknown }).authority;
        if (typeof maybe === "string") {
          const parsed = normalizeRole(maybe);
          if (parsed) return parsed;
        }
      }
    }
  }
  if (typeof authorities === "string") {
    for (const part of authorities.split(/[,\s]+/)) {
      const parsed = normalizeRole(part);
      if (parsed) return parsed;
    }
  }

  // Some backends use "roles" as a space/comma-separated string.
  if (typeof roles === "string") {
    for (const part of roles.split(/[,\s]+/)) {
      const parsed = normalizeRole(part);
      if (parsed) return parsed;
    }
  }

  const scope = payload["scope"];
  if (typeof scope === "string") {
    for (const part of scope.split(/\s+/)) {
      const parsed = normalizeRole(part);
      if (parsed) return parsed;
    }
  }

  return null;
}

export function getEmailFromToken(token: string): string | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;

  const email = payload["email"];
  if (typeof email === "string" && email.trim()) return email.trim();

  const username = payload["sub"];
  if (typeof username === "string" && username.trim()) return username.trim();

  return null;
}
