import "./styles.css"
import { AnalysisPanel } from "./components/AnalysisPanel"
import { useRiskState } from "./hooks/useRiskState"
import { useEffect } from "react"

export const App = () => {
  const { result, scanning, analyze } = useRiskState()

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0]
      if (!tab?.id) return
      chrome.tabs.sendMessage(tab.id, { type: "PHIS_REQUEST_ACTIVE_EMAIL" }, (response) => {
        if (response?.email) {
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
    </main>
  )
}
