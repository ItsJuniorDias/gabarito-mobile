import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  BookMarked,
  BrainCircuit,
  Crown,
  RotateCcw,
  Trash2,
} from "lucide-react-native";
import { useApp } from "@/context/AppContext";
import { useAssinatura } from "@/context/SubscriptionContext";
import { removerErro, revisaoDoDia } from "@/lib/storage";
import { montarConfigRevisao } from "@/lib/revisao";
import type { ErroSalvo, SimuladoConfig } from "@/types";
import { alpha, cor, esp, raio } from "@/theme/tokens";
import { Tela } from "@/components/ui/Tela";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, DifBadge } from "@/components/ui/Badge";
import { Texto } from "@/components/ui/Texto";
import { RevisaoQuestao } from "@/components/RevisaoQuestao";

export default function Caderno() {
  const { erros, recarregarErros, refazerComQuestoes, gerar, stats } = useApp();
  const { premium, registrarGeracaoIA, abrirPaywall } = useAssinatura();

  const due = revisaoDoDia(erros);

  const remover = (id: string) => {
    removerErro(id);
    recarregarErros();
  };

  const praticar = (lista: ErroSalvo[]) => {
    if (lista.length === 0) return;
    const base: SimuladoConfig = {
      materias: Array.from(new Set(lista.map((e) => e.questao.materia))),
      banca: lista[0].questao.banca,
      tipo: lista[0].questao.tipo,
      dificuldade: "misto",
      quantidade: lista.length,
      comTempo: false,
    };
    refazerComQuestoes(
      lista.map((e) => e.questao),
      base,
    );
  };

  const revisaoInteligente = () => {
    if (!premium) return abrirPaywall("revisao");
    registrarGeracaoIA();
    void gerar(montarConfigRevisao(stats, erros, 12));
  };

  if (erros.length === 0) {
    return (
      <Tela>
        <View style={s.vazio}>
          <View style={s.vazioIcone}>
            <BookMarked size={26} color={cor.ink3} />
          </View>
          <Texto v="h1" center style={{ marginTop: esp.xl, fontSize: 26 }}>
            Caderno vazio
          </Texto>
          <Texto v="corpo" center style={{ marginTop: esp.sm, maxWidth: 320 }}>
            As questões que você errar nos simulados ficam guardadas aqui e
            voltam pra revisão na hora certa. Comece por um simulado.
          </Texto>
          <Button
            full
            style={{ marginTop: esp.xxl }}
            onPress={() => router.push("/montar")}
          >
            Montar simulado
          </Button>
        </View>
      </Tela>
    );
  }

  return (
    <Tela>
      <Animated.View entering={FadeInDown.duration(340)}>
        <Texto v="eyebrow">revisão</Texto>
        <Texto v="h1" style={{ marginTop: 6 }}>
          Caderno de erros
        </Texto>
        <Texto v="corpo" style={{ marginTop: 6 }}>
          {erros.length} questã{erros.length === 1 ? "o" : "es"} pra dominar.
          Acerte 2× seguidas e ela se aposenta.
        </Texto>
      </Animated.View>

      {/* Ações de revisão */}
      <View style={{ marginTop: esp.xxl, gap: esp.md }}>
        <AcaoCard
          destaque={due.length > 0}
          titulo={`Revisão do dia${due.length ? ` · ${due.length}` : ""}`}
          desc={
            due.length
              ? "Questões que venceram na repetição espaçada."
              : "Nada vencido por agora. Volte amanhã."
          }
          icone={
            <RotateCcw
              size={18}
              color={due.length > 0 ? cor.branco : cor.ink2}
            />
          }
          acao={
            <Button
              size="sm"
              onPress={() => praticar(due)}
              disabled={due.length === 0}
            >
              Revisar
            </Button>
          }
        />
        <AcaoCard
          titulo="Revisão inteligente"
          premium={!premium}
          desc="Questões novas nos seus pontos fracos."
          icone={<BrainCircuit size={18} color={cor.ink2} />}
          acao={
            <Button
              size="sm"
              variant={premium ? "primary" : "outline"}
              onPress={revisaoInteligente}
              icon={premium ? undefined : <Crown size={13} color={cor.ink} />}
            >
              {premium ? "Gerar" : "Premium"}
            </Button>
          }
        />
      </View>

      <View style={s.listaTopo}>
        <Texto v="eyebrow">todas as questões</Texto>
        <Pressable onPress={() => praticar(erros)} hitSlop={8}>
          <Texto v="peq" c={cor.azulInk}>
            praticar todas ({erros.length})
          </Texto>
        </Pressable>
      </View>

      <View style={{ gap: esp.lg }}>
        {erros.map((e) => (
          <View key={e.questao.id}>
            <RevisaoQuestao
              numero={0}
              questao={e.questao}
              resposta={e.respostaDada}
            />
            <View style={s.rodape}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <DifBadge nivel={e.questao.dificuldade} />
                {typeof e.box === "number" && e.box > 1 && (
                  <Badge mono>{`caixa ${e.box}/5`}</Badge>
                )}
                {e.revisadoOk > 0 && (
                  <Badge tom="ok" mono>{`${e.revisadoOk}× ok`}</Badge>
                )}
              </View>
              <Pressable
                onPress={() => remover(e.questao.id)}
                hitSlop={8}
                style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
              >
                <Trash2 size={14} color={cor.ink3} />
                <Texto v="peq" c={cor.ink3}>
                  remover
                </Texto>
              </Pressable>
            </View>
          </View>
        ))}
      </View>
    </Tela>
  );
}

// ── Cartão de ação de revisão ─────────────────────────────────

function AcaoCard({
  titulo,
  desc,
  icone,
  acao,
  destaque,
  premium,
}: {
  titulo: string;
  desc: string;
  icone: ReactNode;
  acao: ReactNode;
  destaque?: boolean;
  premium?: boolean;
}) {
  return (
    <Card
      style={[
        s.acao,
        destaque && {
          borderColor: alpha(cor.azul, 0.3),
          backgroundColor: alpha(cor.azulWash, 0.5),
        },
      ]}
    >
      <View
        style={{ flexDirection: "row", alignItems: "flex-start", gap: esp.md }}
      >
        <View
          style={[
            s.acaoIcone,
            { backgroundColor: destaque ? cor.azul : cor.paper2 },
          ]}
        >
          {icone}
        </View>
        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              flexWrap: "wrap",
            }}
          >
            <Texto v="h3">{titulo}</Texto>
            {premium && (
              <Badge tom="mark" mono>
                premium
              </Badge>
            )}
          </View>
          <Texto v="peq" style={{ marginTop: 2 }}>
            {desc}
          </Texto>
        </View>
      </View>
      <View style={{ marginTop: esp.lg, alignItems: "flex-end" }}>{acao}</View>
    </Card>
  );
}

const s = StyleSheet.create({
  vazio: { alignItems: "center", paddingTop: 64 },
  vazioIcone: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: cor.paper2,
    alignItems: "center",
    justifyContent: "center",
  },
  acao: { padding: esp.xl, borderRadius: raio.lg },
  acaoIcone: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  listaTopo: {
    marginTop: esp.xxxl,
    marginBottom: esp.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rodape: {
    marginTop: esp.sm,
    paddingHorizontal: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
