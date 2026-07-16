import type {
  Configuracoes,
  Diario,
  ErroSalvo,
  Estatisticas,
  Questao,
  Resposta,
  Resultado,
} from "@/types";
import { MODELO_PADRAO } from "@/data/catalog";
import { read, write } from "@/lib/kv";

const K = {
  stats: "gabarito.stats.v1",
  erros: "gabarito.erros.v1",
  config: "gabarito.config.v2", // v2: descarta modelo salvo antigo (slug obsoleto)
  geracoes: "gabarito.geracoes.v1", // cota semanal de geração por IA (free)
  diario: "gabarito.diario.v1", // meta do dia + ofensiva
} as const;

/** Todas as chaves que o boot precisa hidratar (ver src/lib/kv.ts). */
export const CHAVES_STORAGE = Object.values(K);

/** Intervalos (dias) por caixa de Leitner. box 1 = revisar hoje. */
const INTERVALOS_DIAS = [0, 1, 3, 7, 16] as const;
const DIA = 86_400_000;

function proximaRevisao(box: number): number {
  const i = Math.min(Math.max(box, 1), INTERVALOS_DIAS.length) - 1;
  return Date.now() + INTERVALOS_DIAS[i] * DIA;
}

/** Chave ISO da semana (ex.: "2026-W28"). */
function semanaKey(d = new Date()): string {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dia = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - dia);
  const inicioAno = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const semana = Math.ceil(((t.getTime() - inicioAno.getTime()) / DIA + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(semana).padStart(2, "0")}`;
}

/** Chave do dia LOCAL (ex.: "2026-07-16"). Local de propósito: a ofensiva
 *  precisa virar à meia-noite de quem estuda, não à do UTC. */
function diaKey(d = new Date()): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

// ── Configurações ─────────────────────────────────────────────

const configPadrao: Configuracoes = { modelo: MODELO_PADRAO, temperatura: 0.7 };

export function getConfig(): Configuracoes {
  return { ...configPadrao, ...read(K.config, {}) };
}
export function setConfig(c: Configuracoes): void {
  write(K.config, c);
}

// ── Estatísticas ──────────────────────────────────────────────

const statsPadrao: Estatisticas = {
  simuladosFeitos: 0,
  questoesRespondidas: 0,
  acertosTotais: 0,
  porMateria: {},
};

export function getStats(): Estatisticas {
  return read(K.stats, statsPadrao);
}

export function registrarResultado(
  questoes: Questao[],
  respostas: Resposta[],
  resultado: Resultado,
): Estatisticas {
  const s = getStats();
  s.simuladosFeitos += 1;
  s.questoesRespondidas += resultado.total;
  s.acertosTotais += resultado.acertos;
  s.ultimoEm = resultado.finalizadoEm;

  questoes.forEach((q, i) => {
    const acertou = respostas[i] != null && respostas[i] === q.correta;
    const cur = s.porMateria[q.materia] ?? [0, 0];
    s.porMateria[q.materia] = [cur[0] + (acertou ? 1 : 0), cur[1] + 1];
  });

  write(K.stats, s);
  return s;
}

// ── Caderno de erros ──────────────────────────────────────────

export function getErros(): ErroSalvo[] {
  return read<ErroSalvo[]>(K.erros, []);
}

export function salvarErro(questao: Questao, respostaDada: Resposta): void {
  const erros = getErros();
  if (erros.some((e) => e.questao.id === questao.id)) return;
  erros.unshift({
    questao,
    respostaDada,
    salvoEm: Date.now(),
    revisadoOk: 0,
    box: 1,
    revisarEm: proximaRevisao(1), // disponível pra revisar hoje
  });
  write(K.erros, erros);
}

export function removerErro(id: string): ErroSalvo[] {
  const erros = getErros().filter((e) => e.questao.id !== id);
  write(K.erros, erros);
  return erros;
}

export function marcarRevisao(id: string, acertou: boolean): ErroSalvo[] {
  let erros = getErros();
  const alvo = erros.find((e) => e.questao.id === id);
  if (!alvo) return erros;
  if (acertou) {
    alvo.revisadoOk += 1;
    alvo.box = Math.min((alvo.box ?? 1) + 1, 5);
    alvo.revisarEm = proximaRevisao(alvo.box);
    // SRS-lite: 2 acertos seguidos "aposenta" o erro
    if (alvo.revisadoOk >= 2) erros = erros.filter((e) => e.questao.id !== id);
  } else {
    alvo.revisadoOk = 0;
    alvo.box = 1;
    alvo.revisarEm = proximaRevisao(1);
  }
  write(K.erros, erros);
  return erros;
}

/** Erros cuja revisão já venceu (ou legados sem agenda). Ordenados por urgência. */
export function revisaoDoDia(erros?: ErroSalvo[]): ErroSalvo[] {
  const lista = erros ?? getErros();
  const agora = Date.now();
  return lista
    .filter((e) => (e.revisarEm ?? 0) <= agora)
    .sort((a, b) => (a.revisarEm ?? 0) - (b.revisarEm ?? 0));
}

// ── Cota de geração por IA (free) ─────────────────────────────

interface CotaGeracao {
  semana: string;
  usadas: number;
}

export function getGeracoesUsadas(): number {
  const r = read<CotaGeracao>(K.geracoes, { semana: "", usadas: 0 });
  return r.semana === semanaKey() ? r.usadas : 0;
}

export function registrarGeracao(): number {
  const semana = semanaKey();
  const r = read<CotaGeracao>(K.geracoes, { semana: "", usadas: 0 });
  const usadas = (r.semana === semana ? r.usadas : 0) + 1;
  write(K.geracoes, { semana, usadas });
  return usadas;
}

// ── Diário: meta do dia + ofensiva ────────────────────────────

const diarioVazio: Diario = { dia: diaKey(), questoes: 0, streak: 0 };

/** Sempre normalizado pro dia de hoje — nunca devolve contagem de ontem. */
export function getDiario(): Diario {
  const d = read<Diario>(K.diario, diarioVazio);
  const hoje = diaKey();
  if (d.dia === hoje) return d;
  // Virou o dia: zera a contagem, mas preserva a ofensiva (quem decide se ela
  // caiu é o registrarQuestoes, quando a pessoa voltar a estudar).
  return { dia: hoje, questoes: 0, streak: d.streak, ultimoDia: d.ultimoDia };
}

/** A ofensiva morreu? (nem hoje nem ontem tiveram atividade) */
export function streakVivo(d: Diario): boolean {
  if (!d.ultimoDia || d.streak === 0) return false;
  const ontem = diaKey(new Date(Date.now() - DIA));
  return d.ultimoDia === d.dia || d.ultimoDia === ontem;
}

/**
 * Soma questões ao dia e reconta a ofensiva.
 *
 * Regra: o dia entra na ofensiva quando a pessoa responde QUALQUER questão —
 * não quando bate a meta. Ofensiva que exige meta cheia é ofensiva que a
 * pessoa perde numa terça corrida e nunca mais volta.
 */
export function registrarQuestoes(n: number): Diario {
  if (n <= 0) return getDiario();
  const hoje = diaKey();
  const ontem = diaKey(new Date(Date.now() - DIA));
  const atual = read<Diario>(K.diario, diarioVazio);

  const mesmoDia = atual.ultimoDia === hoje;
  const streak = mesmoDia
    ? Math.max(1, atual.streak)
    : atual.ultimoDia === ontem
      ? atual.streak + 1
      : 1;

  const d: Diario = {
    dia: hoje,
    questoes: (atual.dia === hoje ? atual.questoes : 0) + n,
    streak,
    ultimoDia: hoje,
  };
  write(K.diario, d);
  return d;
}
