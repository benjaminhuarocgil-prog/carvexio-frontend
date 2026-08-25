import { redirect } from 'next/navigation';

export default function LoginPage() {
  // Redirigir automáticamente a la Home o al login de Auth0
  redirect('/');
}
