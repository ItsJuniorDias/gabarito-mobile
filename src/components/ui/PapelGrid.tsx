import { StyleSheet, View } from "react-native";
import Svg, { Defs, LinearGradient, Mask, Path, Pattern, Rect, Stop } from "react-native-svg";
import { cor } from "@/theme/tokens";

/**
 * Papel milimetrado sutil no fundo — evoca folha de rascunho.
 *
 * Na web isso era `body::before` com dois linear-gradients e um mask
 * radial. Aqui é SVG: um <Pattern> de 26px e um <Mask> com fade
 * vertical, para a grade sumir antes de encostar no conteúdo.
 */
export function PapelGrid({ altura = 320 }: { altura?: number }) {
  return (
    <View style={[StyleSheet.absoluteFill, { height: altura }]} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id="grade" width={26} height={26} patternUnits="userSpaceOnUse">
            <Path d="M26 0 H0 V26" stroke={cor.line} strokeWidth={1} fill="none" />
          </Pattern>
          <LinearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#fff" stopOpacity={0.85} />
            <Stop offset="0.55" stopColor="#fff" stopOpacity={0.4} />
            <Stop offset="1" stopColor="#fff" stopOpacity={0} />
          </LinearGradient>
          <Mask id="m">
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#fade)" />
          </Mask>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#grade)" mask="url(#m)" />
      </Svg>
    </View>
  );
}
