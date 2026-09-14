/**
 * FNV-1a de 32 bits — não é criptográfico, é só uma forma barata e estável
 * de transformar uma string (sessionId + blockId, por exemplo) num inteiro
 * determinístico para semear embaralhamento e escolha de variante.
 */
export function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** PRNG mulberry32 — determinístico a partir de uma seed de 32 bits. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher–Yates com um PRNG determinístico injetado. */
export function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  const arr = items.slice();
  const rand = mulberry32(seed);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = tmp;
  }
  return arr;
}

/** Escolhe um índice determinístico em [0, length) a partir de uma chave estável. */
export function deterministicIndex(key: string, length: number): number {
  if (length <= 0) return 0;
  return fnv1a(key) % length;
}
