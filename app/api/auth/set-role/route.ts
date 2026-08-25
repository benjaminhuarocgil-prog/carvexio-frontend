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
    const domain = issuerUrl.replace('https://', '').replace('http://', '');

    // Usar credenciales M2M si existen (recomendado), si no, intentar con las normales
    const clientId = process.env.AUTH0_M2M_CLIENT_ID || process.env.AUTH0_CLIENT_ID;
    const clientSecret = process.env.AUTH0_M2M_CLIENT_SECRET || process.env.AUTH0_CLIENT_SECRET;

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
    console.log("Management API token response:", JSON.stringify(tokenResJson));

    if (!tokenResJson.access_token) {
      console.error("No se obtuvo access_token. Respuesta:", tokenResJson);
      return NextResponse.json({
        error: `No se pudo obtener token de gestión: ${tokenResJson.error_description || tokenResJson.error || 'Error desconocido'}`
      }, { status: 500 });
    }

    const access_token = tokenResJson.access_token;

    // 3. Asignar el rol al usuario en Auth0 (AHORA USANDO METADATOS)
    const assignRes = await fetch(`https://${domain}/api/v2/users/${userId}`, {
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
      const errData = await assignRes.json();
      console.error("Error asignando rol:", errData);
      throw new Error("No se pudo asignar el rol");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
