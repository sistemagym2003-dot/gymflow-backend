import { SignJWT, jwtVerify } from "jose";

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET debe estar definida y tener al menos 32 caracteres");
  }
  return new TextEncoder().encode(secret);
}

export interface JwtPayload {
  sub: string;       // usuario id (uuid)
  rol: string;       // nombre del rol con el que hizo login
  gimnasio_id: number | null;
  sucursal_id: number | null;
  iat?: number;
  exp?: number;
}

const DEFAULT_EXP = "7d";

export async function signToken(payload: Omit<JwtPayload, "iat" | "exp">): Promise<string> {
  return new SignJWT({
    sub: payload.sub,
    rol: payload.rol,
    gimnasio_id: payload.gimnasio_id ?? null,
    sucursal_id: payload.sucursal_id ?? null,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(DEFAULT_EXP)
    .sign(getSecretKey());
}

export async function verifyToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, getSecretKey());
  const sub = payload.sub;
  const rol = payload.rol;
  if (!sub || typeof sub !== "string" || !rol || typeof rol !== "string") {
    throw new Error("Token inválido");
  }
  return {
    sub,
    rol,
    gimnasio_id: (payload.gimnasio_id as number) ?? null,
    sucursal_id: (payload.sucursal_id as number) ?? null,
    iat: payload.iat as number,
    exp: payload.exp as number,
  };
}
