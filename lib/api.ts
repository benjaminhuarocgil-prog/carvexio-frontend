export const API_PREFIX = "/api/backend"; // Ahora apunta al proxy seguro de Next.js

type ApiFetchOptions = RequestInit & {
  token?: string; // Mantener por compatibilidad, pero ya no es necesario con el proxy
};

function joinApiPath(path: string) {
  if (!path) return API_PREFIX;
  // Eliminamos el prefijo /api si el path ya lo trae, para evitar /api/backend/api/...
  const cleanPath = path.startsWith("/api") ? path.replace("/api", "") : path;
  return `${API_PREFIX}${cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`}`;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { token, headers, ...init } = options;

  const response = await fetch(joinApiPath(path), {
    ...init,
    headers: {
      // El token ya lo pondrá el proxy automáticamente en el servidor
      ...(init.body && typeof init.body === "string" ? { "Content-Type": "application/json" } : {}),
      ...(headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    // El backend (Spring Boot) devuelve el detalle del error como JSON con un campo "message"
    // (ej. límites del plan). Si existe, lo usamos como mensaje legible en vez del JSON crudo.
    let message: string | null = null;
    if (body) {
      try {
        const parsed = JSON.parse(body);
        if (typeof parsed?.message === "string" && parsed.message.trim()) {
          message = parsed.message;
        } else if (typeof parsed?.detail === "string" && parsed.detail.trim()) {
          // Spring Boot 3 responde errores de validación como ProblemDetail.
          message = parsed.detail;
        }
      } catch {
        // body no era JSON, seguimos con el formato genérico de abajo
      }
    }
    throw new Error(
      message ?? `API error ${response.status} ${response.statusText}${body ? ` - ${body}` : ""}`,
    );
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return (await response.json()) as T;
  }
  return (await response.text()) as unknown as T;
}
