import { db } from "../storage/db"
import { sha256Hex } from "../security/hash"

interface SeedFeedRecord {
  hash: string
  source: "openphish" | "phishtank" | "malware"
  kind: "domain" | "url" | "ip"
}

export const bootstrapThreatFeed = async () => {
  const existing = await db.indicators.count()
  if (existing > 0) {
    return
  }

  const url = chrome.runtime.getURL("assets/feeds/local-seed.json")
  const response = await fetch(url)
  if (!response.ok) {
    return
  }

  const records = (await response.json()) as SeedFeedRecord[]
  const now = new Date().toISOString()

  await db.indicators.bulkAdd(
    await Promise.all(
      records.map(async (item) => ({
        hash: await sha256Hex(item.hash),
        source: item.source,
        kind: item.kind,
        firstSeen: now,
        lastSeen: now
      }))
    )
  )
}
