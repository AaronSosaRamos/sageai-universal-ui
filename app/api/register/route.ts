import { NextRequest, NextResponse } from 'next/server';
import api from '@/lib/axios';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const res = await api.post('/users', body);
    
    return NextResponse.json(res.data);
  } catch (error: unknown) {
    const err = error as { response?: { data?: { detail?: string }; status?: number } };
    console.error('Error en registro:', err.response?.data || error);
    return NextResponse.json(
      { detail: err.response?.data?.detail || 'Error al registrar usuario' },
      { status: err.response?.status || 500 }
    );
  }
}
