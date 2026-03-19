import { validateRequiredEnv } from "@/lib/env/validation";

export async function register() {
  validateRequiredEnv();
}
