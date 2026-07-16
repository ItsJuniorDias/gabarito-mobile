import { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { ArrowLeft } from "lucide-react-native";
import { cor, esp, fonte } from "@/theme/tokens";
import { Texto } from "@/components/ui/Texto";

/**
 * Cabeçalho do onboarding: a folha de prova.
 *
 * O progresso não é uma barra — é a fileira de bolhas do cartão-resposta
 * sendo preenchida a lápis. É o mesmo gesto que a pessoa vai repetir no app
 * inteiro, então o cadastro já ensina a interface em vez de atrapalhar.
 */
export function CabecalhoFicha({
  passo,
  total,
  onVoltar,
}: {
  /** 0-based. */
  passo: number;
  total: number;
  onVoltar?: () => void;
}) {
  return (
    <View>
      <View style={s.topo}>
        {onVoltar ? (
          <Pressable onPress={onVoltar} hitSlop={12} style={s.voltar} accessibilityLabel="Voltar">
            <ArrowLeft size={15} color={cor.ink2} />
            <Texto v="eyebrow">voltar</Texto>
          </Pressable>
        ) : (
          <Texto v="eyebrow">ficha de inscrição</Texto>
        )}
        <Texto v="mono" c={cor.ink3} style={s.contador}>
          {`${String(Math.min(passo + 1, total)).padStart(2, "0")}/${String(total).padStart(2, "0")}`}
        </Texto>
      </View>

      <View style={s.trilha} accessibilityRole="progressbar">
        {Array.from({ length: total }).map((_, i) => (
          <BolhaProgresso key={i} preenchida={i <= passo} atual={i === passo} indice={i} />
        ))}
      </View>
    </View>
  );
}

function BolhaProgresso({
  preenchida,
  atual,
  indice,
}: {
  preenchida: boolean;
  atual: boolean;
  indice: number;
}) {
  const escala = useSharedValue(preenchida ? 1 : 0);

  useEffect(() => {
    escala.value = preenchida
      ? withSpring(1, { damping: 13, stiffness: 240 })
      : withTiming(0, { duration: 140 });
  }, [preenchida, escala]);

  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: escala.value }],
    opacity: escala.value,
  }));

  return (
    <View
      style={[
        s.bolha,
        { borderColor: preenchida ? cor.graphite : cor.line2 },
        atual && { borderColor: cor.azul },
      ]}
      // O leitor de tela não precisa ouvir "bolha" seis vezes: o contador
      // "03/06" acima já diz onde a pessoa está.
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { borderRadius: 6, backgroundColor: atual ? cor.azul : cor.graphite },
          anim,
        ]}
      />
      <View style={{ opacity: 0 }} pointerEvents="none">
        <Texto v="mono" style={{ fontSize: 7 }}>
          {indice}
        </Texto>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  topo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: esp.md,
    minHeight: 20,
  },
  voltar: { flexDirection: "row", alignItems: "center", gap: 6 },
  contador: { fontSize: 11, fontFamily: fonte.monoMedium, letterSpacing: 1 },
  trilha: { flexDirection: "row", gap: 6 },
  bolha: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    overflow: "hidden",
  },
});
