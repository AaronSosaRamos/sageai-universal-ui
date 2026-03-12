import { NextRequest, NextResponse } from "next/server";
import api from "@/lib/axios";

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("Token");
    if (!token) {
      return NextResponse.json({ error: "Token requerido" }, { status: 401 });
    }

    const body = await req.json();
    const { query, assistant_id } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "'query' es requerido" }, { status: 400 });
    }
    if (!assistant_id || typeof assistant_id !== "string") {
      return NextResponse.json({ error: "'assistant_id' es requerido" }, { status: 400 });
    }

    const { data } = await api.post(
      "/assistant-chat",
      { query, assistant_id },
      { headers: { Token: token } }
    );
    return NextResponse.json(data);
  } catch (e: unknown) {
    const err = e as { response?: { data?: { detail?: string }; status?: number } };
    return NextResponse.json(
      { error: err.response?.data?.detail || "Error al enviar mensaje" },
      { status: err.response?.status || 500 }
    );
  }
}
