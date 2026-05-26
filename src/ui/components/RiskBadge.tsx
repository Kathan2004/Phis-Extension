import type { ThreatLevel } from "../../types/analysis"

const mapColor = (level: ThreatLevel) => {
  switch (level) {
    case "safe":
      return "bg-emerald-500/20 text-emerald-200 border-emerald-400/50"
    case "low":
      return "bg-cyan-500/20 text-cyan-100 border-cyan-300/50"
    case "suspicious":
      return "bg-amber-500/20 text-amber-100 border-amber-300/50"
    case "high":
      return "bg-orange-500/20 text-orange-100 border-orange-300/50"
    default:
      return "bg-red-500/20 text-red-100 border-red-300/50"
  }
}

export const RiskBadge = ({ level }: { level: ThreatLevel }) => {
  return (
    <span className={`rounded-full border px-2 py-1 text-xs uppercase tracking-[0.14em] ${mapColor(level)}`}>
      {level}
    </span>
  )
}
