import { NextRequest, NextResponse } from "next/server";
import api from "@/lib/axios";

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("Token");
    if (!token) {
      return NextResponse.json({ detail: "Token requerido" }, { status: 401 });
    }
    
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    
    const res = await api.get("/assistants", {
      params: { page, limit },
      headers: { Token: token }
    });
    return NextResponse.json(res.data);
  } catch (e: unknown) {
    const err = e as { response?: { data?: { detail?: string }; status?: number } };
    return NextResponse.json(
      { detail: err.response?.data?.detail || "Error al obtener asistentes" },
      { status: err.response?.status || 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("Token");
    if (!token) return NextResponse.json({ detail: "Token requerido" }, { status: 401 });
    const body = await req.json();
    const res = await api.post("/assistants", body, { headers: { Token: token } });
    return NextResponse.json(res.data, { status: 201 });
  } catch (e: unknown) {
    const err = e as { response?: { data?: { detail?: string }; status?: number } };
    return NextResponse.json(
      { detail: err.response?.data?.detail || "Error al crear asistente" },
      { status: err.response?.status || 500 }
    );
  }
}
