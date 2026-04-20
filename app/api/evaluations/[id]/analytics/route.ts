import { NextRequest, NextResponse } from "next/server";
import api from "@/lib/axios";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.headers.get("Token");
    if (!token) {
      return NextResponse.json({ detail: "Token requerido" }, { status: 401 });
    }
    const { id } = await params;
    const userId = req.nextUrl.searchParams.get("user_id") || undefined;
    const { data } = await api.get(`/evaluations/${id}/analytics`, {
      headers: { Token: token },
      params: userId ? { user_id: userId } : {},
    });
    return NextResponse.json(data);
  } catch (e: unknown) {
    const err = e as { response?: { data?: { detail?: string }; status?: number } };
    return NextResponse.json(
      { detail: err.response?.data?.detail || "Error al cargar analytics" },
      { status: err.response?.status || 500 }
    );
  }
}
