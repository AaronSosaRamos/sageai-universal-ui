export async function POST(request: Request): Promise<Response> {
  try {
    // Obtener token del header
    const token = request.headers.get("Token");
    if (!token) {
      return Response.json({ error: "Token no proporcionado" }, { status: 401 });
    }

    const { query, session_uuid, inner_uuid } = await request.json();
    if (!query || typeof query !== "string") {
      return Response.json({ error: "'query' es requerido" }, { status: 400 });
    }
    if (!session_uuid || typeof session_uuid !== "string") {
      return Response.json({ error: "'session_uuid' es requerido" }, { status: 400 });
    }
    if (!inner_uuid || typeof inner_uuid !== "string") {
      return Response.json({ error: "'inner_uuid' es requerido" }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!baseUrl) {
      return Response.json({ error: "Falta NEXT_PUBLIC_API_BASE_URL" }, { status: 500 });
    }

    const supRes = await fetch(`${baseUrl}/supervisor`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Token": token,
      },
      body: JSON.stringify({ 
        query,
        user_id: session_uuid,
        thread_id: inner_uuid
      }),
    });

    if (!supRes.ok) {
      const err = await safeJson(supRes);
      return Response.json({ error: "Error al consultar supervisor", detail: err }, { status: 500 });
    }

    const data = (await supRes.json()) as { response: string };
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: "Error interno", detail: serializeError(error) }, { status: 500 });
  }
}

async function safeJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return { status: res.status, statusText: res.statusText };
  }
}

function serializeError(error: unknown): unknown {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack };
  }
  return String(error);
}

