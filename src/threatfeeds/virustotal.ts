/**
 * VirusTotal API Integration
 * API key is stored in chrome.storage.managed (enterprise) or chrome.storage.local (user-provided).
 * Configure your key via the extension Settings panel or MDM policy.
 */

const VT_API_URL = "https://www.virustotal.com/api/v3"

const getVtApiKey = async (): Promise<string | null> => {
  // Enterprise policy takes priority
  if (chrome.storage?.managed) {
    try {
      const managed = await new Promise<Record<string, unknown>>((resolve) => {
        chrome.storage.managed.get("vtApiKey", (items) => {
          if (chrome.runtime.lastError || !items) resolve({})
          else resolve(items)
        })
      })
      if (typeof managed.vtApiKey === "string" && managed.vtApiKey.length > 0) {
        return managed.vtApiKey
      }
    } catch {
      // Managed storage not available; fall through
    }
  }

  // User-provided key
  try {
    const local = await chrome.storage.local.get("vtApiKey")
    if (typeof local.vtApiKey === "string" && local.vtApiKey.length > 0) {
      return local.vtApiKey
    }
  } catch {
    // Storage unavailable
  }

  return null
}

export interface VirusTotalScore {
  url: string
  harmless: number
  malicious: number
  suspicious: number
  undetected: number
  last_analysis_date: string
  safe: boolean
}

/**
 * Fetch URL reputation from VirusTotal.
 * Returns null if no API key is configured or on network error.
 */
export const getVirusTotalScore = async (url: string): Promise<VirusTotalScore | null> => {
  const apiKey = await getVtApiKey()
  if (!apiKey) return null

  try {
    const urlId = btoa(url).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_")

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    const response = await fetch(`${VT_API_URL}/urls/${urlId}`, {
      method: "GET",
      headers: {
        "x-apikey": apiKey
      },
      signal: controller.signal
    })

    clearTimeout(timeout)

    if (!response.ok) {
      // If 404, URL hasn't been scanned yet
      if (response.status === 404) {
        return {
          url,
          harmless: 0,
          malicious: 0,
          suspicious: 0,
          undetected: 0,
          last_analysis_date: new Date().toISOString(),
          safe: true
        }
      }
      throw new Error(`VirusTotal API error: ${response.status}`)
    }

    const data = await response.json()

    const stats = data.data?.attributes?.last_analysis_stats || {
      harmless: 0,
      malicious: 0,
      suspicious: 0,
      undetected: 0
    }

    return {
      url,
      harmless: stats.harmless || 0,
      malicious: stats.malicious || 0,
      suspicious: stats.suspicious || 0,
      undetected: stats.undetected || 0,
      last_analysis_date: data.data?.attributes?.last_analysis_date || new Date().toISOString(),
      safe: (stats.malicious || 0) === 0 && (stats.suspicious || 0) === 0
    }
  } catch (error) {
    console.error("VirusTotal lookup failed:", error)
    // Return null on error - VT lookups are optional
    return null
  }
}

/**
 * Batch fetch scores for multiple URLs (with rate limiting)
 */
export const getVirusTotalScoresBatch = async (urls: string[]): Promise<VirusTotalScore[]> => {
  const results: VirusTotalScore[] = []

  for (const url of urls) {
    // Add delay between requests to respect rate limits (4 requests per minute for free API)
    await new Promise((resolve) => setTimeout(resolve, 15000))

    const score = await getVirusTotalScore(url)
    if (score) {
      results.push(score)
    }
  }

  return results
}
