import { NextRequest } from "next/server";
import { queryForAdmin } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { signToken } from "@/lib/auth/jwt";
import { getCorsHeaders } from "@/lib/cors";
import { errorResponse, jsonResponse } from "@/lib/api-response";

interface AdminUsuarioRow {
  id: string;
  gimnasio_id: number | null;
  sucursal_id: number | null;
  correo: string;
  nombre_completo: string;
  telefono: string | null;
  activo: boolean;
  password_hash: string;
  es_admin_fortis: boolean;
  nivel: "owner" | "admin" | "soporte" | "ventas";
  admin_activo: boolean;
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(null),
  });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("Origin");

  try {
    const body = await request.json();
    const correo = typeof body.correo === "string" ? body.correo.trim() : "";
    const contraseña =
      typeof body.contraseña === "string" ? body.contraseña : "";

    if (!correo || !contraseña) {
      return errorResponse("Faltan correo o contraseña", 400, origin);
    }

    const { rows } = await queryForAdmin<AdminUsuarioRow>(
      `SELECT
         u.id,
         u.gimnasio_id,
         u.sucursal_id,
         u.correo,
         u.nombre_completo,
         u.telefono,
         u.activo,
         u.password_hash,
         u.es_admin_fortis,
         a.nivel,
         a.activo AS admin_activo
       FROM public.usuarios u
       JOIN public.admin_fortis_usuarios a
         ON a.usuario_id = u.id
       WHERE u.correo = $1
       LIMIT 1`,
      [correo]
    );

    const usuario = rows[0];
    if (!usuario) {
      return errorResponse("Credenciales inválidas", 401, origin);
    }
    if (!usuario.activo) {
      return errorResponse("Usuario inactivo", 403, origin);
    }
    if (!usuario.es_admin_fortis || !usuario.admin_activo) {
      return errorResponse("Usuario no autorizado", 403, origin);
    }

    const ok = await verifyPassword(contraseña, usuario.password_hash);
    if (!ok) {
      return errorResponse("Credenciales inválidas", 401, origin);
    }

    const token = await signToken({
      sub: usuario.id,
      rol: "admin_fortis",
      gimnasio_id: usuario.gimnasio_id,
      sucursal_id: usuario.sucursal_id,
    });

    return jsonResponse(
      {
        token,
        usuario: {
          id: usuario.id,
          correo: usuario.correo,
          nombre_completo: usuario.nombre_completo,
          telefono: usuario.telefono,
          gimnasio_id: usuario.gimnasio_id,
          sucursal_id: usuario.sucursal_id,
          rol: "admin_fortis",
          nivel_admin: usuario.nivel,
        },
      },
      200,
      origin
    );
  } catch (e) {
    console.error("Admin login error:", e);
    return errorResponse("Error interno", 500, origin);
  }
}
