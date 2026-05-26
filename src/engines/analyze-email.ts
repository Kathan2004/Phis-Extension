import { runRuleEngine } from "./rules/rule-engine"
import { runUrlIntelligence } from "./url/url-intelligence"
import { buildRiskResult } from "./scoring/weighted-scoring"
import { lookupThreatIndicators } from "../threatfeeds/local-feed"
import type { EmailArtifact, RiskResult } from "../types/analysis"
import { runNlpDetection } from "./ml/nlp-engine"
import { runBehavioralScoring } from "./scoring/behavioral-engine"

export const analyzeEmail = async (email: EmailArtifact): Promise<RiskResult> => {
  const [threatFeedIndicators, nlp] = await Promise.all([lookupThreatIndicators(email), runNlpDetection(email)])

  const ruleIndicators = runRuleEngine(email)
  const urlIndicators = runUrlIntelligence(email)
  const behavioralIndicators = runBehavioralScoring(email)

  return buildRiskResult(
    email.id,
    [...ruleIndicators, ...urlIndicators, ...behavioralIndicators, ...threatFeedIndicators, ...nlp.indicators],
    nlp.phishingProbability,
    nlp.confidence
  )
}
