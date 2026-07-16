import { StyleSheet, View } from "react-native";
import Svg, { Circle, Rect } from "react-native-svg";
import { cor } from "@/theme/tokens";
import { Texto } from "@/components/ui/Texto";

/** Marca do produto: bolha preenchida como pingo. */
export function Logo({ size = 26, texto = true }: { size?: number; texto?: boolean }) {
  return (
    <View style={s.wrap}>
      <Svg width={size} height={size} viewBox="0 0 32 32">
        <Rect width={32} height={32} rx={7} fill={cor.ink} />
        <Circle cx={16} cy={16} r={8.5} fill="none" stroke={cor.paper} strokeWidth={2.2} />
        <Circle cx={16} cy={16} r={4.6} fill={cor.azul} />
      </Svg>
      {texto && (
        <Texto v="h3" style={{ fontSize: 17 }}>
          Gabarito
        </Texto>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", gap: 8 },
});
