import { useCallback, useState } from "react"
import type { RiskResult } from "../../types/analysis"
import type { RawEmailDom } from "../../parsers/email-normalizer"

export const useRiskState = () => {
  const [result, setResult] = useState<RiskResult | undefined>()
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | undefined>()

  const analyze = useCallback((email: RawEmailDom) => {
    setScanning(true)
    setError(undefined)
    chrome.runtime.sendMessage(
      {
        type: "PHIS_ANALYZE_EMAIL",
        payload: email
      },
      (response: { ok: boolean; result?: RiskResult; error?: string } | undefined) => {
        setScanning(false)

        if (chrome.runtime.lastError) {
          setError("Extension error: " + chrome.runtime.lastError.message)
          return
        }

        if (!response) {
          setError("No response from background worker")
          return
        }

        if (!response.ok || !response.result) {
          setError(response.error ?? "Analysis failed")
          return
        }

        setResult(response.result)
      }
    )
  }, [])

  return { result, scanning, error, analyze }
}
