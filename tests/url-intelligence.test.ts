import { describe, expect, it } from "vitest"

import { hasHomoglyphPatterns, hasSuspiciousUnicode } from "../src/engines/rules/unicode"
import { isSameOrSubdomain, runUrlIntelligence } from "../src/engines/url/url-intelligence"
import type { EmailArtifact } from "../src/types/analysis"

const email = (...hrefs: string[]): EmailArtifact => ({
  id: "t",
  platform: "gmail",
  sender: "a@b.com",
  senderDomain: "b.com",
  subject: "",
  bodyText: "",
  links: hrefs.map((href) => ({ href, text: href })),
  attachments: [],
  receivedAt: new Date(0).toISOString()
})

const ids = (...hrefs: string[]) => runUrlIntelligence(email(...hrefs)).map((i) => i.id.split("_")[0])

describe("isSameOrSubdomain", () => {
  it("matches exact and subdomains only", () => {
    expect(isSameOrSubdomain("login.microsoft.com", "microsoft.com")).toBe(true)
    expect(isSameOrSubdomain("microsoft.com", "microsoft.com")).toBe(true)
    expect(isSameOrSubdomain("evilmicrosoft.com", "microsoft.com")).toBe(false)
  })
})

describe("runUrlIntelligence", () => {
  it("flags brand lookalike hosts that merely end with a trusted name", () => {
    expect(ids("https://evilmicrosoft.com/microsoft/login")).toContain("fake")
  })

  it("does not flag the genuine identity provider", () => {
    expect(ids("https://login.microsoft.com/common/oauth2")).not.toContain("fake")
  })

  it("flags punycode lookalike domains", () => {
    expect(ids("https://аpple.com/signin")).toContain("idn")
  })

  it("flags shorteners but not hosts that only end with the same letters", () => {
    expect(ids("https://bit.ly/x")).toContain("shortener")
    expect(ids("https://rabbit.ly/x")).not.toContain("shortener")
  })

  it("flags credential bait paths and risky TLDs", () => {
    const found = ids("https://secure-portal.xyz/account/verify/login")
    expect(found).toContain("credential")
    expect(found).toContain("risky")
  })
})

describe("unicode rules", () => {
  it("detects Cyrillic lookalikes", () => {
    expect(hasSuspiciousUnicode("pаypal")).toBe(true)
    expect(hasHomoglyphPatterns("gооgle.com")).toBe(true)
    expect(hasSuspiciousUnicode("paypal")).toBe(false)
  })
})
