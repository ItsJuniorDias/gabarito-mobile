import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
// Importados por subpath de propósito: o barrel (`@expo-google-fonts/ibm-plex-sans`)
// dá require em TODOS os 14 pesos + itálicos, e o Metro não faz tree-shaking de
// asset. Pelo caminho exato, o bundle cai de ~5,1 MB de fonte pra ~1,8 MB.
import { IBMPlexSans_400Regular } from "@expo-google-fonts/ibm-plex-sans/400Regular";
import { IBMPlexSans_500Medium } from "@expo-google-fonts/ibm-plex-sans/500Medium";
import { IBMPlexSans_600SemiBold } from "@expo-google-fonts/ibm-plex-sans/600SemiBold";
import { IBMPlexSans_700Bold } from "@expo-google-fonts/ibm-plex-sans/700Bold";
import { IBMPlexMono_400Regular } from "@expo-google-fonts/ibm-plex-mono/400Regular";
import { IBMPlexMono_500Medium } from "@expo-google-fonts/ibm-plex-mono/500Medium";
import { IBMPlexMono_600SemiBold } from "@expo-google-fonts/ibm-plex-mono/600SemiBold";
import { IBMPlexMono_700Bold } from "@expo-google-fonts/ibm-plex-mono/700Bold";

import { cor, temaNavegacao } from "@/theme/tokens";
import { hidratar } from "@/lib/kv";
import { CHAVES_STORAGE } from "@/lib/storage";
import { CHAVES_IDENTIDADE } from "@/lib/identidade";
import { CHAVES_BILLING, configurarBilling } from "@/lib/billing";
import { CHAVES_ONBOARDING } from "@/lib/onboarding";
import { AppProvider } from "@/context/AppContext";
import { PerfilProvider, usePerfil } from "@/context/PerfilContext";
import { SubscriptionProvider } from "@/context/SubscriptionContext";
import { GeracaoOverlay } from "@/components/GeracaoOverlay";

void SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ duration: 300, fade: true });

export default function RootLayout() {
  const [fontesOk, fontesErro] = useFonts({
    IBMPlexSans_400Regular,
    IBMPlexSans_500Medium,
    IBMPlexSans_600SemiBold,
    IBMPlexSans_700Bold,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
    IBMPlexMono_600SemiBold,
    IBMPlexMono_700Bold,
  });

  // O storage precisa estar em memória ANTES dos providers montarem: eles leem
  // no initializer do useState (ver src/lib/kv.ts). O splash cobre a espera.
  const [dadosOk, setDadosOk] = useState(false);
  useEffect(() => {
    void (async () => {
      await hidratar([
        ...CHAVES_STORAGE,
        ...CHAVES_IDENTIDADE,
        ...CHAVES_BILLING,
        ...CHAVES_ONBOARDING,
      ]);
      // O RevenueCat também precisa estar de pé antes dos providers: o
      // SubscriptionProvider consulta a loja assim que monta. `configure` é
      // síncrono por dentro, então isso não segura o splash de verdade.
      await configurarBilling();
      setDadosOk(true);
    })();
  }, []);

  const pronto = dadosOk && (fontesOk || !!fontesErro);

  const aoMontar = useCallback(() => {
    if (pronto) void SplashScreen.hideAsync();
  }, [pronto]);

  if (!pronto) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: cor.paper }}>
      <SafeAreaProvider>
        {/* Sem isto a tab bar de vidro pisca branco no push e o header
            renderiza sobre a cor errada (docs do expo-router, native tabs). */}
        <ThemeProvider value={temaNavegacao}>
          <SubscriptionProvider>
            <PerfilProvider>
              <AppProvider>
                <View style={{ flex: 1 }} onLayout={aoMontar}>
                  <StatusBar style="dark" />
                  <Rotas />
                  <GeracaoOverlay />
                </View>
              </AppProvider>
            </PerfilProvider>
          </SubscriptionProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/**
 * As rotas moram num filho porque precisam ler o perfil — e quem provê o
 * perfil é o layout acima.
 *
 * `Stack.Protected` é o mecanismo do expo-router pra isso: quando `guard` vira
 * falso as telas somem do navegador e ele reposiciona sozinho na primeira
 * disponível. É por isso que o onboarding não precisa chamar `router.replace`
 * ao terminar — basta salvar o perfil (ver app/onboarding.tsx).
 *
 * `premium` fica FORA dos dois guards de propósito: é a única tela que faz
 * sentido nos dois mundos, e mantê-la sempre montada evita a corrida entre
 * trocar o guard e empilhar o modal.
 */
function Rotas() {
  const { pronto } = usePerfil();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: cor.paper },
      }}
    >
      <Stack.Protected guard={!pronto}>
        <Stack.Screen
          name="onboarding"
          options={{ animation: "fade", gestureEnabled: false }}
        />
      </Stack.Protected>

      <Stack.Protected guard={pronto}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="simulado"
          options={{
            animation: "slide_from_bottom",
            // sair da prova por gesto = perder as respostas sem querer
            gestureEnabled: false,
          }}
        />
        <Stack.Screen name="resultado" options={{ gestureEnabled: false }} />
      </Stack.Protected>

      <Stack.Screen
        name="premium"
        options={{ presentation: "modal", sheetGrabberVisible: true }}
      />
    </Stack>
  );
}
