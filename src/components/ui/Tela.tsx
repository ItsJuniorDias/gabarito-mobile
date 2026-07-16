import type { ReactNode } from "react";
import { Platform, ScrollView, StyleSheet, View, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { cor, esp } from "@/theme/tokens";
import { PapelGrid } from "@/components/ui/PapelGrid";

/**
 * Casca de tela: papel + grade + insets.
 *
 * Detalhe de iOS 26: com a tab bar de vidro o conteúdo PRECISA correr por
 * baixo dela (é isso que faz o vidro existir). O react-native-screens já
 * aplica o content inset automático no iOS, então lá não somamos padding —
 * só no Android, onde a barra é opaca e o inset não vem de graça.
 */
export function Tela({
  children,
  scroll = true,
  grade = true,
  emTabs = true,
  topo = true,
  contentStyle,
}: {
  children: ReactNode;
  scroll?: boolean;
  grade?: boolean;
  /** A tela vive dentro das NativeTabs? (some no /simulado, /resultado…) */
  emTabs?: boolean;
  /** Respeitar o inset de topo (status bar). */
  topo?: boolean;
  contentStyle?: ViewStyle;
}) {
  const insets = useSafeAreaInsets();

  const padBottom =
    (emTabs && Platform.OS !== "ios" ? 96 : 0) + (emTabs ? 0 : insets.bottom) + esp.xxxl;

  const padding: ViewStyle = {
    paddingTop: topo ? insets.top + esp.md : esp.md,
    paddingHorizontal: esp.xl,
    paddingBottom: padBottom,
  };

  return (
    <View style={s.fundo}>
      {grade && <PapelGrid altura={340} />}
      {scroll ? (
        <ScrollView
          contentContainerStyle={[padding, contentStyle]}
          contentInsetAdjustmentBehavior={emTabs ? "automatic" : "never"}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[s.flex, padding, contentStyle]}>{children}</View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  fundo: { flex: 1, backgroundColor: cor.paper },
  flex: { flex: 1 },
});
