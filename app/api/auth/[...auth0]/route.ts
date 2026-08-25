import { handleAuth, handleLogin } from '@auth0/nextjs-auth0';

export const GET = async (req: any, { params }: any) => {
  const resolvedParams = await params;
  
  return handleAuth({
    login: handleLogin({
      authorizationParams: {
        audience: process.env.AUTH0_AUDIENCE,
        // Pedimos los permisos necesarios
        scope: 'openid profile email'
      }
    })
  })(req, { params: resolvedParams });
};

export const POST = async (req: any, { params }: any) => {
  const resolvedParams = await params;
  return handleAuth()(req, { params: resolvedParams });
};
