import React, { useState, useEffect } from "react"
import type { EmailArtifact, RiskResult } from "../../types/analysis"

interface AuthenticationHeader {
  spf: "pass" | "fail" | "unknown"
  dkim: "pass" | "fail" | "unknown"
  dmarc: "pass" | "fail" | "unknown"
}

interface VirusTotalScore {
  url: string
  harmless: number
  malicious: number
  suspicious: number
  undetected: number
  last_analysis_date?: string
  safe?: boolean
}

const MAX_VT_LOOKUPS = 5

export function DetailedReport({
  email,
  result
}: {
  email: EmailArtifact
  result: RiskResult
}): React.ReactElement {
  const [authHeaders, setAuthHeaders] = useState<AuthenticationHeader>({
    spf: "unknown",
    dkim: "unknown",
    dmarc: "unknown"
  })
  const [vtScores, setVtScores] = useState<VirusTotalScore[]>([])
  const [vtLoading, setVtLoading] = useState(true)
  const [vtConfigured, setVtConfigured] = useState(true)

  useEffect(() => {
    let cancelled = false

    const parseHeaders = () => {
      const headerBlob = Object.entries(email.headers || {})
        .map(([k, v]) => `${k}:${v}`)
        .join("\n")
        .toLowerCase()

      setAuthHeaders({
        spf: /spf\s*=\s*pass/.test(headerBlob) ? "pass" : /spf\s*=\s*fail/.test(headerBlob) ? "fail" : "unknown",
        dkim: /dkim\s*=\s*pass/.test(headerBlob) ? "pass" : /dkim\s*=\s*fail/.test(headerBlob) ? "fail" : "unknown",
        dmarc: /dmarc\s*=\s*pass/.test(headerBlob)
          ? "pass"
          : /dmarc\s*=\s*fail/.test(headerBlob)
            ? "fail"
            : "unknown"
      })
    }

    const fetchVirusTotalScores = async () => {
      // Check if VT key is configured before making requests
      const keyCheck = await new Promise<boolean>((resolve) => {
        chrome.runtime.sendMessage({ type: "PHIS_GET_VT_KEY" }, (response) => {
          if (chrome.runtime.lastError || !response?.ok) resolve(false)
          else resolve(Boolean(response.configured))
        })
      })

      if (!keyCheck) {
        if (!cancelled) setVtConfigured(false)
        return
      }

      // Deduplicate by hostname, limit to MAX_VT_LOOKUPS
      const seenHosts = new Set<string>()
      const urlsToScan: string[] = []
      for (const link of email.links) {
        try {
          const host = new URL(link.href).hostname
          if (!seenHosts.has(host)) {
            seenHosts.add(host)
            urlsToScan.push(link.href)
          }
        } catch {
          // Skip malformed URLs
        }
        if (urlsToScan.length >= MAX_VT_LOOKUPS) break
      }

      const scores: VirusTotalScore[] = []
      for (const url of urlsToScan) {
        if (cancelled) return
        const score = await new Promise<VirusTotalScore | null>((resolve) => {
          const timeout = setTimeout(() => resolve(null), 10_000)
          chrome.runtime.sendMessage({ type: "PHIS_GET_VT_SCORE", payload: url }, (response) => {
            clearTimeout(timeout)
            if (chrome.runtime.lastError || !response?.ok) resolve(null)
            else resolve(response.score ?? null)
          })
        })
        if (score) scores.push(score)
      }

      if (!cancelled) setVtScores(scores)
    }

    const run = async () => {
      parseHeaders()
      await fetchVirusTotalScores()
      if (!cancelled) setVtLoading(false)
    }

    run()

    return () => {
      cancelled = true
    }
  }, [email.id])

  const getAuthStatus = (status: string) => {
    switch (status) {
      case "pass":
        return <span className="text-green-400">✓ PASS</span>
      case "fail":
        return <span className="text-red-400">✗ FAIL</span>
      default:
        return <span className="text-gray-400">⊗ Unknown</span>
    }
  }

  return (
    <div className="space-y-4 text-xs text-slate-300 p-3">
      {/* Authentication Headers */}
      <div className="border border-cyan-900/30 rounded p-3 bg-slate-900/50">
        <h3 className="font-bold text-cyan-300 mb-2">Email Authentication</h3>
        <div className="space-y-1">
          <div className="flex justify-between">
            <span>SPF:</span>
            {getAuthStatus(authHeaders.spf)}
          </div>
          <div className="flex justify-between">
            <span>DKIM:</span>
            {getAuthStatus(authHeaders.dkim)}
          </div>
          <div className="flex justify-between">
            <span>DMARC:</span>
            {getAuthStatus(authHeaders.dmarc)}
          </div>
        </div>
      </div>

      {/* Sender Information */}
      <div className="border border-cyan-900/30 rounded p-3 bg-slate-900/50">
        <h3 className="font-bold text-cyan-300 mb-2">Sender Details</h3>
        <div className="space-y-1 break-all">
          <div className="text-gray-400">From: {email.sender}</div>
          <div className="text-gray-400">Domain: {email.senderDomain}</div>
          {email.replyTo && <div className="text-gray-400">Reply-To: {email.replyTo}</div>}
        </div>
      </div>

      {/* VirusTotal Link Scores */}
      <div className="border border-cyan-900/30 rounded p-3 bg-slate-900/50">
        <h3 className="font-bold text-cyan-300 mb-2">Link Reputation (VirusTotal)</h3>
        {!vtConfigured ? (
          <p className="text-slate-500 text-[10px]">
            Configure a VirusTotal API key in Settings to enable link reputation checks.
          </p>
        ) : vtLoading ? (
          <p className="text-slate-500 text-[10px] animate-pulse">Scanning links…</p>
        ) : vtScores.length === 0 ? (
          <p className="text-slate-500 text-[10px]">No scannable links found.</p>
        ) : (
          <div className="space-y-2">
            {vtScores.map((score, idx) => (
              <div key={idx} className="border-t border-slate-700/50 pt-2 first:border-0 first:pt-0">
                <div className="text-gray-400 truncate text-[10px]">{score.url}</div>
                <div className="flex justify-between mt-1 text-[10px]">
                  <span className="text-green-400">Harmless: {score.harmless}</span>
                  <span className="text-red-400">Malicious: {score.malicious}</span>
                  <span className="text-yellow-400">Suspicious: {score.suspicious}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Risk Indicators */}
      {result.indicators.length > 0 && (
        <div className="border border-cyan-900/30 rounded p-3 bg-slate-900/50">
          <h3 className="font-bold text-cyan-300 mb-2">Detected Indicators ({result.indicators.length})</h3>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {result.indicators.slice(0, 8).map((indicator) => (
              <div key={indicator.id} className="text-gray-400 text-[10px]">
                <span className="text-orange-300">•</span> {indicator.title}
                {indicator.evidence && (
                  <div className="text-gray-500 ml-2 font-mono break-all">
                    {indicator.evidence}
                  </div>
                )}
              </div>
            ))}
            {result.indicators.length > 8 && (
              <div className="text-gray-500 text-[10px]">+{result.indicators.length - 8} more indicators</div>
            )}
          </div>
        </div>
      )}

      {/* Score Breakdown */}
      <div className="border border-cyan-900/30 rounded p-3 bg-slate-900/50">
        <h3 className="font-bold text-cyan-300 mb-2">Risk Analysis</h3>
        <div className="space-y-1">
          <div className="flex justify-between">
            <span>Final Score:</span>
            <span className="font-bold">{result.score}/100</span>
          </div>
          <div className="flex justify-between">
            <span>Threat Level:</span>
            <span
              className={`font-bold ${
                result.threatLevel === "critical"
                  ? "text-red-400"
                  : result.threatLevel === "high"
                    ? "text-orange-400"
                    : result.threatLevel === "suspicious"
                      ? "text-amber-400"
                      : "text-green-400"
              }`}
            >
              {result.threatLevel.toUpperCase()}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Confidence:</span>
            <span className="font-bold">{result.confidence}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}
