import { useEffect, useState } from "react";
import { Modal, StyleSheet, View } from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  FadeOutUp,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { TriangleAlert } from "lucide-react-native";
import { router } from "expo-router";
import { alpha, cor, esp, fonte } from "@/theme/tokens";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/Button";
import { Texto } from "@/components/ui/Texto";
import { Folha } from "@/components/ui/Folha";

const MENSAGENS = [
  "Consultando o edital…",
  "Selecionando os temas…",
  "Elaborando os enunciados…",
  "Montando distratores plausíveis…",
  "Escrevendo o gabarito comentado…",
  "Imprimindo o cartão-resposta…",
];

/** Overlay global de geração + modal de erro. Fica montado no _layout raiz. */
export function GeracaoOverlay() {
  const { gerando, erroGeracao, limparErroGeracao } = useApp();

  return (
    <>
      <Modal visible={gerando} transparent animationType="none" statusBarTranslucent>
        <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut} style={s.overlay}>
          <BolhasAnimadas />
          <View style={{ marginTop: esp.xxxl, alignItems: "center" }}>
            <Texto v="eyebrow">gerando</Texto>
            <MensagemRotativa />
          </View>
        </Animated.View>
      </Modal>

      <Folha
        aberto={!!erroGeracao && !gerando}
        onFechar={limparErroGeracao}
        fecharVisivel
      >
        <View style={{ flexDirection: "row", gap: esp.md }}>
          <View style={s.iconeErro}>
            <TriangleAlert size={18} color={cor.noInk} />
          </View>
          <View style={{ flex: 1 }}>
            <Texto v="h3">Não deu pra gerar</Texto>
            <Texto v="peq" style={{ marginTop: 6 }}>
              {erroGeracao}
            </Texto>
          </View>
        </View>
        <View style={s.acoesErro}>
          <Button
            variant="ghost"
            onPress={() => {
              limparErroGeracao();
              router.push("/ajustes");
            }}
          >
            Ajustes
          </Button>
          <Button onPress={limparErroGeracao}>Tentar de novo</Button>
        </View>
      </Folha>
    </>
  );
}

function MensagemRotativa() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((m) => (m + 1) % MENSAGENS.length), 1600);
    return () => clearInterval(t);
  }, []);
  return (
    <View style={s.msgSlot}>
      <Animated.View key={i} entering={FadeInDown.duration(280)} exiting={FadeOutUp.duration(200)}>
        <Texto v="corpo" c={cor.ink} style={{ fontFamily: fonte.sansMedium }} center>
          {MENSAGENS[i]}
        </Texto>
      </Animated.View>
    </View>
  );
}

/** Linha de bolhas que preenchem em sequência, em loop. */
function BolhasAnimadas() {
  return (
    <View style={{ flexDirection: "row", gap: 12 }}>
      {["A", "B", "C", "D", "E"].map((l, i) => (
        <BolhaPulsante key={l} letra={l} atraso={i * 180} />
      ))}
    </View>
  );
}

function BolhaPulsante({ letra, atraso }: { letra: string; atraso: number }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(
      atraso,
      withRepeat(
        withSequence(withTiming(1, { duration: 750 }), withTiming(0, { duration: 750 })),
        -1,
      ),
    );
  }, [atraso, p]);

  const fundo = useAnimatedStyle(() => ({ opacity: p.value }));
  const borda = useAnimatedStyle(() => ({
    borderColor: p.value > 0.5 ? cor.graphite : cor.line2,
  }));
  const txt = useAnimatedStyle(() => ({ color: p.value > 0.5 ? cor.branco : cor.ink3 }));

  return (
    <Animated.View style={[s.bolha, borda]}>
      <Animated.View
        style={[StyleSheet.absoluteFill, { backgroundColor: cor.graphite, borderRadius: 22 }, fundo]}
      />
      <Animated.Text style={[s.bolhaTxt, txt]}>{letra}</Animated.Text>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: alpha(cor.paper, 0.94),
  },
  msgSlot: { height: 26, marginTop: 8, justifyContent: "center" },
  bolha: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  bolhaTxt: { fontFamily: fonte.monoMedium, fontSize: 14, includeFontPadding: false },
  iconeErro: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: cor.noWash,
    alignItems: "center",
    justifyContent: "center",
  },
  acoesErro: {
    marginTop: esp.xl,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: esp.sm,
  },
});
