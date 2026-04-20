import { NextRequest, NextResponse } from "next/server";
import api from "@/lib/axios";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.headers.get("Token");
    if (!token) return NextResponse.json({ detail: "Token requerido" }, { status: 401 });
    const { id } = await params;
    const res = await api.post(`/evaluations/${id}/share/rotate`, {}, { headers: { Token: token } });
    return NextResponse.json(res.data);
  } catch (e: unknown) {
    const err = e as { response?: { data?: { detail?: string }; status?: number } };
    return NextResponse.json(
      { detail: err.response?.data?.detail || "No se pudo renovar el enlace" },
      { status: err.response?.status || 500 }
    );
  }
}
