import { NextRequest, NextResponse } from 'next/server';
import api from '@/lib/axios';

export async function DELETE(
  request: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const token = request.headers.get('Token');
    if (!token) {
      return NextResponse.json({ error: 'Token no proporcionado' }, { status: 401 });
    }

    const url = request.url;
    const match = url.match(/\/files\/delete\/(.*)/);
    if (!match) throw new Error('Invalid URL format');
    
    const { data } = await api.delete(`/files/${match[1]}`, {
      headers: {
        'Token': token,
      },
    });
    return NextResponse.json(data);
  } catch (error: unknown) {
    const err = error as { 
      response?: { 
        data?: { detail?: string; error?: string }; 
        status?: number;
      };
      message?: string;
    };
    
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { 
        error: err.response?.data?.detail || err.response?.data?.error || err.message || 'Failed to delete file',
        details: err.response?.data
      },
      { status: err.response?.status || 500 }
    );
  }
}
