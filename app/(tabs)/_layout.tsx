import { Pressable, StyleSheet, View } from "react-native";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { ChevronRight, RotateCcw } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useApp } from "@/context/AppContext";
import { revisaoDoDia } from "@/lib/storage";
import type { SimuladoConfig } from "@/types";
import { cor, fonte } from "@/theme/tokens";
import { Texto } from "@/components/ui/Texto";

/**
 * Tab bar NATIVA — não é uma barra em JS imitando o sistema.
 *
 * No iOS vira um UITabBarController: no iOS 26+ ganha o Liquid Glass de
 * graça (o conteúdo corre por baixo e o vidro refrata o papel), no iOS 18
 * cai no visual clássico. No Android vira a Material 3, com o popover de
 * long-press incluso. Nada disso é reimplementado aqui.
 *
 * Duas regras que valem lembrar:
 * 1. NÃO defina `backgroundColor` — cor sólida mata o vidro.
 * 2. As abas não entram sozinhas: cada rota precisa do seu Trigger.
 */
export default function TabsLayout() {
  const { erros } = useApp();
  const due = revisaoDoDia(erros);

  return (
    <NativeTabs
      tintColor={cor.azul}
      iconColor={cor.ink3}
      labelStyle={{ fontFamily: fonte.monoMedium, fontSize: 10 }}
      badgeBackgroundColor={cor.azul}
      // iOS 26: a barra encolhe numa pílula quando o dedo desce a lista
      minimizeBehavior="onScrollDown"
    >
      {/* iOS 26: cápsula de vidro flutuando sobre a tab bar (o padrão do
          mini-player do Music). Só existe quando há revisão vencida — some
          sozinha quando não há. Ignorado silenciosamente fora do iOS 26. */}
      {due.length > 0 && (
        <NativeTabs.BottomAccessory>
          <AcessorioRevisao total={due.length} />
        </NativeTabs.BottomAccessory>
      )}

      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon
          sf={{ default: "house", selected: "house.fill" }}
          md="home"
        />
        <NativeTabs.Trigger.Label>Início</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="montar">
        <NativeTabs.Trigger.Icon
          sf={{ default: "wand.and.stars", selected: "wand.and.sparkles" }}
          md="auto_awesome"
        />
        <NativeTabs.Trigger.Label>Montar</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="caderno">
        <NativeTabs.Trigger.Icon
          sf={{ default: "bookmark", selected: "bookmark.fill" }}
          md="bookmark"
        />
        <NativeTabs.Trigger.Label>Caderno</NativeTabs.Trigger.Label>
        {erros.length > 0 && (
          <NativeTabs.Trigger.Badge>{String(erros.length)}</NativeTabs.Trigger.Badge>
        )}
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="ajustes">
        <NativeTabs.Trigger.Icon
          sf={{ default: "gearshape", selected: "gearshape.fill" }}
          md="settings"
        />
        <NativeTabs.Trigger.Label>Ajustes</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

/** Conteúdo do acessório. O vidro e o raio vêm do sistema — aqui só o miolo. */
function AcessorioRevisao({ total }: { total: number }) {
  const { erros, refazerComQuestoes } = useApp();
  // 'inline' = a tab bar minimizou e o acessório virou uma pílula estreita
  const placement = NativeTabs.BottomAccessory.usePlacement();
  const compacto = placement === "inline";

  const revisar = () => {
    const due = revisaoDoDia(erros);
    if (due.length === 0) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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

  return (
    <Pressable onPress={revisar} style={s.acessorio} accessibilityRole="button">
      <View style={s.circulo}>
        <RotateCcw size={15} color={cor.branco} />
      </View>
      {compacto ? (
        <Texto v="mono" c={cor.ink} style={{ fontSize: 13 }}>
          {total}
        </Texto>
      ) : (
        <>
          <View style={{ flex: 1 }}>
            <Texto v="h3" style={{ fontSize: 14 }} numberOfLines={1}>
              Revisão do dia
            </Texto>
            <Texto v="micro" numberOfLines={1}>
              {`${total} questã${total === 1 ? "o" : "es"} vencida${total === 1 ? "" : "s"}`}
            </Texto>
          </View>
          <ChevronRight size={17} color={cor.ink3} />
        </>
      )}
    </Pressable>
  );
}

const s = StyleSheet.create({
  acessorio: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
  },
  circulo: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: cor.azul,
    alignItems: "center",
    justifyContent: "center",
  },
});
