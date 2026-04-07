import { NextRequest, NextResponse } from "next/server";
import { REGISTER_GATE_COOKIE, createRegisterGateToken } from "@/lib/registerGateToken";
import { getServerSharedSecret } from "@/lib/serverSharedSecret";

export async function POST(req: NextRequest) {
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

  let body: { secret_value?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ detail: "No se pudieron leer los datos enviados." }, { status: 400 });
  }

  const secret =
    typeof body.secret_value === "string" ? body.secret_value.trim() : "";
  if (!secret || secret !== expected) {
    return NextResponse.json({ detail: "Código de acceso inválido" }, { status: 401 });
  }

  const token = createRegisterGateToken(expected);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(REGISTER_GATE_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60,
  });
  return res;
}

/** Cierra el acceso al registro (volver al login). */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(REGISTER_GATE_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
