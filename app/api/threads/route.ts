import { NextRequest, NextResponse } from 'next/server';
import api from '@/lib/axios';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Token');
    if (!token) {
      return NextResponse.json({ error: 'Token no proporcionado' }, { status: 401 });
    }

    const { data } = await api.get('/threads', {
      headers: {
        'Token': token,
      },
    });
    return NextResponse.json(data);
  } catch (error: unknown) {
    const err = error as { response?: { data?: { detail?: string }; status?: number } };
    return NextResponse.json(
      { error: 'Error al obtener threads', detail: err.response?.data?.detail },
      { status: err.response?.status || 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Token');
    if (!token) {
      return NextResponse.json({ error: 'Token no proporcionado' }, { status: 401 });
    }

    const { data } = await api.post('/threads', {}, {
      headers: {
        'Token': token,
      },
    });
    return NextResponse.json(data);
  } catch (error: unknown) {
    const err = error as { response?: { data?: { detail?: string }; status?: number } };
    return NextResponse.json(
      { error: 'Error al crear thread', detail: err.response?.data?.detail },
      { status: err.response?.status || 500 }
    );
  }
}

