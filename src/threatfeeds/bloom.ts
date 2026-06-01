/**
 * Bloom filter using FNV-1a (32-bit) with 5 independent seeds.
 * FNV-1a has good avalanche properties and low false positive rate
 * compared to polynomial rolling hash.
 */

const FNV_PRIME = 16777619
const FNV_OFFSET = 2166136261

const fnv1a32 = (value: string, seed: number): number => {
  let hash = (FNV_OFFSET ^ seed) >>> 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash ^ value.charCodeAt(i)) >>> 0
    hash = Math.imul(hash, FNV_PRIME) >>> 0
  }
  return hash
}

const SEEDS = [0, 0x9e3779b9, 0x6b43a9b5, 0x52c62f2f, 0xd1b54a32] as const

export class BloomFilter {
  private bits: Uint8Array
  private readonly size: number

  constructor(size = 120000) {
    this.size = size
    this.bits = new Uint8Array(size)
  }

  private positions(value: string): number[] {
    return SEEDS.map((seed) => fnv1a32(value, seed) % this.size)
  }

  add(value: string): void {
    for (const pos of this.positions(value)) {
      this.bits[pos] = 1
    }
  }

  mayContain(value: string): boolean {
    return this.positions(value).every((pos) => this.bits[pos] === 1)
  }
}
