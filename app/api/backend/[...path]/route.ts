import { getAccessToken } from '@auth0/nextjs-auth0';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: any) {
  return handleRequest(req, params, 'GET');
}

export async function POST(req: NextRequest, { params }: any) {
  return handleRequest(req, params, 'POST');
}

export async function PUT(req: NextRequest, { params }: any) {
  return handleRequest(req, params, 'PUT');
}

export async function DELETE(req: NextRequest, { params }: any) {
  return handleRequest(req, params, 'DELETE');
}

async function handleRequest(req: NextRequest, paramsPromise: any, method: string) {
  let accessToken: string | undefined;

  // Intentar obtener el token de acceso
  try {
    const res = new NextResponse();
    const tokenResult = await getAccessToken(req, res);
    accessToken = tokenResult.accessToken;
  } catch (tokenError) {
    console.error('TOKEN ERROR:', tokenError);
    accessToken = undefined;
  }

  try {
    const params = await paramsPromise;
    const path = params.path.join('/');
    const searchParams = req.nextUrl.search;

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
    const url = `${backendUrl}/api/${path}${searchParams}`;

    const contentType = req.headers.get('Content-Type') || '';
    
    // Preparar el payload del body
    let bodyPayload: any;
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      if (contentType.includes('multipart/form-data')) {
        bodyPayload = await req.formData();
      } else {
        bodyPayload = await req.text();
      }
    }

    const headers: Record<string, string> = {};
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    // Solo poner Content-Type si hay texto. Si es FormData, fetch pone el boundary automáticamente.
    if (bodyPayload && typeof bodyPayload === 'string') {
      headers['Content-Type'] = contentType || 'application/json';
    }

    const response = await fetch(url, {
      method,
      headers,
      body: bodyPayload || undefined,
    });

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const responseText = await response.text();

    // Log en consola del servidor para debug
    if (!response.ok) {
      console.error(`Backend Error [${method} ${url}]: ${response.status} - ${responseText}`);
    }

    return new NextResponse(responseText, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
      },
    });
  } catch (error) {
    console.error('Proxy Error:', error);
    return NextResponse.json(
      { error: 'Error de conexión con el servidor backend', details: String(error) },
      { status: 502 }
    );
  }
}
