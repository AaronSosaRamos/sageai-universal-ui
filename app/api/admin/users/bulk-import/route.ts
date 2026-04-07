import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("Token");
    if (!token) {
      return NextResponse.json({ detail: "Token requerido" }, { status: 401 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!baseUrl) {
      return NextResponse.json({ detail: "Falta NEXT_PUBLIC_API_BASE_URL" }, { status: 500 });
    }

    const incoming = await req.formData();
    const res = await fetch(`${baseUrl}/admin/users/bulk-import`, {
      method: "POST",
      headers: { Token: token },
      body: incoming,
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e: unknown) {
    console.error("bulk-import proxy:", e);
    return NextResponse.json({ detail: "Error al importar usuarios" }, { status: 500 });
  }
}
