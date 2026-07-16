import { useEffect, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  Apple,
  BadgeCheck,
  Check,
  Play,
  ShieldCheck,
} from "lucide-react-native";
import {
  useAssinatura,
  type MotivoPaywall,
} from "@/context/SubscriptionContext";
import { usePerfil } from "@/context/PerfilContext";
import { BENEFICIOS } from "@/data/planos";
import type { PlanoId, PlanoOferta } from "@/types";
import { alpha, cor, esp, fonte, raio } from "@/theme/tokens";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Texto } from "@/components/ui/Texto";
import { CarimboAprovado } from "@/components/CarimboAprovado";

/**
 * Links legais — exigidos pela App Store (3.1.2) DENTRO do paywall.
 *
 * Não é firula: paywall de assinatura sem duração, preço por período, EULA e
 * política de privacidade visíveis é rejeição na revisão. O EULA padrão da
 * Apple serve enquanto você não tiver o seu.
 */
const URL_TERMOS =
  process.env.EXPO_PUBLIC_URL_TERMOS ||
  "https://app.notion.com/p/Termos-de-Uso-Completo-Gabarito-39fbd4163b3b81018e64d954d4800b5b?source=copy_link";

const URL_PRIVACIDADE =
  process.env.EXPO_PUBLIC_URL_PRIVACIDADE ||
  "https://app.notion.com/p/Pol-tica-de-Privacidade-Completa-Gabarito-39fbd4163b3b8151b47cc6ade8c85ff0?source=copy_link";

/** Marca-texto — no RN um <Text> aninhado com fundo vira grifo de verdade. */
function Grifo({ children }: { children: ReactNode }) {
  return (
    <Texto v="h1" style={s.grifo}>
      {children}
    </Texto>
  );
}

interface Copy {
  titulo: ReactNode;
  sub: string;
}

/** Copy do paywall por motivo. O do onboarding usa o plano recém-montado. */
function copyDoMotivo(
  motivo: MotivoPaywall,
  ctx: { dias: number | null; questoes: number | null },
): Copy {
  switch (motivo) {
    case "limite":
      return {
        titulo: (
          <>
            Acabaram seus simulados <Grifo>grátis</Grifo> da semana.
          </>
        ),
        sub: "No Premium você gera quantos simulados quiser, na hora que bater a vontade de estudar. Sem esperar a semana virar.",
      };
    case "revisao":
      return {
        titulo: (
          <>
            Transforme seus erros num <Grifo>plano de estudo</Grifo>.
          </>
        ),
        sub: "A revisão inteligente gera questões novas exatamente nos seus pontos fracos — o motivo nº 1 pra assinar.",
      };
    case "questoes":
      return {
        titulo: (
          <>
            Simulados de verdade, com <Grifo>30 questões</Grifo>.
          </>
        ),
        sub: "Solte o limite de 10 questões, use todos os modelos de IA e treine no volume de uma prova real.",
      };
    case "modelo":
      return {
        titulo: (
          <>
            Desbloqueie os <Grifo>modelos mais fortes</Grifo>.
          </>
        ),
        sub: "Questões melhor elaboradas com os modelos de ponta — além de simulados ilimitados e revisão inteligente.",
      };
    case "aha":
      return {
        titulo: (
          <>
            Mantenha o ritmo até a <Grifo>aprovação</Grifo>.
          </>
        ),
        sub: "Você foi bem — agora deixe a revisão inteligente atacar o que ainda falha, sem limite de simulados.",
      };
    case "onboarding":
      return {
        titulo:
          ctx.dias != null ? (
            <>
              {`Faltam ${ctx.dias} dias. `}
              <Grifo>Sem freio</Grifo> até lá.
            </>
          ) : (
            <>
              Seu plano está pronto. <Grifo>Solte o limite</Grifo>.
            </>
          ),
        sub:
          ctx.questoes != null
            ? `São ${ctx.questoes.toLocaleString("pt-BR")} questões até a prova no ritmo que você escolheu. No grátis dá pra gerar 3 simulados por semana — no Premium, quantos você aguentar.`
            : "No grátis você gera 3 simulados por semana. No Premium, quantos quiser — com revisão inteligente nos seus pontos fracos.",
      };
    default:
      return {
        titulo: (
          <>
            Estude sem freio até <Grifo>passar</Grifo>.
          </>
        ),
        sub: "Simulados com IA ilimitados, revisão inteligente dos seus erros e todos os modelos. Cancele quando quiser.",
      };
  }
}

/** Texto legal da renovação. A loja exige e o usuário merece. */
function textoRenovacao(
  oferta: PlanoOferta | undefined,
  trial: number,
): string {
  const loja = Platform.OS === "ios" ? "App Store" : "Google Play";
  const preco = oferta?.precoLabel ?? "";
  const periodo = oferta?.id === "anual" ? "ano" : "mês";
  const inicio =
    trial > 0
      ? `Depois dos ${trial} dias de teste grátis, a assinatura `
      : "A assinatura ";
  return (
    `${inicio}renova automaticamente por ${preco}/${periodo} e é cobrada na sua conta da ${loja}. ` +
    `Cancele quando quiser, até 24 h antes da renovação, direto nos ajustes da ${loja}.`
  );
}

export function Paywall({
  contexto = "modal",
  onFechar,
  aoAssinar,
}: {
  /** "onboarding" = último passo do fluxo; "modal" = tela /premium. */
  contexto?: "modal" | "onboarding";
  onFechar: () => void;
  aoAssinar?: () => void;
}) {
  const {
    ofertas,
    ofertaPor,
    carregandoOfertas,
    ofertasDaLoja,
    recarregarOfertas,
    modo,
    comprando,
    restaurando,
    erro,
    limparErro,
    assinar,
    restaurar,
    motivoPaywall,
    setMotivoPaywall,
  } = useAssinatura();
  const { diasAteProva, questoesAteProva } = usePerfil();

  const [escolhido, setPlano] = useState<PlanoId>("anual");
  // A loja manda no que existe: se o plano escolhido sumiu do offering,
  // caímos no primeiro disponível em vez de renderizar um cartão vazio.
  const plano = ofertas.some((o) => o.id === escolhido)
    ? escolhido
    : (ofertas[0]?.id ?? escolhido);

  useEffect(() => {
    if (contexto === "onboarding") setMotivoPaywall("onboarding");
  }, [contexto, setMotivoPaywall]);

  const copy = copyDoMotivo(motivoPaywall, {
    dias: diasAteProva,
    questoes: questoesAteProva,
  });
  const atual = ofertaPor(plano);
  const trial = atual?.trialDias ?? 0;

  const comprar = async () => {
    const ok = await assinar(plano);
    if (ok) aoAssinar?.();
  };

  return (
    <>
      {/* ── Hero ── */}
      <Animated.View entering={FadeInDown.duration(400)}>
        <View style={s.eyebrowLinha}>
          <BadgeCheck size={14} color={cor.ok} />
          <Texto v="eyebrow">gabarito premium</Texto>
        </View>
        <Texto v="h1" style={s.h1}>
          {copy.titulo}
        </Texto>
        <Texto v="corpoG" style={{ marginTop: esp.lg }}>
          {copy.sub}
        </Texto>

        <View style={{ marginTop: esp.xxl, gap: esp.md }}>
          {BENEFICIOS.map((b) => (
            <View key={b} style={s.beneficio}>
              <View style={s.check}>
                <Check size={12} color={cor.okInk} />
              </View>
              <Texto v="corpo" c={cor.ink} style={{ flex: 1, fontSize: 14.5 }}>
                {b}
              </Texto>
            </View>
          ))}
        </View>
      </Animated.View>

      <View style={s.carimboWrap}>
        <CarimboAprovado />
      </View>

      {/* ── Planos ── */}
      <View style={{ marginTop: esp.xxxl, gap: esp.md }}>
        {ofertas.map((o) => (
          <CartaoPlano
            key={o.id}
            oferta={o}
            on={o.id === plano}
            carregando={carregandoOfertas && !ofertasDaLoja}
            onPress={() => setPlano(o.id)}
          />
        ))}
      </View>

      {/* ── Erro ── */}
      {erro && (
        <Pressable onPress={limparErro} style={s.erro}>
          <Texto v="peq" c={cor.noInk} style={{ lineHeight: 19 }}>
            {erro}
          </Texto>
          <Texto v="micro" c={cor.noInk} style={{ marginTop: 4, opacity: 0.7 }}>
            toque pra dispensar
          </Texto>
        </Pressable>
      )}

      {modo === "ausente" && <ConfigAusente />}

      {/* ── Ação ── */}
      <Button
        size="lg"
        full
        style={{ marginTop: esp.xl }}
        disabled={modo === "ausente" || !!comprando}
        loading={comprando === plano}
        onPress={() => void comprar()}
      >
        {trial > 0
          ? `Começar ${trial} dias grátis`
          : `Assinar ${atual?.nome.toLowerCase() ?? ""} · ${atual?.precoLabel ?? ""}`}
      </Button>

      {trial > 0 && (
        <Texto v="peq" center c={cor.ink3} style={{ marginTop: esp.md }}>
          {`Grátis por ${trial} dias. Depois ${atual?.precoLabel}${atual?.periodoLabel}.`}
        </Texto>
      )}

      <View style={s.selo}>
        {Platform.OS === "ios" ? (
          <Apple size={12} color={cor.ink3} />
        ) : (
          <Play size={12} color={cor.ink3} />
        )}
        <Texto v="micro">
          {Platform.OS === "ios"
            ? "cobrança pela App Store · Face ID ou senha"
            : "cobrança pelo Google Play"}
        </Texto>
      </View>

      {/* ── Restaurar / sair ── */}
      <View style={{ marginTop: esp.xl, gap: esp.lg }}>
        <Pressable
          onPress={() => void restaurar()}
          hitSlop={8}
          disabled={restaurando}
          accessibilityRole="button"
        >
          <View style={s.linhaCentro}>
            {restaurando && (
              <ActivityIndicator size="small" color={cor.azulInk} />
            )}
            <Texto
              v="peq"
              center
              c={cor.azulInk}
              style={{ fontFamily: fonte.sansMedium }}
            >
              já assinou? restaurar compras
            </Texto>
          </View>
        </Pressable>

        {contexto === "onboarding" && (
          <Pressable onPress={onFechar} hitSlop={8} accessibilityRole="button">
            <Texto v="peq" center c={cor.ink3}>
              continuar no plano grátis
            </Texto>
          </Pressable>
        )}
      </View>

      {/* ── Legal (exigido pela loja) ── */}
      <Texto v="micro" center style={s.legal}>
        {textoRenovacao(atual, trial)}
      </Texto>
      <View style={s.links}>
        <Pressable
          onPress={() => void WebBrowser.openBrowserAsync(URL_TERMOS)}
          hitSlop={8}
        >
          <Texto v="micro" c={cor.ink2} style={s.link}>
            Termos de uso
          </Texto>
        </Pressable>
        <Texto v="micro" c={cor.line2}>
          ·
        </Texto>
        <Pressable
          onPress={() => void WebBrowser.openBrowserAsync(URL_PRIVACIDADE)}
          hitSlop={8}
        >
          <Texto v="micro" c={cor.ink2} style={s.link}>
            Privacidade
          </Texto>
        </Pressable>
        {!ofertasDaLoja && modo === "revenuecat" && (
          <>
            <Texto v="micro" c={cor.line2}>
              ·
            </Texto>
            <Pressable onPress={() => void recarregarOfertas()} hitSlop={8}>
              <Texto v="micro" c={cor.ink2} style={s.link}>
                atualizar preços
              </Texto>
            </Pressable>
          </>
        )}
      </View>
    </>
  );
}

// ── Cartão de plano ───────────────────────────────────────────

function CartaoPlano({
  oferta,
  on,
  carregando,
  onPress,
}: {
  oferta: PlanoOferta;
  on: boolean;
  carregando: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: on }}
    >
      <Card
        style={[s.plano, on ? { borderColor: cor.azul, borderWidth: 2 } : null]}
        lift={on}
      >
        {oferta.destaque && (
          <View style={s.destaque}>
            <Badge tom="mark" mono>
              {oferta.economiaPct
                ? `economize ${oferta.economiaPct}%`
                : "melhor valor"}
            </Badge>
          </View>
        )}
        <View style={s.planoTopo}>
          <View
            style={{ flexDirection: "row", alignItems: "center", gap: esp.sm }}
          >
            <Texto v="h2">{oferta.nome}</Texto>
            {oferta.trialDias > 0 && (
              <Badge tom="ok" mono>
                {`${oferta.trialDias} dias grátis`}
              </Badge>
            )}
          </View>
          <View
            style={[
              s.radio,
              on ? { borderColor: cor.azul, backgroundColor: cor.azul } : null,
            ]}
          >
            {on && <Check size={12} color={cor.branco} />}
          </View>
        </View>

        <View style={s.precoLinha}>
          {carregando ? (
            <View style={s.precoSkeleton} />
          ) : (
            <Texto v="mono" c={cor.ink} style={s.preco}>
              {oferta.precoLabel}
            </Texto>
          )}
          <Texto v="peq" c={cor.ink3} style={{ marginBottom: 4 }}>
            {oferta.periodoLabel}
          </Texto>
        </View>

        {oferta.precoMensalLabel && (
          <Texto v="peq" c={cor.ink3} style={{ marginTop: 2 }}>
            {`equivale a ${oferta.precoMensalLabel}/mês`}
          </Texto>
        )}
      </Card>
    </Pressable>
  );
}

// ── Config ausente ────────────────────────────────────────────

function ConfigAusente() {
  return (
    <Card style={[s.card, { marginTop: esp.lg }]}>
      <View style={{ flexDirection: "row", gap: esp.md }}>
        <View style={s.iconeAviso}>
          <ShieldCheck size={18} color={cor.ink} />
        </View>
        <View style={{ flex: 1 }}>
          <Texto v="h3">Assinatura ainda não configurada</Texto>
          <Texto v="peq" style={{ marginTop: 4, lineHeight: 20 }}>
            Defina{" "}
            <Texto v="mono" style={s.code}>
              EXPO_PUBLIC_RC_IOS_KEY
            </Texto>{" "}
            e{" "}
            <Texto v="mono" style={s.code}>
              EXPO_PUBLIC_RC_ANDROID_KEY
            </Texto>{" "}
            com as chaves públicas do seu projeto no RevenueCat, crie os
            produtos na App Store Connect / Play Console e rode um development
            build. Os preços acima são só de exibição. Veja o README.
          </Texto>
        </View>
      </View>
    </Card>
  );
}

const s = StyleSheet.create({
  eyebrowLinha: { flexDirection: "row", alignItems: "center", gap: 7 },
  h1: { marginTop: esp.md, fontSize: 32, lineHeight: 37 },
  grifo: { backgroundColor: alpha(cor.mark, 0.75), color: cor.ink },
  beneficio: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  check: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: cor.okWash,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  carimboWrap: { marginTop: esp.xxxl, alignItems: "center" },
  // planos
  plano: { padding: esp.xl },
  destaque: { position: "absolute", top: -10, right: 14, zIndex: 1 },
  planoTopo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: cor.line2,
    alignItems: "center",
    justifyContent: "center",
  },
  precoLinha: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
    marginTop: esp.md,
  },
  preco: {
    fontSize: 30,
    lineHeight: 34,
    fontFamily: fonte.monoBold,
    letterSpacing: -0.8,
  },
  precoSkeleton: {
    width: 110,
    height: 30,
    borderRadius: raio.sm,
    backgroundColor: cor.paper2,
  },
  // checkout
  card: { padding: esp.xl },
  erro: {
    marginTop: esp.lg,
    borderRadius: raio.base,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: alpha(cor.no, 0.3),
    backgroundColor: alpha(cor.noWash, 0.6),
    paddingHorizontal: esp.md,
    paddingVertical: esp.md,
  },
  selo: {
    marginTop: esp.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  linhaCentro: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  iconeAviso: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: alpha(cor.mark, 0.4),
    alignItems: "center",
    justifyContent: "center",
  },
  code: { fontSize: 12.5, color: cor.ink },
  legal: { marginTop: esp.xxl, lineHeight: 17 },
  links: {
    marginTop: esp.md,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: esp.sm,
  },
  link: { textDecorationLine: "underline" },
});
