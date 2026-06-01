import type { PlasmoCSConfig } from "plasmo"
import type { RawEmailDom } from "../parsers/email-normalizer"

export const config: PlasmoCSConfig = {
  matches: ["https://outlook.office.com/*", "https://outlook.live.com/*"],
  all_frames: false,
  run_at: "document_idle"
}

const extractOutlookHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {}
  
  // Look for authentication details in Outlook's message pane
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
    chrome.runtime.sendMessage({ type: "PHIS_ANALYZE_EMAIL", payload: email }, (response) => {
      if (!response?.ok || !response.result) return
      const existing = document.querySelector("#phis-outlook-banner")
      if (existing) existing.remove()

      const banner = document.createElement("div")
      banner.id = "phis-outlook-banner"
      banner.textContent = `PHIS Sentinel: ${response.result.threatLevel.toUpperCase()} (${response.result.score}/100)`
      banner.style.cssText = [
        "position:fixed",
        "top:12px",
        "right:12px",
        "z-index:2147483647",
        "padding:12px 14px",
        "max-width:420px",
        "border-radius:12px",
        "background:rgba(9,16,26,0.96)",
        "color:#ecfeff",
        "border:1px solid rgba(53,212,255,0.45)",
        "box-shadow:0 14px 32px rgba(0,0,0,0.38)",
        "font:12px/1.4 Segoe UI"
      ].join(";")
      document.body.appendChild(banner)
      setTimeout(() => banner.remove(), 12000)
    })
  })

  toolbar.appendChild(button)
}

new MutationObserver(() => injectOutlookButton()).observe(document.documentElement, {
  childList: true,
  subtree: true
})
injectOutlookButton()
