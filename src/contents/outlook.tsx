import type { PlasmoCSConfig } from "plasmo"
import type { RawEmailDom } from "../parsers/email-normalizer"

export const config: PlasmoCSConfig = {
  matches: ["https://outlook.office.com/*", "https://outlook.live.com/*"],
  all_frames: false,
  run_at: "document_idle"
}

const extractOutlookHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {}
  
  const detailsPanel = document.querySelector('[data-testid*="message-details"], div[role="region"]')
  if (detailsPanel) {
    const text = detailsPanel.textContent?.toLowerCase() || ""
    
    if (text.includes("spf=pass")) headers["spf"] = "pass"
    else if (text.includes("spf=fail")) headers["spf"] = "fail"
    
    if (text.includes("dkim=pass")) headers["dkim"] = "pass"
    else if (text.includes("dkim=fail")) headers["dkim"] = "fail"
    
    if (text.includes("dmarc=pass")) headers["dmarc"] = "pass"
    else if (text.includes("dmarc=fail")) headers["dmarc"] = "fail"
  }
  
  return headers
}

const extractOutlookEmail = (): RawEmailDom | null => {
  const sender = (document.querySelector('[aria-label*="From"]')?.textContent || "").trim()
  const subject = (document.querySelector('[role="heading"]')?.textContent || "").trim()
  const bodyRoot = document.querySelector('div[role="document"]')
  if (!sender || !bodyRoot) return null

  const links = Array.from(bodyRoot.querySelectorAll<HTMLAnchorElement>("a[href]"))
    .map((anchor) => ({
      href: anchor.href,
      text: anchor.textContent?.trim() || "",
      visibleDomain: anchor.textContent?.trim() || ""
    }))
    .slice(0, 80)

  return {
    platform: "outlook",
    id: `outlook-${location.pathname}-${subject.slice(0, 24)}`,
    sender,
    subject,
    bodyText: bodyRoot.textContent?.trim() || "",
    links,
    attachments: [],
    headers: extractOutlookHeaders()
  }
}

const showBanner = (text: string, threatLevel: string) => {
  const existing = document.getElementById("phis-outlook-banner-host")
  if (existing) existing.remove()

  const host = document.createElement("div")
  host.id = "phis-outlook-banner-host"
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
    "max-width:420px",
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

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "PHIS_REQUEST_ACTIVE_EMAIL") return false
  sendResponse({ email: extractOutlookEmail() })
  return false
})

const injectOutlookButton = () => {
  if (document.querySelector("#phis-outlook-btn")) return
  const toolbar = document.querySelector('[role="toolbar"]')
  if (!toolbar) return

  const button = document.createElement("button")
  button.id = "phis-outlook-btn"
  button.textContent = "Scan with PHIS"
  button.type = "button"
  button.style.cssText = [
    "margin-left:10px",
    "padding:6px 12px",
    "border-radius:999px",
    "border:1px solid rgba(53,212,255,0.45)",
    "background:#0f2230",
    "color:#d9f7ff",
    "font-size:12px",
    "cursor:pointer"
  ].join(";")

  button.addEventListener("click", () => {
    const email = extractOutlookEmail()
    if (!email) return
    button.textContent = "Scanning..."
    button.style.opacity = "0.6"

    chrome.runtime.sendMessage({ type: "PHIS_ANALYZE_EMAIL", payload: email }, (response) => {
      button.textContent = "Scan with PHIS"
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

let debounceTimer: ReturnType<typeof setTimeout> | null = null

const observer = new MutationObserver(() => {
  if (debounceTimer !== null) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(injectOutlookButton, 400)
})

observer.observe(document.documentElement, { childList: true, subtree: true })
injectOutlookButton()

window.addEventListener("beforeunload", () => {
  observer.disconnect()
  if (debounceTimer !== null) clearTimeout(debounceTimer)
})
