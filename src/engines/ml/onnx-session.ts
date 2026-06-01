interface OrtRuntime {
  env: {
    wasm: { numThreads: number; simd: boolean }
    logLevel: string
  }
}

let configurePromise: Promise<void> | null = null

const loadRuntime = async (): Promise<OrtRuntime | undefined> => {
  try {
    return (await import("onnxruntime-web")) as unknown as OrtRuntime
  } catch {
    return undefined
  }
}

export const configureOnnxRuntime = (): Promise<void> => {
  if (!configurePromise) {
    configurePromise = (async () => {
      const ort = await loadRuntime()
      if (!ort?.env?.wasm) return
      ort.env.wasm.numThreads = 1
      ort.env.wasm.simd = true
      ort.env.logLevel = "warning"
    })()
  }
  return configurePromise
}

export const supportsWebGpu = (): boolean => {
  return typeof navigator !== "undefined" && Boolean((navigator as Navigator & { gpu?: unknown }).gpu)
}
