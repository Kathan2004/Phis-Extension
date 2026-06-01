import "./styles.css"
import { AnalysisPanel } from "./components/AnalysisPanel"
import { DetailedReport } from "./components/DetailedReport"
import { useRiskState } from "./hooks/useRiskState"
import { useEffect, useState } from "react"
import type { EmailArtifact } from "../types/analysis"

export const App = () => {
  const { result, scanning, analyze } = useRiskState()
  const [activeEmail, setActiveEmail] = useState<EmailArtifact | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0]
      if (!tab?.id) return
      chrome.tabs.sendMessage(tab.id, { type: "PHIS_REQUEST_ACTIVE_EMAIL" }, (response) => {
        if (response?.email) {
          setActiveEmail(response.email)
          analyze(response.email)
        }
      })
    })
  }, [analyze])

  return (
    <main className="phis-gradient min-h-[420px] w-[360px] p-4 font-body text-slate-100">
      <header className="mb-4">
        <p className="font-display text-xs tracking-[0.2em] text-cyan-200">PHIS SENTINEL</p>
        <h1 className="font-display text-2xl">Endpoint Phishing Defense</h1>
      </header>
      <AnalysisPanel result={result} scanning={scanning} />
      {result && activeEmail && (
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="mt-4 w-full px-3 py-2 bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-500/50 rounded text-xs text-cyan-300 transition-colors"
        >
          {showDetails ? "Hide" : "Show"} Detailed Report
        </button>
      )}
      {showDetails && result && activeEmail && (
        <div className="mt-4 border border-cyan-900/50 rounded bg-slate-950/50 max-h-96 overflow-y-auto">
          <DetailedReport email={activeEmail} result={result} />
        </div>
      )}
    </main>
  )
}
