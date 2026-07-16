import type { Configuracoes, Questao, SimuladoConfig } from "@/types";
import { GenError } from "@/types";
import { SYSTEM_PROMPT, buildUserPrompt } from "@/lib/prompts";
import { LETRAS, uid } from "@/lib/utils";

const API_BASE = process.env.EXPO_PUBLIC_API_BASE?.replace(/\/$/, "");
const OR_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
const OR_URL = "https://openrouter.ai/api/v1/chat/completions";

/** Gerar 30 questões com contexto leva tempo; rede de celular, mais ainda. */
const TIMEOUT_MS = 90_000;

/** Como o app está configurado para falar com o modelo. */
export function apiMode(): "proxy" | "direto" | "ausente" {
  if (API_BASE) return "proxy";
  if (OR_KEY && OR_KEY !== "cole-sua-key-aqui") return "direto";
  return "ausente";
}

// ── Parsing robusto do JSON do modelo ─────────────────────────

function extrairJson(txt: string): unknown {
  let s = txt.trim();
  // remove cercas ```json ... ```
  s = s.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  // recorta do primeiro { ao último }
  const ini = s.indexOf("{");
  const fim = s.lastIndexOf("}");
  if (ini !== -1 && fim !== -1 && fim > ini) s = s.slice(ini, fim + 1);
  return JSON.parse(s);
}

// ── Validação / normalização ──────────────────────────────────

function normalizar(raw: unknown, config: SimuladoConfig): Questao[] {
  const obj = raw as { questoes?: unknown };
  const lista = Array.isArray(obj?.questoes) ? obj.questoes : [];
  const out: Questao[] = [];

  for (const item of lista) {
    const q = item as Record<string, unknown>;
    const tipo = q.tipo === "certo_errado" ? "certo_errado" : "multipla";
    const enunciado = String(q.enunciado ?? "").trim();
    if (!enunciado) continue;

    const materia = String(q.materia ?? config.materias[0] ?? "Geral").trim();
    const dif = ["facil", "medio", "dificil"].includes(String(q.dificuldade))
      ? (q.dificuldade as Questao["dificuldade"])
      : "medio";

    const comum = {
      id: uid("q_"),
      tipo,
      materia,
      assunto: String(q.assunto ?? materia).trim(),
      banca: config.banca,
      dificuldade: dif,
      contexto: q.contexto ? String(q.contexto).trim() : undefined,
      enunciado,
      explicacao: String(q.explicacao ?? "").trim(),
    } satisfies Partial<Questao>;

    if (tipo === "certo_errado") {
      out.push({
        ...(comum as Questao),
        correta: q.correta === true,
      });
      continue;
    }

    // múltipla escolha
    const altsRaw = Array.isArray(q.alternativas) ? q.alternativas : [];
    const alternativas = altsRaw
      .map((a, i) => {
        const alt = a as Record<string, unknown>;
        return {
          letra: String(alt.letra ?? LETRAS[i] ?? "?"),
          texto: String(alt.texto ?? "").trim(),
        };
      })
      .filter((a) => a.texto);

    if (alternativas.length < 2) continue;
    // renumera letras em sequência para garantir consistência com o cartão
    alternativas.forEach((a, i) => (a.letra = LETRAS[i] ?? a.letra));

    let correta = typeof q.correta === "number" ? q.correta : 0;
    if (correta < 0 || correta >= alternativas.length) correta = 0;

    out.push({ ...(comum as Questao), alternativas, correta });
  }

  return out;
}

// ── Chamada ───────────────────────────────────────────────────

interface ORChoice {
  message?: { content?: string };
}
interface ORResponse {
  choices?: ORChoice[];
  error?: { message?: string };
}

/** fetch com timeout — sem isso, um 4G ruim deixa o overlay girando pra sempre. */
async function fetchComTimeout(url: string, init: RequestInit): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

function erroDeRede(e: unknown, onde: string): never {
  const abortou = e instanceof Error && e.name === "AbortError";
  throw new GenError(
    abortou
      ? "A geração demorou demais e foi cancelada. Tente com menos questões ou troque o modelo."
      : `Não foi possível falar com ${onde}. Verifique sua conexão.`,
    "network",
  );
}

async function chamar(
  config: SimuladoConfig,
  settings: Configuracoes,
): Promise<string> {
  const body = {
    model: settings.modelo,
    temperature: settings.temperatura,
    max_tokens: 4096,
    response_format: { type: "json_object" as const },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(config) },
    ],
  };

  // Modo proxy: o backend injeta a key e fala com o OpenRouter.
  if (API_BASE) {
    let res: Response;
    try {
      res = await fetchComTimeout(`${API_BASE}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch (e) {
      erroDeRede(e, "o servidor");
    }
    if (!res.ok) await erroDaResposta(res);
    const data = (await res.json()) as ORResponse | { content?: string };
    // Aceita tanto o passthrough do OpenRouter quanto { content }.
    const passthrough = (data as ORResponse).choices?.[0]?.message?.content;
    const direto = (data as { content?: string }).content;
    const txt = passthrough ?? direto ?? "";
    if (!txt) throw new GenError("Resposta vazia do servidor.", "empty");
    return txt;
  }

  // Modo direto (DEV): chama o OpenRouter do device com a key do .env.
  if (!OR_KEY || OR_KEY === "cole-sua-key-aqui") {
    throw new GenError(
      "Nenhuma forma de acesso configurada. Defina EXPO_PUBLIC_API_BASE (proxy) ou EXPO_PUBLIC_OPENROUTER_API_KEY (dev) no .env e reinicie o bundler com --clear.",
      "config",
    );
  }

  let res: Response;
  try {
    res = await fetchComTimeout(OR_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OR_KEY}`,
        "Content-Type": "application/json",
        // não existe `location.origin` aqui — o OpenRouter usa isso só pro ranking
        "HTTP-Referer": "https://gabarito.com.br",
        "X-Title": "Gabarito",
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    erroDeRede(e, "o OpenRouter");
  }
  if (!res.ok) await erroDaResposta(res);
  const data = (await res.json()) as ORResponse;
  if (data.error?.message) throw new GenError(data.error.message, "unknown");
  const txt = data.choices?.[0]?.message?.content ?? "";
  if (!txt) throw new GenError("O modelo não retornou conteúdo.", "empty");
  return txt;
}

/** Lê o corpo da resposta de erro e monta uma mensagem útil.
 *  O OpenRouter costuma explicar no corpo (ex.: "No endpoints found for
 *  <modelo>", "not a valid model id", "data policy"). */
async function erroDaResposta(res: Response): Promise<never> {
  let detalhe = "";
  try {
    const j = (await res.json()) as {
      error?: { message?: string } | string;
    };
    const err = j?.error;
    detalhe = typeof err === "string" ? err : err?.message ?? "";
  } catch {
    try {
      detalhe = (await res.text()).slice(0, 300);
    } catch {
      /* sem corpo */
    }
  }

  const status = res.status;
  const kind =
    status === 401 || status === 403 || status === 402
      ? "auth"
      : status === 429
        ? "rate"
        : "unknown";

  const base =
    status === 401 || status === 403
      ? "Key inválida ou sem permissão"
      : status === 402
        ? "Sem créditos no OpenRouter"
        : status === 429
          ? "Muitas requisições — aguarde um instante"
          : status === 404
            ? "Modelo indisponível ou não encontrado (troque o modelo em Ajustes)"
            : `Erro na API (HTTP ${status})`;

  throw new GenError(detalhe ? `${base}. ${detalhe}` : `${base} (HTTP ${status}).`, kind);
}

/** Gera as questões de um simulado. Faz 1 retry em falha de parsing. */
export async function gerarQuestoes(
  config: SimuladoConfig,
  settings: Configuracoes,
): Promise<Questao[]> {
  let ultimaFalha: unknown;

  for (let tentativa = 0; tentativa < 2; tentativa++) {
    const txt = await chamar(config, settings);
    try {
      const questoes = normalizar(extrairJson(txt), config);
      if (questoes.length === 0) throw new GenError("Sem questões válidas.", "empty");
      return questoes;
    } catch (e) {
      ultimaFalha = e;
      // tenta de novo uma vez (variação de saída do modelo)
    }
  }

  if (ultimaFalha instanceof GenError) throw ultimaFalha;
  throw new GenError(
    "Não consegui interpretar a resposta do modelo. Tente de novo ou troque o modelo em Ajustes.",
    "parse",
  );
}
