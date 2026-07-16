import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { BellRing, Check } from "lucide-react-native";
import { cor, esp } from "@/theme/tokens";
import { useAssinatura } from "@/context/SubscriptionContext";
import { Button } from "@/components/ui/Button";
import { Folha } from "@/components/ui/Folha";
import { Input, Label } from "@/components/ui/Field";
import { Texto } from "@/components/ui/Texto";

const emailOk = (e: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e.trim());

/** Captura nome+e-mail no momento de maior engajamento (fim do 1º simulado). */
export function CapturaIdentidade({
  aberto,
  onFechar,
}: {
  aberto: boolean;
  onFechar: () => void;
}) {
  const { salvarIdentidade } = useAssinatura();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [feito, setFeito] = useState(false);

  const salvar = () => {
    if (!emailOk(email)) return;
    salvarIdentidade(email.trim(), nome.trim() || undefined);
    setFeito(true);
    setTimeout(onFechar, 1100);
  };

  return (
    <Folha aberto={aberto} onFechar={onFechar} fecharVisivel={!feito}>
      {feito ? (
        <View style={{ alignItems: "center", paddingVertical: esp.xl }}>
          <View style={[s.icone, { backgroundColor: cor.okWash }]}>
            <Check size={22} color={cor.okInk} />
          </View>
          <Texto v="h3" style={{ marginTop: esp.lg }}>
            Anotado!
          </Texto>
          <Texto v="peq" style={{ marginTop: 4 }}>
            Pode fechar e continuar.
          </Texto>
        </View>
      ) : (
        <>
          <View style={[s.icone, { backgroundColor: cor.azulWash }]}>
            <BellRing size={20} color={cor.azulInk} />
          </View>
          <Texto v="h2" style={{ marginTop: esp.lg }}>
            Quer o lembrete da revisão?
          </Texto>
          <Texto v="peq" style={{ marginTop: 6 }}>
            A repetição espaçada só funciona se você voltar no dia certo. Deixe seu
            e-mail e a gente avisa quando sua revisão vencer. Seu progresso fica salvo
            no aparelho de qualquer jeito.
          </Texto>

          <View style={{ marginTop: esp.xl, gap: esp.md }}>
            <View>
              <Label>Nome (opcional)</Label>
              <Input
                value={nome}
                onChangeText={setNome}
                placeholder="Como te chamamos?"
                autoCapitalize="words"
                autoComplete="name"
                returnKeyType="next"
              />
            </View>
            <View>
              <Label>E-mail</Label>
              <Input
                value={email}
                onChangeText={setEmail}
                placeholder="voce@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                inputMode="email"
                returnKeyType="done"
                onSubmitEditing={salvar}
              />
            </View>
          </View>

          <Button
            size="lg"
            full
            style={{ marginTop: esp.xl }}
            disabled={!emailOk(email)}
            onPress={salvar}
          >
            Quero o lembrete
          </Button>
          <Pressable onPress={onFechar} style={{ marginTop: esp.md, alignSelf: "center" }} hitSlop={8}>
            <Texto v="micro">agora não</Texto>
          </Pressable>
        </>
      )}
    </Folha>
  );
}

const s = StyleSheet.create({
  icone: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
