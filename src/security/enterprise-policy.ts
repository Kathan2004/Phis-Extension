import type { DetectionPolicy } from "../types/analysis"

const defaultPolicy: DetectionPolicy = {
  strictMode: true,
  maxModelLatencyMs: 250,
  blockCriticalLinks: true,
  adminMode: false
}

export const getDefaultPolicy = () => ({ ...defaultPolicy })

export const loadManagedPolicy = async (): Promise<DetectionPolicy> => {
  if (!chrome.storage?.managed) {
    return getDefaultPolicy()
  }

  return new Promise((resolve) => {
    chrome.storage.managed.get(null, (items) => {
      if (chrome.runtime.lastError || !items) {
        resolve(getDefaultPolicy())
        return
      }

      resolve({
        strictMode: typeof items.strictMode === "boolean" ? items.strictMode : defaultPolicy.strictMode,
        maxModelLatencyMs:
          typeof items.maxModelLatencyMs === "number" ? items.maxModelLatencyMs : defaultPolicy.maxModelLatencyMs,
        blockCriticalLinks:
          typeof items.blockCriticalLinks === "boolean"
            ? items.blockCriticalLinks
            : defaultPolicy.blockCriticalLinks,
        adminMode: typeof items.adminMode === "boolean" ? items.adminMode : defaultPolicy.adminMode
      })
    })
  })
}
