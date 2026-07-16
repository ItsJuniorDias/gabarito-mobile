import { Platform } from "react-native";
import Purchases, {
  LOG_LEVEL,
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
  type PurchasesStoreProduct,
} from "react-native-purchases";
import type { Assinatura, PlanoId, PlanoOferta } from "@/types";
import { PLANOS, planoById } from "@/data/planos";
import { read, remove, write } from "@/lib/kv";

/**
 * Camada de assinatura — RevenueCat.
 *
 * Substitui o antigo `mp.ts` (checkout externo do Mercado Pago), que violava
 * a diretriz 3.1.1 da App Store: conteúdo digital consumido dentro do app tem
 * que ser vendido por In-App Purchase. Aqui a compra acontece na StoreKit /
 * Play Billing, e o RevenueCat é só quem valida o recibo e mantém o
 * entitlement.
 *
 * Regra que vale a pena guardar: o SDK do RevenueCat NÃO vaza deste arquivo.
 * Quem consome (`SubscriptionContext`, `premium.tsx`, `ajustes.tsx`) só vê
 * `Assinatura`, `PlanoOferta` e `BillingError` — tipos nossos, serializáveis.
 * Foi o que permitiu trocar o Mercado Pago inteiro sem tocar na UI de paywall.
 */

// ── Configuração ──────────────────────────────────────────────

/** Chave PÚBLICA do RevenueCat (appl_… / goog_…). Pode ir no bundle. */
const API_KEY = Platform.select({
  ios: process.env.EXPO_PUBLIC_RC_IOS_KEY,
  android: process.env.EXPO_PUBLIC_RC_ANDROID_KEY,
  default: undefined,
});

/** Identificador do entitlement no dashboard do RevenueCat. */
const ENTITLEMENT = process.env.EXPO_PUBLIC_RC_ENTITLEMENT || "premium";

/** Offering específico. Vazio = usa o `current` (o que o dashboard mandar). */
const OFFERING = process.env.EXPO_PUBLIC_RC_OFFERING || "";

const K_ASSINATURA = "gabarito.assinatura.v2"; // v2: formato RC, descarta o do MP
const K_DEV = "gabarito.dev.premium.v1";

/** Chaves que o boot precisa hidratar (ver src/lib/kv.ts). */
export const CHAVES_BILLING = [K_ASSINATURA, K_DEV];

/** Está tudo configurado pra vender? */
export function billingMode(): "revenuecat" | "ausente" {
  return API_KEY ? "revenuecat" : "ausente";
}

let configurado = false;

/**
 * Liga o SDK. Chamar UMA vez, no boot, antes dos providers.
 *
 * Em Expo Go o SDK entra sozinho em Browser Mode (mocks em JS) e nada aqui
 * explode — mas compra de verdade só em development build.
 */
export async function configurarBilling(appUserID?: string): Promise<void> {
  if (configurado || !API_KEY) return;
  try {
    await Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.WARN : LOG_LEVEL.ERROR);
  } catch {
    /* log é opcional; nunca deve impedir o configure */
  }
  try {
    Purchases.configure({ apiKey: API_KEY, appUserID: appUserID ?? null });
    configurado = true;
  } catch (e) {
    // Sem módulo nativo (Expo Go antigo / web): o app segue no plano grátis.
    if (__DEV__) console.warn("[billing] configure falhou:", e);
  }
}

export function billingPronto(): boolean {
  return configurado;
}

// ── Erros ─────────────────────────────────────────────────────

export type BillingErroKind =
  | "cancelado" // o usuário fechou a folha de pagamento — não é erro
  | "pendente" // aguardando aprovação (boleto/família/Ask to Buy)
  | "rede"
  | "loja"
  | "config"
  | "desconhecido";

export class BillingError extends Error {
  constructor(
    message: string,
    public readonly kind: BillingErroKind = "desconhecido",
  ) {
    super(message);
    this.name = "BillingError";
  }
}

/** Erro do SDK → mensagem em pt-BR que o usuário entende e pode agir. */
export function traduzErro(e: unknown): BillingError {
  if (e instanceof BillingError) return e;

  const err = e as { code?: string; message?: string; userCancelled?: boolean };
  if (err?.userCancelled) return new BillingError("Compra cancelada.", "cancelado");

  switch (err?.code) {
    case PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR:
      return new BillingError("Compra cancelada.", "cancelado");
    case PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR:
      return new BillingError(
        "Pagamento em análise. Assim que a loja aprovar, o Premium libera sozinho — não precisa pagar de novo.",
        "pendente",
      );
    case PURCHASES_ERROR_CODE.NETWORK_ERROR:
    case PURCHASES_ERROR_CODE.OFFLINE_CONNECTION_ERROR:
    case PURCHASES_ERROR_CODE.PRODUCT_REQUEST_TIMED_OUT_ERROR:
      return new BillingError("Sem conexão com a loja. Tente de novo.", "rede");
    case PURCHASES_ERROR_CODE.PRODUCT_ALREADY_PURCHASED_ERROR:
    case PURCHASES_ERROR_CODE.RECEIPT_ALREADY_IN_USE_ERROR:
      return new BillingError(
        "Essa assinatura já existe nesta conta. Toque em “restaurar compras”.",
        "loja",
      );
    case PURCHASES_ERROR_CODE.PURCHASE_NOT_ALLOWED_ERROR:
      return new BillingError(
        "Este aparelho não está autorizado a comprar. Veja as restrições em Ajustes › Tempo de Uso.",
        "loja",
      );
    case PURCHASES_ERROR_CODE.STORE_PROBLEM_ERROR:
    case PURCHASES_ERROR_CODE.UNKNOWN_BACKEND_ERROR:
      return new BillingError(
        "A loja está com problema agora. Tente de novo em instantes.",
        "loja",
      );
    case PURCHASES_ERROR_CODE.PRODUCT_NOT_AVAILABLE_FOR_PURCHASE_ERROR:
      return new BillingError(
        "Este plano não está disponível na sua região ou ainda não foi liberado na loja.",
        "loja",
      );
    case PURCHASES_ERROR_CODE.CONFIGURATION_ERROR:
    case PURCHASES_ERROR_CODE.INVALID_CREDENTIALS_ERROR:
      return new BillingError(
        "Assinatura mal configurada nesta build. Veja o README.",
        "config",
      );
    case PURCHASES_ERROR_CODE.INELIGIBLE_ERROR:
      return new BillingError(
        "Você não está elegível a esta oferta (o teste grátis vale uma vez por conta).",
        "loja",
      );
    default:
      return new BillingError(
        err?.message?.slice(0, 180) || "Não deu pra concluir a compra.",
        "desconhecido",
      );
  }
}

// ── Persistência local ────────────────────────────────────────
// O RevenueCat já cacheia offline, mas o cache dele é assíncrono e o app lê
// no initializer do useState (ver kv.ts). Guardamos nossa própria cópia pra
// primeira tela nascer com o estado certo, sem flash de "grátis".

const VAZIA: Assinatura = { premium: false, status: "nunca" };

export function getAssinatura(): Assinatura {
  return { ...VAZIA, ...read<Partial<Assinatura>>(K_ASSINATURA, {}) };
}

export function setAssinatura(a: Assinatura): void {
  write(K_ASSINATURA, a);
}

export function limparAssinatura(): void {
  remove(K_ASSINATURA);
}

// ── Override de desenvolvimento ───────────────────────────────
// Sandbox de assinatura é lento e chato de repetir: cada teste do paywall
// exige comprar de novo com a Sandbox Apple ID. Este atalho liga o Premium
// no aparelho SÓ em __DEV__ — nunca em release, então não tem como virar
// bypass no app publicado.

export function getPremiumDev(): boolean {
  if (!__DEV__) return false;
  return read<boolean>(K_DEV, false);
}

export function setPremiumDev(v: boolean): void {
  if (!__DEV__) return;
  if (v) write(K_DEV, true);
  else remove(K_DEV);
}

// ── CustomerInfo → Assinatura ─────────────────────────────────

/** productIdentifier → PlanoId. Preenchido ao carregar as ofertas. */
const produtoParaPlano = new Map<string, PlanoId>();

function planoDoProduto(productId: string): PlanoId | undefined {
  const direto = produtoParaPlano.get(productId);
  if (direto) return direto;
  // Fallback: o app pode subir premium (cache do RC) antes de ler o offering.
  const id = productId.toLowerCase();
  if (/(anual|annual|year|yr|12m)/.test(id)) return "anual";
  if (/(mensal|monthly|month|1m)/.test(id)) return "mensal";
  return undefined;
}

export function assinaturaDeCustomerInfo(info: CustomerInfo): Assinatura {
  const ativo = info.entitlements.active[ENTITLEMENT];
  const gerenciarUrl = info.managementURL ?? undefined;

  if (!ativo) {
    const jaTeve = !!info.entitlements.all[ENTITLEMENT];
    return {
      premium: false,
      status: jaTeve ? "expirada" : "nunca",
      gerenciarUrl,
    };
  }

  return {
    premium: true,
    status: "ativa",
    plano: planoDoProduto(ativo.productIdentifier),
    loja: ativo.store,
    desde: ativo.originalPurchaseDateMillis || undefined,
    expiraEm: ativo.expirationDateMillis ?? undefined,
    renova: ativo.willRenew,
    emTrial: ativo.periodType === "TRIAL" || ativo.periodType === "INTRO",
    gerenciarUrl,
  };
}

// ── Ofertas ───────────────────────────────────────────────────

let offeringAtual: PurchasesOffering | null = null;
const pacotes = new Map<PlanoId, PurchasesPackage>();

/** Dias de teste grátis do intro offer (0 = não tem). */
function trialDias(p: PurchasesStoreProduct): number {
  const intro = p.introPrice;
  if (!intro || intro.price > 0) return 0;
  const n = intro.periodNumberOfUnits * Math.max(1, intro.cycles);
  switch (intro.periodUnit.toUpperCase()) {
    case "DAY":
      return n;
    case "WEEK":
      return n * 7;
    case "MONTH":
      return n * 30;
    case "YEAR":
      return n * 365;
    default:
      return n;
  }
}

function acharPacote(o: PurchasesOffering, id: PlanoId, packageId: string) {
  const porIdentificador = o.availablePackages.find((p) => p.identifier === packageId);
  if (porIdentificador) return porIdentificador;
  return id === "anual" ? o.annual : o.monthly;
}

/**
 * Puxa os planos da loja. Preço, moeda e trial vêm de lá — nunca daqui.
 *
 * É o que conserta, de graça, o problema que o Mercado Pago tinha: usuário
 * de fora do Brasil via preço em BRL e não conseguia pagar. A App Store
 * cobra na moeda da conta e já devolve `priceString` formatado no locale.
 */
export async function carregarOfertas(): Promise<PlanoOferta[]> {
  if (!API_KEY || !configurado) return [];

  const offerings = await Purchases.getOfferings().catch((e: unknown) => {
    throw traduzErro(e);
  });

  const o = (OFFERING ? offerings.all[OFFERING] : null) ?? offerings.current;
  if (!o || o.availablePackages.length === 0) return [];

  offeringAtual = o;
  pacotes.clear();
  produtoParaPlano.clear();

  const achados = PLANOS.map((plano) => {
    const pkg = acharPacote(o, plano.id, plano.packageId);
    if (pkg) {
      pacotes.set(plano.id, pkg);
      produtoParaPlano.set(pkg.product.identifier, plano.id);
    }
    return { plano, pkg };
  }).filter((x): x is { plano: (typeof PLANOS)[number]; pkg: PurchasesPackage } => !!x.pkg);

  const mensal = achados.find((x) => x.plano.id === "mensal");

  return achados.map(({ plano, pkg }) => {
    const p = pkg.product;
    // Comparar preço só faz sentido na mesma moeda (é sempre a mesma conta,
    // mas a loja pode devolver produtos de storefronts diferentes em teste).
    const comparavel = mensal && mensal.pkg.product.currencyCode === p.currencyCode;
    const economiaPct =
      plano.id === "anual" && comparavel && mensal!.pkg.product.price > 0
        ? Math.round((1 - p.price / (mensal!.pkg.product.price * 12)) * 100)
        : undefined;

    return {
      ...plano,
      preco: p.price,
      precoLabel: p.priceString,
      precoMensalLabel: plano.id === "anual" ? (p.pricePerMonthString ?? undefined) : undefined,
      moeda: p.currencyCode,
      trialDias: trialDias(p),
      economiaPct: economiaPct && economiaPct > 0 ? economiaPct : undefined,
      daLoja: true,
    };
  });
}

/** Planos de exibição enquanto a loja não respondeu (ou sem chave). */
export function ofertasFallback(): PlanoOferta[] {
  const brl = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
  const mensal = planoById("mensal");
  return PLANOS.map((p) => {
    const economiaPct =
      p.id === "anual" && mensal
        ? Math.round((1 - p.precoFallback / (mensal.precoFallback * 12)) * 100)
        : undefined;
    return {
      ...p,
      preco: p.precoFallback,
      precoLabel: brl(p.precoFallback),
      precoMensalLabel: p.id === "anual" ? brl(p.precoFallback / 12) : undefined,
      moeda: "BRL",
      trialDias: 0,
      economiaPct: economiaPct && economiaPct > 0 ? economiaPct : undefined,
      daLoja: false,
    };
  });
}

// ── Compra / restauração ──────────────────────────────────────

/** Abre a folha de pagamento nativa. Lança `BillingError`. */
export async function comprarPlano(id: PlanoId): Promise<Assinatura> {
  if (!API_KEY) {
    throw new BillingError(
      "Assinatura não configurada nesta build. Defina EXPO_PUBLIC_RC_IOS_KEY / EXPO_PUBLIC_RC_ANDROID_KEY.",
      "config",
    );
  }
  const pkg = pacotes.get(id);
  if (!pkg) {
    throw new BillingError(
      "Esse plano não está disponível agora. Puxe pra atualizar e tente de novo.",
      "config",
    );
  }
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    const a = assinaturaDeCustomerInfo(customerInfo);
    setAssinatura(a);
    return a;
  } catch (e) {
    throw traduzErro(e);
  }
}

/**
 * Restaura compras. Obrigatório pela App Store (3.1.1) e pela Play.
 *
 * Repare que não pede e-mail: a loja já sabe quem é o usuário. O antigo
 * "restaurar por e-mail" do Mercado Pago sumiu junto com o checkout web.
 */
export async function restaurarCompras(): Promise<Assinatura> {
  if (!API_KEY) throw new BillingError("Assinatura não configurada.", "config");
  try {
    const info = await Purchases.restorePurchases();
    const a = assinaturaDeCustomerInfo(info);
    setAssinatura(a);
    return a;
  } catch (e) {
    throw traduzErro(e);
  }
}

/** Relê o estado atual (cache do RC, com rede quando dá). */
export async function sincronizarAssinatura(): Promise<Assinatura | null> {
  if (!API_KEY || !configurado) return null;
  try {
    const info = await Purchases.getCustomerInfo();
    const a = assinaturaDeCustomerInfo(info);
    setAssinatura(a);
    return a;
  } catch {
    return null; // offline: fica com o que já estava salvo
  }
}

/** Avisa quando a loja mexe na assinatura (renovou, expirou, reembolsou…). */
export function ouvirAssinatura(cb: (a: Assinatura) => void): () => void {
  if (!API_KEY || !configurado) return () => {};
  const listener = (info: CustomerInfo) => {
    const a = assinaturaDeCustomerInfo(info);
    setAssinatura(a);
    cb(a);
  };
  Purchases.addCustomerInfoUpdateListener(listener);
  return () => Purchases.removeCustomerInfoUpdateListener(listener);
}

/** Abre a tela de gerenciar/cancelar da loja. */
export async function abrirGerenciarAssinatura(): Promise<void> {
  try {
    await Purchases.showManageSubscriptions();
  } catch (e) {
    throw traduzErro(e);
  }
}

/** iOS: folha de resgate de código promocional (Offer Codes). */
export async function abrirResgateDeCodigo(): Promise<void> {
  if (Platform.OS !== "ios") return;
  try {
    await Purchases.presentCodeRedemptionSheet();
  } catch {
    /* iOS < 14 ou indisponível — silencioso */
  }
}

// ── Atributos (remarketing / suporte) ─────────────────────────

/**
 * Manda o lead pro RevenueCat. É o que liga o e-mail do app à assinatura no
 * dashboard — e o que permite reencontrar a pessoa depois pela integração de
 * e-mail/webhook, sem nenhum SDK de tracking dentro do app.
 */
export async function identificarNoBilling(email?: string, nome?: string): Promise<void> {
  if (!API_KEY || !configurado) return;
  try {
    if (email) await Purchases.setEmail(email);
    if (nome) await Purchases.setDisplayName(nome);
  } catch {
    /* atributo é best-effort; nunca bloqueia o usuário */
  }
}

/** Atributos livres — aparecem no perfil do cliente no dashboard. */
export async function marcarAtributos(attrs: Record<string, string | null>): Promise<void> {
  if (!API_KEY || !configurado) return;
  try {
    await Purchases.setAttributes(attrs);
  } catch {
    /* idem */
  }
}

/** Só pra tela de diagnóstico dos Ajustes. */
export function offeringId(): string | null {
  return offeringAtual?.identifier ?? null;
}
