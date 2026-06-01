import type { PlasmoCSConfig } from "plasmo"
import type { RawEmailDom } from "../parsers/email-normalizer"

export const config: PlasmoCSConfig = {
  matches: ["https://mail.google.com/*"],
  all_frames: false,
  run_at: "document_idle"
}

const senderSelector = "h3.iw span[email]"
const subjectSelector = "h2.hP"
const bodySelector = "div.a3s"
const attachmentSelector = "div.aQA span.aV3"

const safeQueryText = (selector: string) => document.querySelector(selector)?.textContent?.trim() || ""

const extractGmailHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {}
  
  const headerSection = document.querySelector("div.gX, div.nH")
  if (headerSection) {
    const text = headerSection.textContent?.toLowerCase() || ""
    
    if (text.includes("spf=pass")) headers["spf"] = "pass"
    else if (text.includes("spf=fail")) headers["spf"] = "fail"
    else if (text.includes("spf=neutral")) headers["spf"] = "neutral"
    
    if (text.includes("dkim=pass")) headers["dkim"] = "pass"
    else if (text.includes("dkim=fail")) headers["dkim"] = "fail"
    
    if (text.includes("dmarc=pass")) headers["dmarc"] = "pass"
    else if (text.includes("dmarc=fail")) headers["dmarc"] = "fail"
  }
  
  return headers
}

const extractGmailEmail = (): RawEmailDom | null => {
  const senderEl = document.querySelector(senderSelector)
  const subject = safeQueryText(subjectSelector)
  const bodyRoot = document.querySelector(bodySelector)

  if (!senderEl || !bodyRoot) return null

  const links = Array.from(bodyRoot.querySelectorAll<HTMLAnchorElement>("a[href]"))
    .map((anchor) => ({
      href: anchor.href,
      text: anchor.textContent?.trim() || "",
      visibleDomain: anchor.textContent?.trim() || ""
    }))
    .slice(0, 80)

  const attachments = Array.from(document.querySelectorAll(attachmentSelector)).map((item) => {
    const name = item.textContent?.trim() || "attachment"
    const ext = name.includes(".") ? name.split(".").pop() || "" : ""
    return { name, extension: ext.toLowerCase() }
  })

  return {
    platform: "gmail",
    id: `gmail-${location.pathname}-${subject.slice(0, 24)}`,
    sender: senderEl.getAttribute("email") || senderEl.textContent || "",
    subject,
    bodyText: bodyRoot.textContent?.trim() || "",
    links,
    attachments,
    headers: extractGmailHeaders()
  }
}

const showBanner = (text: string, threatLevel: string) => {
  const existing = document.getElementById("phis-banner-host")
  if (existing) existing.remove()

  const host = document.createElement("div")
  host.id = "phis-banner-host"
  const shadow = host.attachShadow({ mode: "closed" })

  const levelColors: Record<string, string> = {
    safe: "#10b981",
    low: "#06b6d4",
    suspicious: "#f59e0b",
    high: "#f97316",
    critical: "#ef4444"
  }
  const color = levelColors[threatLevel] ?? "#06b6d4"

  const inner = document.createElement("div")
  inner.style.cssText = [
    "position:fixed",
    "top:12px",
    "right:12px",
    "z-index:2000000000",
    "padding:12px 14px",
    "max-width:460px",
    "border-radius:12px",
    "background:rgba(9,16,26,0.96)",
    `border:1px solid ${color}`,
    "box-shadow:0 14px 32px rgba(0,0,0,0.38)",
    "font:12px/1.4 Segoe UI,sans-serif",
    `color:${color}`,
    "user-select:none"
  ].join(";")
  inner.textContent = text
  shadow.appendChild(inner)
  document.body.appendChild(host)
  setTimeout(() => host.remove(), 12000)
}

const injectActionButton = () => {
  if (document.querySelector("#phis-scan-button")) return
  const toolbar = document.querySelector("div[gh=mtb]")
  if (!toolbar) return

  const button = document.createElement("button")
  button.id = "phis-scan-button"
  button.type = "button"
  button.textContent = "Scan Email"
  button.style.cssText = [
    "margin-left:12px",
    "padding:8px 14px",
    "border-radius:999px",
    "border:1px solid rgba(53,212,255,0.45)",
    "background:linear-gradient(120deg,#07131e,#0f2637)",
    "color:#d9f7ff",
    "font-size:12px",
    "cursor:pointer"
  ].join(";")

  button.addEventListener("click", () => {
    const email = extractGmailEmail()
    if (!email) return
    button.textContent = "Scanning..."
    button.style.opacity = "0.6"

    chrome.runtime.sendMessage({ type: "PHIS_ANALYZE_EMAIL", payload: email }, (response) => {
      button.textContent = "Scan Email"
      button.style.opacity = "1"

      if (chrome.runtime.lastError) {
        showBanner("PHIS Sentinel: scan error — " + chrome.runtime.lastError.message, "suspicious")
        return
      }
      if (!response?.ok || !response.result) {
        showBanner("PHIS Sentinel: analysis failed", "suspicious")
        return
      }

      const { threatLevel, score, explanation } = response.result
      const summary = explanation[0] || "No major indicators detected"
      showBanner(`PHIS Sentinel: ${threatLevel.toUpperCase()} (${score}/100) — ${summary}`, threatLevel)
    })
  })

  toolbar.appendChild(button)
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "PHIS_REQUEST_ACTIVE_EMAIL") {
    return false
  }
  sendResponse({ email: extractGmailEmail() })
  return false
})

let debounceTimer: ReturnType<typeof setTimeout> | null = null

const observer = new MutationObserver(() => {
  if (debounceTimer !== null) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(injectActionButton, 400)
})

observer.observe(document.documentElement, { childList: true, subtree: true })
injectActionButton()

window.addEventListener("beforeunload", () => {
  observer.disconnect()
  if (debounceTimer !== null) clearTimeout(debounceTimer)
})
