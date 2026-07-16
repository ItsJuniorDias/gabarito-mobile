import type { SimuladoConfig } from "@/types";

export interface MateriaDef {
  nome: string;
  grupo: "Básicas" | "Direito" | "ENEM" | "Específicas";
}

export const MATERIAS: MateriaDef[] = [
  // Básicas (comuns a quase todo concurso)
  { nome: "Língua Portuguesa", grupo: "Básicas" },
  { nome: "Raciocínio Lógico", grupo: "Básicas" },
  { nome: "Matemática", grupo: "Básicas" },
  { nome: "Informática", grupo: "Básicas" },
  { nome: "Atualidades", grupo: "Básicas" },
  { nome: "Redação Oficial", grupo: "Básicas" },

  // Direito
  { nome: "Direito Constitucional", grupo: "Direito" },
  { nome: "Direito Administrativo", grupo: "Direito" },
  { nome: "Direito Penal", grupo: "Direito" },
  { nome: "Direito Processual Penal", grupo: "Direito" },
  { nome: "Direito Civil", grupo: "Direito" },
  { nome: "Direito Tributário", grupo: "Direito" },

  // ENEM
  { nome: "Linguagens e Códigos", grupo: "ENEM" },
  { nome: "Matemática e suas Tecnologias", grupo: "ENEM" },
  { nome: "Ciências da Natureza", grupo: "ENEM" },
  { nome: "Ciências Humanas", grupo: "ENEM" },
  { nome: "História", grupo: "ENEM" },
  { nome: "Geografia", grupo: "ENEM" },
  { nome: "Física", grupo: "ENEM" },
  { nome: "Química", grupo: "ENEM" },
  { nome: "Biologia", grupo: "ENEM" },

  // Específicas
  { nome: "Administração Pública", grupo: "Específicas" },
  { nome: "Contabilidade", grupo: "Específicas" },
  { nome: "Legislação Específica", grupo: "Específicas" },
];

export const GRUPOS: MateriaDef["grupo"][] = [
  "Básicas",
  "Direito",
  "ENEM",
  "Específicas",
];

export interface BancaDef {
  id: string;
  nome: string;
  /** Nota curta sobre o estilo — usada no prompt e na UI. */
  estilo: string;
  /** Se a banca usa itens Certo/Errado como formato característico. */
  certoErrado?: boolean;
}

export const BANCAS: BancaDef[] = [
  {
    id: "enem",
    nome: "ENEM / INEP",
    estilo:
      "questões contextualizadas com texto de apoio, interdisciplinares, 5 alternativas (A–E), foco em interpretação e aplicação.",
  },
  {
    id: "cebraspe",
    nome: "Cebraspe (Cespe)",
    estilo:
      "afirmações objetivas para julgar como Certo ou Errado; pegadinhas por generalização, exceção e literalidade da lei.",
    certoErrado: true,
  },
  {
    id: "fgv",
    nome: "FGV",
    estilo:
      "enunciados longos e analíticos, casos concretos, 5 alternativas plausíveis; exige raciocínio, não decoreba.",
  },
  {
    id: "fcc",
    nome: "FCC",
    estilo:
      "questões diretas e legalistas, muito apego à letra da lei e súmulas, 5 alternativas.",
  },
  {
    id: "vunesp",
    nome: "VUNESP",
    estilo:
      "enunciados claros e de dificuldade média, boa cobertura de literalidade e jurisprudência básica, 5 alternativas.",
  },
  {
    id: "ibfc",
    nome: "IBFC",
    estilo: "questões objetivas de dificuldade média, 5 alternativas.",
  },
];

export function bancaById(id: string): BancaDef {
  return BANCAS.find((b) => b.id === id) ?? BANCAS[0];
}

// ── Trilhas rápidas (quick start) ─────────────────────────────

export interface Trilha {
  id: string;
  titulo: string;
  descricao: string;
  config: SimuladoConfig;
}

const base = {
  dificuldade: "misto" as const,
  quantidade: 10,
  comTempo: false,
};

export const TRILHAS: Trilha[] = [
  {
    id: "enem-natureza",
    titulo: "ENEM · Natureza",
    descricao: "Física, Química e Biologia com texto de apoio.",
    config: {
      ...base,
      materias: ["Física", "Química", "Biologia"],
      banca: "enem",
      tipo: "multipla",
    },
  },
  {
    id: "enem-humanas",
    titulo: "ENEM · Humanas",
    descricao: "História e Geografia, interpretação e contexto.",
    config: {
      ...base,
      materias: ["História", "Geografia"],
      banca: "enem",
      tipo: "multipla",
    },
  },
  {
    id: "tribunais-fgv",
    titulo: "Tribunais · FGV",
    descricao: "Constitucional e Administrativo no estilo analítico.",
    config: {
      ...base,
      materias: ["Direito Constitucional", "Direito Administrativo"],
      banca: "fgv",
      tipo: "multipla",
    },
  },
  {
    id: "policia-cebraspe",
    titulo: "Carreiras policiais · Cebraspe",
    descricao: "Itens Certo/Errado de Penal e Processual Penal.",
    config: {
      ...base,
      materias: ["Direito Penal", "Direito Processual Penal"],
      banca: "cebraspe",
      tipo: "certo_errado",
    },
  },
  {
    id: "basicas-fcc",
    titulo: "Básicas · FCC",
    descricao: "Português, Raciocínio Lógico e Informática.",
    config: {
      ...base,
      materias: ["Língua Portuguesa", "Raciocínio Lógico", "Informática"],
      banca: "fcc",
      tipo: "multipla",
    },
  },
];

// ── Modelos sugeridos no OpenRouter ───────────────────────────

export interface ModeloDef {
  id: string;
  nome: string;
  nota: string;
}

export const MODELOS: ModeloDef[] = [
  {
    id: "openai/gpt-4o-mini",
    nome: "GPT-4o mini",
    nota: "Barato, confiável e ótimo em pt-BR/JSON. Padrão.",
  },
  {
    id: "google/gemini-2.5-flash-lite",
    nome: "Gemini 2.5 Flash Lite",
    nota: "O mais rápido e barato do momento.",
  },
  {
    id: "google/gemini-2.5-flash",
    nome: "Gemini 2.5 Flash",
    nota: "Questões mais bem elaboradas; ainda econômico.",
  },
  {
    id: "deepseek/deepseek-chat",
    nome: "DeepSeek Chat",
    nota: "Muito barato; qualidade variável.",
  },
];

export const MODELO_PADRAO =
  process.env.EXPO_PUBLIC_DEFAULT_MODEL || MODELOS[0].id;
