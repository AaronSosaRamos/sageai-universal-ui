import { NextRequest, NextResponse } from "next/server";
import api from "@/lib/axios";

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("Token");
    if (!token) {
      return NextResponse.json({ detail: "Token requerido" }, { status: 401 });
    }

    const res = await api.get("/admin/users/import-template", {
      headers: { Token: token },
      responseType: "arraybuffer",
    });

    return new NextResponse(res.data, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="plantilla_usuarios.xlsx"',
      },
    });
  } catch (e: unknown) {
    const err = e as { response?: { data?: { detail?: string }; status?: number } };
    return NextResponse.json(
      { detail: err.response?.data?.detail || "Error al descargar la plantilla" },
      { status: err.response?.status || 500 }
    );
  }
}
