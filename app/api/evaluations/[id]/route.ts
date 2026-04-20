import { NextRequest, NextResponse } from "next/server";
import api from "@/lib/axios";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.headers.get("Token");
    if (!token) return NextResponse.json({ detail: "Token requerido" }, { status: 401 });
    const { id } = await params;
    const previewStudent = req.nextUrl.searchParams.get("preview_student");
    const res = await api.get(`/evaluations/${id}`, {
      headers: { Token: token },
      params:
        previewStudent === "1" || previewStudent === "true"
          ? { preview_student: true }
          : {},
    });
    return NextResponse.json(res.data);
  } catch (e: unknown) {
    const err = e as { response?: { data?: { detail?: string }; status?: number } };
    return NextResponse.json(
      { detail: err.response?.data?.detail || "Error al obtener evaluación" },
      { status: err.response?.status || 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.headers.get("Token");
    if (!token) return NextResponse.json({ detail: "Token requerido" }, { status: 401 });
    const { id } = await params;
    const body = await req.json();
    const res = await api.put(`/evaluations/${id}`, body, { headers: { Token: token } });
    return NextResponse.json(res.data);
  } catch (e: unknown) {
    const err = e as { response?: { data?: { detail?: string }; status?: number } };
    return NextResponse.json(
      { detail: err.response?.data?.detail || "Error al actualizar evaluación" },
      { status: err.response?.status || 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.headers.get("Token");
    if (!token) return NextResponse.json({ detail: "Token requerido" }, { status: 401 });
    const { id } = await params;
    const res = await api.delete(`/evaluations/${id}`, { headers: { Token: token } });
    return NextResponse.json(res.data);
  } catch (e: unknown) {
    const err = e as { response?: { data?: { detail?: string }; status?: number } };
    return NextResponse.json(
      { detail: err.response?.data?.detail || "Error al eliminar evaluación" },
      { status: err.response?.status || 500 }
    );
  }
}
