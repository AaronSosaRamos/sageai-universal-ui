import { NextResponse } from 'next/server';
import api from '@/lib/axios';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { data } = await api.post('/token', body);
    return NextResponse.json(data);
  } catch (error: unknown) {
    const err = error as { response?: { data?: { detail?: string }; status?: number } };
    console.error('Error getting token:', error);
    const status = err.response?.status || 500;
    const message = err.response?.data?.detail || 'Error al obtener token';
    return NextResponse.json(
      { detail: message },
      { status }
    );
  }
}
