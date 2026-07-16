import type { Plano } from "@/types";

const num = (v: string | undefined, fb: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fb;
};

/**
 * ATENÇÃO: estes preços são só FALLBACK de exibição.
 *
 * Quem manda no preço é a App Store / Play Store — `PlanoOferta.precoLabel`
 * chega formatado na moeda da conta do usuário. Isto aqui só aparece se a
 * loja não responder (offline, sandbox mal configurado, Expo Go). Nunca cobre
 * nada com base neste número.
 */
const FALLBACK_MENSAL = num(process.env.EXPO_PUBLIC_PRECO_MENSAL, 19.9);
const FALLBACK_ANUAL = num(process.env.EXPO_PUBLIC_PRECO_ANUAL, 199);

/**
 * `packageId` é o identificador do package dentro do offering no dashboard do
 * RevenueCat. `$rc_monthly` e `$rc_annual` são os identificadores padrão — se
 * você criou packages com nome próprio, troque aqui (o billing ainda cai no
 * `offering.monthly` / `offering.annual` como rede de segurança).
 */
export const PLANOS: Plano[] = [
  {
    id: "mensal",
    nome: "Mensal",
    packageId: "$rc_monthly",
    periodoLabel: "/mês",
    precoFallback: FALLBACK_MENSAL,
  },
  {
    id: "anual",
    nome: "Anual",
    packageId: "$rc_annual",
    periodoLabel: "/ano",
    precoFallback: FALLBACK_ANUAL,
    destaque: true,
  },
];

export function planoById(id: string): Plano | undefined {
  return PLANOS.find((p) => p.id === id);
}

// ── Limites free vs premium ───────────────────────────────────

/** Modelo único liberado no plano gratuito. */
export const MODELO_FREE = "openai/gpt-4o-mini";

export const LIMITE = {
  free: { maxQuestoes: 10, geracoesSemana: 3 },
  premium: { maxQuestoes: 30 },
} as const;

export const BENEFICIOS: string[] = [
  "Simulados com IA ilimitados (grátis: 3 por semana)",
  "Revisão inteligente: questões novas nos seus pontos fracos",
  "Até 30 questões por simulado e todos os modelos de IA",
  "Seu plano de estudo evolui com o caderno de erros",
];
