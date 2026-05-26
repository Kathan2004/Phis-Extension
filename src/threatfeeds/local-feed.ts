import { BloomFilter } from "./bloom"
import { db } from "../storage/db"
import type { Indicator, EmailArtifact } from "../types/analysis"
import { sha256Hex } from "../security/hash"

const feedBloom = new BloomFilter()
let initialized = false

const normalizeIndicator = (value: string) => value.trim().toLowerCase()

export const seedThreatIndicators = async () => {
  if (initialized) return
  const items = await db.indicators.toArray()
  items.forEach((record) => feedBloom.add(record.hash))
  initialized = true
}

export const lookupThreatIndicators = async (email: EmailArtifact): Promise<Indicator[]> => {
  await seedThreatIndicators()
  const indicators: Indicator[] = []

  const candidates = new Set<string>()
  candidates.add(normalizeIndicator(email.senderDomain))

  email.links.forEach((item) => {
    try {
      const host = new URL(item.href).hostname.toLowerCase()
      candidates.add(normalizeIndicator(host))
      candidates.add(normalizeIndicator(item.href))
    } catch {
      // Ignore invalid URLs in feed lookups.
    }
  })

  for (const candidate of candidates) {
    const hashed = await sha256Hex(candidate)

    if (!feedBloom.mayContain(hashed)) {
      continue
    }

    const hit = await db.indicators.get(hashed)
    if (!hit) {
      continue
    }

    indicators.push({
      id: `threatfeed_${candidate}`,
      category: "behavior",
      weight: 24,
      title: "Known malicious indicator",
      detail: `Matched local ${hit.source} threat feed entry.`,
      evidence: candidate.slice(0, 72)
    })
  }

  return indicators
}
