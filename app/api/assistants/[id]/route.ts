import { NextRequest, NextResponse } from "next/server";
import api from "@/lib/axios";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = req.headers.get("Token");
    if (!token) return NextResponse.json({ detail: "Token requerido" }, { status: 401 });
    const res = await api.get(`/assistants/${id}`, { headers: { Token: token } });
    return NextResponse.json(res.data);
  } catch (e: unknown) {
    const err = e as { response?: { data?: { detail?: string }; status?: number } };
    return NextResponse.json(
      { detail: err.response?.data?.detail || "Error al obtener asistente" },
      { status: err.response?.status || 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = req.headers.get("Token");
    if (!token) return NextResponse.json({ detail: "Token requerido" }, { status: 401 });
    const body = await req.json();
    const res = await api.put(`/assistants/${id}`, body, { headers: { Token: token } });
    return NextResponse.json(res.data);
  } catch (e: unknown) {
    const err = e as { response?: { data?: { detail?: string }; status?: number } };
    return NextResponse.json(
      { detail: err.response?.data?.detail || "Error al actualizar asistente" },
      { status: err.response?.status || 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = req.headers.get("Token");
    if (!token) return NextResponse.json({ detail: "Token requerido" }, { status: 401 });
    await api.delete(`/assistants/${id}`, { headers: { Token: token } });
    return NextResponse.json({ message: "Asistente eliminado" });
  } catch (e: unknown) {
    const err = e as { response?: { data?: { detail?: string }; status?: number } };
    return NextResponse.json(
      { detail: err.response?.data?.detail || "Error al eliminar asistente" },
      { status: err.response?.status || 500 }
    );
  }
}
