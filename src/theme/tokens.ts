import { Platform, type TextStyle, type ViewStyle } from "react-native";

/* ══════════════════════════════════════════════════════════════
   GABARITO — DESIGN SYSTEM (nativo)
   Mundo material: papel de prova · lápis grafite · caneta azul ·
   marca-texto. Mesmos tokens do index.css da web, sem Tailwind.
   ══════════════════════════════════════════════════════════════ */

export const cor = {
  // — Papel & superfícies —
  paper: "#f3f2ee", // bloco de papel, mais frio que creme
  paper2: "#eae8e2", // painel / cartão-resposta
  card: "#fcfcfb", // superfície de cartão

  // — Grafite (texto) —
  ink: "#1b1b1e",
  ink2: "#55555b",
  ink3: "#8a8a90",

  // — Traços —
  line: "#e3e1da",
  line2: "#d1cfc7",

  graphite: "#3a3a3e", // bolha preenchida a lápis

  // — Caneta azul (ação/marca) —
  azul: "#263fd4",
  azulInk: "#1d33ad",
  azulWash: "#e9ecfb",

  // — Gabarito: certo —
  ok: "#0e8f5e",
  okInk: "#0a6e49",
  okWash: "#e4f5ec",

  // — Gabarito: errado —
  no: "#d22b2b",
  noInk: "#a81f1f",
  noWash: "#fbe9e9",

  // — Marca-texto —
  mark: "#fce44d",
  markDeep: "#e6c200",

  branco: "#ffffff",
} as const;

/** `bg-azul/30` do Tailwind vira `alpha(cor.azul, 0.3)`. */
export function alpha(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

// ── Tipografia ────────────────────────────────────────────────
// IBM Plex Sans (texto) + IBM Plex Mono (números, letras, rótulos —
// a voz de formulário/edital). No RN não existe font-weight sintético
// confiável: cada peso é uma família própria.

export const fonte = {
  sans: "IBMPlexSans_400Regular",
  sansMedium: "IBMPlexSans_500Medium",
  sansSemi: "IBMPlexSans_600SemiBold",
  sansBold: "IBMPlexSans_700Bold",
  mono: "IBMPlexMono_400Regular",
  monoMedium: "IBMPlexMono_500Medium",
  monoSemi: "IBMPlexMono_600SemiBold",
  monoBold: "IBMPlexMono_700Bold",
} as const;

/** Eyebrow / rótulo em mono — a voz de edital. */
export const eyebrow: TextStyle = {
  fontFamily: fonte.monoMedium,
  fontSize: 11,
  letterSpacing: 1.5,
  textTransform: "uppercase",
  color: cor.ink3,
};

// ── Raio ──────────────────────────────────────────────────────

export const raio = {
  sm: 6,
  base: 8,
  md: 10,
  lg: 14,
  xl: 18,
  full: 999,
} as const;

// ── Espaço ────────────────────────────────────────────────────

export const esp = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

// ── Sombra ────────────────────────────────────────────────────
// Papel sobre papel: sombra curta e fria, nunca difusa demais.

export const sombra: Record<"card" | "lift", ViewStyle> = {
  card: Platform.select({
    ios: {
      shadowColor: cor.ink,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.06,
      shadowRadius: 10,
    },
    android: { elevation: 1 },
    default: {},
  }) as ViewStyle,
  lift: Platform.select({
    ios: {
      shadowColor: cor.ink,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 20,
    },
    android: { elevation: 6 },
    default: {},
  }) as ViewStyle,
};

// ── Tema do expo-router (react-navigation) ────────────────────
// Precisa casar com o papel, ou o header/tab bar piscam branco
// no push e o liquid glass renderiza sobre a cor errada.

export const temaNavegacao = {
  dark: false,
  colors: {
    primary: cor.azul,
    background: cor.paper,
    card: cor.paper,
    text: cor.ink,
    border: cor.line,
    notification: cor.no,
  },
  fonts: {
    regular: { fontFamily: fonte.sans, fontWeight: "400" as const },
    medium: { fontFamily: fonte.sansMedium, fontWeight: "500" as const },
    bold: { fontFamily: fonte.sansSemi, fontWeight: "600" as const },
    heavy: { fontFamily: fonte.sansBold, fontWeight: "700" as const },
  },
};
