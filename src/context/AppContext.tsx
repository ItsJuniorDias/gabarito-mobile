import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { router } from "expo-router";
import type {
  Configuracoes,
  Diario,
  ErroSalvo,
  Estatisticas,
  Questao,
  Resposta,
  Resultado,
  Simulado,
  SimuladoConfig,
} from "@/types";
import { GenError } from "@/types";
import {
  getConfig,
  getDiario,
  getErros,
  getStats,
  registrarQuestoes,
  registrarResultado,
  setConfig as persistConfig,
} from "@/lib/storage";
import { gerarQuestoes } from "@/lib/openrouter";
import { uid } from "@/lib/utils";

/**
 * Na web, `view` era um state e o App fazia switch. Aqui a navegação é do
 * expo-router (as rotas são arquivos), então este contexto guarda só o que
 * a rota não guarda: a SESSÃO do simulado — que precisa sobreviver ao pulo
 * /simulado → /resultado sem virar param de URL.
 */

interface AppState {
  simulado: Simulado | null;
  respostas: Resposta[];
  resultado: Resultado | null;
  settings: Configuracoes;
  stats: Estatisticas;
  erros: ErroSalvo[];
  /** Meta do dia + ofensiva. Alimentado pelo fim de cada simulado. */
  diario: Diario;
  gerando: boolean;
  erroGeracao: string | null;
}

interface AppApi extends AppState {
  salvarSettings: (c: Configuracoes) => void;
  gerar: (config: SimuladoConfig) => Promise<void>;
  refazerComQuestoes: (questoes: Questao[], base: SimuladoConfig) => void;
  limparErroGeracao: () => void;
  responder: (index: number, r: Resposta) => void;
  finalizarSimulado: (duracaoSeg?: number) => Resultado;
  recarregarErros: () => void;
  sairParaHome: () => void;
}

const Ctx = createContext<AppApi | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [simulado, setSimulado] = useState<Simulado | null>(null);
  const [respostas, setRespostas] = useState<Resposta[]>([]);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [settings, setSettings] = useState<Configuracoes>(() => getConfig());
  const [stats, setStats] = useState<Estatisticas>(() => getStats());
  const [erros, setErros] = useState<ErroSalvo[]>(() => getErros());
  const [diario, setDiario] = useState<Diario>(() => getDiario());
  const [gerando, setGerando] = useState(false);
  const [erroGeracao, setErroGeracao] = useState<string | null>(null);

  const salvarSettings = useCallback((c: Configuracoes) => {
    persistConfig(c);
    setSettings(c);
  }, []);

  const abrirProva = useCallback((s: Simulado) => {
    setSimulado(s);
    setRespostas(new Array(s.questoes.length).fill(null));
    setResultado(null);
    // "refazer" pode partir do /resultado; sem zerar a pilha ela viraria
    // tabs → resultado → simulado → resultado → … a cada rodada.
    if (router.canDismiss()) router.dismissAll();
    router.push("/simulado");
  }, []);

  const gerar = useCallback(
    async (config: SimuladoConfig) => {
      setErroGeracao(null);
      setGerando(true);
      try {
        const questoes = await gerarQuestoes(config, settings);
        abrirProva({
          id: uid("s_"),
          criadoEm: Date.now(),
          config,
          questoes,
        });
      } catch (e) {
        const msg =
          e instanceof GenError ? e.message : "Algo deu errado ao gerar. Tente de novo.";
        setErroGeracao(msg);
      } finally {
        setGerando(false);
      }
    },
    [settings, abrirProva],
  );

  const refazerComQuestoes = useCallback(
    (questoes: Questao[], base: SimuladoConfig) => {
      abrirProva({
        id: uid("s_"),
        criadoEm: Date.now(),
        config: { ...base, quantidade: questoes.length },
        questoes,
      });
    },
    [abrirProva],
  );

  const limparErroGeracao = useCallback(() => setErroGeracao(null), []);

  const responder = useCallback((index: number, r: Resposta) => {
    setRespostas((prev) => {
      const next = [...prev];
      next[index] = r;
      return next;
    });
  }, []);

  const finalizarSimulado = useCallback(
    (duracaoSeg?: number): Resultado => {
      const qs: Questao[] = simulado?.questoes ?? [];
      let acertos = 0;
      qs.forEach((q, i) => {
        if (respostas[i] != null && respostas[i] === q.correta) acertos++;
      });
      const res: Resultado = {
        simuladoId: simulado?.id ?? "",
        respostas,
        acertos,
        total: qs.length,
        duracaoSeg,
        finalizadoEm: Date.now(),
      };
      setResultado(res);
      setStats(registrarResultado(qs, respostas, res));
      // A ofensiva conta questões RESPONDIDAS, não simulados: quem faz 5 por
      // dia mantém a sequência tanto quanto quem faz 30.
      setDiario(registrarQuestoes(qs.length));
      // replace: voltar do resultado não pode cair na prova já entregue
      router.replace("/resultado");
      return res;
    },
    [simulado, respostas],
  );

  const recarregarErros = useCallback(() => setErros(getErros()), []);

  const sairParaHome = useCallback(() => {
    setSimulado(null);
    setResultado(null);
    setRespostas([]);
    setStats(getStats());
    setErros(getErros());
    setDiario(getDiario());
    if (router.canDismiss()) router.dismissAll();
    else router.replace("/");
  }, []);

  const api = useMemo<AppApi>(
    () => ({
      simulado,
      respostas,
      resultado,
      settings,
      stats,
      erros,
      diario,
      gerando,
      erroGeracao,
      salvarSettings,
      gerar,
      refazerComQuestoes,
      limparErroGeracao,
      responder,
      finalizarSimulado,
      recarregarErros,
      sairParaHome,
    }),
    [
      simulado,
      respostas,
      resultado,
      settings,
      stats,
      erros,
      diario,
      gerando,
      erroGeracao,
      salvarSettings,
      gerar,
      refazerComQuestoes,
      limparErroGeracao,
      responder,
      finalizarSimulado,
      recarregarErros,
      sairParaHome,
    ],
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useApp(): AppApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp deve ser usado dentro de <AppProvider>");
  return ctx;
}
