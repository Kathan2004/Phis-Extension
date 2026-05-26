import type { EmailArtifact } from "../types/analysis"

const safeText = (value?: string) => (value || "").replace(/\s+/g, " ").trim()

const inferDomain = (address: string) => {
  const parts = address.split("@")
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : ""
}

export interface RawEmailDom {
  platform: "gmail" | "outlook"
  id: string
  sender: string
  replyTo?: string
  subject: string
  bodyText: string
  links: Array<{ href: string; text: string; visibleDomain?: string }>
  attachments: Array<{ name: string; extension: string; size?: number }>
  headers?: Record<string, string>
}

export const normalizeEmail = (raw: RawEmailDom): EmailArtifact => {
  const sender = safeText(raw.sender)
  const replyTo = safeText(raw.replyTo)

  return {
    id: raw.id,
    platform: raw.platform,
    sender,
    senderDomain: inferDomain(sender),
    replyTo,
    replyToDomain: inferDomain(replyTo),
    subject: safeText(raw.subject),
    bodyText: safeText(raw.bodyText),
    links: raw.links,
    attachments: raw.attachments,
    headers: raw.headers,
    receivedAt: new Date().toISOString()
  }
}
