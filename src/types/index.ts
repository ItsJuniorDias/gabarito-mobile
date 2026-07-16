// ── Domínio: questões, simulados, tentativas ──────────────────

export type QuestaoTipo = "multipla" | "certo_errado";
export type Dificuldade = "facil" | "medio" | "dificil" | "misto";

/** Uma alternativa de questão de múltipla escolha. */
export interface Alternativa {
  /** Letra exibida no cartão-resposta. */
  letra: string; // "A" | "B" | "C" | "D" | "E"
  texto: string;
}

export interface Questao {
  id: string;
  tipo: QuestaoTipo;
  materia: string;
  assunto: string;
  banca: string;
  dificuldade: Exclude<Dificuldade, "misto">;
  /** Texto de apoio / contexto (opcional, comum no ENEM). */
  contexto?: string;
  enunciado: string;
  /** Presente quando tipo === "multipla". */
  alternativas?: Alternativa[];
  /** Índice (0-based) da correta em `alternativas`, ou boolean p/ certo_errado. */
  correta: number | boolean;
  explicacao: string;
}

export interface SimuladoConfig {
  materias: string[];
  banca: string;
  dificuldade: Dificuldade;
  tipo: QuestaoTipo;
  quantidade: number;
  /** Foco livre digitado pelo usuário (ex.: "controle de constitucionalidade"). */
  topico?: string;
  comTempo: boolean;
  /** Minutos totais quando comTempo. */
  minutos?: number;
}

/** Resposta do usuário a uma questão. index p/ múltipla, boolean p/ C/E. */
export type Resposta = number | boolean | null;

export interface Simulado {
  id: string;
  criadoEm: number;
  config: SimuladoConfig;
  questoes: Questao[];
}

export interface Resultado {
  simuladoId: string;
  respostas: Resposta[];
  acertos: number;
  total: number;
  /** Segundos gastos, quando cronometrado. */
  duracaoSeg?: number;
  finalizadoEm: number;
}

// ── Persistência ──────────────────────────────────────────────

export interface ErroSalvo {
  questao: Questao;
  respostaDada: Resposta;
  salvoEm: number;
  /** Revisões corretas consecutivas (SRS-lite). */
  revisadoOk: number;
  /** Caixa de Leitner (1..5): quanto maior, mais espaçada a revisão. */
  box?: number;
  /** Timestamp da próxima revisão sugerida. */
  revisarEm?: number;
}

export interface Estatisticas {
  simuladosFeitos: number;
  questoesRespondidas: number;
  acertosTotais: number;
  /** Por matéria: [acertos, total]. */
  porMateria: Record<string, [number, number]>;
  ultimoEm?: number;
}

export interface Configuracoes {
  modelo: string;
  temperatura: number;
}

// ── OpenRouter ────────────────────────────────────────────────

export interface GenResult {
  questoes: Questao[];
}

export class GenError extends Error {
  constructor(
    message: string,
    public readonly kind:
      | "auth"
      | "rate"
      | "network"
      | "parse"
      | "empty"
      | "config"
      | "unknown" = "unknown",
  ) {
    super(message);
    this.name = "GenError";
  }
}

// ── Assinatura (Premium via RevenueCat) ───────────────────────

export type PlanoId = "mensal" | "anual";

/** Metadados de exibição do plano. O PREÇO não mora aqui — vem da loja. */
export interface Plano {
  id: PlanoId;
  nome: string;
  /** Identificador do package no RevenueCat (ex.: "$rc_monthly"). */
  packageId: string;
  periodoLabel: string; // ex.: "/mês"
  /** Preço mostrado enquanto a loja não responde (ou se falhar). Só BRL. */
  precoFallback: number;
  destaque?: boolean;
}

/**
 * Plano já casado com o que a App Store / Play devolveu.
 *
 * Tudo aqui é serializável de propósito: o `PurchasesPackage` fica preso
 * dentro de `src/lib/billing.ts` e a UI nunca importa o SDK.
 */
export interface PlanoOferta extends Plano {
  /** Preço numérico na moeda do usuário (para calcular economia). */
  preco: number;
  /** Já formatado PELA LOJA, na moeda e no locale certos. Use este. */
  precoLabel: string;
  /** "R$ 16,58" — mensal equivalente do anual, formatado pela loja. */
  precoMensalLabel?: string;
  moeda: string;
  /** Dias de teste grátis do introOffer. 0 = sem trial. */
  trialDias: number;
  /** Economia do anual vs. 12× o mensal, em % (ambos da loja). */
  economiaPct?: number;
  /** Preço de exibição veio da loja, ou é o fallback estático? */
  daLoja: boolean;
}

export type AssinaturaStatus =
  | "ativa"
  | "expirada" // já assinou um dia, hoje não
  | "nunca";

export interface Assinatura {
  premium: boolean;
  status: AssinaturaStatus;
  plano?: PlanoId;
  /** "APP_STORE" | "PLAY_STORE" | "PROMOTIONAL" | … */
  loja?: string;
  desde?: number;
  expiraEm?: number;
  /** false = cancelada mas ainda no período pago. */
  renova?: boolean;
  emTrial?: boolean;
  /** Deep link da loja para gerenciar/cancelar. */
  gerenciarUrl?: string;
  /** Premium forçado no aparelho (só dev — ver Ajustes). */
  simulado?: boolean;
}

// ── Perfil de estudo (onboarding) ─────────────────────────────

export type Objetivo = "concurso" | "enem" | "ambos";

export interface PerfilEstudo {
  objetivo: Objetivo;
  /** id da banca-alvo (ver src/data/catalog.ts). */
  banca: string;
  materias: string[];
  /** Questões por dia que a pessoa se comprometeu a fazer. */
  metaDiaria: number;
  /** Timestamp aproximado da prova. Ausente = "ainda não sei". */
  provaEm?: number;
  nome?: string;
  concluidoEm: number;
}

/** Ofensiva + meta do dia. */
export interface Diario {
  /** Chave YYYY-MM-DD do dia corrente. */
  dia: string;
  /** Questões respondidas hoje. */
  questoes: number;
  /** Dias seguidos com pelo menos uma questão. */
  streak: number;
  /** Último dia com atividade (YYYY-MM-DD). */
  ultimoDia?: string;
}
