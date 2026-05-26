let initialized = false
let ortRuntime: any | undefined

const loadRuntime = async () => {
  if (ortRuntime) return ortRuntime
  try {
    ortRuntime = await import("onnxruntime-web")
    return ortRuntime
  } catch {
    ortRuntime = undefined
    return undefined
  }
}

export const configureOnnxRuntime = async () => {
  if (initialized) return
  const ort = await loadRuntime()
  if (!ort?.env?.wasm) {
    initialized = true
    return
  }

  ort.env.wasm.numThreads = 1
  ort.env.wasm.simd = true
  ort.env.logLevel = "warning"
  initialized = true
}

export const supportsWebGpu = async () => {
  return typeof navigator !== "undefined" && Boolean((navigator as Navigator & { gpu?: unknown }).gpu)
}
