import type { EmailArtifact, Indicator } from "../../types/analysis"
import { runLocalNlpInference } from "./local-inference"

export const runNlpDetection = async (
  email: EmailArtifact
): Promise<{ indicators: Indicator[]; phishingProbability: number; confidence: number }> => {
  const inference = await runLocalNlpInference(`${email.subject}\n${email.bodyText}`)
  const indicators: Indicator[] = []

  if (inference.phishingProbability >= 0.7) {
    indicators.push({
      id: "nlp_high_risk",
      category: "ml",
      weight: 18,
      title: "NLP model detected phishing semantics",
      detail: `Local ${inference.model} scored message as phishing with high probability.`
    })
  }

  return {
    indicators,
    phishingProbability: inference.phishingProbability,
    confidence: inference.confidence
  }
}
