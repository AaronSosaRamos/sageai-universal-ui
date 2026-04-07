import { NextRequest, NextResponse } from "next/server";
import api from "@/lib/axios";

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("Token");
    if (!token) {
      return NextResponse.json({ detail: "Token requerido" }, { status: 401 });
    }
    const days = req.nextUrl.searchParams.get("days") || "30";
    const { data } = await api.get("/admin/analytics/dashboard", {
      headers: { Token: token },
      params: { days },
    });
    return NextResponse.json(data);
  } catch (e: unknown) {
    const err = e as { response?: { data?: { detail?: string }; status?: number } };
    return NextResponse.json(
      { detail: err.response?.data?.detail || "Error al cargar el panel" },
      { status: err.response?.status || 500 }
    );
  }
}
