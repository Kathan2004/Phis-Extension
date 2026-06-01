import { analyzeEmail } from "./engines/analyze-email"
import { normalizeEmail, type RawEmailDom } from "./parsers/email-normalizer"
import { db } from "./storage/db"
import { configureOnnxRuntime } from "./engines/ml/onnx-session"
import { loadManagedPolicy } from "./security/enterprise-policy"
import { bootstrapThreatFeed } from "./threatfeeds/bootstrap"
import { getVirusTotalScore } from "./threatfeeds/virustotal"

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

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "PHIS_ANALYZE_EMAIL") {
    const run = async () => {
      const raw = message.payload as RawEmailDom
      const normalized = normalizeEmail(raw)
      const result = await analyzeEmail(normalized)
      await db.riskResults.put(result)
      sendResponse({ ok: true, result })
    }

    run().catch((error) => {
      sendResponse({ ok: false, error: String(error) })
    })

    return true
  }

  if (message?.type === "PHIS_GET_VT_SCORE") {
    const run = async () => {
      const url = message.payload as string
      const score = await getVirusTotalScore(url)
      sendResponse({ ok: true, score })
    }

    run().catch((error) => {
      sendResponse({ ok: false, error: String(error) })
    })

    return true
  }

  return false
})

