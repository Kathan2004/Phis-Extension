import "./styles.css"
import { AnalysisPanel } from "./components/AnalysisPanel"
import { DetailedReport } from "./components/DetailedReport"
import { SettingsPanel } from "./components/SettingsPanel"
import { useRiskState } from "./hooks/useRiskState"
import { useEffect, useState } from "react"
import type { EmailArtifact } from "../types/analysis"

export const App = () => {
  const { result, scanning, error, analyze } = useRiskState()
  const [activeEmail, setActiveEmail] = useState<EmailArtifact | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [tabError, setTabError] = useState<string | undefined>()

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError) {
        setTabError("Cannot access tab: " + chrome.runtime.lastError.message)
        return
      }
      const tab = tabs[0]
      if (!tab?.id) {
        setTabError("No active tab found")
        return
      }
      chrome.tabs.sendMessage(tab.id, { type: "PHIS_REQUEST_ACTIVE_EMAIL" }, (response) => {
        if (chrome.runtime.lastError) {
          // Content script not injected — user is not on a supported mail client
          return
        }
        if (response?.email) {
          setActiveEmail(response.email)
          analyze(response.email)
        }
      })
    })
  }, [analyze])

  const displayError = error ?? tabError

  return (
    <main className="phis-gradient min-h-[420px] w-[360px] p-4 font-body text-slate-100">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <p className="font-display text-xs tracking-[0.2em] text-cyan-200">PHIS SENTINEL</p>
          <h1 className="font-display text-2xl">Endpoint Phishing Defense</h1>
        </div>
        <button
          onClick={() => setShowSettings((v) => !v)}
          aria-label="Toggle settings"
          title="Settings"
          className={`ml-2 rounded-full p-1.5 transition-colors ${showSettings ? "bg-cyan-600/30 text-cyan-300" : "text-slate-500 hover:text-cyan-400"}`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </header>

      {displayError && (
        <div className="mb-3 rounded-xl border border-red-500/30 bg-red-900/20 px-3 py-2 text-xs text-red-400">
          {displayError}
        </div>
      )}

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

      {showSettings && <SettingsPanel />}
    </main>
  )
}
