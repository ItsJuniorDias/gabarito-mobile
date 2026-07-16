import type { ReactNode } from "react";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";
import { alpha, cor, fonte, raio } from "@/theme/tokens";

export type Tom = "neutral" | "azul" | "ok" | "no" | "mark";

const tons: Record<Tom, { bg: string; fg: string; br: string }> = {
  neutral: { bg: cor.paper2, fg: cor.ink2, br: cor.line2 },
  azul: { bg: cor.azulWash, fg: cor.azulInk, br: alpha(cor.azul, 0.2) },
  ok: { bg: cor.okWash, fg: cor.okInk, br: alpha(cor.ok, 0.25) },
  no: { bg: cor.noWash, fg: cor.noInk, br: alpha(cor.no, 0.25) },
  mark: { bg: alpha(cor.mark, 0.4), fg: cor.ink, br: alpha(cor.markDeep, 0.4) },
};

/** O RN aplica letterSpacing depois do último glifo também — daí a compensação. */
const LS_MONO = 0.8;

export function Badge({
  children,
  tom = "neutral",
  mono,
  style,
}: {
  children: ReactNode;
  tom?: Tom;
  mono?: boolean;
  style?: ViewStyle;
}) {
  const t = tons[tom];
  return (
    <View style={[s.wrap, { backgroundColor: t.bg, borderColor: t.br }, style]}>
      {typeof children === "string" ? (
        <Text
          style={[s.txt, mono && s.mono, { color: t.fg }]}
          numberOfLines={1}
          // Chip de UI, não conteúdo: acima disso "economize 16%" estoura a tag.
          maxFontSizeMultiplier={1.2}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  );
}

const difMap: Record<string, { label: string; tom: Tom }> = {
  facil: { label: "fácil", tom: "ok" },
  medio: { label: "médio", tom: "azul" },
  dificil: { label: "difícil", tom: "no" },
};

export function DifBadge({ nivel }: { nivel: string }) {
  const d = difMap[nivel] ?? difMap.medio;
  return (
    <Badge tom={d.tom} mono>
      {d.label}
    </Badge>
  );
}

const s = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: raio.sm,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 7,
    paddingVertical: 3,
    alignSelf: "flex-start",
  },
  txt: {
    fontFamily: fonte.sansMedium,
    fontSize: 11,
    lineHeight: 14,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  mono: {
    fontFamily: fonte.monoMedium,
    textTransform: "uppercase",
    letterSpacing: LS_MONO,
    marginRight: -LS_MONO,
  },
});
