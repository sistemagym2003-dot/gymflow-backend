import bcrypt from "bcryptjs";

/**
 * Compara la contraseña en texto plano con el hash almacenado.
 * El esquema en Supabase usa pgcrypto crypt(..., gen_salt('bf')) que es compatible con bcrypt.
 */
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
