import { Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  ArrowRight,
  BrainCircuit,
  CalendarClock,
  Crown,
  Flame,
  Layers,
  RotateCcw,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react-native";
import { useApp } from "@/context/AppContext";
import { useAssinatura } from "@/context/SubscriptionContext";
import { usePerfil } from "@/context/PerfilContext";
import { TRILHAS, bancaById } from "@/data/catalog";
import { SIMULADOS_PRONTOS } from "@/data/simuladosProntos";
import { montarConfigRevisao, pontosFracos } from "@/lib/revisao";
import { configDoPerfil } from "@/lib/onboarding";
import { revisaoDoDia, streakVivo } from "@/lib/storage";
import { apiMode } from "@/lib/openrouter";
import { pct } from "@/lib/utils";
import type { Diario, PerfilEstudo, SimuladoConfig } from "@/types";
import { alpha, cor, esp, fonte, raio } from "@/theme/tokens";
import { Tela } from "@/components/ui/Tela";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Texto } from "@/components/ui/Texto";
import { Logo } from "@/components/ui/Logo";
import { CartaoDecorativo } from "@/components/CartaoDecorativo";

export default function Dashboard() {
  const { gerar, stats, erros, diario, refazerComQuestoes } = useApp();
  const {
    premium,
    podeGerarIA,
    registrarGeracaoIA,
    geracoesRestantes,
    geracoesLimite,
    maxQuestoes,
    abrirPaywall,
  } = useAssinatura();
  const { perfil, diasAteProva } = usePerfil();

  const modo = apiMode();
  const temHistorico = stats.simuladosFeitos > 0;
  const primeiroNome = perfil?.nome?.trim().split(" ")[0] ?? "";
  const bancaDoPerfil = perfil ? bancaById(perfil.banca).nome : "";
  // O treino do dia é a meta diária, limitada pelo teto do plano.
  const tamanhoTreino = Math.min(perfil?.metaDiaria ?? 10, maxQuestoes);
  const due = revisaoDoDia(erros);
  const fracos = pontosFracos(stats);
  const podeRevisar = fracos.length > 0 || erros.length > 0;

  // gera com IA respeitando a cota; senão, abre o paywall no contexto certo
  const iniciarGeracao = (config: SimuladoConfig) => {
    if (!podeGerarIA) return abrirPaywall("limite");
    registrarGeracaoIA();
    void gerar(config);
  };

  const revisarHoje = () => {
    if (due.length === 0) return;
    const base: SimuladoConfig = {
      materias: Array.from(new Set(due.map((e) => e.questao.materia))),
      banca: due[0].questao.banca,
      tipo: due[0].questao.tipo,
      dificuldade: "misto",
      quantidade: due.length,
      comTempo: false,
    };
    refazerComQuestoes(
      due.map((e) => e.questao),
      base,
    );
  };

  const revisaoInteligente = () => {
    if (!premium) return abrirPaywall("revisao");
    registrarGeracaoIA();
    void gerar(montarConfigRevisao(stats, erros, 12));
  };

  /** Um toque = simulado. Sai direto do perfil montado no onboarding. */
  const treinoDoDia = () => {
    if (!perfil) return router.push("/montar");
    iniciarGeracao(configDoPerfil(perfil, tamanhoTreino));
  };

  return (
    <Tela>
      {/* ── Topo ── */}
      <View style={s.topo}>
        <Logo />
        {premium ? (
          <Badge tom="ok" mono>
            premium
          </Badge>
        ) : (
          <Button
            size="sm"
            variant="subtle"
            icon={<Crown size={14} color={cor.azulInk} />}
            onPress={() => abrirPaywall(null)}
          >
            Premium
          </Button>
        )}
      </View>

      {/* ── Hoje: meta, ofensiva e prazo da prova ── */}
      {perfil && (
        <Animated.View entering={FadeInDown.duration(340)} style={{ marginTop: esp.xl }}>
          <PainelHoje perfil={perfil} diario={diario} dias={diasAteProva} />
        </Animated.View>
      )}

      {/* ── Hero ── */}
      <Animated.View entering={FadeInDown.duration(380)} style={{ marginTop: esp.xxl }}>
        <View style={s.eyebrowLinha}>
          <Sparkles size={13} color={cor.azul} />
          <Texto v="eyebrow">simulados gerados sob medida</Texto>
        </View>
        <Texto v="h1" style={s.h1}>
          {primeiroNome
            ? `${saudacao()}, ${primeiroNome}.\nBora treinar?`
            : `Sua prova, do jeito\nque a banca cobra.`}
        </Texto>
        <Texto v="corpoG" style={{ marginTop: esp.lg }}>
          {perfil
            ? `Seu treino já vem pronto com ${bancaDoPerfil} e as matérias que você escolheu. Cada erro vira revisão — é assim que a nota sobe.`
            : "Escolha a matéria e a banca. A IA monta o simulado com gabarito comentado, e cada erro vira um plano de revisão que te leva à aprovação."}
        </Texto>

        {/* Um toque pra estudar: o perfil do onboarding já sabe a banca, as
            matérias e o tamanho da sessão. Quem quiser recortar mais fino
            continua tendo o Montar. */}
        <Button
          size="lg"
          full
          style={{ marginTop: esp.xxl }}
          iconRight={<ArrowRight size={18} color={cor.branco} />}
          onPress={treinoDoDia}
        >
          {perfil ? `Treino do dia · ${tamanhoTreino} questões` : "Montar simulado"}
        </Button>
        {perfil && (
          <Pressable onPress={() => router.push("/montar")} hitSlop={8} style={{ marginTop: esp.md }}>
            <Texto v="peq" center c={cor.azulInk} style={{ fontFamily: fonte.sansMedium }}>
              montar do zero →
            </Texto>
          </Pressable>
        )}

        {modo === "ausente" && (
          <Badge tom="no" style={{ marginTop: esp.md }}>
            key não configurada — veja o README
          </Badge>
        )}

        <View style={{ marginTop: esp.lg }}>
          <MedidorGeracoes
            premium={premium}
            restantes={geracoesRestantes}
            limite={geracoesLimite}
            onUpgrade={() => abrirPaywall("limite")}
          />
        </View>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.duration(420).delay(80)}
        style={s.cartaoWrap}
      >
        <CartaoDecorativo />
      </Animated.View>

      {/* ── Revisão do dia (retenção) ── */}
      {due.length > 0 && (
        <Animated.View entering={FadeInDown.duration(360)} style={{ marginTop: esp.xxl }}>
          <Card style={[s.faixa, { borderColor: alpha(cor.azul, 0.3), backgroundColor: alpha(cor.azulWash, 0.5) }]}>
            <View style={s.faixaLinha}>
              <View style={[s.circulo, { backgroundColor: cor.azul }]}>
                <RotateCcw size={19} color={cor.branco} />
              </View>
              <View style={{ flex: 1 }}>
                <Texto v="h3">
                  Revisão do dia · {due.length} questã{due.length === 1 ? "o" : "es"}
                </Texto>
                <Texto v="peq" style={{ marginTop: 2 }}>
                  A repetição espaçada trouxe de volta o que você quase esqueceu.
                </Texto>
              </View>
            </View>
            <Button
              full
              style={{ marginTop: esp.lg }}
              iconRight={<ArrowRight size={16} color={cor.branco} />}
              onPress={revisarHoje}
            >
              Revisar agora
            </Button>
          </Card>
        </Animated.View>
      )}

      {/* ── Revisão inteligente (motivo de pagar) ── */}
      {podeRevisar && (
        <Animated.View entering={FadeInDown.duration(360)} style={{ marginTop: esp.md }}>
          <Card marks style={s.bloco}>
            <View style={s.eyebrowLinha}>
              <BrainCircuit size={14} color={cor.azul} />
              <Texto v="eyebrow">revisão inteligente</Texto>
              {!premium && (
                <Badge tom="mark" mono>
                  premium
                </Badge>
              )}
            </View>
            <Texto v="h2" style={{ marginTop: esp.sm }}>
              {fracos.length > 0
                ? `Seu ponto fraco agora é ${fracos[0].materia} (${fracos[0].pct}%).`
                : "Gere um simulado focado nos seus erros."}
            </Texto>
            <Texto v="peq" style={{ marginTop: 6, lineHeight: 21 }}>
              Questões novas — não as mesmas de sempre — mirando exatamente onde você
              mais erra. É assim que a nota sobe.
            </Texto>
            <Button
              full
              style={{ marginTop: esp.lg }}
              icon={
                premium ? (
                  <Zap size={16} color={cor.branco} />
                ) : (
                  <Crown size={15} color={cor.branco} />
                )
              }
              onPress={revisaoInteligente}
            >
              {premium ? "Gerar revisão" : "Desbloquear"}
            </Button>
          </Card>
        </Animated.View>
      )}

      {/* ── Trilhas rápidas ── */}
      <Secao
        eyebrow="comece por aqui"
        titulo="Trilhas rápidas"
        acao={{ label: "montar do zero", onPress: () => router.push("/montar") }}
      >
        {TRILHAS.map((t, i) => (
          <Animated.View key={t.id} entering={FadeInDown.duration(320).delay(i * 40)}>
            <Pressable onPress={() => iniciarGeracao(t.config)}>
              {({ pressed }) => (
                <Card style={[s.item, pressed && s.itemPressed]}>
                  <View style={s.itemTopo}>
                    <View style={s.selo}>
                      <Texto v="mono" c={cor.branco} style={{ fontSize: 11 }}>
                        {t.config.tipo === "certo_errado" ? "C" : "A"}
                      </Texto>
                    </View>
                    <Badge mono>{`${t.config.materias.length} matérias`}</Badge>
                  </View>
                  <Texto v="h3" style={{ marginTop: esp.md }}>
                    {t.titulo}
                  </Texto>
                  <Texto v="peq" style={{ marginTop: 3 }}>
                    {t.descricao}
                  </Texto>
                </Card>
              )}
            </Pressable>
          </Animated.View>
        ))}
      </Secao>

      {/* ── Simulados prontos (grátis, sem IA) ── */}
      <Secao eyebrow="sem gastar sua cota" titulo="Simulados prontos · grátis" icone={<Layers size={13} color={cor.ink3} />}>
        {SIMULADOS_PRONTOS.map((sim, i) => (
          <Animated.View key={sim.id} entering={FadeInDown.duration(320).delay(i * 40)}>
            <Pressable onPress={() => refazerComQuestoes(sim.questoes, sim.config)}>
              {({ pressed }) => (
                <Card style={[s.item, pressed && s.itemPressed]}>
                  <View style={s.itemTopo}>
                    <Badge tom="ok" mono>
                      grátis
                    </Badge>
                    <Badge mono>{`${sim.questoes.length} questões`}</Badge>
                  </View>
                  <Texto v="h3" style={{ marginTop: esp.md }}>
                    {sim.titulo}
                  </Texto>
                  <Texto v="peq" style={{ marginTop: 3 }}>
                    {sim.descricao}
                  </Texto>
                </Card>
              )}
            </Pressable>
          </Animated.View>
        ))}
      </Secao>

      {/* ── Estatísticas ── */}
      {temHistorico && (
        <View style={{ marginTop: esp.xxxl }}>
          <View style={[s.eyebrowLinha, { marginBottom: esp.lg }]}>
            <TrendingUp size={13} color={cor.ink3} />
            <Texto v="eyebrow">seu desempenho</Texto>
          </View>
          <Card marks style={s.bloco}>
            <View style={s.grade}>
              <Stat label="simulados" valor={String(stats.simuladosFeitos)} />
              <Stat label="questões" valor={String(stats.questoesRespondidas)} />
              <Stat
                label="acerto geral"
                valor={`${pct(stats.acertosTotais, stats.questoesRespondidas)}%`}
                destaque
              />
              <Stat label="no caderno" valor={String(erros.length)} />
            </View>

            {Object.keys(stats.porMateria).length > 0 && (
              <View style={s.porMateria}>
                <View style={s.porMateriaTopo}>
                  <View style={s.eyebrowLinha}>
                    <Target size={12} color={cor.ink3} />
                    <Texto v="eyebrow">acerto por matéria</Texto>
                  </View>
                  {podeRevisar && (
                    <Pressable onPress={revisaoInteligente} hitSlop={8}>
                      <Texto v="micro" c={cor.azulInk} style={{ fontFamily: fonte.sansMedium }}>
                        treinar os fracos →
                      </Texto>
                    </Pressable>
                  )}
                </View>
                <View style={{ gap: esp.md }}>
                  {Object.entries(stats.porMateria)
                    .sort((a, b) => pct(a[1][0], a[1][1]) - pct(b[1][0], b[1][1]))
                    .slice(0, 6)
                    .map(([mat, [ac, tot]]) => {
                      const p = pct(ac, tot);
                      return (
                        <View key={mat}>
                          <View style={s.barraTopo}>
                            <Texto v="peq" numberOfLines={1} style={{ flex: 1 }}>
                              {mat}
                            </Texto>
                            <Texto v="mono" style={{ fontSize: 12.5 }}>
                              {p}%
                            </Texto>
                          </View>
                          <View style={s.barraTrilho}>
                            <View
                              style={[
                                s.barraFill,
                                {
                                  width: `${p}%`,
                                  backgroundColor:
                                    p >= 70 ? cor.ok : p >= 50 ? cor.markDeep : cor.no,
                                },
                              ]}
                            />
                          </View>
                        </View>
                      );
                    })}
                </View>
              </View>
            )}
          </Card>
        </View>
      )}
    </Tela>
  );
}

function saudacao(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

// ── Painel do dia ─────────────────────────────────────────────

/**
 * O que traz a pessoa de volta amanhã.
 *
 * A ofensiva conta DIAS COM ALGUMA QUESTÃO, não dias com a meta batida — quem
 * exige perfeição perde o usuário na primeira terça corrida. A meta é a barra;
 * a ofensiva é o hábito.
 */
function PainelHoje({
  perfil,
  diario,
  dias,
}: {
  perfil: PerfilEstudo;
  diario: Diario;
  dias: number | null;
}) {
  const meta = perfil.metaDiaria;
  const feitas = diario.questoes;
  const p = Math.min(100, pct(feitas, meta));
  const bateu = feitas >= meta;
  const vivo = streakVivo(diario);

  return (
    <Card style={s.hoje}>
      <View style={s.hojeTopo}>
        <View style={s.eyebrowLinha}>
          <Texto v="eyebrow">hoje</Texto>
          {bateu && (
            <Badge tom="ok" mono>
              meta batida
            </Badge>
          )}
        </View>
        {vivo && diario.streak > 1 && (
          <View style={s.streak}>
            <Flame size={13} color={cor.markDeep} />
            <Texto v="mono" c={cor.ink} style={{ fontSize: 12 }}>
              {`${diario.streak} dias`}
            </Texto>
          </View>
        )}
      </View>

      <View style={s.hojeLinha}>
        <Texto v="mono" c={bateu ? cor.ok : cor.ink} style={s.hojeNumero}>
          {feitas}
        </Texto>
        <Texto v="peq" c={cor.ink3} style={{ marginBottom: 5 }}>
          {`de ${meta} questões`}
        </Texto>
      </View>

      <View style={[s.barraTrilho, { marginTop: esp.md }]}>
        <View
          style={[
            s.barraFill,
            {
              width: `${Math.max(p, feitas > 0 ? 4 : 0)}%`,
              backgroundColor: bateu ? cor.ok : cor.azul,
            },
          ]}
        />
      </View>

      <View style={s.hojeRodape}>
        <Texto v="micro" style={{ flex: 1 }}>
          {bateu
            ? diario.streak > 1
              ? `Dia fechado. São ${diario.streak} seguidos.`
              : "Dia fechado. Volte amanhã pra começar a ofensiva."
            : feitas > 0
              ? `Faltam ${meta - feitas} pra fechar o dia.`
              : "Ainda não começou hoje."}
        </Texto>
        {dias != null && (
          <View style={s.prazo}>
            <CalendarClock size={12} color={cor.ink3} />
            <Texto v="micro">{`prova em ${dias} dias`}</Texto>
          </View>
        )}
      </View>
    </Card>
  );
}

// ── Seção com cabeçalho ───────────────────────────────────────

function Secao({
  eyebrow,
  titulo,
  icone,
  acao,
  children,
}: {
  eyebrow: string;
  titulo: string;
  icone?: React.ReactNode;
  acao?: { label: string; onPress: () => void };
  children: React.ReactNode;
}) {
  return (
    <View style={{ marginTop: esp.xxxl }}>
      <View style={s.secaoTopo}>
        <View>
          <View style={s.eyebrowLinha}>
            {icone}
            <Texto v="eyebrow">{eyebrow}</Texto>
          </View>
          <Texto v="h2" style={{ marginTop: 4 }}>
            {titulo}
          </Texto>
        </View>
        {acao && (
          <Pressable onPress={acao.onPress} hitSlop={8}>
            <Texto v="peq" c={cor.azulInk} style={{ fontFamily: fonte.sansMedium }}>
              {acao.label}
            </Texto>
          </Pressable>
        )}
      </View>
      <View style={{ gap: esp.md }}>{children}</View>
    </View>
  );
}

// ── Medidor de cota grátis ────────────────────────────────────

function MedidorGeracoes({
  premium,
  restantes,
  limite,
  onUpgrade,
}: {
  premium: boolean;
  restantes: number;
  limite: number;
  onUpgrade: () => void;
}) {
  if (premium) {
    return (
      <View style={s.eyebrowLinha}>
        <Crown size={14} color={cor.ok} />
        <Texto v="peq" c={cor.ink3}>
          Premium · simulados com IA ilimitados
        </Texto>
      </View>
    );
  }
  const usadas = limite - restantes;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: esp.md }}>
      <View style={{ flexDirection: "row", gap: 4 }}>
        {Array.from({ length: limite }).map((_, i) => (
          <View
            key={i}
            style={[s.tick, { backgroundColor: i < usadas ? cor.line2 : cor.azul }]}
          />
        ))}
      </View>
      {restantes > 0 ? (
        <Texto v="peq" style={{ flex: 1 }}>
          <Texto v="peq" c={cor.ink} style={{ fontFamily: fonte.sansSemi }}>
            {restantes}
          </Texto>
          {` de ${limite} simulados com IA nesta semana`}
        </Texto>
      ) : (
        <Pressable onPress={onUpgrade} hitSlop={6} style={{ flex: 1 }}>
          <Texto v="peq" c={cor.azulInk} style={{ fontFamily: fonte.sansMedium }}>
            acabou a cota — liberar ilimitado
          </Texto>
        </Pressable>
      )}
    </View>
  );
}

function Stat({
  label,
  valor,
  destaque,
}: {
  label: string;
  valor: string;
  destaque?: boolean;
}) {
  return (
    <View style={{ width: "47%" }}>
      <Texto
        v="mono"
        c={destaque ? cor.azul : cor.ink}
        style={{ fontSize: 34, lineHeight: 40, fontFamily: fonte.monoSemi }}
      >
        {valor}
      </Texto>
      <Texto v="eyebrow" style={{ marginTop: 2 }}>
        {label}
      </Texto>
    </View>
  );
}

const s = StyleSheet.create({
  topo: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  eyebrowLinha: { flexDirection: "row", alignItems: "center", gap: 7, flexWrap: "wrap" },
  h1: { marginTop: esp.md, fontSize: 34, lineHeight: 38 },
  cartaoWrap: { marginTop: esp.xxxl, alignItems: "center" },
  // hoje
  hoje: { padding: esp.xl },
  hojeTopo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: esp.sm,
  },
  streak: { flexDirection: "row", alignItems: "center", gap: 5 },
  hojeLinha: { flexDirection: "row", alignItems: "flex-end", gap: 6 },
  hojeNumero: { fontSize: 30, lineHeight: 34, fontFamily: fonte.monoSemi, letterSpacing: -0.5 },
  hojeRodape: {
    flexDirection: "row",
    alignItems: "center",
    gap: esp.md,
    marginTop: esp.md,
  },
  prazo: { flexDirection: "row", alignItems: "center", gap: 5 },
  faixa: { padding: esp.xl },
  faixaLinha: { flexDirection: "row", alignItems: "center", gap: esp.md },
  circulo: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  bloco: { padding: esp.xxl },
  // itens (trilhas / prontos)
  secaoTopo: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: esp.lg,
    gap: esp.md,
  },
  item: { padding: esp.xl },
  itemPressed: { backgroundColor: cor.paper, transform: [{ scale: 0.995 }] },
  itemTopo: { flexDirection: "row", alignItems: "center", gap: esp.sm },
  selo: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: cor.graphite,
    alignItems: "center",
    justifyContent: "center",
  },
  // estatísticas
  grade: { flexDirection: "row", flexWrap: "wrap", rowGap: esp.xl, columnGap: "6%" },
  porMateria: {
    marginTop: esp.xxl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: cor.line,
    paddingTop: esp.xl,
  },
  porMateriaTopo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: esp.lg,
  },
  barraTopo: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5, gap: esp.sm },
  barraTrilho: {
    height: 7,
    borderRadius: raio.full,
    backgroundColor: cor.paper2,
    overflow: "hidden",
  },
  barraFill: { height: "100%", borderRadius: raio.full },
  tick: { height: 6, width: 24, borderRadius: 3 },
});
