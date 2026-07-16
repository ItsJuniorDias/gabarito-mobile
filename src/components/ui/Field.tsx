import type { ReactNode } from "react";
import { useCallback, useState } from "react";
import {
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type LayoutChangeEvent,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Minus, Plus } from "lucide-react-native";
import { alpha, cor, esp, fonte, raio } from "@/theme/tokens";
import { Texto } from "@/components/ui/Texto";
import { clamp } from "@/lib/utils";

// ── Label ─────────────────────────────────────────────────────

export function Label({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return (
    <View style={[{ marginBottom: esp.sm }, style]}>
      <Texto v="eyebrow">{children}</Texto>
    </View>
  );
}

// ── Input ─────────────────────────────────────────────────────

export function Input({ style, ...rest }: TextInputProps) {
  const [focado, setFocado] = useState(false);
  return (
    <TextInput
      placeholderTextColor={cor.ink3}
      selectionColor={cor.azul}
      onFocus={() => setFocado(true)}
      onBlur={() => setFocado(false)}
      style={[s.input, focado && { borderColor: cor.azul }, style]}
      {...rest}
    />
  );
}

// ── Segmented control ─────────────────────────────────────────

interface SegOption<T extends string> {
  value: T;
  label: string;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: SegOption<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  const [larg, setLarg] = useState(0);
  const idx = Math.max(0, options.findIndex((o) => o.value === value));
  const passo = larg > 0 ? (larg - 8) / options.length : 0;

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setLarg(e.nativeEvent.layout.width);
  }, []);

  return (
    <View style={s.segWrap} onLayout={onLayout}>
      {passo > 0 && (
        <Animated.View
          style={[
            s.segPill,
            { width: passo, transform: [{ translateX: idx * passo }] },
          ]}
        />
      )}
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            onPress={() => {
              if (on) return;
              void Haptics.selectionAsync();
              onChange(o.value);
            }}
            style={s.segItem}
          >
            <Text
              numberOfLines={1}
              style={[s.segTxt, { color: on ? cor.ink : cor.ink3 }]}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ── Stepper numérico ──────────────────────────────────────────

export function Stepper({
  value,
  onChange,
  min = 1,
  max = 30,
  step = 1,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  const set = (v: number) => {
    const n = clamp(v, min, max);
    if (n === value) return;
    void Haptics.selectionAsync();
    onChange(n);
  };
  return (
    <View style={s.stepWrap}>
      <Pressable
        accessibilityLabel="Diminuir"
        accessibilityRole="button"
        onPress={() => set(value - step)}
        disabled={value <= min}
        style={({ pressed }) => [
          s.stepBtn,
          { opacity: value <= min ? 0.3 : pressed ? 0.6 : 1 },
        ]}
        hitSlop={4}
      >
        <Minus size={17} color={cor.ink2} />
      </Pressable>
      <Text style={s.stepVal}>{value}</Text>
      <Pressable
        accessibilityLabel="Aumentar"
        accessibilityRole="button"
        onPress={() => set(value + step)}
        disabled={value >= max}
        style={({ pressed }) => [
          s.stepBtn,
          { opacity: value >= max ? 0.3 : pressed ? 0.6 : 1 },
        ]}
        hitSlop={4}
      >
        <Plus size={17} color={cor.ink2} />
      </Pressable>
    </View>
  );
}

// ── Toggle ────────────────────────────────────────────────────

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked }}
      onPress={() => {
        void Haptics.selectionAsync();
        if (Platform.OS === "android") {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        }
        onChange(!checked);
      }}
      style={s.togWrap}
    >
      <View style={[s.togTrilho, { backgroundColor: checked ? cor.azul : cor.line2 }]}>
        <View style={[s.togBola, { left: checked ? 20 : 2 }]} />
      </View>
      <Texto v="peq">{label}</Texto>
    </Pressable>
  );
}

// ── Slider (temperatura) ──────────────────────────────────────
// O RN não tem slider nativo multiplataforma; este é o mínimo honesto:
// gesto de arrasto sobre um trilho, com a bolinha na thread da UI.

export function Slider({
  value,
  onChange,
  min = 0,
  max = 1.2,
  step = 0.1,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  const [larg, setLarg] = useState(0);
  const util = Math.max(1, larg - 24);
  const x = useSharedValue(((value - min) / (max - min)) * util);

  const aplicar = useCallback(
    (px: number) => {
      const bruto = min + (px / util) * (max - min);
      const arred = Math.round(bruto / step) * step;
      const v = Number(clamp(arred, min, max).toFixed(2));
      if (v !== value) onChange(v);
    },
    [min, max, step, util, value, onChange],
  );

  const pan = Gesture.Pan()
    .onChange((e) => {
      x.value = Math.min(util, Math.max(0, x.value + e.changeX));
      runOnJS(aplicar)(x.value);
    })
    .onFinalize(() => {
      x.value = withSpring(x.value, { damping: 20, stiffness: 300 });
    });

  const bola = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  const trilho = useAnimatedStyle(() => ({ width: x.value + 12 }));

  return (
    <GestureDetector gesture={pan}>
      <View
        style={s.sliderWrap}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          setLarg(w);
          x.value = ((value - min) / (max - min)) * Math.max(1, w - 24);
        }}
      >
        <View style={s.sliderTrilho} />
        <Animated.View style={[s.sliderAtivo, trilho]} />
        <Animated.View style={[s.sliderBola, bola]} />
      </View>
    </GestureDetector>
  );
}

const s = StyleSheet.create({
  input: {
    height: 46,
    borderRadius: raio.base,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: cor.line2,
    backgroundColor: cor.card,
    paddingHorizontal: 14,
    fontFamily: fonte.sans,
    fontSize: 15,
    color: cor.ink,
  },
  // segmented
  segWrap: {
    flexDirection: "row",
    borderRadius: raio.base,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: cor.line2,
    backgroundColor: cor.paper2,
    padding: 4,
  },
  segPill: {
    position: "absolute",
    top: 4,
    left: 4,
    bottom: 4,
    borderRadius: raio.sm,
    backgroundColor: cor.card,
  },
  segItem: { flex: 1, paddingVertical: 8, alignItems: "center" },
  segTxt: { fontFamily: fonte.sansMedium, fontSize: 13.5, includeFontPadding: false },
  // stepper
  stepWrap: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: raio.base,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: cor.line2,
    backgroundColor: cor.card,
  },
  stepBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  stepVal: {
    width: 46,
    textAlign: "center",
    fontFamily: fonte.monoMedium,
    fontSize: 18,
    color: cor.ink,
    fontVariant: ["tabular-nums"],
  },
  // toggle
  togWrap: { flexDirection: "row", alignItems: "center", gap: 10 },
  togTrilho: { width: 38, height: 22, borderRadius: 11, justifyContent: "center" },
  togBola: {
    position: "absolute",
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: cor.branco,
  },
  // slider
  sliderWrap: { height: 36, justifyContent: "center" },
  sliderTrilho: {
    height: 5,
    borderRadius: 3,
    backgroundColor: cor.line2,
    marginHorizontal: 6,
  },
  sliderAtivo: {
    position: "absolute",
    left: 6,
    height: 5,
    borderRadius: 3,
    backgroundColor: cor.azul,
  },
  sliderBola: {
    position: "absolute",
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: cor.card,
    borderWidth: 2,
    borderColor: cor.azul,
    shadowColor: alpha(cor.ink, 1),
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
});
