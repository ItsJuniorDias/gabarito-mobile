import type { Estatisticas, ErroSalvo, SimuladoConfig } from "@/types";
import { pct } from "@/lib/utils";

export interface PontoFraco {
  materia: string;
  acertos: number;
  total: number;
  pct: number;
}

/** Matérias com pior aproveitamento (com amostra mínima), da pior pra melhor. */
export function pontosFracos(
  stats: Estatisticas,
  k = 3,
  minTotal = 3,
): PontoFraco[] {
  return Object.entries(stats.porMateria)
    .filter(([, [, tot]]) => tot >= minTotal)
    .map(([materia, [ac, tot]]) => ({
      materia,
      acertos: ac,
      total: tot,
      pct: pct(ac, tot),
    }))
    .sort((a, b) => a.pct - b.pct)
    .slice(0, k);
}

/** Há dados suficientes pra uma revisão inteligente fazer sentido? */
export function temSinalDeFraqueza(stats: Estatisticas, erros: ErroSalvo[]): boolean {
  return pontosFracos(stats).length > 0 || erros.length > 0;
}

function bancaMaisComum(erros: ErroSalvo[]): string | null {
  if (erros.length === 0) return null;
  const cont: Record<string, number> = {};
  for (const e of erros) cont[e.questao.banca] = (cont[e.questao.banca] ?? 0) + 1;
  return Object.entries(cont).sort((a, b) => b[1] - a[1])[0][0];
}

/** Monta a config de um simulado focado nos pontos fracos do usuário. */
export function montarConfigRevisao(
  stats: Estatisticas,
  erros: ErroSalvo[],
  quantidade = 12,
): SimuladoConfig {
  const fracas = pontosFracos(stats, 3).map((f) => f.materia);
  const deErros = Array.from(new Set(erros.map((e) => e.questao.materia)));
  const materias = (fracas.length ? fracas : deErros).slice(0, 4);

  // assuntos recentes das matérias-alvo viram dica de foco
  const assuntos = Array.from(
    new Set(
      erros
        .filter((e) => materias.includes(e.questao.materia))
        .map((e) => e.questao.assunto)
        .filter(Boolean),
    ),
  ).slice(0, 3);

  const banca = bancaMaisComum(erros) ?? "fgv";

  return {
    materias: materias.length ? materias : ["Língua Portuguesa"],
    banca,
    tipo: "multipla",
    dificuldade: "misto",
    quantidade,
    topico: assuntos.length ? assuntos.join(", ") : undefined,
    comTempo: false,
  };
}
