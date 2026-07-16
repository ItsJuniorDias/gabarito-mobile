import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { AppState } from "react-native";
import { router } from "expo-router";
import type { Assinatura, PlanoId, PlanoOferta } from "@/types";
import { LIMITE, MODELO_FREE } from "@/data/planos";
import {
  BillingError,
  abrirGerenciarAssinatura,
  abrirResgateDeCodigo,
  billingMode,
  carregarOfertas,
  comprarPlano,
  getAssinatura,
  getPremiumDev,
  identificarNoBilling,
  ofertasFallback,
  ouvirAssinatura,
  restaurarCompras,
  setAssinatura,
  setPremiumDev,
  sincronizarAssinatura,
} from "@/lib/billing";
import { getGeracoesUsadas, registrarGeracao } from "@/lib/storage";
import {
  getIdentidade,
  registrarLead,
  setIdentidade,
  type Identidade,
} from "@/lib/identidade";

/** Contexto que motiva a abertura do paywall (personaliza o texto). */
export type MotivoPaywall =
  | "limite" // estourou a cota semanal de geração
  | "revisao" // quis a revisão inteligente
  | "questoes" // quis mais questões
  | "modelo" // quis outro modelo
  | "aha" // acabou de ir bem num simulado
  | "onboarding" // fim do onboarding, plano recém-montado
  | null;

interface AssinaturaApi {
  assinatura: Assinatura;
  premium: boolean;
  modo: ReturnType<typeof billingMode>;
  maxQuestoes: number;
  podeUsarModelo: (id: string) => boolean;
  // cota de geração por IA (free)
  geracoesLimite: number;
  geracoesRestantes: number;
  geracoesIlimitado: boolean;
  podeGerarIA: boolean;
  registrarGeracaoIA: () => void;
  // identidade / lead
  identidade: Identidade | null;
  salvarIdentidade: (email: string, nome?: string) => void;
  // paywall contextual
  motivoPaywall: MotivoPaywall;
  setMotivoPaywall: (m: MotivoPaywall) => void;
  /** Atalho: marca o motivo e abre a tela de planos. */
  abrirPaywall: (m: MotivoPaywall) => void;
  // ofertas (preço/trial vêm da loja)
  ofertas: PlanoOferta[];
  carregandoOfertas: boolean;
  ofertasDaLoja: boolean;
  recarregarOfertas: () => Promise<void>;
  ofertaPor: (id: PlanoId) => PlanoOferta | undefined;
  /** Maior teste grátis disponível entre os planos. 0 = não tem. */
  trialDias: number;
  // compra
  comprando: PlanoId | null;
  restaurando: boolean;
  erro: string | null;
  limparErro: () => void;
  assinar: (plano: PlanoId) => Promise<boolean>;
  restaurar: () => Promise<boolean>;
  gerenciar: () => Promise<void>;
  resgatarCodigo: () => Promise<void>;
  // dev
  premiumDev: boolean;
  simularPremium: (v: boolean) => void;
}

const Ctx = createContext<AssinaturaApi | null>(null);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [assinatura, setAss] = useState<Assinatura>(() => getAssinatura());
  const [premiumDev, setPremiumDevState] = useState<boolean>(() => getPremiumDev());
  const [geracoesUsadas, setGeracoesUsadas] = useState<number>(() => getGeracoesUsadas());
  const [identidade, setId] = useState<Identidade | null>(() => getIdentidade());
  const [motivoPaywall, setMotivoPaywall] = useState<MotivoPaywall>(null);
  const [ofertas, setOfertas] = useState<PlanoOferta[]>(() => ofertasFallback());
  const [ofertasDaLoja, setOfertasDaLoja] = useState(false);
  const [carregandoOfertas, setCarregandoOfertas] = useState(false);
  const [comprando, setComprando] = useState<PlanoId | null>(null);
  const [restaurando, setRestaurando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const modo = billingMode();
  const premium = assinatura.premium || premiumDev;

  const aplicar = useCallback((a: Assinatura) => {
    setAss(a);
    setAssinatura(a);
  }, []);

  // ── cota de geração ─────────────────────────────────────────
  const registrarGeracaoIA = useCallback(() => {
    if (premium) return;
    setGeracoesUsadas(registrarGeracao());
  }, [premium]);

  const geracoesLimite = LIMITE.free.geracoesSemana;
  const geracoesRestantes = Math.max(0, geracoesLimite - geracoesUsadas);
  const podeGerarIA = premium || geracoesRestantes > 0;

  // ── identidade / lead ───────────────────────────────────────
  const salvarIdentidade = useCallback((email: string, nome?: string) => {
    const id: Identidade = { email, nome, criadoEm: Date.now() };
    setIdentidade(id);
    setId(id);
    void registrarLead(email, nome);
    // O e-mail também vira atributo do cliente no RevenueCat: é o que liga a
    // pessoa à assinatura no dashboard e permite o remarketing por webhook.
    void identificarNoBilling(email, nome);
  }, []);

  // ── paywall ─────────────────────────────────────────────────
  const abrirPaywall = useCallback((m: MotivoPaywall) => {
    setMotivoPaywall(m);
    router.push("/premium");
  }, []);

  // ── ofertas ─────────────────────────────────────────────────
  const recarregarOfertas = useCallback(async () => {
    if (modo === "ausente") return;
    setCarregandoOfertas(true);
    try {
      const lista = await carregarOfertas();
      if (lista.length > 0) {
        setOfertas(lista);
        setOfertasDaLoja(true);
      }
    } catch (e) {
      // Preço é informação: melhor mostrar o fallback do que uma tela vazia.
      // Só reclamamos alto se a pessoa tentar comprar de verdade.
      if (__DEV__) console.warn("[assinatura] ofertas:", e);
    } finally {
      setCarregandoOfertas(false);
    }
  }, [modo]);

  const ofertaPor = useCallback(
    (id: PlanoId) => ofertas.find((o) => o.id === id),
    [ofertas],
  );

  const trialDias = useMemo(
    () => ofertas.reduce((max, o) => Math.max(max, o.trialDias), 0),
    [ofertas],
  );

  // ── compra ──────────────────────────────────────────────────
  const assinar = useCallback(
    async (plano: PlanoId): Promise<boolean> => {
      setErro(null);
      setComprando(plano);
      try {
        const a = await comprarPlano(plano);
        aplicar(a);
        if (identidade?.email) void identificarNoBilling(identidade.email, identidade.nome);
        return a.premium;
      } catch (e) {
        const b = e instanceof BillingError ? e : null;
        // Fechar a folha de pagamento é uma decisão, não um erro: mostrar um
        // alerta vermelho aqui é a forma mais rápida de queimar a próxima
        // tentativa.
        if (b?.kind !== "cancelado") {
          setErro(b?.message ?? "Não deu pra concluir a compra.");
        }
        // Pagamento pendente (boleto, Ask to Buy, cartão em análise): a compra
        // não falhou, só não terminou. O listener libera quando aprovar.
        return false;
      } finally {
        setComprando(null);
      }
    },
    [aplicar, identidade],
  );

  const restaurar = useCallback(async (): Promise<boolean> => {
    setErro(null);
    setRestaurando(true);
    try {
      const a = await restaurarCompras();
      aplicar(a);
      if (!a.premium) {
        setErro(
          "Nenhuma assinatura ativa nesta conta da loja. Confira se está no mesmo ID que usou pra assinar.",
        );
      }
      return a.premium;
    } catch (e) {
      setErro(e instanceof BillingError ? e.message : "Não consegui verificar agora.");
      return false;
    } finally {
      setRestaurando(false);
    }
  }, [aplicar]);

  const gerenciar = useCallback(async () => {
    try {
      await abrirGerenciarAssinatura();
    } catch (e) {
      setErro(e instanceof BillingError ? e.message : "Não consegui abrir a loja.");
    }
  }, []);

  const resgatarCodigo = useCallback(async () => {
    await abrirResgateDeCodigo();
    await sincronizarAssinatura().then((a) => a && aplicar(a));
  }, [aplicar]);

  const limparErro = useCallback(() => setErro(null), []);

  const simularPremium = useCallback((v: boolean) => {
    setPremiumDev(v);
    setPremiumDevState(v);
  }, []);

  // ── ciclo de vida ───────────────────────────────────────────

  // Boot: relê o estado real e puxa os preços. O estado local já pintou a
  // primeira tela, então isso só corrige (renovou, expirou, foi reembolsado).
  const iniciado = useRef(false);
  useEffect(() => {
    if (iniciado.current || modo === "ausente") return;
    iniciado.current = true;
    void sincronizarAssinatura().then((a) => a && aplicar(a));
    void recarregarOfertas();
  }, [modo, aplicar, recarregarOfertas]);

  // A loja avisa sozinha quando algo muda (renovação, cancelamento,
  // reembolso, compra feita fora do app, pagamento pendente que aprovou).
  useEffect(() => {
    return ouvirAssinatura(setAss);
  }, []);

  // Voltar do background é quando a assinatura costuma ter mudado: a pessoa
  // saiu pra cancelar na App Store e voltou. Sem isso o app mente até o
  // próximo boot.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (estado) => {
      if (estado === "active") void sincronizarAssinatura().then((a) => a && aplicar(a));
    });
    return () => sub.remove();
  }, [aplicar]);

  const api = useMemo<AssinaturaApi>(
    () => ({
      assinatura,
      premium,
      modo,
      maxQuestoes: premium ? LIMITE.premium.maxQuestoes : LIMITE.free.maxQuestoes,
      podeUsarModelo: (id: string) => premium || id === MODELO_FREE,
      geracoesLimite,
      geracoesRestantes,
      geracoesIlimitado: premium,
      podeGerarIA,
      registrarGeracaoIA,
      identidade,
      salvarIdentidade,
      motivoPaywall,
      setMotivoPaywall,
      abrirPaywall,
      ofertas,
      carregandoOfertas,
      ofertasDaLoja,
      recarregarOfertas,
      ofertaPor,
      trialDias,
      comprando,
      restaurando,
      erro,
      limparErro,
      assinar,
      restaurar,
      gerenciar,
      resgatarCodigo,
      premiumDev,
      simularPremium,
    }),
    [
      assinatura,
      premium,
      modo,
      geracoesLimite,
      geracoesRestantes,
      podeGerarIA,
      registrarGeracaoIA,
      identidade,
      salvarIdentidade,
      motivoPaywall,
      abrirPaywall,
      ofertas,
      carregandoOfertas,
      ofertasDaLoja,
      recarregarOfertas,
      ofertaPor,
      trialDias,
      comprando,
      restaurando,
      erro,
      limparErro,
      assinar,
      restaurar,
      gerenciar,
      resgatarCodigo,
      premiumDev,
      simularPremium,
    ],
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useAssinatura(): AssinaturaApi {
  const ctx = useContext(Ctx);
  if (!ctx)
    throw new Error("useAssinatura deve ser usado dentro de <SubscriptionProvider>");
  return ctx;
}
