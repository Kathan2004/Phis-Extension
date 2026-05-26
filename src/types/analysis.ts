export type ThreatLevel = "safe" | "low" | "suspicious" | "high" | "critical"

export interface EmailArtifact {
  id: string
  platform: "gmail" | "outlook"
  sender: string
  senderDomain: string
  replyTo?: string
  replyToDomain?: string
  subject: string
  bodyText: string
  links: Array<{
    href: string
    text: string
    visibleDomain?: string
  }>
  attachments: Array<{
    name: string
    extension: string
    size?: number
  }>
  headers?: Record<string, string>
  receivedAt: string
}

export interface Indicator {
  id: string
  weight: number
  category:
    | "auth"
    | "domain"
    | "url"
    | "content"
    | "impersonation"
    | "attachment"
    | "behavior"
    | "ml"
  title: string
  detail: string
  evidence?: string
}

export interface ModelInference {
  phishingProbability: number
  confidence: number
  label: "phishing" | "benign"
  model: string
}

export interface RiskResult {
  emailId: string
  score: number
  confidence: number
  threatLevel: ThreatLevel
  indicators: Indicator[]
  explanation: string[]
  generatedAt: string
}

export interface DetectionPolicy {
  strictMode: boolean
  maxModelLatencyMs: number
  blockCriticalLinks: boolean
  adminMode: boolean
}
