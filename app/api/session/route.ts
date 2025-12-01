import { NextResponse } from 'next/server';
import api from '@/lib/axios';

export async function POST(request: Request) {
  try {
    const token = request.headers.get("Token");
    if (!token) {
      return NextResponse.json(
        { error: "Token no proporcionado" },
        { status: 401 }
      );
    }

    const { data } = await api.post('/start-session', {}, {
      headers: {
        Token: token
      }
    });

    return NextResponse.json(data);
  } catch (error: unknown) {
    const err = error as { response?: { data?: { detail?: string }; status?: number } };
    console.error('Error starting session:', error);
    const status = err.response?.status || 500;
    const message = err.response?.data?.detail || 'Failed to start session';
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}
