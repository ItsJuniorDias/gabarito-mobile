import { read, write } from "@/lib/kv";

const API_BASE = process.env.EXPO_PUBLIC_API_BASE?.replace(/\/$/, "");
const K_ID = "gabarito.identidade.v1";

/** Chave que o boot precisa hidratar (ver src/lib/kv.ts). */
export const CHAVES_IDENTIDADE = [K_ID];

export interface Identidade {
  nome?: string;
  email: string;
  criadoEm: number;
}

export function getIdentidade(): Identidade | null {
  return read<Identidade | null>(K_ID, null);
}

export function setIdentidade(id: Identidade): void {
  write(K_ID, id);
}

/** Registra o lead no backend (lista de remarketing). Best-effort. */
export async function registrarLead(email: string, nome?: string): Promise<void> {
  if (!API_BASE) return; // sem backend, guardamos só localmente
  try {
    await fetch(`${API_BASE}/api/lead`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, nome, origem: "app" }),
    });
  } catch {
    /* silencioso — não bloqueia o usuário */
  }
}
