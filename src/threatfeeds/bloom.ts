export class BloomFilter {
  private bits: Uint8Array
  private readonly size: number

  constructor(size = 120000) {
    this.size = size
    this.bits = new Uint8Array(size)
  }

  private hash(value: string, seed: number): number {
    let h = seed
    for (let i = 0; i < value.length; i += 1) {
      h = (h * 31 + value.charCodeAt(i)) % this.size
    }
    return Math.abs(h)
  }

  add(value: string) {
    const a = this.hash(value, 17)
    const b = this.hash(value, 31)
    const c = this.hash(value, 101)
    this.bits[a] = 1
    this.bits[b] = 1
    this.bits[c] = 1
  }

  mayContain(value: string) {
    const a = this.hash(value, 17)
    const b = this.hash(value, 31)
    const c = this.hash(value, 101)
    return Boolean(this.bits[a] && this.bits[b] && this.bits[c])
  }
}
