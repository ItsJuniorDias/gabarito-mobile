import type { Questao, SimuladoConfig } from "@/types";

export interface SimuladoPronto {
  id: string;
  titulo: string;
  descricao: string;
  config: SimuladoConfig;
  questoes: Questao[];
}

const cfg = (materia: string, n: number): SimuladoConfig => ({
  materias: [materia],
  banca: "fcc",
  tipo: "multipla",
  dificuldade: "misto",
  quantidade: n,
  comTempo: false,
});

// NOTA: banco-semente com gabaritos conferidos, em tópicos objetivos.
// Em produção, expanda com questões de provas reais (a confiança do
// concurseiro no gabarito é o que sustenta a assinatura).

const RLM: Questao[] = [
  {
    id: "pronto-rlm-1",
    tipo: "multipla",
    materia: "Raciocínio Lógico",
    assunto: "Sequências",
    banca: "fcc",
    dificuldade: "facil",
    enunciado: "Na sequência 2, 4, 8, 16, …, qual é o próximo termo?",
    alternativas: [
      { letra: "A", texto: "24" },
      { letra: "B", texto: "30" },
      { letra: "C", texto: "32" },
      { letra: "D", texto: "64" },
    ],
    correta: 2,
    explicacao: "Cada termo é o dobro do anterior; 16 × 2 = 32.",
  },
  {
    id: "pronto-rlm-2",
    tipo: "multipla",
    materia: "Raciocínio Lógico",
    assunto: "Silogismo",
    banca: "fcc",
    dificuldade: "medio",
    enunciado:
      "Se todo A é B e todo B é C, qual conclusão é necessariamente verdadeira?",
    alternativas: [
      { letra: "A", texto: "Todo A é C" },
      { letra: "B", texto: "Todo C é A" },
      { letra: "C", texto: "Nenhum A é C" },
      { letra: "D", texto: "Algum A não é C" },
    ],
    correta: 0,
    explicacao: "Por transitividade: A ⊂ B ⊂ C, logo A ⊂ C — todo A é C.",
  },
  {
    id: "pronto-rlm-3",
    tipo: "multipla",
    materia: "Raciocínio Lógico",
    assunto: "Porcentagem",
    banca: "fcc",
    dificuldade: "facil",
    enunciado: "Quanto é 20% de 150?",
    alternativas: [
      { letra: "A", texto: "15" },
      { letra: "B", texto: "20" },
      { letra: "C", texto: "30" },
      { letra: "D", texto: "45" },
    ],
    correta: 2,
    explicacao: "20% = 0,2; então 0,2 × 150 = 30.",
  },
  {
    id: "pronto-rlm-4",
    tipo: "multipla",
    materia: "Raciocínio Lógico",
    assunto: "Negação de proposições",
    banca: "fcc",
    dificuldade: "medio",
    enunciado: "A negação de 'Todos os alunos passaram' é:",
    alternativas: [
      { letra: "A", texto: "Nenhum aluno passou" },
      { letra: "B", texto: "Todos os alunos não passaram" },
      { letra: "C", texto: "Pelo menos um aluno não passou" },
      { letra: "D", texto: "Alguns alunos passaram" },
    ],
    correta: 2,
    explicacao:
      "A negação de 'todo X é P' é 'existe X que não é P' — pelo menos um aluno não passou.",
  },
  {
    id: "pronto-rlm-5",
    tipo: "multipla",
    materia: "Raciocínio Lógico",
    assunto: "Condicional",
    banca: "fcc",
    dificuldade: "dificil",
    enunciado:
      "A contrapositiva de 'Se chove, então a rua fica molhada' é:",
    alternativas: [
      { letra: "A", texto: "Se a rua fica molhada, então chove" },
      { letra: "B", texto: "Se não chove, então a rua não fica molhada" },
      { letra: "C", texto: "Se a rua não fica molhada, então não chove" },
      { letra: "D", texto: "Se chove, então a rua não fica molhada" },
    ],
    correta: 2,
    explicacao:
      "A contrapositiva de p → q é ¬q → ¬p, logicamente equivalente à original.",
  },
];

const MAT: Questao[] = [
  {
    id: "pronto-mat-1",
    tipo: "multipla",
    materia: "Matemática",
    assunto: "Regra de três inversa",
    banca: "fcc",
    dificuldade: "medio",
    enunciado:
      "Se 3 operários constroem um muro em 12 dias, quantos dias levam 6 operários no mesmo ritmo?",
    alternativas: [
      { letra: "A", texto: "6" },
      { letra: "B", texto: "9" },
      { letra: "C", texto: "18" },
      { letra: "D", texto: "24" },
    ],
    correta: 0,
    explicacao:
      "Grandezas inversamente proporcionais: 3 × 12 = 6 × d ⇒ d = 36 ÷ 6 = 6 dias.",
  },
  {
    id: "pronto-mat-2",
    tipo: "multipla",
    materia: "Matemática",
    assunto: "MMC",
    banca: "fcc",
    dificuldade: "facil",
    enunciado: "O MMC entre 4 e 6 é:",
    alternativas: [
      { letra: "A", texto: "2" },
      { letra: "B", texto: "10" },
      { letra: "C", texto: "12" },
      { letra: "D", texto: "24" },
    ],
    correta: 2,
    explicacao: "12 é o menor número múltiplo de 4 e de 6 ao mesmo tempo.",
  },
  {
    id: "pronto-mat-3",
    tipo: "multipla",
    materia: "Matemática",
    assunto: "Fração e porcentagem",
    banca: "fcc",
    dificuldade: "facil",
    enunciado: "A fração 3/4 corresponde a qual porcentagem?",
    alternativas: [
      { letra: "A", texto: "34%" },
      { letra: "B", texto: "43%" },
      { letra: "C", texto: "60%" },
      { letra: "D", texto: "75%" },
    ],
    correta: 3,
    explicacao: "3 ÷ 4 = 0,75 = 75%.",
  },
  {
    id: "pronto-mat-4",
    tipo: "multipla",
    materia: "Matemática",
    assunto: "Desconto",
    banca: "fcc",
    dificuldade: "medio",
    enunciado:
      "Um produto de R$ 80,00 recebe 25% de desconto. O preço final é:",
    alternativas: [
      { letra: "A", texto: "R$ 55,00" },
      { letra: "B", texto: "R$ 60,00" },
      { letra: "C", texto: "R$ 65,00" },
      { letra: "D", texto: "R$ 75,00" },
    ],
    correta: 1,
    explicacao: "25% de 80 = 20; 80 − 20 = 60.",
  },
  {
    id: "pronto-mat-5",
    tipo: "multipla",
    materia: "Matemática",
    assunto: "Média aritmética",
    banca: "fcc",
    dificuldade: "facil",
    enunciado: "A média aritmética de 4, 6, 8 e 10 é:",
    alternativas: [
      { letra: "A", texto: "6" },
      { letra: "B", texto: "7" },
      { letra: "C", texto: "8" },
      { letra: "D", texto: "9" },
    ],
    correta: 1,
    explicacao: "(4 + 6 + 8 + 10) ÷ 4 = 28 ÷ 4 = 7.",
  },
];

const PORT: Questao[] = [
  {
    id: "pronto-port-1",
    tipo: "multipla",
    materia: "Língua Portuguesa",
    assunto: "Crase",
    banca: "fcc",
    dificuldade: "medio",
    enunciado:
      "Assinale a opção que completa corretamente: 'Entreguei o documento ___ secretária.'",
    alternativas: [
      { letra: "A", texto: "a" },
      { letra: "B", texto: "à" },
      { letra: "C", texto: "há" },
      { letra: "D", texto: "as" },
    ],
    correta: 1,
    explicacao:
      "'Entregar' pede a preposição 'a' e 'secretária' admite o artigo 'a': a + a = à (crase).",
  },
  {
    id: "pronto-port-2",
    tipo: "multipla",
    materia: "Língua Portuguesa",
    assunto: "Concordância verbal",
    banca: "fcc",
    dificuldade: "dificil",
    enunciado: "Assinale a frase correta:",
    alternativas: [
      { letra: "A", texto: "Fazem dois anos que ele partiu" },
      { letra: "B", texto: "Faz dois anos que ele partiu" },
      { letra: "C", texto: "Houveram muitos problemas na prova" },
      { letra: "D", texto: "Fazem meses que não o vejo" },
    ],
    correta: 1,
    explicacao:
      "'Fazer' e 'haver' indicando tempo decorrido são impessoais: ficam no singular — 'Faz dois anos'.",
  },
  {
    id: "pronto-port-3",
    tipo: "multipla",
    materia: "Língua Portuguesa",
    assunto: "Plural",
    banca: "fcc",
    dificuldade: "facil",
    enunciado: "O plural de 'cidadão' é:",
    alternativas: [
      { letra: "A", texto: "cidadães" },
      { letra: "B", texto: "cidadãos" },
      { letra: "C", texto: "cidadões" },
      { letra: "D", texto: "cidadans" },
    ],
    correta: 1,
    explicacao: "'Cidadão' faz o plural em 'cidadãos'.",
  },
  {
    id: "pronto-port-4",
    tipo: "multipla",
    materia: "Língua Portuguesa",
    assunto: "Mal x mau",
    banca: "fcc",
    dificuldade: "medio",
    enunciado: "Complete: 'Ele se saiu muito ___ na prova.'",
    alternativas: [
      { letra: "A", texto: "mal" },
      { letra: "B", texto: "mau" },
      { letra: "C", texto: "maus" },
      { letra: "D", texto: "máu" },
    ],
    correta: 0,
    explicacao:
      "'Mal' é advérbio (oposto de 'bem'); 'mau' é adjetivo (oposto de 'bom'). Aqui cabe 'mal'.",
  },
  {
    id: "pronto-port-5",
    tipo: "multipla",
    materia: "Língua Portuguesa",
    assunto: "Por que / porque",
    banca: "fcc",
    dificuldade: "medio",
    enunciado: "Complete: 'Não sei ___ ele saiu tão cedo.'",
    alternativas: [
      { letra: "A", texto: "porque" },
      { letra: "B", texto: "por que" },
      { letra: "C", texto: "porquê" },
      { letra: "D", texto: "por quê" },
    ],
    correta: 1,
    explicacao:
      "Em pergunta (direta ou indireta) usa-se 'por que' separado; a forma com acento ('por quê') só fecha frase.",
  },
];

export const SIMULADOS_PRONTOS: SimuladoPronto[] = [
  {
    id: "pronto-rlm",
    titulo: "Raciocínio Lógico · essencial",
    descricao: "Sequências, silogismos, porcentagem e proposições.",
    config: cfg("Raciocínio Lógico", RLM.length),
    questoes: RLM,
  },
  {
    id: "pronto-mat",
    titulo: "Matemática básica · concurso",
    descricao: "Regra de três, MMC, porcentagem, desconto e média.",
    config: cfg("Matemática", MAT.length),
    questoes: MAT,
  },
  {
    id: "pronto-port",
    titulo: "Língua Portuguesa · essencial",
    descricao: "Crase, concordância, plural e as pegadinhas clássicas.",
    config: cfg("Língua Portuguesa", PORT.length),
    questoes: PORT,
  },
];
