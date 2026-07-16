import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { ChevronLeft, ChevronRight, Clock, Flag, X } from "lucide-react-native";
import { useApp } from "@/context/AppContext";
import { fmtTempo } from "@/lib/utils";
import { alpha, cor, esp, fonte, raio } from "@/theme/tokens";
import { Button } from "@/components/ui/Button";
import { Folha } from "@/components/ui/Folha";
import { Texto } from "@/components/ui/Texto";
import { QuestaoView } from "@/components/QuestaoView";

export default function Simulado() {
  const { simulado, respostas, responder, finalizarSimulado, sairParaHome } = useApp();
  const insets = useSafeAreaInsets();
  const scroll = useRef<ScrollView>(null);

  const [atual, setAtual] = useState(0);
  const [confirmar, setConfirmar] = useState(false);
  const [sair, setSair] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const total = simulado?.questoes.length ?? 0;
  const comTempo = !!simulado?.config.comTempo && !!simulado.config.minutos;
  const limite = (simulado?.config.minutos ?? 0) * 60;
  const restante = Math.max(0, limite - elapsed);

  // relógio
  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // tempo esgotado -> finaliza
  useEffect(() => {
    if (comTempo && elapsed >= limite) finalizarSimulado(elapsed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed, comTempo, limite]);

  const respondidas = useMemo(() => respostas.filter((r) => r != null).length, [respostas]);

  if (!simulado) return null;
  const q = simulado.questoes[atual];
  const ultima = atual === total - 1;
  const semResposta = total - respondidas;

  const irPara = (i: number) => {
    setAtual(Math.min(total - 1, Math.max(0, i)));
    scroll.current?.scrollTo({ y: 0, animated: true });
  };

  const pedirFinalizar = () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    if (semResposta > 0) setConfirmar(true);
    else finalizarSimulado(elapsed);
  };

  return (
    <View style={s.fundo}>
      {/* ── Barra superior ── */}
      <View style={[s.topo, { paddingTop: insets.top + esp.sm }]}>
        <Pressable onPress={() => setSair(true)} hitSlop={10} style={s.sair}>
          <X size={17} color={cor.ink2} />
          <Texto v="peq">sair</Texto>
        </Pressable>

        <View style={{ flexDirection: "row", alignItems: "center", gap: esp.md }}>
          <Texto v="mono" style={{ fontSize: 14 }}>
            <Texto v="mono" c={cor.ink} style={{ fontFamily: fonte.monoSemi, fontSize: 14 }}>
              {String(atual + 1).padStart(2, "0")}
            </Texto>
            <Texto v="mono" c={cor.ink3} style={{ fontSize: 14 }}>
              {` / ${String(total).padStart(2, "0")}`}
            </Texto>
          </Texto>
          {comTempo && (
            <View
              style={[
                s.relogio,
                restante <= 60
                  ? { borderColor: alpha(cor.no, 0.4), backgroundColor: cor.noWash }
                  : { borderColor: cor.line2, backgroundColor: cor.card },
              ]}
            >
              <Clock size={13} color={restante <= 60 ? cor.noInk : cor.ink} />
              <Texto v="mono" c={restante <= 60 ? cor.noInk : cor.ink} style={{ fontSize: 13 }}>
                {fmtTempo(restante)}
              </Texto>
            </View>
          )}
        </View>
      </View>

      {/* ── Progresso ── */}
      <View style={s.progresso}>
        <View style={[s.progressoFill, { width: `${(respondidas / total) * 100}%` }]} />
      </View>

      {/* ── Caderno ── */}
      <ScrollView
        ref={scroll}
        contentContainerStyle={s.conteudo}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View key={q.id} entering={FadeIn.duration(220)} exiting={FadeOut.duration(120)}>
          <QuestaoView
            numero={atual + 1}
            questao={q}
            resposta={respostas[atual]}
            onResponder={(r) => responder(atual, r)}
          />
        </Animated.View>
      </ScrollView>

      {/* ── Cartão-resposta ao vivo + navegação ── */}
      <View style={[s.rodape, { paddingBottom: Math.max(insets.bottom, esp.md) }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.strip}
        >
          {simulado.questoes.map((qq, i) => {
            const feita = respostas[i] != null;
            const aqui = i === atual;
            return (
              <Pressable
                key={qq.id}
                onPress={() => irPara(i)}
                style={[
                  s.stripItem,
                  aqui
                    ? { borderColor: cor.azul, backgroundColor: cor.azulWash }
                    : feita
                      ? { borderColor: cor.graphite, backgroundColor: cor.graphite }
                      : { borderColor: cor.line2, backgroundColor: "transparent" },
                ]}
              >
                <Texto
                  v="mono"
                  c={aqui ? cor.azulInk : feita ? cor.branco : cor.ink3}
                  style={{ fontSize: 12 }}
                >
                  {i + 1}
                </Texto>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={s.nav}>
          <Button
            variant="outline"
            onPress={() => irPara(atual - 1)}
            disabled={atual === 0}
            icon={<ChevronLeft size={18} color={cor.ink} />}
          >
            Anterior
          </Button>

          {ultima ? (
            <Button onPress={pedirFinalizar} icon={<Flag size={15} color={cor.branco} />}>
              Finalizar
            </Button>
          ) : (
            <Button
              onPress={() => irPara(atual + 1)}
              iconRight={<ChevronRight size={18} color={cor.branco} />}
            >
              Próxima
            </Button>
          )}
        </View>
      </View>

      {/* ── Diálogos ── */}
      <Folha aberto={confirmar} onFechar={() => setConfirmar(false)} titulo="Finalizar mesmo assim?">
        <Texto v="peq">
          {semResposta === 1
            ? "Falta 1 questão em branco."
            : `Faltam ${semResposta} questões em branco.`}{" "}
          Elas contarão como erro.
        </Texto>
        <View style={s.acoes}>
          <Button variant="ghost" onPress={() => setConfirmar(false)}>
            Continuar prova
          </Button>
          <Button
            onPress={() => {
              setConfirmar(false);
              finalizarSimulado(elapsed);
            }}
          >
            Finalizar
          </Button>
        </View>
      </Folha>

      <Folha aberto={sair} onFechar={() => setSair(false)} titulo="Sair do simulado?">
        <Texto v="peq">Você perde as respostas deste simulado. Sem volta.</Texto>
        <View style={s.acoes}>
          <Button variant="ghost" onPress={() => setSair(false)}>
            Voltar
          </Button>
          <Button
            variant="danger"
            onPress={() => {
              setSair(false);
              sairParaHome();
            }}
          >
            Sair sem salvar
          </Button>
        </View>
      </Folha>
    </View>
  );
}

const s = StyleSheet.create({
  fundo: { flex: 1, backgroundColor: cor.paper },
  topo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: esp.xl,
    paddingBottom: esp.md,
  },
  sair: { flexDirection: "row", alignItems: "center", gap: 5 },
  relogio: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: raio.sm,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  progresso: {
    height: 5,
    marginHorizontal: esp.xl,
    borderRadius: raio.full,
    backgroundColor: cor.paper2,
    overflow: "hidden",
  },
  progressoFill: { height: "100%", backgroundColor: cor.azul, borderRadius: raio.full },
  conteudo: { padding: esp.xl, paddingBottom: esp.xxxl },
  rodape: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: cor.line,
    backgroundColor: alpha(cor.paper, 0.98),
    paddingTop: esp.md,
  },
  strip: { paddingHorizontal: esp.xl, gap: 7 },
  stripItem: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  nav: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: esp.xl,
    paddingTop: esp.md,
  },
  acoes: {
    marginTop: esp.xl,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: esp.sm,
  },
});
