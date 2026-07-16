# Gabarito · mobile

Simulados de concurso e ENEM gerados sob medida com IA. Porte nativo do
projeto web (React/Vite) para **Expo SDK 57 + expo-router**, com a tab bar
nativa da Apple (Liquid Glass no iOS 26) e Material 3 no Android.

Todo o domínio veio do web sem reescrita: mesma máquina de conversão (cota
semanal, paywall contextual, repetição espaçada, captura de lead), mesmo
design system (papel · lápis grafite · caneta azul · marca-texto), mesmos
prompts.

Duas coisas que o web não tinha e o app precisa ter: um **onboarding** que
monta o plano de estudo em seis perguntas, e **assinatura via RevenueCat** —
In-App Purchase de verdade, como a App Store exige.

---

## Rodando

```bash
npm install
cp .env.example .env      # preencha (veja abaixo)
npx expo start
```

Para a tab bar de vidro você precisa de um **build nativo** — Expo Go não
serve, porque as native tabs são um `UITabBarController` de verdade:

```bash
npx expo run:ios          # requer Xcode 26+ e macOS
npx expo run:android
```

> **Liquid Glass exige compilar com Xcode 26 ou superior.** Compilado com
> Xcode 26 e rodando em iOS 26+, o vidro aparece sozinho. Em iOS 18 a mesma
> build cai no visual clássico, sem alterar código. Se por algum motivo você
> quiser o visual antigo mesmo no iOS 26, adicione em `app.json`:
> `ios.infoPlist.UIDesignRequiresCompatibility: true` (deixei fora de
> propósito).

---

## Variáveis de ambiente

Duas formas de falar com o OpenRouter. A tela **Ajustes** mostra em qual você
está, sem adivinhação.

| Modo | Como | Quando |
|---|---|---|
| `proxy` | `EXPO_PUBLIC_API_BASE` aponta pro `server/` (Fastify) do projeto web | **Produção.** A key fica no servidor |
| `direto` | `EXPO_PUBLIC_OPENROUTER_API_KEY` | Só dev/simulador |
| `ausente` | nada configurado | O app avisa e não deixa gerar |

> ⚠️ **`EXPO_PUBLIC_*` é inlinado no bundle.** Na web isso já era ruim; no
> mobile é pior — qualquer um baixa o IPA/APK, descompacta e lê a string. Não
> publique com `EXPO_PUBLIC_OPENROUTER_API_KEY` preenchida.

Do backend web (`server/`) o app usa só `/api/generate` e `/api/lead`. Os
endpoints `/api/mp/*` não são mais chamados — a assinatura agora é IAP (veja
abaixo). Garanta que o servidor esteja acessível pela rede do aparelho (use o
IP da máquina, não `localhost`).

### RevenueCat

| Var | O que é |
|---|---|
| `EXPO_PUBLIC_RC_IOS_KEY` | chave **pública** do SDK (`appl_…`) |
| `EXPO_PUBLIC_RC_ANDROID_KEY` | chave **pública** do SDK (`goog_…`) |
| `EXPO_PUBLIC_RC_ENTITLEMENT` | identifier do entitlement. Default: `premium` |
| `EXPO_PUBLIC_RC_OFFERING` | vazio = usa o `current` do dashboard (recomendado) |
| `EXPO_PUBLIC_URL_TERMOS` | EULA. Vazio = cai no padrão da Apple |
| `EXPO_PUBLIC_URL_PRIVACIDADE` | política de privacidade |
| `EXPO_PUBLIC_PRECO_MENSAL` / `_ANUAL` | só fallback de exibição |

Sem as chaves o app **não quebra**: `billingMode()` devolve `ausente`, o
paywall explica o que falta e o resto do app funciona normalmente.

---

## Assinatura: o que configurar

O código está pronto. O que falta é fora do repositório — e a ordem importa,
porque cada passo depende do anterior.

**1. Lojas.** Na App Store Connect, crie um *subscription group* (ex.:
"Gabarito Premium") com dois produtos, `gabarito_premium_mensal` e
`gabarito_premium_anual`. O ID é livre: quem manda é o mapeamento no
RevenueCat, não o nome. Se quiser teste grátis, adicione uma *introductory
offer* de 7 dias — o app lê e ajusta o botão sozinho. No Play Console, o
equivalente são duas assinaturas com seus *base plans*.

**2. RevenueCat.** Crie o projeto e conecte as duas lojas (iOS pede o
*App-Specific Shared Secret*; Android, uma service account). Importe os
produtos e então:

- **Entitlement** com identifier `premium` — é o que o app pergunta. Anexe os
  dois produtos a ele.
- **Offering** marcado como `current`, com dois packages: `$rc_monthly` e
  `$rc_annual`. Esses identifiers **não** são decorativos: `src/data/planos.ts`
  procura exatamente por eles pra saber qual cartão é qual.

**3. Chaves.** `Project settings → API keys`, copie as **públicas** (`appl_…` e
`goog_…`) pro `.env`. A secret key não entra no app.

**4. Development build.** Compra não funciona no Expo Go — o SDK entra em
"Browser Mode" e devolve mocks:

```bash
npx expo run:ios      # ou eas build --profile development
```

No iOS, teste com um **Sandbox Tester** (App Store Connect → Users and Access).
No Android, faixa de teste interna com a conta na lista de licenças.

### Como saber se está tudo certo

Ajustes mostra o estado da conexão com o modelo; o **paywall** mostra o da
loja. Se aparecer o aviso "Assinatura ainda não configurada", `billingMode()`
devolveu `ausente` — chave faltando no `.env` (lembre do `--clear`). Se os
preços aparecerem mas forem os do `.env`, o offering não chegou: normalmente
é entitlement com nome diferente, package com identifier fora do padrão, ou
produto ainda em "Missing Metadata" na App Store Connect.

### Testando sem a loja

`__DEV__` ligado, Ajustes → **Simular Premium**. Libera tudo sem sandbox. O
toggle só existe em desenvolvimento, então não vira bypass no app publicado —
mas é `AsyncStorage`, não pergunte pra ele se a compra é real.

---

## O onboarding

Seis perguntas, `app/onboarding.tsx`. Duas decisões que valem explicar:

**As perguntas são alternativas de prova.** Bolha, letra, mola, háptico — o
mesmo `Bubble` do simulado. Quem termina o cadastro já sabe usar o app; o
onboarding não é um pedágio antes do produto, é a primeira aula dele. Escolha
única avança sozinha depois de 260 ms (dá pra ver a bolha preencher). Não tem
e-mail, não tem senha: o app é da pessoa desde o primeiro toque.

**O paywall é o último passo da própria rota**, não um `push("/premium")`. Isso
não é preferência estética — é o que evita uma corrida. Quem controla o acesso
é o `Stack.Protected` do `app/_layout.tsx`:

```tsx
<Stack.Protected guard={!pronto}>   // perfil ainda não existe
  <Stack.Screen name="onboarding" />
</Stack.Protected>
<Stack.Protected guard={pronto}>
  <Stack.Screen name="(tabs)" />
  …
</Stack.Protected>
```

Salvar o perfil vira o guard, o expo-router derruba a rota `/onboarding` e
reposiciona na home **sozinho**. Se o onboarding tentasse empilhar `/premium`
no mesmo tick, ele estaria empilhando numa tela que está sendo desmontada. Por
isso o perfil só é salvo quando a pessoa decide — assinando ou seguindo no
grátis — e por isso `premium` fica **fora** dos dois guards: é a única tela que
faz sentido nos dois mundos.

O paywall em si é `src/components/Paywall.tsx`, usado nos dois lugares. Um
paywall, um copy, um lugar pra mexer no preço. `app/premium.tsx` é só a casca
de modal (144 linhas, eram 542).

O que o onboarding devolve pro resto do app:

- **Home**: painel "hoje" (meta, ofensiva, dias até a prova) e o botão *Treino
  do dia*, que gera o simulado num toque com a banca e as matérias já
  escolhidas. Estudar sem passar pela tela de montagem é o ganho de retenção
  que o web não tinha.
- **Montar**: nasce preenchido, tudo editável.
- **Paywall**: o copy do motivo `onboarding` usa os números reais — "faltam 87
  dias", "870 questões até lá". Urgência que a própria pessoa acabou de
  declarar, não invenção de marketing.
- **Ajustes**: "Meu plano de estudo" edita a meta e refaz o onboarding sem
  apagar estatísticas nem caderno de erros.

A ofensiva (`src/lib/storage.ts`) conta **dias com alguma questão**, não dias
com a meta batida. Streak que exige perfeição morre na primeira terça-feira
ruim, e junto com ele o hábito.

---

## O que mudou do web pro mobile (e por quê)

### 1. `localStorage` → AsyncStorage, sem contaminar o domínio

`localStorage` é síncrono, AsyncStorage não. Reescrever tudo pra `async`
contaminaria `storage.ts`, `revisao.ts`, os dois contexts e metade dos
componentes — e ainda daria flash de estado vazio a cada render.

A ponte é `src/lib/kv.ts`: no boot, `hidratar()` puxa todas as chaves de uma
vez com `multiGet` e joga num cache em memória; o splash segura a tela até
terminar. Depois disso, **leitura é síncrona** e escrita é write-through
(memória agora, disco em background). Resultado: `storage.ts`, `revisao.ts`,
`identidade.ts` e os contexts ficaram praticamente idênticos aos do web.

Detalhe importante: os providers leem no *initializer* do `useState`, então a
hidratação precisa rodar **antes** deles montarem. É o que o `app/_layout.tsx`
faz — sem isso, o primeiro render viria vazio.

### 2. `state view` → rotas de arquivo

O `App.tsx` do web era um `switch (view)`. Aqui a navegação é o file system:

```
app/
  _layout.tsx          fontes · hidratação · providers · Stack raiz
  (tabs)/
    _layout.tsx        ← NativeTabs (o vidro mora aqui)
    index.tsx          Início      (Dashboard)
    montar.tsx         Montar      (SimuladoBuilder)
    caderno.tsx        Caderno     (ErrorBook)
    ajustes.tsx        Ajustes     (Settings)
  simulado.tsx         prova       ─┐ Stack por cima das tabs:
  resultado.tsx        resultado    │ durante a prova NÃO pode
  premium.tsx          paywall      │ existir tab bar
                                   ─┘
```

O grupo `(tabs)` não aparece na URL — as rotas são `/`, `/montar`, `/caderno`,
`/ajustes`. O `AppContext` perdeu o `view` e ganhou o `router`:
`abrirProva → push("/simulado")`, `finalizarSimulado → replace("/resultado")`
(replace pra que voltar não caia numa prova já entregue), `sairParaHome →
dismissAll()`.

### 3. Checkout web → In-App Purchase

O maior desvio do web, e o único obrigatório: **conteúdo digital consumido
dentro do app precisa ser vendido por IAP** (App Store 3.1.1). Mandar pro
checkout do Mercado Pago é rejeição na revisão.

`src/lib/mp.ts` saiu inteiro e no lugar entrou `src/lib/billing.ts`, com a
mesma regra de antes: **o SDK não vaza daqui**. Nenhum componente importa
`react-native-purchases` — todos falam com `configurarBilling`, `carregarOfertas`,
`comprarPlano`, `restaurarCompras`, `sincronizarAssinatura`, `ouvirAssinatura`.
O `SubscriptionContext` foi reescrito pra falar com essa interface e a UI de
paywall continua consumindo o context, não a loja.

Três coisas que o checkout web não dava e agora vêm de graça:

- **Preço e moeda vêm da loja**, não do seu `.env`. Quem abre o app na
  Inglaterra vê libra, com o imposto local já aplicado — o problema de moeda
  que o Mercado Pago não resolvia.
- **Trial** (`introPrice`) também vem da loja: o botão vira "Começar 7 dias
  grátis" sozinho se você configurar a oferta introdutória lá.
- **Restaurar compras** existe de verdade, sem conta nem senha.

### 4. framer-motion → Reanimated

Só layout animations (`FadeInDown`, `FadeIn/Out`, `SlideInDown`) e uma mola na
bolha do cartão-resposta. Nada de worklet complicado.

### 5. Tailwind → StyleSheet

`src/theme/tokens.ts` tem os mesmos hex do `index.css` do web (`paper #f3f2ee`,
`azul #263fd4`, `mark #fce44d`…). `bg-azul/30` virou `alpha(cor.azul, 0.3)`.
`grifo` (marca-texto) virou `<Text>` aninhado com `backgroundColor` — no RN
isso desenha um grifo de verdade.

No RN não existe font-weight sintético confiável: cada peso é uma família
própria (`IBMPlexSans_600SemiBold`). E as fontes são importadas por **subpath**
(`@expo-google-fonts/ibm-plex-sans/600SemiBold`), não pelo barrel — o barrel dá
`require` nos 14 pesos + itálicos e o Metro não faz tree-shaking de asset. Isso
sozinho tira ~3,5 MB do bundle.

### 6. Ganhos que o web não tinha

- **Timeout de 90 s** no fetch do OpenRouter — rede de celular cai, e o web
  ficava girando pra sempre.
- **Háptico** em bolha, chip, stepper, toggle, botão e no placar (sucesso vs.
  aviso conforme a nota). É metade do que faz parecer nativo.
- **Badge nativa** na aba Caderno com o total de erros.
- **Bottom accessory (iOS 26)**: quando há revisão vencida, aparece uma cápsula
  de vidro flutuando sobre a tab bar — o padrão do mini-player do Music. Some
  sozinha quando não há nada vencido, e encolhe pra pílula quando a tab bar
  minimiza no scroll.

---

## A tab bar

`app/(tabs)/_layout.tsx` usa `expo-router/unstable-native-tabs`. Não é uma
barra em JS imitando o sistema: no iOS vira `UITabBarController`, no Android
vira Material 3 (com o popover de long-press incluso de graça).

Duas regras que custam caro esquecer:

1. **Nunca defina `backgroundColor` no `<NativeTabs>`.** Cor sólida mata o
   vidro. Use `tintColor` / `iconColor` / `labelStyle` e deixe o fundo em paz.
2. **As abas não entram sozinhas.** Cada rota precisa do seu `Trigger`,
   explicitamente.

E o conteúdo **tem** que correr por baixo da barra — é isso que dá o que
refratar. O `react-native-screens` já aplica o content inset automático no iOS,
então `src/components/ui/Tela.tsx` só soma padding no Android, onde a barra é
opaca.

---

## Antes de submeter na App Store

O bloqueio antigo caiu: **não existe mais checkout externo**, a venda é IAP e a
diretriz 3.1.1 está atendida. O que sobra é a checklist chata que reprova gente
todo dia:

- **3.1.2 — o paywall precisa dizer o que está vendendo.** Nome da assinatura,
  duração, preço por período, renovação automática, e link pro EULA e pra
  política de privacidade **dentro da tela de compra**. Já está tudo no
  `Paywall.tsx`; falta você preencher `EXPO_PUBLIC_URL_TERMOS` e
  `EXPO_PUBLIC_URL_PRIVACIDADE`. Sem o primeiro, o app cai no EULA padrão da
  Apple — funciona, mas o seu é melhor.
- **Restaurar compras** precisa existir e ser alcançável sem pagar. Está no
  paywall e em Ajustes, nos dois casos fora de qualquer fluxo de compra.
- **Os produtos precisam estar "Ready to Submit"** e anexados à versão do app,
  senão o revisor abre o paywall e vê o fallback do `.env`. É a rejeição mais
  boba possível.
- **Conteúdo gerado por IA**: o app cria questões sob demanda. Vale deixar
  claro no formulário de revisão que o conteúdo é educacional e gerado por
  modelo, e que existe canal de reporte.

Duas coisas que já vieram prontas:

- **Sem SDK de tracking.** O tráfego de rede é o seu backend, o OpenRouter e o
  RevenueCat. Você conhece a dor do Kids Category na Pedagogy — aqui não tem
  Facebook SDK pra derrubar a review.
- `ios.infoPlist.ITSAppUsesNonExemptEncryption: false` já configurado.

---

## Estrutura

```
app/
  _layout               hidratação, providers, guards do onboarding
  onboarding            as 6 perguntas + plano + paywall        ← NOVO
  premium               casca de modal do Paywall
  (tabs)/               início · montar · caderno · ajustes
  simulado · resultado
src/
  components/
    ui/                   Texto · Card · Badge · Bubble · Button · Field
                          PapelGrid · Logo · Tela · Folha
    onboarding/           CabecalhoFicha · Alternativa          ← NOVO
    Paywall               o paywall inteiro, usado em 2 lugares ← NOVO
    CarimboAprovado       o carimbo do Premium                  ← NOVO
    CartaoDecorativo      o cartão-resposta da home
    GeracaoOverlay        overlay global de geração + erro
    QuestaoView           o caderno de prova
    RevisaoQuestao        gabarito comentado
    CapturaIdentidade     captura de lead
  context/
    AppContext            sessão do simulado, settings, stats, erros, diário
    PerfilContext         o plano de estudo + guard do onboarding ← NOVO
    SubscriptionContext   cota, paywall contextual, ofertas, compra
  data/                   catalog · planos · simuladosProntos
  lib/
    kv                    ponte localStorage → AsyncStorage
    billing               RevenueCat isolado (o SDK não sai daqui) ← NOVO
    onboarding            prazos, metas, perfil → config          ← NOVO
    storage · revisao     persistência, Leitner e o diário/streak
    openrouter · prompts  geração
    identidade · utils
  theme/tokens            design system nativo
  types/
```

`@/*` aponta pra `./src/*` — o mesmo alias do Vite, então os imports do web
funcionam sem reescrever caminho.

## Verificado

- `npx tsc --noEmit` → 0 erros (inclusive com `--noUnusedLocals`)
- `npx expo export --platform ios` → bundle Hermes gerado, todos os imports
  resolvem, React Compiler e o plugin do Reanimated rodam
- `react-native-purchases@10.4.3` não tem config plugin — autolinking resolve,
  nada a adicionar no `app.json`. Em Expo Go o SDK entra em Browser Mode e o
  app abre normal; compra real exige development build.

> `npm install` roda com `--legacy-peer-deps` neste projeto: o `react-dom`
> instalado (19.2.7) está à frente do `react` (19.2.3) que o RN 0.86 fixa. É
> um conflito que já existia antes desta entrega e não afeta o app — `react-dom`
> só entra em build web.
