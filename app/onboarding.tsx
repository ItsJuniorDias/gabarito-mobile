import { useEffect, useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { ArrowRight, CalendarDays, Check, Flame, Target } from "lucide-react-native";
import { useAssinatura } from "@/context/SubscriptionContext";
import { usePerfil } from "@/context/PerfilContext";
import { BANCAS, bancaById } from "@/data/catalog";
import {
  METAS,
  PRAZOS,
  bancaDoObjetivo,
  materiasDoObjetivo,
  prazoParaData,
  type PrazoId,
} from "@/lib/onboarding";
import type { Objetivo } from "@/types";
import { LETRAS } from "@/lib/utils";
import { alpha, cor, esp, fonte } from "@/theme/tokens";
import { PapelGrid } from "@/components/ui/PapelGrid";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Field";
import { Texto } from "@/components/ui/Texto";
import { Logo } from "@/components/ui/Logo";
import { Bubble } from "@/components/ui/Bubble";
import { CartaoDecorativo } from "@/components/CartaoDecorativo";
import { CabecalhoFicha } from "@/components/onboarding/CabecalhoFicha";
import { Alternativa, ChipMateria } from "@/components/onboarding/Alternativa";
import { Paywall } from "@/components/Paywall";

/**
 * Onboarding.
 *
 * Duas decisões que valem a explicação:
 *
 * 1. As perguntas são ALTERNATIVAS DE PROVA, não um formulário. A pessoa
 *    preenche a bolha, sente a mola, ouve o háptico — o mesmo gesto do
 *    simulado. O cadastro já é a primeira aula da interface.
 *
 * 2. O paywall é o ÚLTIMO PASSO desta rota, não um push pra /premium. Assim
 *    não existe corrida entre salvar o perfil (que troca o guard e derruba
 *    esta rota) e empilhar o modal. O perfil só é salvo quando a pessoa
 *    decide — assinando ou seguindo no grátis — e aí o guard leva pra home
 *    sozinho.
 */

type Etapa =
  | "capa"
  | "objetivo"
  | "banca"
  | "materias"
  | "prazo"
  | "meta"
  | "nome"
  | "montando"
  | "plano"
  | "paywall";

const OBJETIVOS: { id: Objetivo; titulo: string; nota: string }[] = [
  {
    id: "concurso",
    titulo: "Concurso público",
    nota: "Federal, estadual, tribunais, carreiras policiais",
  },
  { id: "enem", titulo: "ENEM e vestibular", nota: "Prova contextualizada, 5 alternativas" },
  { id: "ambos", titulo: "Os dois", nota: "Estou de olho em tudo que aparecer" },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { salvarPerfil } = usePerfil();
  const { premium, recarregarOfertas } = useAssinatura();

  const [etapa, setEtapa] = useState<Etapa>("capa");
  const [objetivo, setObjetivo] = useState<Objetivo | null>(null);
  const [banca, setBanca] = useState<string | null>(null);
  const [materias, setMaterias] = useState<string[]>([]);
  const [prazo, setPrazo] = useState<PrazoId | null>(null);
  const [meta, setMeta] = useState<number>(10);
  const [nome, setNome] = useState("");

  // Puxa os preços cedo: quando a pessoa chegar no paywall, o cartão já nasce
  // com o valor certo da loja em vez de piscar o fallback.
  useEffect(() => {
    void recarregarOfertas();
  }, [recarregarOfertas]);

  const perguntas = useMemo<Etapa[]>(() => {
    const p: Etapa[] = ["objetivo"];
    if (objetivo !== "enem") p.push("banca");
    p.push("materias", "prazo", "meta", "nome");
    return p;
  }, [objetivo]);

  const idx = perguntas.indexOf(etapa);
  const emPergunta = idx >= 0;

  const avancar = () => {
    if (!emPergunta) return;
    if (idx < perguntas.length - 1) setEtapa(perguntas[idx + 1]);
    else setEtapa("montando");
  };

  const voltar = () => {
    if (idx > 0) setEtapa(perguntas[idx - 1]);
    else setEtapa("capa");
  };

  /** Escolha única avança sozinha — com um respiro pra bolha preencher. */
  const escolher = (fn: () => void) => {
    fn();
    setTimeout(avancar, 260);
  };

  const podeAvancar =
    (etapa === "objetivo" && !!objetivo) ||
    (etapa === "banca" && !!banca) ||
    (etapa === "materias" && materias.length > 0) ||
    (etapa === "prazo" && !!prazo) ||
    etapa === "meta" ||
    etapa === "nome";

  const concluir = () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    salvarPerfil({
      objetivo: objetivo ?? "concurso",
      banca: banca ?? bancaDoObjetivo(objetivo ?? "concurso"),
      materias,
      metaDiaria: meta,
      provaEm: prazo ? prazoParaData(prazo) : undefined,
      nome: nome.trim() || undefined,
    });
    // Não navegamos daqui: salvar o perfil vira o guard do Stack e o
    // expo-router leva pra home sozinho (ver app/_layout.tsx).
  };

  // ── Capa ──────────────────────────────────────────────────
  if (etapa === "capa") {
    return (
      <Fundo>
        <View style={[s.capa, { paddingTop: insets.top + esp.xxl, paddingBottom: insets.bottom + esp.xl }]}>
          <Animated.View entering={FadeInDown.duration(420)}>
            <Logo size={30} />
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(460).delay(90)} style={{ marginTop: esp.xxxl }}>
            <Texto v="eyebrow">antes de começar</Texto>
            <Texto v="h1" style={s.h1Capa}>
              Seis perguntas.{"\n"}Depois é só estudar.
            </Texto>
            <Texto v="corpoG" style={{ marginTop: esp.lg }}>
              A gente monta seu plano com a sua banca, as suas matérias e o tempo que falta
              pra prova. Leva menos de um minuto — e responde igual a um simulado.
            </Texto>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(500).delay(180)}
            style={{ marginTop: esp.xxxl, alignItems: "center" }}
          >
            <CartaoDecorativo />
          </Animated.View>

          <View style={{ flex: 1 }} />

          <Animated.View entering={FadeIn.duration(400).delay(300)}>
            <Button
              size="lg"
              full
              style={{ marginTop: esp.xxl }}
              iconRight={<ArrowRight size={18} color={cor.branco} />}
              onPress={() => setEtapa("objetivo")}
            >
              Preencher minha ficha
            </Button>
          </Animated.View>
        </View>
      </Fundo>
    );
  }

  // ── Montagem do plano ─────────────────────────────────────
  if (etapa === "montando") {
    return (
      <Fundo>
        <Montando onPronto={() => setEtapa("plano")} />
      </Fundo>
    );
  }

  // ── Plano pronto ──────────────────────────────────────────
  if (etapa === "plano") {
    return (
      <Fundo>
        <ScrollView
          contentContainerStyle={{
            paddingTop: insets.top + esp.xxl,
            paddingHorizontal: esp.xl,
            paddingBottom: insets.bottom + esp.xxl,
          }}
          showsVerticalScrollIndicator={false}
        >
          <PlanoPronto
            objetivo={objetivo ?? "concurso"}
            banca={banca ?? bancaDoObjetivo(objetivo ?? "concurso")}
            materias={materias}
            meta={meta}
            prazo={prazo}
            nome={nome.trim()}
          />
          <Button
            size="lg"
            full
            style={{ marginTop: esp.xxl }}
            iconRight={<ArrowRight size={18} color={cor.branco} />}
            onPress={() => (premium ? concluir() : setEtapa("paywall"))}
          >
            {premium ? "Começar a estudar" : "Continuar"}
          </Button>
        </ScrollView>
      </Fundo>
    );
  }

  // ── Paywall (último passo) ────────────────────────────────
  if (etapa === "paywall") {
    return (
      <Fundo>
        <ScrollView
          contentContainerStyle={{
            paddingTop: insets.top + esp.xxl,
            paddingHorizontal: esp.xl,
            paddingBottom: insets.bottom + esp.xxl,
          }}
          showsVerticalScrollIndicator={false}
        >
          <Paywall contexto="onboarding" onFechar={concluir} aoAssinar={concluir} />
        </ScrollView>
      </Fundo>
    );
  }

  // ── Perguntas ─────────────────────────────────────────────
  const opcoesMaterias = materiasDoObjetivo(objetivo ?? "concurso");
  const grupos = Array.from(new Set(opcoesMaterias.map((m) => m.grupo)));

  return (
    <Fundo>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={{ paddingTop: insets.top + esp.lg, paddingHorizontal: esp.xl }}>
          <CabecalhoFicha passo={idx} total={perguntas.length} onVoltar={voltar} />
        </View>

        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {etapa === "objetivo" && (
            <Pergunta eyebrow="objetivo" titulo="O que você vai prestar?">
              {OBJETIVOS.map((o, i) => (
                <Alternativa
                  key={o.id}
                  letra={LETRAS[i]}
                  titulo={o.titulo}
                  nota={o.nota}
                  on={objetivo === o.id}
                  onPress={() =>
                    escolher(() => {
                      setObjetivo(o.id);
                      setBanca(bancaDoObjetivo(o.id));
                      // Trocar de objetivo invalida matérias do outro mundo.
                      const validas = materiasDoObjetivo(o.id).map((m) => m.nome);
                      setMaterias((prev) => prev.filter((m) => validas.includes(m)));
                    })
                  }
                />
              ))}
            </Pergunta>
          )}

          {etapa === "banca" && (
            <Pergunta
              eyebrow="banca"
              titulo="Qual banca te espera?"
              sub="Cada uma cobra de um jeito. É isso que muda o estilo das questões."
            >
              {BANCAS.filter((b) => objetivo === "ambos" || b.id !== "enem").map((b, i) => (
                <Alternativa
                  key={b.id}
                  letra={LETRAS[i]}
                  titulo={b.nome}
                  nota={b.certoErrado ? "Itens Certo/Errado" : "Múltipla escolha"}
                  on={banca === b.id}
                  onPress={() => escolher(() => setBanca(b.id))}
                />
              ))}
              {banca && (
                <Texto v="peq" c={cor.ink3} style={{ marginTop: esp.md, lineHeight: 20 }}>
                  {bancaById(banca).estilo}
                </Texto>
              )}
            </Pergunta>
          )}

          {etapa === "materias" && (
            <Pergunta
              eyebrow="matérias"
              titulo="O que você mais precisa treinar?"
              sub="Escolha quantas quiser. Dá pra mudar depois, a qualquer momento."
            >
              <View style={{ gap: esp.lg }}>
                {grupos.map((g) => (
                  <View key={g}>
                    <Texto v="micro" style={s.grupo}>
                      {g}
                    </Texto>
                    <View style={s.chips}>
                      {opcoesMaterias
                        .filter((m) => m.grupo === g)
                        .map((m) => (
                          <ChipMateria
                            key={m.nome}
                            nome={m.nome}
                            on={materias.includes(m.nome)}
                            onPress={() =>
                              setMaterias((prev) =>
                                prev.includes(m.nome)
                                  ? prev.filter((x) => x !== m.nome)
                                  : [...prev, m.nome],
                              )
                            }
                          />
                        ))}
                    </View>
                  </View>
                ))}
              </View>
            </Pergunta>
          )}

          {etapa === "prazo" && (
            <Pergunta
              eyebrow="prazo"
              titulo="Quando é a prova?"
              sub="Serve pra dimensionar o ritmo. Se o edital ainda não saiu, tudo bem."
            >
              {PRAZOS.map((p, i) => (
                <Alternativa
                  key={p.id}
                  letra={LETRAS[i]}
                  titulo={p.label}
                  nota={p.nota}
                  on={prazo === p.id}
                  onPress={() => escolher(() => setPrazo(p.id))}
                />
              ))}
            </Pergunta>
          )}

          {etapa === "meta" && (
            <Pergunta
              eyebrow="ritmo"
              titulo="Quantas questões por dia?"
              sub="Escolha o que você consegue manter numa terça-feira ruim, não no domingo animado."
            >
              {METAS.map((m, i) => (
                <Alternativa
                  key={m.valor}
                  letra={LETRAS[i]}
                  titulo={m.label}
                  nota={m.nota}
                  on={meta === m.valor}
                  onPress={() => escolher(() => setMeta(m.valor))}
                />
              ))}
            </Pergunta>
          )}

          {etapa === "nome" && (
            <Pergunta
              eyebrow="identificação"
              titulo="Como te chamamos?"
              sub="Só pra deixar de te tratar por “você”. Pode pular."
            >
              <Input
                value={nome}
                onChangeText={setNome}
                placeholder="Seu nome"
                autoCapitalize="words"
                autoComplete="name"
                autoFocus
                returnKeyType="done"
                onSubmitEditing={avancar}
                maxLength={40}
              />
              <Texto v="micro" style={{ marginTop: esp.md, lineHeight: 17 }}>
                Fica só no aparelho. Nada de e-mail nem senha por enquanto — o app é seu
                desde já.
              </Texto>
            </Pergunta>
          )}
        </ScrollView>

        <View style={[s.rodape, { paddingBottom: Math.max(insets.bottom, esp.lg) }]}>
          <Button
            size="lg"
            full
            disabled={!podeAvancar}
            onPress={avancar}
            iconRight={<ArrowRight size={18} color={cor.branco} />}
          >
            {etapa === "nome" ? "Montar meu plano" : "Continuar"}
          </Button>
          {etapa === "materias" && (
            <Texto v="micro" center style={{ marginTop: esp.sm }}>
              {materias.length === 0
                ? "escolha pelo menos uma"
                : `${materias.length} selecionada${materias.length === 1 ? "" : "s"}`}
            </Texto>
          )}
          {etapa === "nome" && !nome.trim() && (
            <Pressable onPress={avancar} hitSlop={8} style={{ marginTop: esp.sm }}>
              <Texto v="micro" center>
                pular
              </Texto>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </Fundo>
  );
}

// ── Casca ─────────────────────────────────────────────────────

function Fundo({ children }: { children: React.ReactNode }) {
  return (
    <View style={s.fundo}>
      <PapelGrid altura={380} />
      {children}
    </View>
  );
}

function Pergunta({
  eyebrow,
  titulo,
  sub,
  children,
}: {
  eyebrow: string;
  titulo: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <Animated.View entering={FadeInDown.duration(300)}>
      <Texto v="eyebrow">{eyebrow}</Texto>
      <Texto v="h1" style={s.pergunta}>
        {titulo}
      </Texto>
      {sub && (
        <Texto v="corpo" style={{ marginTop: esp.sm, lineHeight: 22 }}>
          {sub}
        </Texto>
      )}
      <View style={{ marginTop: esp.xxl, gap: esp.sm }}>{children}</View>
    </Animated.View>
  );
}

// ── Montagem ──────────────────────────────────────────────────

const PASSOS_MONTAGEM = [
  "Lendo o estilo da banca",
  "Separando suas matérias",
  "Calculando o ritmo até a prova",
  "Abrindo seu caderno de erros",
];

/** ~1,7 s de montagem. É o tempo de uma animação — não fingimos mais que
 *  isso: o plano é calculado na hora e sai daqui direto pra tela. */
function Montando({ onPronto }: { onPronto: () => void }) {
  const insets = useSafeAreaInsets();
  const [passo, setPasso] = useState(0);
  const feito = useRef(false);

  useEffect(() => {
    const t = setInterval(() => {
      setPasso((p) => {
        if (p >= PASSOS_MONTAGEM.length - 1) {
          clearInterval(t);
          if (!feito.current) {
            feito.current = true;
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setTimeout(onPronto, 420);
          }
          return p;
        }
        void Haptics.selectionAsync();
        return p + 1;
      });
    }, 430);
    return () => clearInterval(t);
  }, [onPronto]);

  return (
    <View style={[s.montando, { paddingTop: insets.top }]}>
      <Texto v="eyebrow" center>
        montando seu plano
      </Texto>
      <View style={{ marginTop: esp.xxxl, gap: esp.lg, alignSelf: "stretch" }}>
        {PASSOS_MONTAGEM.map((p, i) => {
          const ok = i < passo;
          const agora = i === passo;
          return (
            <View key={p} style={s.montandoLinha}>
              <Bubble
                letra={ok ? "" : String(i + 1)}
                size="sm"
                state={ok ? "correct" : agora ? "selected" : "idle"}
              />
              <Texto
                v="corpo"
                c={ok || agora ? cor.ink : cor.ink3}
                style={{ fontFamily: agora ? fonte.sansMedium : fonte.sans }}
              >
                {p}
              </Texto>
              {ok && <Check size={14} color={cor.ok} />}
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ── Plano pronto ──────────────────────────────────────────────

function PlanoPronto({
  objetivo,
  banca,
  materias,
  meta,
  prazo,
  nome,
}: {
  objetivo: Objetivo;
  banca: string;
  materias: string[];
  meta: number;
  prazo: PrazoId | null;
  nome: string;
}) {
  const dias = prazo ? (PRAZOS.find((p) => p.id === prazo)?.dias ?? 0) : 0;
  const total = dias * meta;
  const b = bancaById(banca);

  return (
    <Animated.View entering={FadeInDown.duration(420)}>
      <Texto v="eyebrow">plano de estudo</Texto>
      <Texto v="h1" style={s.h1Plano}>
        {nome ? `Pronto, ${nome.split(" ")[0]}.` : "Seu plano está pronto."}
      </Texto>

      {dias > 0 ? (
        <Texto v="corpoG" style={{ marginTop: esp.lg }}>
          {`Faltam cerca de `}
          <Texto v="corpoG" c={cor.ink} style={{ fontFamily: fonte.sansBold }}>
            {`${dias} dias`}
          </Texto>
          {` pra sua prova. No seu ritmo, dá `}
          <Texto v="corpoG" c={cor.ink} style={{ fontFamily: fonte.sansBold }}>
            {`${total.toLocaleString("pt-BR")} questões`}
          </Texto>
          {` até lá — se você aparecer todo dia.`}
        </Texto>
      ) : (
        <Texto v="corpoG" style={{ marginTop: esp.lg }}>
          {`Sem data marcada, o jogo é constância: ${meta} questões por dia, todo dia. Quando o edital sair, você já está aquecido.`}
        </Texto>
      )}

      <Card marks style={s.ficha}>
        <View style={s.fichaTopo}>
          <Texto v="eyebrow">ficha do candidato</Texto>
          <Texto v="mono" c={cor.ink3} style={{ fontSize: 11 }}>
            nº 0001
          </Texto>
        </View>

        <Linha rotulo="objetivo" valor={objetivo === "enem" ? "ENEM e vestibular" : objetivo === "ambos" ? "Concurso + ENEM" : "Concurso público"} />
        <Linha rotulo="banca" valor={b.nome} />
        <Linha
          rotulo="matérias"
          valor={materias.length ? materias.join(" · ") : "a definir"}
        />
        <Linha rotulo="ritmo" valor={`${meta} questões por dia`} />
        <Linha
          rotulo="prova"
          valor={dias > 0 ? `em cerca de ${dias} dias` : "sem data definida"}
          ultimo
        />
      </Card>

      <View style={s.metricas}>
        <Metrica icone={<Target size={15} color={cor.azul} />} valor={String(meta)} label="por dia" />
        <Metrica
          icone={<CalendarDays size={15} color={cor.azul} />}
          valor={dias > 0 ? String(dias) : "—"}
          label="dias"
        />
        <Metrica
          icone={<Flame size={15} color={cor.markDeep} />}
          valor={total > 0 ? total.toLocaleString("pt-BR") : "∞"}
          label="questões"
        />
      </View>

      <View style={s.avisoWrap}>
        <Badge tom="mark" mono>
          começa hoje
        </Badge>
        <Texto v="peq" style={{ flex: 1, lineHeight: 20 }}>
          Cada erro seu vai pro caderno e volta na hora certa pela repetição espaçada. É o
          plano se corrigindo sozinho.
        </Texto>
      </View>
    </Animated.View>
  );
}

function Linha({
  rotulo,
  valor,
  ultimo,
}: {
  rotulo: string;
  valor: string;
  ultimo?: boolean;
}) {
  return (
    <View style={[s.linha, ultimo && { borderBottomWidth: 0 }]}>
      <Texto v="eyebrow" style={{ width: 78 }}>
        {rotulo}
      </Texto>
      <Texto v="peq" c={cor.ink} style={{ flex: 1, fontFamily: fonte.sansMedium }}>
        {valor}
      </Texto>
    </View>
  );
}

function Metrica({
  icone,
  valor,
  label,
}: {
  icone: React.ReactNode;
  valor: string;
  label: string;
}) {
  return (
    <Card style={s.metrica}>
      {icone}
      <Texto v="mono" c={cor.ink} style={s.metricaValor} numberOfLines={1}>
        {valor}
      </Texto>
      <Texto v="eyebrow" style={{ fontSize: 9.5 }}>
        {label}
      </Texto>
    </Card>
  );
}

const s = StyleSheet.create({
  fundo: { flex: 1, backgroundColor: cor.paper },
  // capa
  capa: { flex: 1, paddingHorizontal: esp.xl },
  h1Capa: { marginTop: esp.md, fontSize: 34, lineHeight: 39 },
  // perguntas
  scroll: { paddingHorizontal: esp.xl, paddingTop: esp.xxl, paddingBottom: esp.xxxl },
  pergunta: { marginTop: esp.sm, fontSize: 29, lineHeight: 34 },
  grupo: {
    marginBottom: esp.sm,
    fontFamily: fonte.sansMedium,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontSize: 11,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: esp.sm },
  rodape: {
    paddingHorizontal: esp.xl,
    paddingTop: esp.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: cor.line,
    backgroundColor: alpha(cor.paper, 0.96),
  },
  // montando
  montando: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: esp.xxxl,
  },
  montandoLinha: { flexDirection: "row", alignItems: "center", gap: esp.md },
  // plano
  h1Plano: { marginTop: esp.sm, fontSize: 32, lineHeight: 37 },
  ficha: { marginTop: esp.xxl, padding: esp.xl },
  fichaTopo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: esp.md,
  },
  linha: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: esp.md,
    paddingVertical: esp.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: cor.line,
  },
  metricas: { flexDirection: "row", gap: esp.sm, marginTop: esp.md },
  metrica: { flex: 1, padding: esp.lg, alignItems: "center", gap: 4 },
  metricaValor: { fontSize: 22, lineHeight: 26, fontFamily: fonte.monoSemi },
  avisoWrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: esp.md,
    marginTop: esp.xl,
  },
});
