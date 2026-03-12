import { NextRequest, NextResponse } from 'next/server';
import api from '@/lib/axios';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('Token');
    if (!token) {
      return NextResponse.json(
        { detail: 'Token requerido' },
        { status: 401 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const activeOnly = searchParams.get('active_only') === 'true';

    const res = await api.get('/custom-spaces', {
      params: { active_only: activeOnly },
      headers: { Token: token }
    });

    return NextResponse.json(res.data);
  } catch (error: unknown) {
    const err = error as { response?: { data?: { detail?: string }; status?: number } };
    console.error('Error obteniendo espacios personalizados:', err.response?.data || error);
    return NextResponse.json(
      { detail: err.response?.data?.detail || 'Error al obtener espacios personalizados' },
      { status: err.response?.status || 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('Token');
    if (!token) {
      return NextResponse.json(
        { detail: 'Token requerido' },
        { status: 401 }
      );
    }

    const body = await req.json();

    const res = await api.post('/custom-spaces', body, {
      headers: { Token: token }
    });

    return NextResponse.json(res.data, { status: 201 });
  } catch (error: unknown) {
    const err = error as { response?: { data?: { detail?: string }; status?: number } };
    console.error('Error creando espacio personalizado:', err.response?.data || error);
    return NextResponse.json(
      { detail: err.response?.data?.detail || 'Error al crear espacio personalizado' },
      { status: err.response?.status || 500 }
    );
  }
}
