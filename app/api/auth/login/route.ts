import { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { signToken } from "@/lib/auth/jwt";
import { getCorsHeaders } from "@/lib/cors";
import { jsonResponse, errorResponse } from "@/lib/api-response";

interface UsuarioRow {
  id: string;
  gimnasio_id: number | null;
  sucursal_id: number | null;
  correo: string;
  nombre_completo: string;
  telefono: string | null;
  activo: boolean;
  password_hash: string;
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
    const contraseña = typeof body.contraseña === "string" ? body.contraseña : "";
    const rol = typeof body.rol === "string" ? body.rol.trim().toLowerCase() : "";

    if (!correo || !contraseña || !rol) {
      return errorResponse(
        "Faltan correo, contraseña o rol",
        400,
        origin
      );
    }

    const validRoles = ["admin_ti", "gerencia", "recepcion", "entrenador", "socio"];
    if (!validRoles.includes(rol)) {
      return errorResponse("Rol no válido", 400, origin);
    }

    const { rows: usuarios } = await query<UsuarioRow>(
      `SELECT id, gimnasio_id, sucursal_id, correo, nombre_completo, telefono, activo, password_hash
       FROM usuarios WHERE correo = $1 LIMIT 1`,
      [correo]
    );

    const usuario = usuarios[0];
    if (!usuario) {
      return errorResponse("Credenciales inválidas", 401, origin);
    }
    if (!usuario.activo) {
      return errorResponse("Usuario inactivo", 403, origin);
    }

    const ok = await verifyPassword(contraseña, usuario.password_hash);
    if (!ok) {
      return errorResponse("Credenciales inválidas", 401, origin);
    }

    const { rows: rolesRows } = await query<{ rol_id: number }>(
      `SELECT ur.rol_id FROM usuarios_roles ur
       JOIN roles r ON r.id = ur.rol_id
       WHERE ur.usuario_id = $1 AND r.nombre = $2`,
      [usuario.id, rol]
    );

    if (rolesRows.length === 0) {
      return errorResponse("El usuario no tiene asignado el rol indicado", 403, origin);
    }

    const token = await signToken({
      sub: usuario.id,
      rol,
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
          rol,
        },
      },
      200,
      origin
    );
  } catch (e) {
    console.error("Login error:", e);
    return errorResponse("Error interno", 500, origin);
  }
}
