import { Pressable, StyleSheet, View } from "react-native";
import * as Haptics from "expo-haptics";
import type { Questao, Resposta } from "@/types";
import { bancaById } from "@/data/catalog";
import { alpha, cor, esp, raio } from "@/theme/tokens";
import { Card } from "@/components/ui/Card";
import { Badge, DifBadge } from "@/components/ui/Badge";
import { Bubble } from "@/components/ui/Bubble";
import { Texto } from "@/components/ui/Texto";

export function QuestaoView({
  numero,
  questao,
  resposta,
  onResponder,
}: {
  numero: number;
  questao: Questao;
  resposta: Resposta;
  onResponder: (r: Resposta) => void;
}) {
  const marcar = (r: Resposta) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onResponder(r);
  };

  return (
    <Card marks style={s.card}>
      <View style={s.cabecalho}>
        <View style={s.numero}>
          <Texto v="mono" c={cor.paper} style={s.numeroTxt}>
            {numero}
          </Texto>
        </View>
        <Badge mono>{questao.materia}</Badge>
        <DifBadge nivel={questao.dificuldade} />
      </View>

      <Texto v="eyebrow" style={{ marginBottom: esp.md, fontSize: 10 }}>
        {bancaById(questao.banca).nome}
        {questao.assunto && questao.assunto !== questao.materia
          ? ` · ${questao.assunto}`
          : ""}
      </Texto>

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

      <View style={{ marginTop: esp.xxl }}>
        {questao.tipo === "certo_errado" ? (
          <CertoErrado resposta={resposta} onResponder={marcar} />
        ) : (
          <View style={{ gap: 10 }}>
            {questao.alternativas?.map((alt, i) => {
              const on = resposta === i;
              return (
                <Pressable
                  key={alt.letra}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  onPress={() => marcar(i)}
                  style={({ pressed }) => [
                    s.alt,
                    on
                      ? { borderColor: cor.azul, backgroundColor: cor.azulWash }
                      : { borderColor: cor.line, backgroundColor: cor.card },
                    pressed && !on && { backgroundColor: cor.paper },
                  ]}
                >
                  <Bubble letra={alt.letra} state={on ? "selected" : "idle"} />
                  <Texto v="corpo" c={cor.ink} style={s.altTxt}>
                    {alt.texto}
                  </Texto>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
    </Card>
  );
}

export function CertoErrado({
  resposta,
  onResponder,
}: {
  resposta: Resposta;
  onResponder: (r: Resposta) => void;
}) {
  const opts = [
    { val: true, letra: "C", label: "Certo" },
    { val: false, letra: "E", label: "Errado" },
  ] as const;

  return (
    <View style={{ flexDirection: "row", gap: esp.md }}>
      {opts.map((o) => {
        const on = resposta === o.val;
        return (
          <Pressable
            key={o.label}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            onPress={() => onResponder(o.val)}
            style={({ pressed }) => [
              s.ce,
              on
                ? { borderColor: cor.azul, backgroundColor: cor.azulWash }
                : { borderColor: cor.line, backgroundColor: cor.card },
              pressed && !on && { backgroundColor: cor.paper },
            ]}
          >
            <Bubble letra={o.letra} state={on ? "selected" : "idle"} />
            <Texto v="h3" c={on ? cor.azulInk : cor.ink2}>
              {o.label}
            </Texto>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  card: { padding: esp.xxl, paddingTop: esp.xxl + 4 },
  cabecalho: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: esp.md,
  },
  numero: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: cor.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  numeroTxt: { fontSize: 13 },
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
    gap: 13,
    borderRadius: raio.base,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
  },
  altTxt: { flex: 1, paddingTop: 5, fontSize: 15.5, lineHeight: 22 },
  ce: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: raio.base,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: esp.lg,
  },
});
