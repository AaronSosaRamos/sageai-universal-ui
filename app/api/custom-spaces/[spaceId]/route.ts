import { NextRequest, NextResponse } from 'next/server';
import api from '@/lib/axios';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  try {
    const { spaceId } = await params;
    const token = req.headers.get('Token');
    if (!token) {
      return NextResponse.json(
        { detail: 'Token requerido' },
        { status: 401 }
      );
    }

    const res = await api.get(`/custom-spaces/${spaceId}`, {
      headers: { Token: token }
    });

    return NextResponse.json(res.data);
  } catch (error: unknown) {
    const err = error as { response?: { data?: { detail?: string }; status?: number } };
    console.error('Error obteniendo espacio personalizado:', err.response?.data || error);
    return NextResponse.json(
      { detail: err.response?.data?.detail || 'Error al obtener espacio personalizado' },
      { status: err.response?.status || 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  try {
    const { spaceId } = await params;
    const token = req.headers.get('Token');
    if (!token) {
      return NextResponse.json(
        { detail: 'Token requerido' },
        { status: 401 }
      );
    }

    const body = await req.json();

    const res = await api.put(`/custom-spaces/${spaceId}`, body, {
      headers: { Token: token }
    });

    return NextResponse.json(res.data);
  } catch (error: unknown) {
    const err = error as { response?: { data?: { detail?: string }; status?: number } };
    console.error('Error actualizando espacio personalizado:', err.response?.data || error);
    return NextResponse.json(
      { detail: err.response?.data?.detail || 'Error al actualizar espacio personalizado' },
      { status: err.response?.status || 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  try {
    const { spaceId } = await params;
    const token = req.headers.get('Token');
    if (!token) {
      return NextResponse.json(
        { detail: 'Token requerido' },
        { status: 401 }
      );
    }

    await api.delete(`/custom-spaces/${spaceId}`, {
      headers: { Token: token }
    });

    return NextResponse.json({ message: 'Espacio eliminado exitosamente' });
  } catch (error: unknown) {
    const err = error as { response?: { data?: { detail?: string }; status?: number } };
    console.error('Error eliminando espacio personalizado:', err.response?.data || error);
    return NextResponse.json(
      { detail: err.response?.data?.detail || 'Error al eliminar espacio personalizado' },
      { status: err.response?.status || 500 }
    );
  }
}
