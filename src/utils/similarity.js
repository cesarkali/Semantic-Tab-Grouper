/**
 * Similaridade de cosseno entre dois vetores de embedding.
 * Os vetores gerados pelo pipeline (pooling: 'mean', normalize: true) já vêm
 * normalizados (norma 1), mas a divisão abaixo é mantida para não depender
 * dessa garantia caso o modelo/config mude no futuro.
 */
export function cosineSimilarity(a, b) {
  if (a.length !== b.length) {
    throw new Error(`Vetores de tamanhos diferentes: ${a.length} vs ${b.length}`);
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
