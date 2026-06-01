import type { ModelInference } from "../../types/analysis"

type ClassifierResult = Array<{ label: string; score: number }>
type LocalPipeline = (input: string, options?: Record<string, unknown>) => Promise<ClassifierResult>

interface TransformersModule {
  env: {
    allowRemoteModels: boolean
    allowLocalModels: boolean
    useBrowserCache: boolean
  }
  pipeline: (
    task: string,
    model: string,
    options?: Record<string, unknown>
  ) => Promise<LocalPipeline>
}

let classifierPromise: Promise<LocalPipeline | null> | null = null

const loadTransformers = async (): Promise<TransformersModule> => {
  const mod = (await import("@xenova/transformers")) as unknown as TransformersModule
  mod.env.allowRemoteModels = false
  mod.env.allowLocalModels = true
  mod.env.useBrowserCache = true
  return mod
}

const loadClassifier = (): Promise<LocalPipeline | null> => {
  if (!classifierPromise) {
    classifierPromise = (async () => {
      try {
        const transformers = await loadTransformers()
        return await transformers.pipeline("text-classification", "Xenova/distilbert-base-uncased-finetuned-sst-2-english", {
          quantized: true
        })
      } catch {
        classifierPromise = null
        return null
      }
    })()
  }
  return classifierPromise
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
    const output = await model(text, { topk: 2 })
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
