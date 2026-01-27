export function meanVector(vectors: number[][]): number[] | null {
    if (!vectors.length) return null;
    const dimension = vectors[0].length;
    if (dimension === 0) return null;
    const sum = new Array<number>(dimension).fill(0);
    for (const vector of vectors) {
        if (vector.length !== dimension) {
            throw new Error('Embedding vectors must have the same dimension');
        }
        for (let i = 0; i < dimension; i += 1) {
            sum[i] += vector[i];
        }
    }
    return sum.map(value => value / vectors.length);
}

export function normalizeVector(vector: number[]): number[] {
    let sumSquares = 0;
    for (const value of vector) {
        sumSquares += value * value;
    }
    if (sumSquares === 0) return vector;
    const norm = Math.sqrt(sumSquares);
    return vector.map(value => value / norm);
}

export function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
        throw new Error('Embedding vectors must have the same dimension');
    }
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i += 1) {
        const av = a[i];
        const bv = b[i];
        dot += av * bv;
        normA += av * av;
        normB += bv * bv;
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
