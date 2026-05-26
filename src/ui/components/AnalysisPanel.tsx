import type { RiskResult } from "../../types/analysis"
import { RiskBadge } from "./RiskBadge"

interface Props {
  result?: RiskResult
  scanning: boolean
}

export const AnalysisPanel = ({ result, scanning }: Props) => {
  if (scanning) {
    return (
      <div className="phis-glass animate-pulseRing rounded-2xl p-4 text-cyan-50 shadow-glass">
        <p className="font-display text-sm tracking-[0.16em] text-cyan-200">SCANNING EMAIL</p>
        <p className="mt-2 text-sm text-cyan-100/80">Running rule, URL, and local NLP inference engines...</p>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="phis-glass rounded-2xl p-4 text-sm text-slate-300 shadow-glass">
        Open an email in Gmail or Outlook and trigger analysis from the Sentinel button.
      </div>
    )
  }

  return (
    <div className="phis-glass animate-slideIn rounded-2xl p-4 text-slate-100 shadow-glass">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg">Threat Analysis</h2>
        <RiskBadge level={result.threatLevel} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-slate-400">Risk Score</p>
          <p className="font-display text-2xl">{result.score}</p>
        </div>
        <div>
          <p className="text-slate-400">Confidence</p>
          <p className="font-display text-2xl">{result.confidence}%</p>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {result.explanation.map((line) => (
          <p key={line} className="rounded-lg border border-cyan-400/20 bg-cyan-500/5 px-3 py-2 text-xs text-cyan-100/95">
            {line}
          </p>
        ))}
      </div>
    </div>
  )
}
