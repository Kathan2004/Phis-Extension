import type { Indicator, RiskResult, ThreatLevel } from "../../types/analysis"

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value))

const mapThreatLevel = (score: number): ThreatLevel => {
  if (score < 15) return "safe"
  if (score < 35) return "low"
  if (score < 60) return "suspicious"
  if (score < 80) return "high"
  return "critical"
}

export const buildRiskResult = (
  emailId: string,
  indicators: Indicator[],
  mlProbability: number,
  mlConfidence: number
): RiskResult => {
  const ruleScore = indicators.reduce((sum, item) => sum + item.weight, 0)
  const mlScore = mlProbability * 100 * 0.45
  const finalScore = clamp(ruleScore * 0.55 + mlScore)

  const explanations = indicators
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 6)
    .map((item) => `${item.title}: ${item.detail}`)

  return {
    emailId,
    score: Math.round(finalScore),
    confidence: Math.round(clamp((mlConfidence * 100 + Math.min(ruleScore, 100)) / 2)),
    threatLevel: mapThreatLevel(finalScore),
    indicators,
    explanation: explanations,
    generatedAt: new Date().toISOString()
  }
}
