export type Tenant = "gymflow" | "primefitness";

const GYMFLOW_ORIGIN =
  process.env.FRONTEND_URL_GYMFLOW ??
  process.env.FRONTEND_URL ??
  "http://localhost:3000";

const PRIMEFITNESS_ORIGIN = process.env.FRONTEND_URL_PRIMEFITNESS;

export function getTenantFromOrigin(origin: string | null): Tenant {
  if (!origin) {
    // Por defecto, tratamos orígenes desconocidos como GymFlow para evitar romper llamadas internas.
    return "gymflow";
  }

  if (origin === "http://localhost:3000") {
    return "gymflow";
  }

  if (origin === GYMFLOW_ORIGIN) {
    return "gymflow";
  }

  if (origin === PRIMEFITNESS_ORIGIN) {
    return "primefitness";
  }

  // Cualquier otro origen no está permitido.
  throw new Error("Origen no permitido");
}

