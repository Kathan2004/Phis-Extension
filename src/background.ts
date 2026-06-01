import { analyzeEmail } from "./engines/analyze-email"
import { normalizeEmail } from "./parsers/email-normalizer"
import { db } from "./storage/db"
import { configureOnnxRuntime } from "./engines/ml/onnx-session"
import { loadManagedPolicy } from "./security/enterprise-policy"
import { bootstrapThreatFeed } from "./threatfeeds/bootstrap"
import { getVirusTotalScore } from "./threatfeeds/virustotal"
import { RawEmailDomSchema } from "./security/validate"

const ANALYSIS_TIMEOUT_MS = 30_000

void configureOnnxRuntime()

chrome.runtime.onInstalled.addListener(async () => {
  await bootstrapThreatFeed()

  const managed = await loadManagedPolicy()
  await db.policies.put({
    id: "global",
    strictMode: managed.strictMode,
    maxModelLatencyMs: managed.maxModelLatencyMs,
    blockCriticalLinks: managed.blockCriticalLinks,
    adminMode: managed.adminMode
  })
})

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
  Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Analysis timed out after ${ms}ms`)), ms)
    )
  ])

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "PHIS_ANALYZE_EMAIL") {
    const run = async () => {
      const parsed = RawEmailDomSchema.safeParse(message.payload)
      if (!parsed.success) {
        sendResponse({ ok: false, error: "Invalid email payload: " + parsed.error.message })
        return
      }
      const normalized = normalizeEmail(parsed.data)
      const result = await withTimeout(analyzeEmail(normalized), ANALYSIS_TIMEOUT_MS)
      await db.riskResults.put(result)
      sendResponse({ ok: true, result })
    }
    run().catch((error) => sendResponse({ ok: false, error: String(error) }))
    return true
  }

  if (message?.type === "PHIS_GET_VT_SCORE") {
    const run = async () => {
      if (typeof message.payload !== "string" || message.payload.length === 0) {
        sendResponse({ ok: false, error: "Invalid URL payload" })
        return
      }
      const score = await getVirusTotalScore(message.payload)
      sendResponse({ ok: true, score })
    }
    run().catch((error) => sendResponse({ ok: false, error: String(error) }))
    return true
  }

  if (message?.type === "PHIS_SET_VT_KEY") {
    const run = async () => {
      const key = message.payload
      if (typeof key === "string" && key.length > 0) {
        await chrome.storage.local.set({ vtApiKey: key })
      } else {
        await chrome.storage.local.remove("vtApiKey")
      }
      sendResponse({ ok: true })
    }
    run().catch((error) => sendResponse({ ok: false, error: String(error) }))
    return true
  }

  if (message?.type === "PHIS_GET_VT_KEY") {
    const run = async () => {
      const local = await chrome.storage.local.get("vtApiKey")
      const configured = typeof local.vtApiKey === "string" && local.vtApiKey.length > 0
      sendResponse({ ok: true, configured })
    }
    run().catch((error) => sendResponse({ ok: false, error: String(error) }))
    return true
  }

  return false
})

