import { StyleSheet, View } from "react-native";
import { alpha, cor, fonte } from "@/theme/tokens";
import { Texto } from "@/components/ui/Texto";

/**
 * Carimbo "APROVADO" — a assinatura visual do Premium.
 *
 * Mora aqui (e não no paywall) porque o onboarding também precisa dele: é a
 * imagem que a pessoa está comprando, e ela aparece no fim do plano de estudo
 * antes de qualquer preço.
 */
export function CarimboAprovado({ pequeno }: { pequeno?: boolean }) {
  const d = pequeno ? 96 : 158;
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[s.carimbo, { width: d, height: d, borderRadius: d / 2 }]}
    >
      <View style={[s.carimboInterno, { borderRadius: d / 2, margin: 3 }]} />
      <Texto v="mono" c={cor.ok} style={[s.carimboTxt, { fontSize: pequeno ? 14 : 20 }]}>
        Aprovado
      </Texto>
      <Texto v="mono" c={cor.ok} style={[s.carimboSub, { fontSize: pequeno ? 8 : 10 }]}>
        premium
      </Texto>
    </View>
  );
}

const s = StyleSheet.create({
  carimbo: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: cor.ok,
    transform: [{ rotate: "-6deg" }],
  },
  carimboInterno: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderWidth: 3,
    borderColor: alpha(cor.ok, 0.15),
  },
  carimboTxt: {
    fontFamily: fonte.monoBold,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  carimboSub: {
    fontFamily: fonte.mono,
    textTransform: "uppercase",
    letterSpacing: 2.5,
    opacity: 0.7,
    marginTop: 3,
  },
});
