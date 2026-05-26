import type { RiskResult } from "../../types/analysis"

const levelTone: Record<string, string> = {
  safe: "border-emerald-300/40 bg-emerald-500/20",
  low: "border-cyan-300/40 bg-cyan-500/20",
  suspicious: "border-amber-300/40 bg-amber-500/20",
  high: "border-orange-300/40 bg-orange-500/20",
  critical: "border-red-300/40 bg-red-500/20"
}

export const ScanBanner = ({ result }: { result: RiskResult }) => {
  return (
    <div className={`fixed right-4 top-4 z-[2147483647] max-w-sm rounded-xl border p-3 text-white shadow-glass ${levelTone[result.threatLevel]}`}>
      <p className="font-display text-xs tracking-[0.16em]">PHIS SENTINEL</p>
      <p className="mt-1 text-sm">Threat level: {result.threatLevel.toUpperCase()} ({result.score}/100)</p>
      <p className="mt-2 text-xs opacity-90">{result.explanation[0] || "No strong phishing indicators detected."}</p>
    </div>
  )
}
