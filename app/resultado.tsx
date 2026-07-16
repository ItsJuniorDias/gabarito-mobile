import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import {
  BookmarkPlus,
  BrainCircuit,
  Check,
  Clock,
  Crown,
  RotateCcw,
  Sparkles,
  Zap,
} from "lucide-react-native";
import { useApp } from "@/context/AppContext";
import { useAssinatura } from "@/context/SubscriptionContext";
import type { Questao, Resposta } from "@/types";
import { marcarRevisao, salvarErro } from "@/lib/storage";
import { montarConfigRevisao } from "@/lib/revisao";
import { fmtTempo, pct } from "@/lib/utils";
import { alpha, cor, esp, fonte, raio } from "@/theme/tokens";
import { Tela } from "@/components/ui/Tela";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Texto } from "@/components/ui/Texto";
import { RevisaoQuestao } from "@/components/RevisaoQuestao";
import { CapturaIdentidade } from "@/components/CapturaIdentidade";

// a dispensa da captura de e-mail vale só pra sessão atual (não renaga)
let dispensadoNaSessao = false;

export default function ResultadoScreen() {
  const {
    simulado,
    resultado,
    gerar,
    refazerComQuestoes,
    recarregarErros,
    sairParaHome,
    erros,
    stats,
  } = useApp();
  const { premium, identidade, abrirPaywall, registrarGeracaoIA } = useAssinatura();

  const [salvos, setSalvos] = useState<Set<string>>(new Set());
  const [mostrarCaptura, setMostrarCaptura] = useState(
    () => !identidade && !dispensadoNaSessao,
  );
  const revisaoAplicada = useRef(false);

  // Ao abrir o resultado: se alguma questão já estava no caderno (sessão de
  // revisão), atualiza a caixa de Leitner conforme acerto/erro. Roda 1× só.
  useEffect(() => {
    if (revisaoAplicada.current || !simulado || !resultado) return;
    revisaoAplicada.current = true;
    const idsNoCaderno = new Set(erros.map((e) => e.questao.id));
    let mexeu = false;
    simulado.questoes.forEach((q, i) => {
      if (idsNoCaderno.has(q.id)) {
        marcarRevisao(q.id, resultado.respostas[i] === q.correta);
        mexeu = true;
      }
    });
    if (mexeu) recarregarErros();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const errados = useMemo(() => {
    if (!simulado || !resultado) return [];
    return simulado.questoes.filter((q, i) => resultado.respostas[i] !== q.correta);
  }, [simulado, resultado]);

  // feedback tátil no placar
  const p = resultado ? pct(resultado.acertos, resultado.total) : 0;
  useEffect(() => {
    if (!resultado) return;
    void Haptics.notificationAsync(
      p >= 70
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Warning,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!simulado || !resultado) return null;

  const nota: "ok" | "medio" | "baixo" = p >= 70 ? "ok" : p >= 50 ? "medio" : "baixo";
  const corNota = nota === "ok" ? cor.ok : nota === "medio" ? cor.markDeep : cor.no;

  const fecharCaptura = () => {
    dispensadoNaSessao = true;
    setMostrarCaptura(false);
  };

  const salvarUm = (q: Questao, r: Resposta) => {
    salvarErro(q, r);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSalvos((s) => new Set(s).add(q.id));
    recarregarErros();
  };

  const salvarTodos = () => {
    simulado.questoes.forEach((q, i) => {
      if (resultado.respostas[i] !== q.correta) salvarErro(q, resultado.respostas[i]);
    });
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSalvos(new Set(errados.map((q) => q.id)));
    recarregarErros();
  };

  const todosErrosSalvos = errados.length > 0 && errados.every((q) => salvos.has(q.id));

  const novoSimulado = () => {
    sairParaHome();
    router.navigate("/montar");
  };

  const revisaoInteligente = () => {
    registrarGeracaoIA();
    void gerar(montarConfigRevisao(stats, erros, 12));
  };

  return (
    <>
      <Tela emTabs={false}>
        {/* ── Placar ── */}
        <Animated.View entering={FadeInDown.duration(420)}>
          <Card marks lift style={s.placar}>
            <Texto v="eyebrow" center>
              resultado
            </Texto>
            <View style={s.numeros}>
              <Texto v="mono" c={corNota} style={s.acertos}>
                {resultado.acertos}
              </Texto>
              <Texto v="mono" c={cor.ink3} style={s.total}>
                /{resultado.total}
              </Texto>
            </View>
            <Texto v="h3" center style={{ marginTop: esp.md }}>
              {p}% de acerto
            </Texto>
            <Texto v="peq" center style={{ marginTop: 4 }}>
              {nota === "ok"
                ? "Mandou bem. Bora revisar os deslizes."
                : nota === "medio"
                  ? "Tá no caminho — o caderno de erros resolve o resto."
                  : "Faz parte. Cada erro salvo vira ponto na próxima."}
            </Texto>

            {resultado.duracaoSeg != null && (
              <View style={s.relogio}>
                <Clock size={14} color={cor.ink2} />
                <Texto v="mono" style={{ fontSize: 13.5 }}>
                  {fmtTempo(resultado.duracaoSeg)}
                </Texto>
              </View>
            )}
          </Card>
        </Animated.View>

        {/* ── Ações ── */}
        <View style={{ marginTop: esp.lg, gap: esp.sm }}>
          {errados.length > 0 && (
            <Button
              full
              size="lg"
              variant={todosErrosSalvos ? "subtle" : "primary"}
              onPress={salvarTodos}
              disabled={todosErrosSalvos}
              icon={
                todosErrosSalvos ? (
                  <Check size={16} color={cor.azulInk} />
                ) : (
                  <BookmarkPlus size={16} color={cor.branco} />
                )
              }
            >
              {todosErrosSalvos
                ? `${errados.length} no caderno`
                : `Salvar ${errados.length} erro${errados.length === 1 ? "" : "s"}`}
            </Button>
          )}
          <View style={{ flexDirection: "row", gap: esp.sm }}>
            <Button
              variant="outline"
              style={{ flex: 1 }}
              onPress={novoSimulado}
              icon={<Sparkles size={15} color={cor.ink} />}
            >
              Novo
            </Button>
            <Button
              variant="outline"
              style={{ flex: 1 }}
              onPress={() => refazerComQuestoes(simulado.questoes, simulado.config)}
              icon={<RotateCcw size={15} color={cor.ink} />}
            >
              Refazer
            </Button>
          </View>
        </View>

        {/* ── Upsell contextual: no pico de desejo ── */}
        {premium
          ? errados.length > 0 && (
              <Card
                style={[
                  s.upsell,
                  {
                    borderColor: alpha(cor.azul, 0.3),
                    backgroundColor: alpha(cor.azulWash, 0.4),
                  },
                ]}
              >
                <View style={s.upsellLinha}>
                  <View style={[s.upsellIcone, { backgroundColor: cor.azul }]}>
                    <BrainCircuit size={18} color={cor.branco} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Texto v="h3">Errou {errados.length}? Vira plano de estudo.</Texto>
                    <Texto v="peq" style={{ marginTop: 2 }}>
                      Gere questões novas mirando exatamente esses pontos.
                    </Texto>
                  </View>
                </View>
                <Button
                  full
                  style={{ marginTop: esp.lg }}
                  onPress={revisaoInteligente}
                  icon={<Zap size={16} color={cor.branco} />}
                >
                  Revisão inteligente
                </Button>
              </Card>
            )
          : (nota === "ok" || errados.length > 0) && (
              <Pressable onPress={() => abrirPaywall(nota === "ok" ? "aha" : "revisao")}>
                {({ pressed }) => (
                  <Card marks style={[s.upsell, pressed && { backgroundColor: cor.paper }]}>
                    <View style={s.upsellLinha}>
                      <View
                        style={[s.upsellIcone, { backgroundColor: alpha(cor.mark, 0.6) }]}
                      >
                        <Crown size={17} color={cor.ink} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Texto v="h3">
                          {nota === "ok"
                            ? "Foi bem — mantenha o ritmo até passar."
                            : `Transforme seus ${errados.length} erro${
                                errados.length === 1 ? "" : "s"
                              } num plano de revisão.`}
                        </Texto>
                        <Texto v="peq" style={{ marginTop: 2 }}>
                          Revisão inteligente e simulados ilimitados no Premium.
                        </Texto>
                      </View>
                    </View>
                    <View style={s.verPlanos}>
                      <Texto
                        v="peq"
                        c={cor.azulInk}
                        style={{ fontFamily: fonte.sansMedium }}
                      >
                        ver planos
                      </Texto>
                      <Sparkles size={14} color={cor.azulInk} />
                    </View>
                  </Card>
                )}
              </Pressable>
            )}

        {/* ── Gabarito comentado ── */}
        <View style={{ marginTop: esp.xxxl }}>
          <Texto v="eyebrow" style={{ marginBottom: esp.lg }}>
            gabarito comentado
          </Texto>
          <View style={{ gap: esp.lg }}>
            {simulado.questoes.map((q, i) => (
              <RevisaoQuestao
                key={q.id}
                numero={i + 1}
                questao={q}
                resposta={resultado.respostas[i]}
                salvo={salvos.has(q.id)}
                onSalvar={() => salvarUm(q, resultado.respostas[i])}
              />
            ))}
          </View>
        </View>

        <Button
          variant="ghost"
          full
          style={{ marginTop: esp.xxl }}
          onPress={sairParaHome}
        >
          Voltar ao início
        </Button>
      </Tela>

      <CapturaIdentidade aberto={mostrarCaptura} onFechar={fecharCaptura} />
    </>
  );
}

const s = StyleSheet.create({
  placar: { padding: esp.xxxl, alignItems: "center" },
  numeros: { flexDirection: "row", alignItems: "flex-end", marginTop: esp.lg },
  acertos: {
    fontSize: 76,
    lineHeight: 78,
    fontFamily: fonte.monoBold,
    letterSpacing: -2,
  },
  total: { fontSize: 30, lineHeight: 40 },
  relogio: {
    marginTop: esp.xl,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: raio.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: cor.line,
    backgroundColor: cor.paper,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  upsell: { marginTop: esp.lg, padding: esp.xl },
  upsellLinha: { flexDirection: "row", alignItems: "center", gap: esp.md },
  upsellIcone: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  verPlanos: {
    marginTop: esp.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 5,
  },
});
