import type { EmailArtifact, Indicator } from "../../types/analysis"

const loginBaitKeywords = ["signin", "login", "verify", "account", "password", "oauth", "mfa"]
const suspiciousHosts = ["bit.ly", "tinyurl.com", "is.gd", "rb.gy"]
const suspiciousLoginHostHints = ["microsoft", "office", "okta", "google", "appleid", "adobe"]
const riskyUrlTlds = new Set(["zip", "top", "xyz", "click"])

export const runUrlIntelligence = (email: EmailArtifact): Indicator[] => {
  const indicators: Indicator[] = []

  email.links.forEach((link) => {
    try {
      const parsed = new URL(link.href)
      const host = parsed.hostname.toLowerCase()
      const path = `${parsed.pathname}${parsed.search}`.toLowerCase()

      if (suspiciousHosts.some((item) => host.endsWith(item))) {
        indicators.push({
          id: `shortener_${host}`,
          category: "url",
          weight: 8,
          title: "Shortened URL",
          detail: "URL shortener detected, obscuring final destination.",
          evidence: host
        })
      }

      const baitHits = loginBaitKeywords.filter((word) => path.includes(word)).length
      if (baitHits >= 2) {
        indicators.push({
          id: `credential_path_${host}`,
          category: "url",
          weight: 12,
          title: "Credential harvesting pattern",
          detail: "URL path contains multiple login-related bait keywords.",
          evidence: `${host}${parsed.pathname}`
        })
      }

      const tld = host.split(".").pop() || ""
      if (riskyUrlTlds.has(tld)) {
        indicators.push({
          id: `risky_tld_${host}`,
          category: "url",
          weight: 10,
          title: "High-risk URL TLD",
          detail: "Linked URL uses a TLD frequently abused in phishing.",
          evidence: host
        })
      }

      const looksLikeTrustedLogin = suspiciousLoginHostHints.some((hint) => path.includes(hint) || host.includes(hint))
      const mismatchedBrandInfra = looksLikeTrustedLogin && !/(microsoft\.com|office\.com|live\.com|google\.com|apple\.com|okta\.com|adobe\.com)$/i.test(host)
      if (mismatchedBrandInfra) {
        indicators.push({
          id: `fake_login_${host}`,
          category: "url",
          weight: 15,
          title: "Possible fake login infrastructure",
          detail: "URL resembles trusted identity provider paths but host does not match expected domain.",
          evidence: host
        })
      }

      const hiddenScheme = /javascript:|data:/i.test(link.href)
      if (hiddenScheme) {
        indicators.push({
          id: `hidden_scheme_${host}`,
          category: "url",
          weight: 22,
          title: "Hidden executable link",
          detail: "Link uses an unsafe URI scheme.",
          evidence: link.href.slice(0, 40)
        })
      }
    } catch {
      indicators.push({
        id: `invalid_url_${link.href.slice(0, 12)}`,
        category: "url",
        weight: 6,
        title: "Malformed URL",
        detail: "Email contains malformed links often used to evade scanners.",
        evidence: link.href
      })
    }
  })

  return indicators
}
