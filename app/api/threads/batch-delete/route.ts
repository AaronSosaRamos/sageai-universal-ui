import { NextRequest, NextResponse } from 'next/server';
import api from '@/lib/axios';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Token');
    if (!token) {
      return NextResponse.json({ error: 'Token no proporcionado' }, { status: 401 });
    }

    const body = await request.json();
    const { thread_ids } = body;

    if (!Array.isArray(thread_ids) || thread_ids.length === 0) {
      return NextResponse.json(
        { error: 'Se requiere un array de thread_ids' },
        { status: 400 }
      );
    }

    const { data } = await api.post('/threads/batch-delete', { thread_ids }, {
      headers: {
        'Token': token,
      },
    });
    return NextResponse.json(data);
  } catch (error: unknown) {
    const err = error as { response?: { data?: { detail?: string }; status?: number } };
    return NextResponse.json(
      { error: 'Error al eliminar threads', detail: err.response?.data?.detail },
      { status: err.response?.status || 500 }
    );
  }
}

