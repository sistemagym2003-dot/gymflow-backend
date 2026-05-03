import { NextRequest } from "next/server";
import { queryForTenant } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { signToken } from "@/lib/auth/jwt";
import { getCorsHeaders } from "@/lib/cors";
import { jsonResponse, errorResponse } from "@/lib/api-response";
import { getTenantFromOrigin, type Tenant } from "@/lib/tenant";

interface UsuarioRow {
  id: string;
  gimnasio_id: number | null;
  sucursal_id: number | null;
  correo: string;
  nombre_completo: string;
  telefono: string | null;
  activo: boolean;
  password_hash: string;
  requiere_cambio_password: boolean;
}

const VALID_ROLES_GYMFLOW = [
  "admin_ti",
  "gerencia",
  "recepcion",
  "entrenador",
  "socio",
] as const;

const VALID_ROLES_PRIMEFITNESS = ["recepcion", "socio", "entrenador"] as const;

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(null),
  });
}

async function resolveRolForPrimefitness(
  tenant: Tenant,
  usuarioId: string,
  rolFromBody: string
): Promise<{ ok: true; rol: string } | { ok: false; status: number; message: string }> {
  if (rolFromBody) {
    if (!VALID_ROLES_PRIMEFITNESS.includes(rolFromBody as (typeof VALID_ROLES_PRIMEFITNESS)[number])) {
      return { ok: false, status: 400, message: "Rol no válido" };
    }
    const { rows: rolesRows } = await queryForTenant<{ rol_id: number }>(
      tenant,
      `SELECT ur.rol_id FROM usuarios_roles ur
       JOIN roles r ON r.id = ur.rol_id
       WHERE ur.usuario_id = $1 AND r.nombre = $2`,
      [usuarioId, rolFromBody]
    );
    if (rolesRows.length === 0) {
      return {
        ok: false,
        status: 403,
        message: "El usuario no tiene asignado el rol indicado",
      };
    }
    return { ok: true, rol: rolFromBody };
  }

  const { rows: roleNames } = await queryForTenant<{ nombre: string }>(
    tenant,
    `SELECT r.nombre FROM usuarios_roles ur
     JOIN roles r ON r.id = ur.rol_id
     WHERE ur.usuario_id = $1`,
    [usuarioId]
  );

  if (roleNames.length === 0) {
    return { ok: false, status: 403, message: "Usuario sin rol asignado" };
  }
  if (roleNames.length > 1) {
    return {
      ok: false,
      status: 403,
      message:
        "La cuenta tiene más de un rol asignado; contacta al administrador.",
    };
  }

  const inferred = roleNames[0].nombre.trim().toLowerCase();
  if (!VALID_ROLES_PRIMEFITNESS.includes(inferred as (typeof VALID_ROLES_PRIMEFITNESS)[number])) {
    return {
      ok: false,
      status: 403,
      message: "Rol no permitido para esta aplicación",
    };
  }
  return { ok: true, rol: inferred };
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("Origin");
  try {
    const tenant = getTenantFromOrigin(origin);
    const body = await request.json();
    const correo = typeof body.correo === "string" ? body.correo.trim() : "";
    const contraseña = typeof body.contraseña === "string" ? body.contraseña : "";
    const rolFromBodyRaw = typeof body.rol === "string" ? body.rol.trim() : "";
    const rolFromBody = rolFromBodyRaw.toLowerCase();

    if (!correo || !contraseña) {
      return errorResponse("Faltan correo o contraseña", 400, origin);
    }

    if (tenant === "gymflow") {
      if (!rolFromBody) {
        return errorResponse(
          "Faltan correo, contraseña o rol",
          400,
          origin
        );
      }
      if (!VALID_ROLES_GYMFLOW.includes(rolFromBody as (typeof VALID_ROLES_GYMFLOW)[number])) {
        return errorResponse("Rol no válido", 400, origin);
      }
    } else if (rolFromBody) {
      if (!VALID_ROLES_PRIMEFITNESS.includes(rolFromBody as (typeof VALID_ROLES_PRIMEFITNESS)[number])) {
        return errorResponse("Rol no válido", 400, origin);
      }
    }

    const { rows: usuarios } = await queryForTenant<UsuarioRow>(
      tenant,
      `SELECT id, gimnasio_id, sucursal_id, correo, nombre_completo, telefono, activo, password_hash,
              COALESCE(requiere_cambio_password, false) AS requiere_cambio_password
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

    let effectiveRol: string;

    if (tenant === "gymflow") {
      const { rows: rolesRows } = await queryForTenant<{ rol_id: number }>(
        tenant,
        `SELECT ur.rol_id FROM usuarios_roles ur
         JOIN roles r ON r.id = ur.rol_id
         WHERE ur.usuario_id = $1 AND r.nombre = $2`,
        [usuario.id, rolFromBody]
      );
      if (rolesRows.length === 0) {
        return errorResponse(
          "El usuario no tiene asignado el rol indicado",
          403,
          origin
        );
      }
      effectiveRol = rolFromBody;
    } else {
      const resolved = await resolveRolForPrimefitness(
        tenant,
        usuario.id,
        rolFromBody
      );
      if (!resolved.ok) {
        return errorResponse(resolved.message, resolved.status, origin);
      }
      effectiveRol = resolved.rol;
    }

    const token = await signToken({
      sub: usuario.id,
      rol: effectiveRol,
      gimnasio_id: usuario.gimnasio_id,
      sucursal_id: usuario.sucursal_id,
      requiere_cambio_password: usuario.requiere_cambio_password,
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
          rol: effectiveRol,
          requiere_cambio_password: usuario.requiere_cambio_password,
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
