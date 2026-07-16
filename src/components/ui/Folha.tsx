import type { ReactNode } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from "react-native-reanimated";
import { X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { alpha, cor, esp, raio, sombra } from "@/theme/tokens";
import { Texto } from "@/components/ui/Texto";

/**
 * Diálogo. Na web era um <div> com backdrop-blur; aqui é um Modal nativo,
 * porque um overlay em View não cobre a tab bar de vidro (ela é uma view
 * nativa acima da árvore RN) e o resultado ficaria meio dentro, meio fora.
 */
export function Folha({
  aberto,
  onFechar,
  titulo,
  children,
  fecharVisivel = false,
}: {
  aberto: boolean;
  onFechar: () => void;
  titulo?: string;
  children: ReactNode;
  fecharVisivel?: boolean;
}) {
  const insets = useSafeAreaInsets();
  if (!aberto) return null;

  return (
    <Modal transparent animationType="none" onRequestClose={onFechar} statusBarTranslucent>
      <Animated.View entering={FadeIn.duration(160)} exiting={FadeOut.duration(120)} style={s.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onFechar} accessibilityLabel="Fechar" />
        <Animated.View
          entering={SlideInDown.springify().damping(20).stiffness(220)}
          exiting={SlideOutDown.duration(160)}
          style={[s.painel, { marginBottom: Math.max(insets.bottom, esp.xl) }]}
        >
          {(titulo || fecharVisivel) && (
            <View style={s.topo}>
              {titulo ? <Texto v="h3">{titulo}</Texto> : <View />}
              {fecharVisivel && (
                <Pressable onPress={onFechar} hitSlop={10} accessibilityLabel="Fechar">
                  <X size={19} color={cor.ink3} />
                </Pressable>
              )}
            </View>
          )}
          {children}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: alpha(cor.graphite, 0.35),
    padding: esp.lg,
  },
  painel: {
    borderRadius: raio.xl,
    backgroundColor: cor.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: cor.line2,
    padding: esp.xxl,
    ...sombra.lift,
  },
  topo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: esp.md,
  },
});
