import { useCallback, useState } from "react"
import type { RiskResult } from "../../types/analysis"
import type { RawEmailDom } from "../../parsers/email-normalizer"

export const useRiskState = () => {
  const [result, setResult] = useState<RiskResult>()
  const [scanning, setScanning] = useState(false)

  const analyze = useCallback((email: RawEmailDom) => {
    setScanning(true)
    chrome.runtime.sendMessage(
      {
        type: "PHIS_ANALYZE_EMAIL",
        payload: email
      },
      (response: { ok: boolean; result?: RiskResult }) => {
        setScanning(false)
        if (response?.ok && response.result) {
          setResult(response.result)
        }
      }
    )
  }, [])

  return { result, scanning, analyze }
}
