import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("Token");
    if (!token) {
      return NextResponse.json({ error: "Token requerido" }, { status: 401 });
    }

    const body = await req.json();
    const { content, format, title } = body as {
      content?: string;
      format?: string;
      title?: string;
    };

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json({ error: "content es requerido" }, { status: 400 });
    }
    if (format !== "docx" && format !== "pdf") {
      return NextResponse.json({ error: "format debe ser docx o pdf" }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!baseUrl) {
      return NextResponse.json(
        { error: "Falta NEXT_PUBLIC_API_BASE_URL" },
        { status: 500 }
      );
    }

    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/export/response`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Token: token,
      },
      body: JSON.stringify({
        content: content.trim(),
        format,
        title: typeof title === "string" ? title : undefined,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: (err as { detail?: string }).detail || "Error al exportar" },
        { status: res.status }
      );
    }

    const buf = await res.arrayBuffer();
    const ct =
      res.headers.get("Content-Type") || "application/octet-stream";
    const cd = res.headers.get("Content-Disposition");

    const headers = new Headers();
    headers.set("Content-Type", ct);
    if (cd) {
      headers.set("Content-Disposition", cd);
    }
    headers.set("Cache-Control", "no-store");

    return new NextResponse(buf, { status: 200, headers });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error interno" },
      { status: 500 }
    );
  }
}
