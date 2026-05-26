import Dexie, { type Table } from "dexie"
import type { RiskResult } from "../types/analysis"

export interface ThreatIndicatorRecord {
  hash: string
  source: "openphish" | "phishtank" | "malware"
  kind: "domain" | "url" | "ip"
  firstSeen: string
  lastSeen: string
}

export interface PolicyRecord {
  id: "global"
  strictMode: boolean
  maxModelLatencyMs: number
  blockCriticalLinks: boolean
  adminMode: boolean
}

class PhisDb extends Dexie {
  riskResults!: Table<RiskResult, string>
  indicators!: Table<ThreatIndicatorRecord, string>
  policies!: Table<PolicyRecord, string>

  constructor() {
    super("phis_sentinel_db")
    this.version(1).stores({
      riskResults: "emailId, generatedAt, threatLevel",
      indicators: "hash, source, kind, firstSeen",
      policies: "id"
    })
  }
}

export const db = new PhisDb()
