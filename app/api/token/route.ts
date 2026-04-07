import { NextResponse } from 'next/server';
import api from '@/lib/axios';
import { getServerSharedSecret } from '@/lib/serverSharedSecret';

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const secret = getServerSharedSecret();
    if (!secret) {
      console.error(
        'Define NEXT_PUBLIC_BACKEND_SECRET_VALUE (o BACKEND_SECRET_VALUE / SECRET_VALUE) en el frontend'
      );
      return NextResponse.json(
        { detail: 'El inicio de sesión no está disponible en este momento.' },
        { status: 500 }
      );
    }
    const { email, password } = body;
    const { data } = await api.post('/token', {
      email,
      password,
      secret_value: secret,
    });
    return NextResponse.json(data);
  } catch (error: unknown) {
    const err = error as { response?: { data?: { detail?: string }; status?: number } };
    console.error('Error getting token:', error);
    const status = err.response?.status || 500;
    const message = err.response?.data?.detail || 'No se pudo iniciar sesión. Comprueba tu correo y contraseña.';
    return NextResponse.json(
      { detail: message },
      { status }
    );
  }
}
