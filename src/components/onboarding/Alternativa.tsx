import { Pressable, StyleSheet, View } from "react-native";
import * as Haptics from "expo-haptics";
import { cor, esp, fonte, raio } from "@/theme/tokens";
import { Bubble } from "@/components/ui/Bubble";
import { Texto } from "@/components/ui/Texto";

/**
 * Uma opção do onboarding, desenhada como alternativa de prova.
 *
 * É a tese do onboarding inteiro: em vez de um formulário genérico, a pessoa
 * preenche o gabarito da própria vida de estudo. O `Bubble` é o mesmo
 * componente do simulado, com a mesma mola — quando ela chegar na primeira
 * prova, o gesto já é conhecido.
 */
export function Alternativa({
  letra,
  titulo,
  nota,
  on,
  onPress,
}: {
  letra: string;
  titulo: string;
  nota?: string;
  on: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: on }}
      accessibilityLabel={nota ? `${titulo}. ${nota}` : titulo}
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => [
        s.wrap,
        on
          ? { borderColor: cor.ink, backgroundColor: cor.card }
          : { borderColor: cor.line2, backgroundColor: cor.card },
        pressed && { transform: [{ scale: 0.995 }], backgroundColor: cor.paper },
      ]}
    >
      <Bubble letra={letra} size="md" state={on ? "selected" : "idle"} />
      <View style={{ flex: 1 }}>
        <Texto v="h3" style={{ fontSize: 15.5 }}>
          {titulo}
        </Texto>
        {nota && (
          <Texto v="peq" c={cor.ink3} style={{ marginTop: 2, fontSize: 12.5 }}>
            {nota}
          </Texto>
        )}
      </View>
      {/* Linha do gabarito: some quando marcada, como o traço do papel. */}
      {!on && <View style={s.pauta} />}
    </Pressable>
  );
}

const s = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: esp.md,
    borderRadius: raio.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: esp.lg,
    paddingVertical: esp.lg,
  },
  pauta: {
    width: 18,
    height: StyleSheet.hairlineWidth * 2,
    backgroundColor: cor.line2,
  },
});

/** Fileira de matérias — mesma linguagem dos chips da tela Montar. */
export function ChipMateria({
  nome,
  on,
  onPress,
}: {
  nome: string;
  on: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on }}
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      style={[
        s2.chip,
        on
          ? { borderColor: cor.azul, backgroundColor: cor.azulWash }
          : { borderColor: cor.line2, backgroundColor: cor.card },
      ]}
    >
      <Bubble letra="" size="xs" state={on ? "selected" : "idle"} />
      <Texto v="peq" c={on ? cor.azulInk : cor.ink2} style={{ fontFamily: fonte.sansMedium }}>
        {nome}
      </Texto>
    </Pressable>
  );
}

const s2 = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderRadius: raio.full,
    borderWidth: StyleSheet.hairlineWidth,
    paddingLeft: 9,
    paddingRight: 13,
    paddingVertical: 7,
  },
});
