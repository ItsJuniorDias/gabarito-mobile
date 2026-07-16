import { StyleSheet, Text, type TextProps, type TextStyle } from "react-native";
import { cor, fonte } from "@/theme/tokens";

type Variante =
  | "h1"
  | "h2"
  | "h3"
  | "corpo"
  | "corpoG"
  | "peq"
  | "micro"
  | "eyebrow"
  | "mono"
  | "enunciado";

interface Props extends TextProps {
  v?: Variante;
  /** Atalho de cor. Default depende da variante. */
  c?: string;
  center?: boolean;
}

const base: Record<Variante, TextStyle> = {
  h1: {
    fontFamily: fonte.sansBold,
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: -0.6,
    color: cor.ink,
  },
  h2: {
    fontFamily: fonte.sansSemi,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.3,
    color: cor.ink,
  },
  h3: {
    fontFamily: fonte.sansSemi,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.2,
    color: cor.ink,
  },
  corpo: { fontFamily: fonte.sans, fontSize: 15, lineHeight: 22, color: cor.ink2 },
  corpoG: { fontFamily: fonte.sans, fontSize: 17, lineHeight: 26, color: cor.ink2 },
  peq: { fontFamily: fonte.sans, fontSize: 13.5, lineHeight: 19, color: cor.ink2 },
  micro: { fontFamily: fonte.sans, fontSize: 12, lineHeight: 16, color: cor.ink3 },
  eyebrow: {
    fontFamily: fonte.monoMedium,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: cor.ink3,
  },
  mono: {
    fontFamily: fonte.mono,
    fontSize: 13,
    lineHeight: 18,
    color: cor.ink2,
    fontVariant: ["tabular-nums"],
  },
  enunciado: { fontFamily: fonte.sans, fontSize: 17, lineHeight: 29, color: cor.ink },
};

const styles = StyleSheet.create(base);

export function Texto({ v = "corpo", c, center, style, ...rest }: Props) {
  return (
    <Text
      style={[
        styles[v],
        c ? { color: c } : null,
        center ? { textAlign: "center" } : null,
        style,
      ]}
      {...rest}
    />
  );
}
