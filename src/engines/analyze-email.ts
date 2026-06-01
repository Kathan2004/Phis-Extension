import { runRuleEngine } from "./rules/rule-engine"
import { runUrlIntelligence } from "./url/url-intelligence"
import { buildRiskResult } from "./scoring/weighted-scoring"
import { lookupThreatIndicators } from "../threatfeeds/local-feed"
import type { EmailArtifact, Indicator, RiskResult } from "../types/analysis"
import { runNlpDetection } from "./ml/nlp-engine"
import { runBehavioralScoring } from "./scoring/behavioral-engine"

const deduplicateIndicators = (indicators: Indicator[]): Indicator[] => {
  const seen = new Set<string>()
  return indicators.filter((ind) => {
    if (seen.has(ind.id)) return false
    seen.add(ind.id)
    return true
  })
}

export const analyzeEmail = async (email: EmailArtifact): Promise<RiskResult> => {
  // Run all engines in parallel — sync engines are wrapped to participate in Promise.all
  const [threatFeedIndicators, nlp, ruleIndicators, urlIndicators, behavioralIndicators] =
    await Promise.all([
      lookupThreatIndicators(email).catch(() => [] as Indicator[]),
      runNlpDetection(email).catch(() => ({ indicators: [] as Indicator[], phishingProbability: 0, confidence: 0.5 })),
      Promise.resolve(runRuleEngine(email)),
      Promise.resolve(runUrlIntelligence(email)),
      Promise.resolve(runBehavioralScoring(email))
    ])

  const raw = [
    ...ruleIndicators,
    ...urlIndicators,
    ...behavioralIndicators,
    ...threatFeedIndicators,
    ...nlp.indicators
  ]

  return buildRiskResult(
    email.id,
    deduplicateIndicators(raw),
    nlp.phishingProbability,
    nlp.confidence
  )
}
