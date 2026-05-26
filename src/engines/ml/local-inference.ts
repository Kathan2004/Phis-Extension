import type { ModelInference } from "../../types/analysis"

type ClassifierResult = Array<{ label: string; score: number }>

type LocalPipeline = (input: string, options?: Record<string, unknown>) => Promise<unknown>

let classifier: LocalPipeline | null = null
let loading = false

const loadTransformers = async () => {
  const mod = (await import("@xenova/transformers")) as any
  mod.env.allowRemoteModels = false
  mod.env.allowLocalModels = true
  mod.env.useBrowserCache = true
  return mod
}

const loadClassifier = async () => {
  if (classifier || loading) {
    return classifier
  }

  loading = true
  try {
    const transformers = await loadTransformers()
    classifier = (await transformers.pipeline("text-classification", "Xenova/distilbert-base-uncased-finetuned-sst-2-english", {
      quantized: true
    })) as LocalPipeline
  } catch {
    classifier = null
  } finally {
    loading = false
  }

  return classifier
}

const heuristicFallback = (text: string): ModelInference => {
  const suspiciousTokens = ["verify", "password", "suspended", "urgent", "security", "invoice"]
  const lower = text.toLowerCase()
  const hits = suspiciousTokens.filter((token) => lower.includes(token)).length
  const probability = Math.min(0.9, hits * 0.16)

  return {
    phishingProbability: probability,
    confidence: Math.min(0.75, 0.45 + hits * 0.07),
    label: probability > 0.5 ? "phishing" : "benign",
    model: "heuristic-fallback"
  }
}

export const runLocalNlpInference = async (text: string): Promise<ModelInference> => {
  const model = await loadClassifier()
  if (!model) {
    return heuristicFallback(text)
  }

  try {
    const output = (await model(text, { topk: 2 })) as ClassifierResult
    const positive = output.find((item) => item.label.toLowerCase().includes("positive"))
    const phishingProbability = 1 - (positive?.score ?? 0.5)

    return {
      phishingProbability,
      confidence: Math.max(...output.map((item) => item.score)),
      label: phishingProbability >= 0.5 ? "phishing" : "benign",
      model: "distilbert-quantized"
    }
  } catch {
    return heuristicFallback(text)
  }
}
