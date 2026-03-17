export type Tenant = "gymflow" | "primefitness";

const GYMFLOW_ORIGIN =
  process.env.FRONTEND_URL_GYMFLOW ??
  process.env.FRONTEND_URL ??
  "http://localhost:3000";

const PRIMEFITNESS_ORIGIN = process.env.FRONTEND_URL_PRIMEFITNESS;

function normalize(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

const normalizedGymflow = normalize(GYMFLOW_ORIGIN);
const normalizedPrime =
  PRIMEFITNESS_ORIGIN != null ? normalize(PRIMEFITNESS_ORIGIN) : null;
const normalizedLocalhost = normalize("http://localhost:3000");

export function getTenantFromOrigin(origin: string | null): Tenant {
  if (!origin) {
    return "primefitness";
  }

  const normalizedOrigin = normalize(origin);

  if (normalizedOrigin === normalizedLocalhost) {
    return "primefitness";
  }

  if (normalizedOrigin === normalizedGymflow) {
    return "gymflow";
  }

  if (normalizedPrime && normalizedOrigin === normalizedPrime) {
    return "primefitness";
  }

  throw new Error("Origen no permitido");
}


