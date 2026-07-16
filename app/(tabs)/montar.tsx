import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { ArrowRight, Check, Crown } from "lucide-react-native";
import { useApp } from "@/context/AppContext";
import { useAssinatura } from "@/context/SubscriptionContext";
import { usePerfil } from "@/context/PerfilContext";
import { BANCAS, GRUPOS, MATERIAS, bancaById } from "@/data/catalog";
import type { Dificuldade, QuestaoTipo, SimuladoConfig } from "@/types";
import { cor, esp, fonte, raio } from "@/theme/tokens";
import { Tela } from "@/components/ui/Tela";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Texto } from "@/components/ui/Texto";
import { Input, Label, Segmented, Stepper, Toggle } from "@/components/ui/Field";

export default function Montar() {
  const { gerar } = useApp();
  const {
    premium,
    maxQuestoes,
    podeGerarIA,
    registrarGeracaoIA,
    geracoesRestantes,
    geracoesLimite,
    abrirPaywall,
  } = useAssinatura();
  const { perfil } = usePerfil();

  // A tela nasce preenchida com o que a pessoa respondeu no onboarding —
  // continua tudo editável, mas o caminho curto já está pronto.
  const [materias, setMaterias] = useState<string[]>(() => perfil?.materias ?? []);
  const [banca, setBanca] = useState(() => perfil?.banca ?? "enem");
  const [tipo, setTipo] = useState<QuestaoTipo>(() =>
    perfil && bancaById(perfil.banca).certoErrado ? "certo_errado" : "multipla",
  );
  const [dificuldade, setDificuldade] = useState<Dificuldade>("misto");
  const [quantidade, setQuantidade] = useState(() => perfil?.metaDiaria ?? 10);
  const [topico, setTopico] = useState("");
  const [comTempo, setComTempo] = useState(false);
  const [minutos, setMinutos] = useState(30);

  // trava a quantidade ao limite do plano (ex.: ao sair do Premium)
  useEffect(() => {
    setQuantidade((q) => Math.min(q, maxQuestoes));
  }, [maxQuestoes]);

  const bancaAtual = bancaById(banca);
  const podeCertoErrado = banca !== "enem";

  const toggleMateria = (nome: string) => {
    void Haptics.selectionAsync();
    setMaterias((prev) =>
      prev.includes(nome) ? prev.filter((m) => m !== nome) : [...prev, nome],
    );
  };

  const trocarBanca = (id: string) => {
    void Haptics.selectionAsync();
    setBanca(id);
    const b = bancaById(id);
    if (id === "enem") setTipo("multipla");
    else if (b.certoErrado) setTipo("certo_errado");
  };

  const config = useMemo<SimuladoConfig>(
    () => ({
      materias,
      banca,
      tipo,
      dificuldade,
      quantidade,
      topico: topico.trim() || undefined,
      comTempo,
      minutos: comTempo ? minutos : undefined,
    }),
    [materias, banca, tipo, dificuldade, quantidade, topico, comTempo, minutos],
  );

  const valido = materias.length > 0;

  // respeita a cota semanal de geração; senão abre o paywall no contexto
  const iniciarGeracao = () => {
    if (!valido) return;
    if (!podeGerarIA) return abrirPaywall("limite");
    registrarGeracaoIA();
    void gerar(config);
  };

  return (
    <Tela>
      <Animated.View entering={FadeInDown.duration(340)}>
        <Texto v="eyebrow">novo simulado</Texto>
        <Texto v="h1" style={{ marginTop: 6 }}>
          Monte sua prova
        </Texto>
        <Texto v="corpo" style={{ marginTop: 6 }}>
          Quanto mais específico o recorte, melhores as questões.
        </Texto>
      </Animated.View>

      <View style={{ marginTop: esp.xxl, gap: esp.lg }}>
        {/* Matérias */}
        <Card style={s.card}>
          <View style={s.cardTopo}>
            <Label>Matérias</Label>
            <Texto v="mono" c={cor.ink3} style={{ fontSize: 11 }}>
              {materias.length} selecionada{materias.length === 1 ? "" : "s"}
            </Texto>
          </View>
          <View style={{ gap: esp.lg }}>
            {GRUPOS.map((grupo) => (
              <View key={grupo}>
                <Texto v="micro" style={s.grupo}>
                  {grupo}
                </Texto>
                <View style={s.chips}>
                  {MATERIAS.filter((m) => m.grupo === grupo).map((m) => {
                    const on = materias.includes(m.nome);
                    return (
                      <Pressable
                        key={m.nome}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: on }}
                        onPress={() => toggleMateria(m.nome)}
                        style={[
                          s.chip,
                          on
                            ? { borderColor: cor.azul, backgroundColor: cor.azulWash }
                            : { borderColor: cor.line2, backgroundColor: cor.card },
                        ]}
                      >
                        {on && <Check size={13} color={cor.azulInk} />}
                        <Texto
                          v="peq"
                          c={on ? cor.azulInk : cor.ink2}
                          style={{ fontFamily: fonte.sansMedium }}
                        >
                          {m.nome}
                        </Texto>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        </Card>

        {/* Banca */}
        <Card style={s.card}>
          <Label>Banca / estilo</Label>
          <View style={s.chips}>
            {BANCAS.map((b) => {
              const on = b.id === banca;
              return (
                <Pressable
                  key={b.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  onPress={() => trocarBanca(b.id)}
                  style={[
                    s.bancaChip,
                    on
                      ? { borderColor: cor.ink, backgroundColor: cor.ink }
                      : { borderColor: cor.line2, backgroundColor: cor.card },
                  ]}
                >
                  <Texto
                    v="peq"
                    c={on ? cor.paper : cor.ink2}
                    style={{ fontFamily: fonte.sansMedium }}
                  >
                    {b.nome}
                  </Texto>
                </Pressable>
              );
            })}
          </View>
          <Texto v="peq" c={cor.ink3} style={{ marginTop: esp.md, lineHeight: 20 }}>
            {bancaAtual.estilo}
          </Texto>
        </Card>

        {/* Tipo */}
        <Card style={s.card}>
          <Label>Tipo de questão</Label>
          <Segmented<QuestaoTipo>
            value={tipo}
            onChange={setTipo}
            options={[
              { value: "multipla", label: "Múltipla escolha" },
              { value: "certo_errado", label: "Certo / Errado" },
            ]}
          />
          {!podeCertoErrado && (
            <Texto v="micro" style={{ marginTop: esp.sm }}>
              O ENEM usa só múltipla escolha.
            </Texto>
          )}
        </Card>

        {/* Dificuldade */}
        <Card style={s.card}>
          <Label>Dificuldade</Label>
          <Segmented<Dificuldade>
            value={dificuldade}
            onChange={setDificuldade}
            options={[
              { value: "facil", label: "Fácil" },
              { value: "medio", label: "Médio" },
              { value: "dificil", label: "Difícil" },
              { value: "misto", label: "Misto" },
            ]}
          />
        </Card>

        {/* Quantidade + tempo */}
        <Card style={s.card}>
          <Label>Quantidade de questões</Label>
          <Stepper value={quantidade} onChange={setQuantidade} min={1} max={maxQuestoes} />
          {!premium && (
            <Pressable
              onPress={() => abrirPaywall("questoes")}
              hitSlop={6}
              style={[s.linkCrown, { marginTop: esp.sm }]}
            >
              <Crown size={12} color={cor.azulInk} />
              <Texto v="micro" c={cor.azulInk}>
                grátis vai até 10 — Premium libera 30
              </Texto>
            </Pressable>
          )}

          <View style={s.divisor} />

          <Toggle checked={comTempo} onChange={setComTempo} label="Cronometrar" />
          {comTempo && (
            <View style={s.tempoLinha}>
              <Stepper value={minutos} onChange={setMinutos} min={5} max={240} step={5} />
              <Texto v="peq">min</Texto>
            </View>
          )}
        </Card>

        {/* Foco temático */}
        <Card style={s.card}>
          <Label>Foco temático (opcional)</Label>
          <Input
            value={topico}
            onChangeText={setTopico}
            placeholder="ex.: controle de constitucionalidade…"
            returnKeyType="done"
          />
        </Card>
      </View>

      {/* Ação */}
      <View style={{ marginTop: esp.xxl }}>
        <Button
          size="lg"
          full
          disabled={!valido}
          onPress={iniciarGeracao}
          icon={
            !premium && geracoesRestantes === 0 ? (
              <Crown size={16} color={cor.branco} />
            ) : undefined
          }
          iconRight={
            !premium && geracoesRestantes === 0 ? undefined : (
              <ArrowRight size={18} color={cor.branco} />
            )
          }
        >
          {!premium && geracoesRestantes === 0 ? "Liberar geração" : "Gerar simulado"}
        </Button>
        <Texto v="micro" center style={{ marginTop: esp.md }}>
          {valido
            ? `${quantidade} questões · ${bancaAtual.nome}${
                premium ? "" : ` · ${geracoesRestantes}/${geracoesLimite} grátis esta semana`
              }`
            : "Escolha pelo menos uma matéria"}
        </Texto>
      </View>
    </Tela>
  );
}

const s = StyleSheet.create({
  card: { padding: esp.xl },
  cardTopo: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  grupo: {
    marginBottom: esp.sm,
    fontFamily: fonte.sansMedium,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontSize: 11,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: esp.sm },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: raio.full,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  bancaChip: {
    borderRadius: raio.base,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  linkCrown: { flexDirection: "row", alignItems: "center", gap: 5 },
  divisor: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: cor.line,
    marginVertical: esp.xl,
  },
  tempoLinha: { flexDirection: "row", alignItems: "center", gap: esp.md, marginTop: esp.md },
});
