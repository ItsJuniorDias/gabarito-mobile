import { useEffect } from "react";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { cor, fonte } from "@/theme/tokens";

export type BubbleState =
  | "idle"
  | "selected"
  | "correct"
  | "incorrect"
  | "gabarito"; // correta não escolhida, em revisão

const tamanhos = {
  xs: { d: 16, f: 8 },
  sm: { d: 24, f: 11 },
  md: { d: 32, f: 13 },
  lg: { d: 36, f: 14 },
} as const;

interface Props {
  letra: string;
  state?: BubbleState;
  size?: keyof typeof tamanhos;
  style?: ViewStyle;
}

/**
 * Bolha do cartão-resposta. O preenchimento "a lápis" é a marca do app —
 * na web era um keyframe CSS; aqui é uma mola de verdade, porque no
 * mobile o dedo encosta na bolha e a resposta tátil faz parte do gesto.
 */
export function Bubble({ letra, state = "idle", size = "md", style }: Props) {
  const { d, f } = tamanhos[size];
  const preenchida = state === "selected" || state === "correct" || state === "incorrect";

  const escala = useSharedValue(preenchida ? 1 : 0);

  useEffect(() => {
    if (preenchida) {
      escala.value = withSequence(
        withTiming(1.12, { duration: 110 }),
        withSpring(1, { damping: 12, stiffness: 260 }),
      );
    } else {
      escala.value = withTiming(0, { duration: 120 });
    }
  }, [preenchida, escala]);

  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: escala.value }],
    opacity: escala.value,
  }));

  const borda =
    state === "correct" || state === "gabarito"
      ? cor.ok
      : state === "incorrect"
        ? cor.no
        : state === "selected"
          ? cor.graphite
          : cor.line2;

  const fundo =
    state === "correct" ? cor.ok : state === "incorrect" ? cor.no : cor.graphite;

  const txt = preenchida
    ? cor.branco
    : state === "gabarito"
      ? cor.okInk
      : cor.ink3;

  return (
    <View
      style={[
        s.wrap,
        { width: d, height: d, borderRadius: d / 2, borderColor: borda },
        style,
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { borderRadius: d / 2, backgroundColor: fundo },
          anim,
        ]}
      />
      <Text style={[s.letra, { fontSize: f, color: txt }]}>{letra}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    overflow: "hidden",
  },
  letra: {
    fontFamily: fonte.monoMedium,
    includeFontPadding: false,
    textAlign: "center",
  },
});
