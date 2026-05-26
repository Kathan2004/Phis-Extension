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
    attachments
  }
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
    chrome.runtime.sendMessage({ type: "PHIS_ANALYZE_EMAIL", payload: email }, (response) => {
      if (!response?.ok || !response.result) return
      const existing = document.querySelector("#phis-banner")
      if (existing) existing.remove()

      const banner = document.createElement("div")
      banner.id = "phis-banner"
      banner.textContent = `PHIS Sentinel: ${response.result.threatLevel.toUpperCase()} (${response.result.score}/100) - ${response.result.explanation[0] || "No major indicators"}`
      banner.style.cssText = [
        "position:fixed",
        "top:12px",
        "right:12px",
        "z-index:2147483647",
        "padding:12px 14px",
        "max-width:460px",
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

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "PHIS_REQUEST_ACTIVE_EMAIL") {
    return false
  }

  sendResponse({ email: extractGmailEmail() })
  return false
})

const observer = new MutationObserver(() => {
  injectActionButton()
})

observer.observe(document.documentElement, { childList: true, subtree: true })
injectActionButton()
