import { NextRequest, NextResponse } from "next/server";
import api from "@/lib/axios";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const res = await api.get(`/evaluations/share/${token}/meta`);
    return NextResponse.json(res.data);
  } catch (e: unknown) {
    const err = e as { response?: { data?: { detail?: string }; status?: number } };
    return NextResponse.json(
      { detail: err.response?.data?.detail || "Evaluación no disponible" },
      { status: err.response?.status || 500 }
    );
  }
}
