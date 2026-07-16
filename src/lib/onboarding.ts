import type { Objetivo, PerfilEstudo, SimuladoConfig } from "@/types";
import { MATERIAS } from "@/data/catalog";
import { read, remove, write } from "@/lib/kv";

const K_PERFIL = "gabarito.perfil.v1";

/** Chaves que o boot precisa hidratar (ver src/lib/kv.ts). */
export const CHAVES_ONBOARDING = [K_PERFIL];

const DIA = 86_400_000;

// ── Persistência ──────────────────────────────────────────────

export function getPerfil(): PerfilEstudo | null {
  return read<PerfilEstudo | null>(K_PERFIL, null);
}

export function setPerfil(p: PerfilEstudo): void {
  write(K_PERFIL, p);
}

export function limparPerfil(): void {
  remove(K_PERFIL);
}

// ── Prazo da prova ────────────────────────────────────────────

/**
 * Faixas de prazo em vez de date picker.
 *
 * Quem está montando o perfil raramente tem a data exata (o edital nem sempre
 * saiu), e um seletor de data no 4º passo do onboarding é a maior fonte de
 * abandono do fluxo. A faixa responde em um toque e é o bastante pro que a
 * gente faz com ela: dimensionar o plano e dar urgência honesta.
 */
export const PRAZOS = [
  { id: "1m", label: "Menos de 1 mês", dias: 25, nota: "reta final" },
  { id: "3m", label: "1 a 3 meses", dias: 60, nota: "dá tempo, mas é agora" },
  { id: "6m", label: "3 a 6 meses", dias: 135, nota: "janela boa" },
  { id: "12m", label: "Mais de 6 meses", dias: 270, nota: "construção" },
  { id: "?", label: "Ainda não sei", dias: 0, nota: "estudo contínuo" },
] as const;

export type PrazoId = (typeof PRAZOS)[number]["id"];

export function prazoParaData(id: PrazoId): number | undefined {
  const p = PRAZOS.find((x) => x.id === id);
  if (!p || p.dias === 0) return undefined;
  return Date.now() + p.dias * DIA;
}

/** Dias que faltam pra prova. `null` quando a pessoa não informou. */
export function diasAteProva(perfil: PerfilEstudo | null): number | null {
  if (!perfil?.provaEm) return null;
  return Math.max(0, Math.ceil((perfil.provaEm - Date.now()) / DIA));
}

// ── Metas ─────────────────────────────────────────────────────

export const METAS = [
  { valor: 5, label: "5 questões", nota: "10 min por dia" },
  { valor: 10, label: "10 questões", nota: "20 min por dia" },
  { valor: 20, label: "20 questões", nota: "40 min por dia" },
  { valor: 40, label: "40 questões", nota: "modo concurseiro" },
] as const;

/**
 * Quantas questões a pessoa vai ter feito até a prova, no ritmo que ela mesma
 * escolheu. Número real, não motivacional: dias × meta.
 */
export function questoesAteProva(perfil: PerfilEstudo | null): number | null {
  const dias = diasAteProva(perfil);
  if (dias == null || !perfil) return null;
  return dias * perfil.metaDiaria;
}

// ── Perfil → resto do app ─────────────────────────────────────

/** Matérias que fazem sentido oferecer pra cada objetivo. */
export function materiasDoObjetivo(objetivo: Objetivo) {
  return MATERIAS.filter((m) => {
    if (objetivo === "enem") return m.grupo === "ENEM" || m.grupo === "Básicas";
    if (objetivo === "concurso") return m.grupo !== "ENEM";
    return true;
  });
}

/** Banca padrão sugerida pelo objetivo. */
export function bancaDoObjetivo(objetivo: Objetivo): string {
  return objetivo === "enem" ? "enem" : "fgv";
}

/**
 * Config de simulado a partir do perfil — é o que faz o onboarding valer
 * alguma coisa depois do onboarding: a tela Montar já nasce preenchida e o
 * "treino do dia" da home sai daqui.
 */
export function configDoPerfil(
  perfil: PerfilEstudo,
  quantidade: number,
): SimuladoConfig {
  const enem = perfil.banca === "enem";
  return {
    materias: perfil.materias.length ? perfil.materias : ["Língua Portuguesa"],
    banca: perfil.banca,
    tipo: enem ? "multipla" : perfil.banca === "cebraspe" ? "certo_errado" : "multipla",
    dificuldade: "misto",
    quantidade,
    comTempo: false,
  };
}
