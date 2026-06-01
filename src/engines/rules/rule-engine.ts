import type { EmailArtifact, Indicator } from "../../types/analysis"
import { hasHomoglyphPatterns, hasSuspiciousUnicode } from "./unicode"

const suspiciousTlds = new Set(["zip", "top", "xyz", "click", "country", "gq", "work"])
const urgencyPatterns = [
  /urgent/i,
  /immediately/i,
  /verify now/i,
  /password expires/i,
  /account suspended/i,
  /security alert/i
]
const impersonationBrands = ["microsoft", "google", "paypal", "apple", "okta", "adobe"]
const riskyAttachmentExt = new Set(["html", "htm", "exe", "js", "iso", "lnk", "scr"])

const domainFromEmail = (value?: string) => (value?.split("@")[1] || "").trim().toLowerCase()
const domainFromUrl = (value: string): string => {
  try {
    return new URL(value).hostname.toLowerCase()
  } catch {
    return ""
  }
}

export const runRuleEngine = (email: EmailArtifact): Indicator[] => {
  const indicators: Indicator[] = []
  const senderDomain = email.senderDomain.toLowerCase()
  const replyDomain = (email.replyToDomain || domainFromEmail(email.replyTo)).toLowerCase()
  const headerBlob = Object.entries(email.headers || {})
    .map(([k, v]) => `${k}:${v}`)
    .join("\n")
    .toLowerCase()

  if (/spf\s*=\s*fail|spf=fail|received-spf:\s*fail/.test(headerBlob)) {
    indicators.push({
      id: "spf_fail",
      category: "auth",
      weight: 17,
      title: "SPF authentication failure",
      detail: "Sender policy framework check indicates this sender may be spoofed."
    })
  }

  if (/dkim\s*=\s*fail|dkim=fail/.test(headerBlob)) {
    indicators.push({
      id: "dkim_fail",
      category: "auth",
      weight: 17,
      title: "DKIM validation failure",
      detail: "DomainKeys Identified Mail signature failed verification."
    })
  }

  if (/dmarc\s*=\s*fail|dmarc=fail/.test(headerBlob)) {
    indicators.push({
      id: "dmarc_fail",
      category: "auth",
      weight: 19,
      title: "DMARC policy failure",
      detail: "DMARC alignment failed between sender and authentication domain."
    })
  }

  if (replyDomain && senderDomain && replyDomain !== senderDomain) {
    indicators.push({
      id: "reply_to_mismatch",
      category: "auth",
      weight: 18,
      title: "Reply-To mismatch",
      detail: "Reply-To domain differs from sender domain.",
      evidence: `${replyDomain} != ${senderDomain}`
    })
  }

  if (hasSuspiciousUnicode(senderDomain) || hasHomoglyphPatterns(senderDomain)) {
    indicators.push({
      id: "unicode_spoofing",
      category: "domain",
      weight: 16,
      title: "Unicode or homoglyph spoofing",
      detail: "Sender domain contains suspicious unicode lookalikes.",
      evidence: senderDomain
    })
  }

  const tld = senderDomain.split(".").pop() || ""
  if (suspiciousTlds.has(tld)) {
    indicators.push({
      id: "suspicious_tld",
      category: "domain",
      weight: 10,
      title: "Suspicious top-level domain",
      detail: "Sender domain uses a high-risk TLD.",
      evidence: tld
    })
  }

  if (urgencyPatterns.some((pattern) => pattern.test(`${email.subject}\n${email.bodyText}`))) {
    indicators.push({
      id: "urgency_language",
      category: "content",
      weight: 11,
      title: "Urgency language detected",
      detail: "Message uses pressure tactics often seen in phishing campaigns."
    })
  }

  if (/qr\s*code|scan\s*to\s*verify|scan\s*with\s*phone/i.test(`${email.subject}\n${email.bodyText}`)) {
    indicators.push({
      id: "qr_phishing_pattern",
      category: "content",
      weight: 12,
      title: "Possible QR phishing lure",
      detail: "Message language suggests QR-based redirection commonly used in phishing."
    })
  }

  const bodyLower = `${email.subject} ${email.bodyText}`.toLowerCase()
  const maybeBrandImpersonation = impersonationBrands.some((brand) => bodyLower.includes(brand))
  if (maybeBrandImpersonation && !impersonationBrands.some((brand) => senderDomain.includes(brand))) {
    indicators.push({
      id: "brand_impersonation",
      category: "impersonation",
      weight: 14,
      title: "Possible brand impersonation",
      detail: "Email references a trusted brand but sender domain does not align."
    })
  }

  email.links.forEach((link) => {
    const hrefDomain = domainFromUrl(link.href)

    // REMOVED: Display text mismatches (anchor mismatch)
    // Industry standard: Gmail, Outlook, etc. do NOT flag display text vs URL mismatches
    // This is normal in legitimate emails for branding, marketing, and user clarity
    // The actual risk is WHERE the link goes, not what text is displayed

    if (hrefDomain && (hasSuspiciousUnicode(hrefDomain) || hasHomoglyphPatterns(hrefDomain))) {
      indicators.push({
        id: `url_homoglyph_${hrefDomain}`,
        category: "url",
        weight: 16,
        title: "URL spoofing pattern",
        detail: "Linked domain contains unicode spoofing or homoglyph patterns.",
        evidence: hrefDomain
      })
    }
  })

  email.attachments.forEach((file) => {
    if (riskyAttachmentExt.has(file.extension.toLowerCase())) {
      indicators.push({
        id: `risky_attachment_${file.name}`,
        category: "attachment",
        weight: 13,
        title: "High-risk attachment type",
        detail: "Attachment extension is frequently used in credential theft payloads.",
        evidence: file.extension
      })
    }
  })

  return indicators
}
