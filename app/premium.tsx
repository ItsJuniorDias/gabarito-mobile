import { Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ArrowLeft, ExternalLink, Gift } from "lucide-react-native";
import { useAssinatura } from "@/context/SubscriptionContext";
import { planoById } from "@/data/planos";
import type { Assinatura } from "@/types";
import { cor, esp } from "@/theme/tokens";
import { Tela } from "@/components/ui/Tela";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Texto } from "@/components/ui/Texto";
import { Paywall } from "@/components/Paywall";
import { CarimboAprovado } from "@/components/CarimboAprovado";

/**
 * Tela de planos (modal).
 *
 * Casca fina: o miolo é o `<Paywall>`, o mesmo que o onboarding usa no último
 * passo. Um paywall só, um copy só, um lugar pra mexer no preço.
 */
export default function PremiumScreen() {
  const { premium, assinatura } = useAssinatura();

  const fechar = () => (router.canGoBack() ? router.back() : router.replace("/"));

  if (premium) return <PremiumAtivo assinatura={assinatura} onVoltar={fechar} />;

  return (
    <Tela emTabs={false}>
      <Pressable onPress={fechar} hitSlop={10} style={s.voltar}>
        <ArrowLeft size={16} color={cor.ink2} />
        <Texto v="peq">voltar</Texto>
      </Pressable>
      <View style={{ marginTop: esp.xl }}>
        <Paywall contexto="modal" onFechar={fechar} aoAssinar={fechar} />
      </View>
    </Tela>
  );
}

// ── Estado premium ativo ──────────────────────────────────────

function PremiumAtivo({
  assinatura,
  onVoltar,
}: {
  assinatura: Assinatura;
  onVoltar: () => void;
}) {
  const { gerenciar, resgatarCodigo, premiumDev } = useAssinatura();
  const p = assinatura.plano ? planoById(assinatura.plano) : undefined;
  const data = (t?: number) => (t ? new Date(t).toLocaleDateString("pt-BR") : null);

  return (
    <Tela emTabs={false}>
      <Animated.View entering={FadeInDown.duration(400)} style={{ marginTop: esp.xxxl }}>
        <Card marks style={s.ativo}>
          <CarimboAprovado pequeno />
          <Texto v="h1" center style={{ marginTop: esp.xl, fontSize: 26 }}>
            {assinatura.emTrial ? "Seu teste começou" : "Você é Premium"}
          </Texto>
          <Texto v="corpo" center style={{ marginTop: esp.sm }}>
            Simulados e modelos liberados sem limite. Bons estudos.
          </Texto>

          <View style={s.selos}>
            {p && (
              <Badge tom="azul" mono>
                {`plano ${p.nome.toLowerCase()}`}
              </Badge>
            )}
            {assinatura.emTrial && (
              <Badge tom="ok" mono>
                em teste grátis
              </Badge>
            )}
            {premiumDev && (
              <Badge tom="no" mono>
                simulado (dev)
              </Badge>
            )}
            {data(assinatura.desde) && !assinatura.emTrial && (
              <Badge mono>{`desde ${data(assinatura.desde)}`}</Badge>
            )}
          </View>

          {/* A data que importa é a próxima cobrança — ou a do fim, se a
              pessoa já cancelou e ainda está no período pago. */}
          {data(assinatura.expiraEm) && (
            <Texto v="peq" center c={cor.ink3} style={{ marginTop: esp.lg }}>
              {assinatura.renova === false
                ? `Acesso até ${data(assinatura.expiraEm)}. Não renova.`
                : `Renova em ${data(assinatura.expiraEm)}.`}
            </Texto>
          )}

          <Button size="lg" full style={{ marginTop: esp.xxl }} onPress={onVoltar}>
            Começar a estudar
          </Button>

          <Button
            variant="outline"
            full
            style={{ marginTop: esp.md }}
            onPress={() => void gerenciar()}
            iconRight={<ExternalLink size={14} color={cor.ink} />}
          >
            Gerenciar assinatura
          </Button>

          <Pressable
            onPress={() => void resgatarCodigo()}
            hitSlop={8}
            style={s.codigo}
          >
            <Gift size={12} color={cor.ink3} />
            <Texto v="micro">tenho um código promocional</Texto>
          </Pressable>
        </Card>
      </Animated.View>
    </Tela>
  );
}

const s = StyleSheet.create({
  voltar: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start" },
  ativo: { padding: esp.xxxl, alignItems: "center" },
  selos: {
    marginTop: esp.xl,
    flexDirection: "row",
    justifyContent: "center",
    gap: esp.sm,
    flexWrap: "wrap",
  },
  codigo: {
    marginTop: esp.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
});
