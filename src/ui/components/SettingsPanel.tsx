import { useState, useEffect } from "react"

export const SettingsPanel = () => {
  const [key, setKey] = useState("")
  const [configured, setConfigured] = useState(false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<"idle" | "saved" | "cleared">("idle")

  useEffect(() => {
    chrome.runtime.sendMessage({ type: "PHIS_GET_VT_KEY" }, (response) => {
      if (chrome.runtime.lastError || !response?.ok) return
      setConfigured(Boolean(response.configured))
    })
  }, [])

  const handleSave = () => {
    const trimmed = key.trim()
    if (!trimmed) return
    setSaving(true)
    chrome.runtime.sendMessage({ type: "PHIS_SET_VT_KEY", payload: trimmed }, (response) => {
      setSaving(false)
      if (chrome.runtime.lastError || !response?.ok) return
      setConfigured(true)
      setKey("")
      setStatus("saved")
      setTimeout(() => setStatus("idle"), 2500)
    })
  }

  const handleClear = () => {
    setSaving(true)
    chrome.runtime.sendMessage({ type: "PHIS_SET_VT_KEY", payload: "" }, (response) => {
      setSaving(false)
      if (chrome.runtime.lastError || !response?.ok) return
      setConfigured(false)
      setKey("")
      setStatus("cleared")
      setTimeout(() => setStatus("idle"), 2500)
    })
  }

  return (
    <div className="mt-4 border border-cyan-900/50 rounded-xl bg-slate-950/60 p-4 space-y-3">
      <h3 className="font-display text-sm text-cyan-300 tracking-wide">Settings</h3>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">VirusTotal API Key</span>
          {status === "saved" ? (
            <span className="text-emerald-400">✓ Saved</span>
          ) : status === "cleared" ? (
            <span className="text-amber-400">Cleared</span>
          ) : (
            <span className={configured ? "text-emerald-400" : "text-slate-500"}>
              {configured ? "✓ Configured" : "Not configured"}
            </span>
          )}
        </div>

        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          placeholder={configured ? "Enter new key to update…" : "Paste your API key…"}
          className="w-full bg-slate-900/80 border border-cyan-900/50 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-cyan-500/60 transition-colors"
        />

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving || !key.trim()}
            className="flex-1 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 disabled:opacity-40 border border-cyan-500/50 rounded-lg text-xs text-cyan-300 transition-colors"
          >
            {saving ? "Saving…" : "Save Key"}
          </button>
          {configured && (
            <button
              onClick={handleClear}
              disabled={saving}
              className="px-3 py-1.5 bg-red-600/10 hover:bg-red-600/20 disabled:opacity-40 border border-red-500/30 rounded-lg text-xs text-red-400 transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        <p className="text-[10px] text-slate-600 leading-relaxed">
          Free keys available at{" "}
          <span className="text-cyan-700">virustotal.com</span>. Without a key, URL reputation
          checks are disabled but all other detection engines remain active.
        </p>
      </div>
    </div>
  )
}
