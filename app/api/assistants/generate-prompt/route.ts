import { NextRequest, NextResponse } from "next/server";
import api from "@/lib/axios";

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("Token");
    if (!token) return NextResponse.json({ detail: "Token requerido" }, { status: 401 });
    const body = await req.json();
    const res = await api.post("/assistants/generate-prompt", body, { headers: { Token: token } });
    return NextResponse.json(res.data);
  } catch (e: unknown) {
    const err = e as { response?: { data?: { detail?: string }; status?: number } };
    return NextResponse.json(
      { detail: err.response?.data?.detail || "Error al generar prompt" },
      { status: err.response?.status || 500 }
    );
  }
}
