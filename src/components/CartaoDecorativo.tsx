import { StyleSheet, View } from "react-native";
import { cor, esp, fonte } from "@/theme/tokens";
import { Card } from "@/components/ui/Card";
import { Bubble } from "@/components/ui/Bubble";
import { Texto } from "@/components/ui/Texto";

const LINHAS = [[2], [0], [4], [1], [3], [2]];
const LETRAS = ["A", "B", "C", "D", "E"];

/** Cartão-resposta decorativo — a tese visual da home. */
export function CartaoDecorativo() {
  return (
    <Card marks lift style={s.card}>
      <View style={s.topo}>
        <Texto v="eyebrow">cartão-resposta</Texto>
        <Texto v="mono" c={cor.ink3} style={{ fontSize: 11 }}>
          nº 0042
        </Texto>
      </View>
      <View style={{ gap: 9 }}>
        {LINHAS.map((marcadas, i) => (
          <View key={i} style={s.linha}>
            <Texto v="mono" c={cor.ink3} style={s.num}>
              {String(i + 1).padStart(2, "0")}
            </Texto>
            {LETRAS.map((l, j) => (
              <Bubble
                key={l}
                letra={l}
                size="sm"
                state={marcadas.includes(j) ? "selected" : "idle"}
              />
            ))}
          </View>
        ))}
      </View>
    </Card>
  );
}

const s = StyleSheet.create({
  card: { padding: esp.xl, paddingHorizontal: esp.xxl, backgroundColor: cor.card },
  topo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: esp.lg,
  },
  linha: { flexDirection: "row", alignItems: "center", gap: 8 },
  num: { width: 20, textAlign: "right", fontSize: 11, fontFamily: fonte.mono },
});
