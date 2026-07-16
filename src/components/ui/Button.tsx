import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type ViewStyle,
} from "react-native";
import * as Haptics from "expo-haptics";
import { alpha, cor, fonte, raio } from "@/theme/tokens";

type Variante = "primary" | "outline" | "ghost" | "subtle" | "danger";
type Tamanho = "sm" | "md" | "lg";

interface Props extends Omit<PressableProps, "style" | "children"> {
  children: ReactNode;
  variant?: Variante;
  size?: Tamanho;
  /** Ícone à esquerda do rótulo. */
  icon?: ReactNode;
  /** Ícone à direita. */
  iconRight?: ReactNode;
  loading?: boolean;
  style?: ViewStyle;
  full?: boolean;
}

const variantes: Record<Variante, { bg: string; fg: string; br?: string }> = {
  primary: { bg: cor.azul, fg: cor.branco },
  outline: { bg: cor.card, fg: cor.ink, br: cor.line2 },
  ghost: { bg: "transparent", fg: cor.ink2 },
  subtle: { bg: cor.azulWash, fg: cor.azulInk },
  danger: { bg: cor.card, fg: cor.noInk, br: alpha(cor.no, 0.4) },
};

const tamanhos: Record<Tamanho, { h: number; px: number; fs: number; r: number }> = {
  sm: { h: 34, px: 12, fs: 13, r: raio.sm },
  md: { h: 44, px: 16, fs: 14.5, r: raio.base },
  lg: { h: 52, px: 22, fs: 15.5, r: raio.md },
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  loading,
  disabled,
  style,
  full,
  onPress,
  ...rest
}: Props) {
  const v = variantes[variant];
  const t = tamanhos[size];
  const inativo = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={inativo}
      onPress={(e) => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.(e);
      }}
      style={({ pressed }) => [
        s.base,
        {
          height: t.h,
          paddingHorizontal: t.px,
          borderRadius: t.r,
          backgroundColor: variant === "primary" && inativo ? cor.ink3 : v.bg,
          borderWidth: v.br ? StyleSheet.hairlineWidth : 0,
          borderColor: v.br,
          opacity: inativo ? 0.6 : 1,
          transform: [{ translateY: pressed && !inativo ? 1 : 0 }],
        },
        full && { alignSelf: "stretch" },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.fg} />
      ) : (
        <>
          {icon}
          {typeof children === "string" ? (
            <Text
              style={[s.txt, { fontSize: t.fs, color: v.fg }]}
              numberOfLines={1}
            >
              {children}
            </Text>
          ) : (
            <View style={s.slot}>{children}</View>
          )}
          {iconRight}
        </>
      )}
    </Pressable>
  );
}

const s = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    alignSelf: "flex-start",
  },
  txt: { fontFamily: fonte.sansMedium, includeFontPadding: false },
  slot: { flexDirection: "row", alignItems: "center", gap: 7 },
});
