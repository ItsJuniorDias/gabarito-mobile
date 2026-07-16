import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  Check,
  Crown,
  ExternalLink,
  RefreshCw,
  Server,
  ShieldCheck,
  TriangleAlert,
  Wrench,
} from "lucide-react-native";
import { useApp } from "@/context/AppContext";
import { useAssinatura } from "@/context/SubscriptionContext";
import { usePerfil } from "@/context/PerfilContext";
import { MODELOS, bancaById } from "@/data/catalog";
import { MODELO_FREE } from "@/data/planos";
import { METAS } from "@/lib/onboarding";
import { apiMode } from "@/lib/openrouter";
import { alpha, cor, esp, fonte, raio } from "@/theme/tokens";
import { Tela } from "@/components/ui/Tela";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, type Tom } from "@/components/ui/Badge";
import { Label, Slider, Toggle } from "@/components/ui/Field";
import { Texto } from "@/components/ui/Texto";
import { Logo } from "@/components/ui/Logo";

export default function Ajustes() {
  const { settings, salvarSettings } = useApp();
  const {
    premium,
    podeUsarModelo,
    abrirPaywall,
    assinatura,
    gerenciar,
    restaurar,
    restaurando,
    modo,
    premiumDev,
    simularPremium,
  } = useAssinatura();

  const [modelo, setModelo] = useState(settings.modelo);
  const [temp, setTemp] = useState(settings.temperatura);
  const [salvou, setSalvou] = useState(false);

  const modoApi = apiMode();
  const mudou = modelo !== settings.modelo || temp !== settings.temperatura;

  // free não pode ficar com modelo premium selecionado
  useEffect(() => {
    if (!premium && !podeUsarModelo(modelo)) setModelo(MODELO_FREE);
  }, [premium, podeUsarModelo, modelo]);

  const salvar = () => {
    salvarSettings({ modelo, temperatura: temp });
    setSalvou(true);
    setTimeout(() => setSalvou(false), 1800);
  };

  const data = (t?: number) => (t ? new Date(t).toLocaleDateString("pt-BR") : null);
  const loja = assinatura.loja === "PLAY_STORE" ? "Google Play" : "App Store";

  return (
    <Tela>
      <Animated.View entering={FadeInDown.duration(340)}>
        <Texto v="eyebrow">ajustes</Texto>
        <Texto v="h1" style={{ marginTop: 6 }}>
          Configurações
        </Texto>
      </Animated.View>

      {/* Plano */}
      <Card style={[s.card, { marginTop: esp.xxl }]}>
        <Label>Plano</Label>
        {premium ? (
          <>
            <View style={s.linha}>
              <View style={[s.icone, { backgroundColor: cor.okWash }]}>
                <Crown size={18} color={cor.okInk} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={s.tituloLinha}>
                  <Texto v="h3">
                    {assinatura.emTrial ? "Premium · teste grátis" : "Premium ativo"}
                  </Texto>
                  {premiumDev && (
                    <Badge tom="no" mono>
                      dev
                    </Badge>
                  )}
                </View>
                <Texto v="peq" style={{ marginTop: 2 }}>
                  {premiumDev
                    ? "Simulado neste aparelho — não é uma compra real."
                    : assinatura.expiraEm
                      ? assinatura.renova === false
                        ? `Cancelada. Acesso até ${data(assinatura.expiraEm)}.`
                        : `Renova em ${data(assinatura.expiraEm)} pela ${loja}.`
                      : "Simulados e modelos liberados sem limite."}
                </Texto>
              </View>
            </View>
            {!premiumDev && (
              <Button
                variant="outline"
                full
                style={{ marginTop: esp.lg }}
                onPress={() => void gerenciar()}
                iconRight={<ExternalLink size={14} color={cor.ink} />}
              >
                Gerenciar na {loja}
              </Button>
            )}
          </>
        ) : (
          <>
            <View style={s.linha}>
              <View style={[s.icone, { backgroundColor: alpha(cor.mark, 0.4) }]}>
                <Crown size={18} color={cor.ink} />
              </View>
              <View style={{ flex: 1 }}>
                <Texto v="h3">Grátis</Texto>
                <Texto v="peq" style={{ marginTop: 2 }}>
                  3 simulados com IA por semana, até 10 questões.
                </Texto>
              </View>
            </View>
            <Button
              full
              style={{ marginTop: esp.lg }}
              icon={<Crown size={15} color={cor.branco} />}
              onPress={() => abrirPaywall(null)}
            >
              Ver o Premium
            </Button>
            {/* Restaurar precisa existir fora do paywall: quem trocou de
                aparelho procura por isto aqui, não numa tela de venda. */}
            <Pressable
              onPress={() => void restaurar()}
              hitSlop={8}
              disabled={restaurando || modo === "ausente"}
              style={s.restaurar}
            >
              <RefreshCw size={12} color={cor.azulInk} />
              <Texto v="micro" c={cor.azulInk} style={{ fontFamily: fonte.sansMedium }}>
                {restaurando ? "verificando…" : "restaurar compras"}
              </Texto>
            </Pressable>
          </>
        )}
      </Card>

      {/* Plano de estudo (onboarding) */}
      <PlanoDeEstudo />

      {/* Status da conexão */}
      <Card style={[s.card, { marginTop: esp.lg }]}>
        <Label>Conexão com o modelo</Label>
        <StatusConexao modo={modoApi} />
      </Card>

      {/* Modelo */}
      <Card style={[s.card, { marginTop: esp.lg }]}>
        <Label>Modelo (OpenRouter)</Label>
        <View style={{ gap: esp.sm }}>
          {MODELOS.map((m) => {
            const bloqueado = !podeUsarModelo(m.id);
            const on = m.id === modelo;
            return (
              <Pressable
                key={m.id}
                accessibilityRole="radio"
                accessibilityState={{ selected: on, disabled: bloqueado }}
                onPress={() => (bloqueado ? abrirPaywall("modelo") : setModelo(m.id))}
                style={[
                  s.modelo,
                  on
                    ? { borderColor: cor.azul, backgroundColor: cor.azulWash }
                    : { borderColor: cor.line, backgroundColor: cor.card },
                  bloqueado && { opacity: 0.55 },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Texto v="h3" style={{ fontSize: 15 }}>
                      {m.nome}
                    </Texto>
                    {bloqueado && (
                      <Badge tom="mark" mono>
                        premium
                      </Badge>
                    )}
                  </View>
                  <Texto v="mono" c={cor.ink3} style={{ fontSize: 11, marginTop: 2 }}>
                    {m.id}
                  </Texto>
                  <Texto v="micro" style={{ marginTop: 4 }}>
                    {m.nota}
                  </Texto>
                </View>
                <View
                  style={[
                    s.radio,
                    on ? { borderColor: cor.azul, backgroundColor: cor.azul } : null,
                  ]}
                >
                  {on && <Check size={12} color={cor.branco} />}
                </View>
              </Pressable>
            );
          })}
        </View>
      </Card>

      {/* Temperatura */}
      <Card style={[s.card, { marginTop: esp.lg }]}>
        <View style={s.cardTopo}>
          <Label>Temperatura</Label>
          <Texto v="mono">{temp.toFixed(1)}</Texto>
        </View>
        <Slider value={temp} onChange={setTemp} min={0} max={1.2} step={0.1} />
        <View style={s.escala}>
          <Texto v="eyebrow" style={{ fontSize: 10 }}>
            preciso
          </Texto>
          <Texto v="eyebrow" style={{ fontSize: 10 }}>
            criativo
          </Texto>
        </View>
        <Texto v="peq" c={cor.ink3} style={{ marginTop: esp.md, lineHeight: 20 }}>
          Baixa (0,3–0,6) deixa as questões mais consistentes e factuais. Alta varia mais
          o estilo, com risco de imprecisão.
        </Texto>
      </Card>

      <Button
        full
        size="lg"
        style={{ marginTop: esp.xl }}
        onPress={salvar}
        disabled={!mudou && !salvou}
        icon={salvou ? <Check size={16} color={cor.branco} /> : undefined}
      >
        {salvou ? "Salvo" : "Salvar"}
      </Button>
      {mudou && !salvou && (
        <Texto v="micro" center style={{ marginTop: esp.md }}>
          alterações não salvas
        </Texto>
      )}

      {/* Bancada de dev — nunca entra no build de release */}
      {__DEV__ && (
        <Card style={[s.card, s.dev, { marginTop: esp.xxl }]}>
          <View style={s.tituloLinha}>
            <Wrench size={13} color={cor.ink3} />
            <Label>Desenvolvimento</Label>
          </View>
          <Toggle
            checked={premiumDev}
            onChange={simularPremium}
            label="Simular Premium neste aparelho"
          />
          <Texto v="micro" style={{ marginTop: esp.sm, lineHeight: 17 }}>
            Libera tudo sem passar pelo sandbox da loja. Só existe em `__DEV__`, então não
            vira bypass no app publicado.
          </Texto>
        </Card>
      )}

      <View style={{ marginTop: 48, alignItems: "center", gap: 6 }}>
        <Logo size={22} />
        <Texto v="micro">versão 0.1.0</Texto>
      </View>
    </Tela>
  );
}

// ── Plano de estudo ───────────────────────────────────────────

function PlanoDeEstudo() {
  const { perfil, atualizarPerfil, refazerOnboarding, diasAteProva } = usePerfil();
  if (!perfil) return null;

  const confirmarRefazer = () => {
    Alert.alert(
      "Refazer o plano?",
      "Suas estatísticas e o caderno de erros continuam intactos. Só as preferências de estudo voltam do zero.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Refazer", style: "destructive", onPress: refazerOnboarding },
      ],
    );
  };

  return (
    <Card style={[s.card, { marginTop: esp.lg }]}>
      <View style={s.cardTopo}>
        <Label>Meu plano de estudo</Label>
        <Pressable onPress={confirmarRefazer} hitSlop={8}>
          <Texto v="micro" c={cor.azulInk} style={{ fontFamily: fonte.sansMedium }}>
            refazer
          </Texto>
        </Pressable>
      </View>

      <View style={{ gap: 6 }}>
        <Texto v="peq" c={cor.ink}>
          {bancaById(perfil.banca).nome}
          {perfil.materias.length > 0 && ` · ${perfil.materias.length} matérias`}
        </Texto>
        <Texto v="micro">
          {diasAteProva != null
            ? `prova em cerca de ${diasAteProva} dias`
            : "sem data de prova definida"}
        </Texto>
      </View>

      <View style={s.divisor} />

      <Label>Meta diária</Label>
      <View style={s.chips}>
        {METAS.map((m) => {
          const on = perfil.metaDiaria === m.valor;
          return (
            <Pressable
              key={m.valor}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              onPress={() => atualizarPerfil({ metaDiaria: m.valor })}
              style={[
                s.chip,
                on
                  ? { borderColor: cor.azul, backgroundColor: cor.azulWash }
                  : { borderColor: cor.line2, backgroundColor: cor.card },
              ]}
            >
              <Texto
                v="peq"
                c={on ? cor.azulInk : cor.ink2}
                style={{ fontFamily: fonte.sansMedium }}
              >
                {m.valor}
              </Texto>
            </Pressable>
          );
        })}
        <Texto v="micro" style={{ alignSelf: "center", marginLeft: 4 }}>
          questões por dia
        </Texto>
      </View>
    </Card>
  );
}

function StatusConexao({ modo }: { modo: ReturnType<typeof apiMode> }) {
  const cfg = {
    proxy: {
      Icone: ShieldCheck,
      tom: "ok" as Tom,
      bg: cor.okWash,
      fg: cor.okInk,
      titulo: "Proxy no backend",
      texto:
        "As chamadas passam pelo seu servidor (EXPO_PUBLIC_API_BASE). A key não vai no app. Recomendado.",
      badge: "seguro",
    },
    direto: {
      Icone: TriangleAlert,
      tom: "mark" as Tom,
      bg: alpha(cor.mark, 0.4),
      fg: cor.ink,
      titulo: "Chamada direta (dev)",
      texto:
        "Falando direto com o OpenRouter usando a key do .env. Ok pra desenvolver, mas não publique assim — a key vai dentro do IPA/APK.",
      badge: "só dev",
    },
    ausente: {
      Icone: Server,
      tom: "no" as Tom,
      bg: cor.noWash,
      fg: cor.noInk,
      titulo: "Sem acesso configurado",
      texto:
        "Defina EXPO_PUBLIC_API_BASE (proxy) ou EXPO_PUBLIC_OPENROUTER_API_KEY (dev) no .env e reinicie com `npx expo start --clear`.",
      badge: "offline",
    },
  }[modo];

  const { Icone } = cfg;
  return (
    <View style={s.status}>
      <View style={[s.icone, { backgroundColor: cfg.bg }]}>
        <Icone size={18} color={cfg.fg} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Texto v="h3" style={{ fontSize: 15 }}>
            {cfg.titulo}
          </Texto>
          <Badge tom={cfg.tom} mono>
            {cfg.badge}
          </Badge>
        </View>
        <Texto v="peq" style={{ marginTop: 4, lineHeight: 20 }}>
          {cfg.texto}
        </Texto>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: { padding: esp.xl },
  cardTopo: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  tituloLinha: { flexDirection: "row", alignItems: "center", gap: 6 },
  linha: { flexDirection: "row", alignItems: "center", gap: esp.md },
  icone: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  restaurar: {
    marginTop: esp.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  status: {
    flexDirection: "row",
    gap: esp.md,
    borderRadius: raio.base,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: cor.line,
    backgroundColor: alpha(cor.paper, 0.6),
    padding: esp.lg,
  },
  modelo: {
    flexDirection: "row",
    alignItems: "center",
    gap: esp.md,
    borderRadius: raio.base,
    borderWidth: StyleSheet.hairlineWidth,
    padding: esp.lg,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: cor.line2,
    alignItems: "center",
    justifyContent: "center",
  },
  escala: { flexDirection: "row", justifyContent: "space-between", marginTop: 2 },
  divisor: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: cor.line,
    marginVertical: esp.xl,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: esp.sm },
  chip: {
    minWidth: 46,
    alignItems: "center",
    borderRadius: raio.full,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  dev: {
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: cor.line2,
    backgroundColor: alpha(cor.paper2, 0.5),
  },
});
