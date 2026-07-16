import { StyleSheet, View } from "react-native";
import { BookmarkPlus, Check } from "lucide-react-native";
import type { Questao, Resposta } from "@/types";
import { alpha, cor, esp, raio } from "@/theme/tokens";
import { Card } from "@/components/ui/Card";
import { Badge, DifBadge } from "@/components/ui/Badge";
import { Bubble, type BubbleState } from "@/components/ui/Bubble";
import { Button } from "@/components/ui/Button";
import { Texto } from "@/components/ui/Texto";

export function RevisaoQuestao({
  numero,
  questao,
  resposta,
  salvo,
  onSalvar,
}: {
  numero: number;
  questao: Questao;
  resposta: Resposta;
  salvo?: boolean;
  onSalvar?: () => void;
}) {
  const acertou = resposta === questao.correta;
  const emBranco = resposta == null;

  return (
    <Card
      style={[
        s.card,
        { borderColor: alpha(acertou ? cor.ok : cor.no, 0.3) },
      ]}
    >
      <View style={s.cabecalho}>
        {numero > 0 && (
          <View style={[s.num, { backgroundColor: acertou ? cor.ok : cor.no }]}>
            <Texto v="mono" c={cor.branco} style={{ fontSize: 13 }}>
              {numero}
            </Texto>
          </View>
        )}
        <Badge mono>{questao.materia}</Badge>
        <DifBadge nivel={questao.dificuldade} />
        <View style={{ flex: 1 }} />
        {acertou ? (
          <Badge tom="ok" mono>
            acertou
          </Badge>
        ) : emBranco ? (
          <Badge tom="neutral" mono>
            em branco
          </Badge>
        ) : (
          <Badge tom="no" mono>
            errou
          </Badge>
        )}
      </View>

      {questao.contexto ? (
        <View style={s.contexto}>
          <Texto v="peq" style={{ lineHeight: 21 }}>
            {questao.contexto}
          </Texto>
        </View>
      ) : null}

      <Texto v="enunciado" selectable>
        {questao.enunciado}
      </Texto>

      <View style={{ marginTop: esp.xl }}>
        {questao.tipo === "certo_errado" ? (
          <RevisaoCertoErrado questao={questao} resposta={resposta} />
        ) : (
          <View style={{ gap: 8 }}>
            {questao.alternativas?.map((alt, i) => {
              const state = estadoAlternativa(i, questao, resposta);
              const certa = state === "correct" || state === "gabarito";
              return (
                <View
                  key={alt.letra}
                  style={[
                    s.alt,
                    certa
                      ? {
                          borderColor: alpha(cor.ok, 0.4),
                          backgroundColor: alpha(cor.okWash, 0.5),
                        }
                      : state === "incorrect"
                        ? {
                            borderColor: alpha(cor.no, 0.4),
                            backgroundColor: alpha(cor.noWash, 0.5),
                          }
                        : { borderColor: cor.line, backgroundColor: cor.card },
                  ]}
                >
                  <Bubble letra={alt.letra} state={state} />
                  <Texto v="corpo" c={cor.ink} style={s.altTxt}>
                    {alt.texto}
                  </Texto>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {questao.explicacao ? (
        <View style={s.explicacao}>
          <Texto v="eyebrow" c={cor.ink2} style={{ marginBottom: 6 }}>
            por que
          </Texto>
          <Texto v="peq" style={{ lineHeight: 21 }} selectable>
            {questao.explicacao}
          </Texto>
        </View>
      ) : null}

      {onSalvar && !acertou ? (
        <View style={{ marginTop: esp.lg, alignItems: "flex-end" }}>
          <Button
            variant={salvo ? "subtle" : "outline"}
            size="sm"
            onPress={onSalvar}
            disabled={salvo}
            icon={
              salvo ? (
                <Check size={14} color={cor.azulInk} />
              ) : (
                <BookmarkPlus size={14} color={cor.ink} />
              )
            }
          >
            {salvo ? "no caderno" : "revisar depois"}
          </Button>
        </View>
      ) : null}
    </Card>
  );
}

function RevisaoCertoErrado({
  questao,
  resposta,
}: {
  questao: Questao;
  resposta: Resposta;
}) {
  const correta = questao.correta === true;
  const opts = [
    { val: true, letra: "C", label: "Certo" },
    { val: false, letra: "E", label: "Errado" },
  ] as const;

  return (
    <View style={{ flexDirection: "row", gap: esp.md }}>
      {opts.map((o) => {
        const ehCorreta = o.val === correta;
        const escolhida = resposta === o.val;
        const state: BubbleState = ehCorreta
          ? escolhida
            ? "correct"
            : "gabarito"
          : escolhida
            ? "incorrect"
            : "idle";
        return (
          <View
            key={o.label}
            style={[
              s.ce,
              ehCorreta
                ? {
                    borderColor: alpha(cor.ok, 0.4),
                    backgroundColor: alpha(cor.okWash, 0.5),
                  }
                : escolhida
                  ? {
                      borderColor: alpha(cor.no, 0.4),
                      backgroundColor: alpha(cor.noWash, 0.5),
                    }
                  : { borderColor: cor.line, backgroundColor: cor.card },
            ]}
          >
            <Bubble letra={o.letra} state={state} />
            <Texto
              v="h3"
              c={ehCorreta ? cor.okInk : escolhida ? cor.noInk : cor.ink3}
            >
              {o.label}
            </Texto>
          </View>
        );
      })}
    </View>
  );
}

function estadoAlternativa(i: number, q: Questao, resposta: Resposta): BubbleState {
  const correta = typeof q.correta === "number" ? q.correta : -1;
  const escolhida = typeof resposta === "number" ? resposta : -1;
  if (i === correta) return escolhida === correta ? "correct" : "gabarito";
  if (i === escolhida) return "incorrect";
  return "idle";
}

const s = StyleSheet.create({
  card: { padding: esp.xxl },
  cabecalho: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: esp.lg,
  },
  num: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  contexto: {
    marginBottom: esp.lg,
    borderLeftWidth: 2,
    borderLeftColor: cor.line2,
    backgroundColor: alpha(cor.paper2, 0.6),
    borderTopRightRadius: raio.base,
    borderBottomRightRadius: raio.base,
    paddingVertical: esp.md,
    paddingLeft: esp.lg,
    paddingRight: esp.md,
  },
  alt: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderRadius: raio.base,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
  },
  altTxt: { flex: 1, paddingTop: 5, fontSize: 15, lineHeight: 21 },
  ce: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: raio.base,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 14,
  },
  explicacao: {
    marginTop: esp.xl,
    borderRadius: raio.base,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: cor.line,
    backgroundColor: alpha(cor.paper, 0.7),
    padding: esp.lg,
  },
});
