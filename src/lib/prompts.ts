import type { SimuladoConfig } from "@/types";
import { bancaById } from "@/data/catalog";

const DIF_LABEL: Record<string, string> = {
  facil: "fácil",
  medio: "médio",
  dificil: "difícil",
  misto: "misto (varie entre fácil, médio e difícil)",
};

export const SYSTEM_PROMPT = `Você é um elaborador sênior de questões para concursos públicos e para o ENEM no Brasil. Você conhece profundamente o estilo de cada banca, a legislação brasileira vigente e o edital típico de cada carreira.

Regras invioláveis:
- Escreva TUDO em português do Brasil, com ortografia e terminologia técnica corretas.
- Questões originais, factualmente corretas e sem ambiguidade. Nada de "todas as anteriores" ou "nenhuma das anteriores".
- A alternativa correta deve estar em posição ALEATÓRIA (não concentre no mesmo índice).
- Os distratores devem ser plausíveis e explorar erros conceituais reais.
- A explicação deve ensinar: justifique a correta e, quando útil, por que as demais estão erradas, citando o fundamento (lei, artigo, princípio, conceito).
- Responda SOMENTE com JSON válido no schema pedido. Sem markdown, sem comentários, sem texto fora do JSON.`;

interface SchemaOpts {
  certoErrado: boolean;
}

function schemaBloco({ certoErrado }: SchemaOpts): string {
  if (certoErrado) {
    return `Cada item do array "questoes" deve ter exatamente:
{
  "tipo": "certo_errado",
  "materia": string,
  "assunto": string,          // subtópico específico
  "enunciado": string,        // uma AFIRMAÇÃO a ser julgada
  "contexto": string | null,  // texto de apoio, se houver
  "correta": boolean,         // true = Certo, false = Errado
  "explicacao": string,
  "dificuldade": "facil" | "medio" | "dificil"
}`;
  }
  return `Cada item do array "questoes" deve ter exatamente:
{
  "tipo": "multipla",
  "materia": string,
  "assunto": string,          // subtópico específico
  "enunciado": string,
  "contexto": string | null,  // texto de apoio (comum no ENEM), se houver
  "alternativas": [           // EXATAMENTE 5 itens
    { "letra": "A", "texto": string },
    { "letra": "B", "texto": string },
    { "letra": "C", "texto": string },
    { "letra": "D", "texto": string },
    { "letra": "E", "texto": string }
  ],
  "correta": number,          // índice 0..4 da alternativa correta
  "explicacao": string,
  "dificuldade": "facil" | "medio" | "dificil"
}`;
}

export function buildUserPrompt(config: SimuladoConfig): string {
  const banca = bancaById(config.banca);
  const certoErrado = config.tipo === "certo_errado";
  const materias = config.materias.join(", ");
  const foco = config.topico?.trim()
    ? `\nFoco temático obrigatório: ${config.topico.trim()}.`
    : "";

  return `Gere ${config.quantidade} ${
    certoErrado ? "itens para julgar (Certo/Errado)" : "questões de múltipla escolha"
  } no estilo da banca ${banca.nome}.

Estilo da banca: ${banca.estilo}
Matéria(s): ${materias}. Distribua as questões entre as matérias informadas.
Dificuldade: ${DIF_LABEL[config.dificuldade]}.${foco}

Formato de saída — objeto JSON com uma única chave "questoes" (array de ${config.quantidade}):
${schemaBloco({ certoErrado })}

Retorne apenas o objeto JSON.`;
}
