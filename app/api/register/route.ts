import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import api from "@/lib/axios";
import { REGISTER_GATE_COOKIE, verifyRegisterGateToken } from "@/lib/registerGateToken";
import { getServerSharedSecret } from "@/lib/serverSharedSecret";

export async function POST(req: NextRequest) {
  try {
    const expected = getServerSharedSecret();
    if (!expected) {
      console.error(
        "Define NEXT_PUBLIC_BACKEND_SECRET_VALUE (o BACKEND_SECRET_VALUE / SECRET_VALUE) en el frontend"
      );
      return NextResponse.json(
        { detail: "El registro no está disponible en este momento." },
        { status: 500 }
      );
    }

    const jar = await cookies();
    const gate = jar.get(REGISTER_GATE_COOKIE)?.value;
    if (!gate || !verifyRegisterGateToken(expected, gate)) {
      return NextResponse.json(
        {
          detail:
            "Tu acceso al registro caducó o no es válido. Vuelve atrás e ingresa el código otra vez.",
        },
        { status: 401 }
      );
    }

    const body = (await req.json()) as Record<string, unknown>;
    const { nombre, apellido, email, password } = body;
    const res = await api.post("/users", { nombre, apellido, email, password });

    return NextResponse.json(res.data);
  } catch (error: unknown) {
    const err = error as { response?: { data?: { detail?: string }; status?: number } };
    console.error("Error en registro:", err.response?.data || error);
    return NextResponse.json(
      { detail: err.response?.data?.detail || "Error al registrar usuario" },
      { status: err.response?.status || 500 }
    );
  }
}
