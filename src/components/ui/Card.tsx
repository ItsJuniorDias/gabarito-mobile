import { StyleSheet, View, type ViewProps } from "react-native";
import { alpha, cor, raio, sombra } from "@/theme/tokens";

interface Props extends ViewProps {
  /** Mostra as marcas de registro do scanner nos cantos. */
  marks?: boolean;
  lift?: boolean;
}

export function Card({ marks, lift, style, children, ...rest }: Props) {
  return (
    <View style={[s.card, lift ? sombra.lift : sombra.card, style]} {...rest}>
      {marks && <MarcasDeRegistro />}
      {children}
    </View>
  );
}

/** Quadradinhos pretos de canto — como os fiduciais que o scanner de
 *  cartão-resposta usa para se alinhar. Puramente estrutural/temático. */
export function MarcasDeRegistro() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[s.marca, { left: 8, top: 8 }]} />
      <View style={[s.marca, { right: 8, top: 8 }]} />
      <View style={[s.marca, { left: 8, bottom: 8 }]} />
      <View style={[s.marca, { right: 8, bottom: 8 }]} />
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    position: "relative",
    borderRadius: raio.lg,
    backgroundColor: cor.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: cor.line,
    overflow: "hidden",
  },
  marca: {
    position: "absolute",
    height: 8,
    width: 8,
    backgroundColor: alpha(cor.ink, 0.85),
  },
});
