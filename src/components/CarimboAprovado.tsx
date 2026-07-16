import { StyleSheet, View } from "react-native";
import { alpha, cor, fonte } from "@/theme/tokens";
import { Texto } from "@/components/ui/Texto";

/**
 * Carimbo "APROVADO" — a assinatura visual do Premium.
 *
 * Mora aqui (e não no paywall) porque o onboarding também precisa dele: é a
 * imagem que a pessoa está comprando, e ela aparece no fim do plano de estudo
 * antes de qualquer preço.
 *
 * O wrapper externo não é decorativo: `transform` não altera a caixa de layout,
 * então o bounding box do carimbo rotacionado vaza pra fora dos `d x d` que o
 * Yoga reservou. A folga devolve esse espaço ao fluxo.
 */
export function CarimboAprovado({ pequeno }: { pequeno?: boolean }) {
  const d = pequeno ? 96 : 158;
  const folga = Math.ceil(d * 0.06);
  const box = d + folga * 2;
  const fs = pequeno ? 14 : 20;
  const fsSub = pequeno ? 8 : 10;
  const ls = pequeno ? 1.5 : 2;
  const lsSub = pequeno ? 2 : 2.5;

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[s.folga, { width: box, height: box }]}
    >
      <View style={[s.carimbo, { width: d, height: d, borderRadius: d / 2 }]}>
        <View style={[s.carimboInterno, { borderRadius: d / 2 }]} />

        <Texto
          v="mono"
          c={cor.ok}
          numberOfLines={1}
          allowFontScaling={false}
          style={[
            s.carimboTxt,
            {
              fontSize: fs,
              lineHeight: Math.round(fs * 1.3),
              letterSpacing: ls,
              paddingLeft: ls,
            },
          ]}
        >
          Aprovado
        </Texto>

        <Texto
          v="mono"
          c={cor.ok}
          numberOfLines={1}
          allowFontScaling={false}
          style={[
            s.carimboSub,
            {
              fontSize: fsSub,
              lineHeight: Math.round(fsSub * 1.4),
              letterSpacing: lsSub,
              paddingLeft: lsSub,
            },
          ]}
        >
          premium
        </Texto>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  folga: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  carimbo: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: cor.ok,
    overflow: "visible",
    transform: [{ rotate: "-6deg" }],
  },
  carimboInterno: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    margin: 3,
    borderWidth: 3,
    borderColor: alpha(cor.ok, 0.15),
  },
  carimboTxt: {
    fontFamily: fonte.monoBold,
    textTransform: "uppercase",
    textAlign: "center",
    includeFontPadding: false,
  },
  carimboSub: {
    fontFamily: fonte.mono,
    textTransform: "uppercase",
    textAlign: "center",
    opacity: 0.7,
    marginTop: 3,
    includeFontPadding: false,
  },
});
