import { Pool } from "pg";
import type { Tenant } from "./tenant";

type DbTenant = Tenant;

let defaultPool: Pool | null = null;
const tenantPools: Partial<Record<DbTenant, Pool>> = {};

function createPool(connectionString: string): Pool {
  return new Pool({
    connectionString,
    ssl: connectionString.includes("supabase")
      ? { rejectUnauthorized: false }
      : undefined,
  });
}

function getDefaultConnectionString(): string {
  const connectionString =
    process.env.DATABASE_URL ?? process.env.DATABASE_URL_GYMFLOW;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL o DATABASE_URL_GYMFLOW deben estar definidas"
    );
  }
  return connectionString;
}

function getTenantConnectionString(tenant: DbTenant): string {
  if (tenant === "gymflow") {
    const cs = process.env.DATABASE_URL_GYMFLOW ?? process.env.DATABASE_URL;
    if (!cs) {
      throw new Error("DATABASE_URL_GYMFLOW o DATABASE_URL deben estar definidas");
    }
    return cs;
  }

  if (tenant === "primefitness") {
    const cs = process.env.DATABASE_URL_PRIMEFITNESS;
    if (!cs) {
      throw new Error("DATABASE_URL_PRIMEFITNESS debe estar definida");
    }
    return cs;
  }

  throw new Error("Tenant de base de datos no soportado");
}

function getPool(): Pool {
  if (!defaultPool) {
    const connectionString = getDefaultConnectionString();
    defaultPool = createPool(connectionString);
  }
  return defaultPool;
}

function getPoolForTenant(tenant: DbTenant): Pool {
  const existing = tenantPools[tenant];
  if (existing) {
    return existing;
  }
  const connectionString = getTenantConnectionString(tenant);
  const pool = createPool(connectionString);
  tenantPools[tenant] = pool;
  return pool;
}

export async function query<T = unknown>(
  text: string,
  params?: unknown[]
): Promise<{ rows: T[]; rowCount: number }> {
  const p = getPool();
  const client = await p.connect();
  try {
    const result = await client.query(text, params);
    return { rows: result.rows as T[], rowCount: result.rowCount ?? 0 };
  } finally {
    client.release();
  }
}

export async function queryForTenant<T = unknown>(
  tenant: DbTenant,
  text: string,
  params?: unknown[]
): Promise<{ rows: T[]; rowCount: number }> {
  const p = getPoolForTenant(tenant);
  const client = await p.connect();
  try {
    const result = await client.query(text, params);
    return { rows: result.rows as T[], rowCount: result.rowCount ?? 0 };
  } finally {
    client.release();
  }
}

