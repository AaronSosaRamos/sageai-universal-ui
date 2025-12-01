import { NextRequest, NextResponse } from 'next/server';
import api from '@/lib/axios';

export async function POST(
  request: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const token = request.headers.get('Token');
    console.log("Headers recibidos:", {
      token: !!token,
      contentType: request.headers.get('Content-Type'),
      allHeaders: Object.fromEntries(request.headers.entries())
    });

    const formData = await request.formData();
    const url = request.url;
    const match = url.match(/\/files\/(.*)/);
    if (!match) throw new Error('Invalid URL format');
    
    console.log("Enviando archivo:", {
      path: match[1],
      formDataKeys: Array.from(formData.keys()),
      token: !!token
    });
    
    // Enviar el FormData directamente
    const { data } = await api.post(
      `/files/${match[1]}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token ? { 'Token': token } : {})
        },
      }
    );
    return NextResponse.json(data);
  } catch (err) {
    const error = err as { 
      response?: { 
        data?: { detail?: string; error?: string }; 
        status?: number;
        headers?: unknown;
      };
      message?: string;
    };

    console.error('Error uploading files:', {
      error: err,
      response: error.response?.data,
      status: error.response?.status,
      headers: error.response?.headers
    });

    return NextResponse.json(
      { 
        error: error.response?.data?.detail || error.response?.data?.error || error.message || 'Failed to upload files',
        details: error.response?.data
      },
      { status: error.response?.status || 500 }
    );
  }
}
