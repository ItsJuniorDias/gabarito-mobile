import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Ponte localStorage → AsyncStorage.
 *
 * O `localStorage` da web é SÍNCRONO; o AsyncStorage não é. Reescrever todo o
 * domínio pra async contaminaria `storage.ts`, `revisao.ts`, os contexts e
 * metade dos componentes — e ainda daria um flash de estado vazio a cada
 * render. Em vez disso: hidratamos tudo UMA vez no boot (o splash segura a
 * tela até acabar) e mantemos um cache em memória. Leituras são síncronas,
 * escritas são write-through (memória agora, disco em background).
 *
 * Consequência prática: os arquivos de domínio ficam idênticos aos da web.
 */

const cache = new Map<string, unknown>();
let hidratado = false;

/** Lê todas as chaves do disco pro cache. Chame no boot, antes dos providers. */
export async function hidratar(chaves: readonly string[]): Promise<void> {
  try {
    const pares = await AsyncStorage.multiGet([...chaves]);
    for (const [chave, raw] of pares) {
      if (raw == null) continue;
      try {
        cache.set(chave, JSON.parse(raw));
      } catch {
        // valor corrompido (versão antiga, escrita parcial) — descarta
        void AsyncStorage.removeItem(chave).catch(() => {});
      }
    }
  } catch {
    // disco indisponível: segue com o cache vazio, o app funciona sem histórico
  } finally {
    hidratado = true;
  }
}

export function estaHidratado(): boolean {
  return hidratado;
}

export function read<T>(chave: string, fallback: T): T {
  return cache.has(chave) ? (cache.get(chave) as T) : fallback;
}

export function write<T>(chave: string, valor: T): void {
  cache.set(chave, valor);
  void AsyncStorage.setItem(chave, JSON.stringify(valor)).catch(() => {
    /* quota / disco cheio — o valor continua válido em memória nesta sessão */
  });
}

export function remove(chave: string): void {
  cache.delete(chave);
  void AsyncStorage.removeItem(chave).catch(() => {});
}
