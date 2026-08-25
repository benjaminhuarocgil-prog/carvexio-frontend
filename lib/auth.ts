type ApiErrorShape = { message?: string };

function apiPrefix() {
  return (process.env.NEXT_PUBLIC_API_PREFIX ?? "/api").replace(/\/$/, "");
}

async function extractErrorMessage(res: Response) {
  try {
    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const data = (await res.json()) as ApiErrorShape;
      if (data?.message) return data.message;
      return JSON.stringify(data);
    }
    const text = await res.text();
    return text || `${res.status} ${res.statusText}`;
  } catch {
    return `${res.status} ${res.statusText}`;
  }
}

export type AuthResponse = { token: string };

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${apiPrefix()}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    throw new Error(await extractErrorMessage(res));
  }

  return (await res.json()) as AuthResponse;
}

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  role: string;
  phone?: string;
};

export type RegisterResponse = { message: string; userId: string | number };

export async function register(payload: RegisterPayload): Promise<RegisterResponse> {
  const body: RegisterPayload = {
    ...payload,
    phone: payload.phone?.trim() ? payload.phone.trim() : undefined,
  };

  const res = await fetch(`${apiPrefix()}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(await extractErrorMessage(res));
  }

  return (await res.json()) as RegisterResponse;
}
