import { getSession } from "@auth0/nextjs-auth0";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const res = new NextResponse();
    const session = await getSession(req, res);
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { role } = await req.json();
    if (!role || !["CLIENTE", "EMPRESA"].includes(role)) {
      return NextResponse.json({ error: "Rol no válido" }, { status: 400 });
    }

    const userId = session.user.sub;
    // AUTH0_ISSUER_BASE_URL is like 'https://carvexio-payment.us.auth0.com'
    const issuerUrl = process.env.AUTH0_ISSUER_BASE_URL || '';
    const domain = issuerUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');

    // Usar credenciales M2M si existen (recomendado), si no, intentar con las normales
    const hasM2M = !!process.env.AUTH0_M2M_CLIENT_ID && !!process.env.AUTH0_M2M_CLIENT_SECRET;
    const clientId = hasM2M ? process.env.AUTH0_M2M_CLIENT_ID : process.env.AUTH0_CLIENT_ID;
    const clientSecret = hasM2M ? process.env.AUTH0_M2M_CLIENT_SECRET : process.env.AUTH0_CLIENT_SECRET;
    if (!domain || !clientId || !clientSecret) {
      return NextResponse.json({ error: "Falta configurar las credenciales de Auth0 en Vercel." }, { status: 500 });
    }

    // 1. Obtener Token de la Management API
    const tokenRes = await fetch(`https://${domain}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        audience: `https://${domain}/api/v2/`,
        grant_type: "client_credentials",
      }),
    });

    const tokenResJson = await tokenRes.json();

    if (!tokenResJson.access_token) {
      console.error("No se obtuvo access_token. Respuesta:", tokenResJson);
      return NextResponse.json({ error: `Auth0 no autorizó el token de gestión: ${tokenResJson.error_description || tokenResJson.error || "Error desconocido"}` }, { status: 500 });
    }

    const access_token = tokenResJson.access_token;

    // 3. Asignar el rol al usuario en Auth0 (AHORA USANDO METADATOS)
    const assignRes = await fetch(`https://${domain}/api/v2/users/${encodeURIComponent(userId)}`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        app_metadata: {
          roles: [role] // Aquí pasas directamente "CLIENTE" o "EMPRESA"
        }
      }),
    });

    if (!assignRes.ok) {
      const errData = await assignRes.json().catch(() => ({}));
      return NextResponse.json({
        error: `Auth0 no pudo asignar el rol: ${errData.message || errData.error_description || errData.error || assignRes.statusText}`,
      }, { status: assignRes.status >= 400 && assignRes.status < 500 ? assignRes.status : 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
