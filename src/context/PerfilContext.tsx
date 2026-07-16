import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { PerfilEstudo } from "@/types";
import {
  diasAteProva,
  getPerfil,
  limparPerfil,
  questoesAteProva,
  setPerfil as persistPerfil,
} from "@/lib/onboarding";
import { identificarNoBilling, marcarAtributos } from "@/lib/billing";

/**
 * Perfil de estudo — o que o onboarding coleta e o resto do app consome.
 *
 * Fica fora do AppContext de propósito: o `_layout` precisa dele pra decidir
 * o guard da rota de onboarding, e ele monta ANTES da sessão de simulado
 * existir.
 */

interface PerfilApi {
  perfil: PerfilEstudo | null;
  /** Onboarding concluído? É o guard da rota. */
  pronto: boolean;
  salvarPerfil: (p: Omit<PerfilEstudo, "concluidoEm">) => void;
  atualizarPerfil: (patch: Partial<PerfilEstudo>) => void;
  /** Apaga o perfil e joga a pessoa de volta no onboarding. */
  refazerOnboarding: () => void;
  // derivados (a home e o paywall vivem disso)
  diasAteProva: number | null;
  questoesAteProva: number | null;
}

const Ctx = createContext<PerfilApi | null>(null);

export function PerfilProvider({ children }: { children: ReactNode }) {
  const [perfil, setPerfil] = useState<PerfilEstudo | null>(() => getPerfil());

  const aplicar = useCallback((p: PerfilEstudo) => {
    persistPerfil(p);
    setPerfil(p);
    // Vira atributo no RevenueCat: dá pra segmentar offering por objetivo e
    // entender no dashboard quem converte. Sem SDK de tracking no app.
    void marcarAtributos({
      objetivo: p.objetivo,
      banca: p.banca,
      meta_diaria: String(p.metaDiaria),
      prova_em: p.provaEm ? new Date(p.provaEm).toISOString().slice(0, 10) : null,
    });
    if (p.nome) void identificarNoBilling(undefined, p.nome);
  }, []);

  const salvarPerfil = useCallback(
    (p: Omit<PerfilEstudo, "concluidoEm">) => {
      aplicar({ ...p, concluidoEm: Date.now() });
    },
    [aplicar],
  );

  const atualizarPerfil = useCallback(
    (patch: Partial<PerfilEstudo>) => {
      setPerfil((prev) => {
        if (!prev) return prev;
        const next = { ...prev, ...patch };
        persistPerfil(next);
        return next;
      });
    },
    [],
  );

  const refazerOnboarding = useCallback(() => {
    limparPerfil();
    setPerfil(null);
  }, []);

  const api = useMemo<PerfilApi>(
    () => ({
      perfil,
      pronto: !!perfil,
      salvarPerfil,
      atualizarPerfil,
      refazerOnboarding,
      diasAteProva: diasAteProva(perfil),
      questoesAteProva: questoesAteProva(perfil),
    }),
    [perfil, salvarPerfil, atualizarPerfil, refazerOnboarding],
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function usePerfil(): PerfilApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePerfil deve ser usado dentro de <PerfilProvider>");
  return ctx;
}
