import { NextRequest, NextResponse } from 'next/server';
import api from '@/lib/axios';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ threadId: string }> }
) {
  try {
    const token = request.headers.get('Token');
    if (!token) {
      return NextResponse.json({ error: 'Token no proporcionado' }, { status: 401 });
    }

    const { threadId } = await context.params;
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '200';

    const { data } = await api.get(`/threads/${threadId}/messages`, {
      params: { limit },
      headers: {
        'Token': token,
      },
    });
    return NextResponse.json(data);
  } catch (error: unknown) {
    const err = error as { response?: { data?: { detail?: string }; status?: number } };
    return NextResponse.json(
      { error: 'Error al obtener mensajes', detail: err.response?.data?.detail },
      { status: err.response?.status || 500 }
    );
  }
}

