/**
 * VirusTotal API Integration
 * Handles secure API calls to VirusTotal for URL reputation checks
 */

const VT_API_KEY = "5a9219f6d9b2761fcb99552cd745603e1ffd8a0c265a468a61d1ab8a4fb5fa99"
const VT_API_URL = "https://www.virustotal.com/api/v3"

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
 * Fetch URL reputation from VirusTotal
 * Uses URL API v3 with API key for authentication
 */
export const getVirusTotalScore = async (url: string): Promise<VirusTotalScore | null> => {
  try {
    // Encode URL for VirusTotal lookup
    const urlId = btoa(url).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_")

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    const response = await fetch(`${VT_API_URL}/urls/${urlId}`, {
      method: "GET",
      headers: {
        "x-apikey": VT_API_KEY
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
