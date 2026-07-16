import type { ReactNode } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
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
 *
 * ⚠️ NÃO ENVOLVA A SCROLLVIEW NUMA <View> COM ESTILO.
 *
 * O `minimizeBehavior` da tab bar é resolvido pelo UIKit, que pergunta ao
 * view controller da aba qual é o content scroll view dele. Essa detecção
 * automática só enxerga a scroll view quando ela é, na prática, o conteúdo
 * raiz da tela. Uma <View> RN com `backgroundColor` no meio do caminho não é
 * achatada pelo Metro, vira UIView nativa de verdade e mata a associação —
 * a barra nunca minimiza e o BottomAccessory nunca vira pílula.
 * (react-native-screens#3954, com repro: tirar o backgroundColor do wrapper
 * faz voltar a funcionar.)
 *
 * Por isso o papel e o `flex: 1` moram na própria ScrollView, e a grade é
 * filha dela. Se um dia você precisar de um irmão da ScrollView aqui (um
 * header fixo, um FAB), ele custa o minimize: prefira colocar dentro.
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
    (emTabs && Platform.OS !== "ios" ? 96 : 0) +
    (emTabs ? 0 : insets.bottom) +
    esp.xxxl;

  const padding: ViewStyle = {
    paddingTop: topo ? insets.top + esp.md : esp.md,
    paddingHorizontal: esp.xl,
    paddingBottom: padBottom,
  };

  // Sem scroll não há o que a tab bar rastrear: aqui o wrapper é inofensivo.
  if (!scroll) {
    return (
      <View style={s.fundo}>
        {grade && <PapelGrid altura={340} />}
        <View style={[s.flex, padding, contentStyle]}>{children}</View>
      </View>
    );
  }

  return (
    <ScrollView
      style={s.fundo}
      contentInsetAdjustmentBehavior={emTabs ? "automatic" : "never"}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
    >
      {/* O padding fica no miolo, não no contentContainer: no Yoga o filho
          `absolute` respeita o padding do pai (ao contrário do CSS), e a
          grade nasceria com 20 px de folga de cada lado. */}
      {grade && <PapelGrid altura={340} />}
      <View style={[padding, contentStyle]}>{children}</View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  fundo: { flex: 1, backgroundColor: cor.paper },
  flex: { flex: 1 },
});
