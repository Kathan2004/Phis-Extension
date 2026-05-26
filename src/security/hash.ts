const toHex = (bytes: Uint8Array) => Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("")

export const sha256Hex = async (input: string): Promise<string> => {
  const data = new TextEncoder().encode(input.trim().toLowerCase())
  const digest = await crypto.subtle.digest("SHA-256", data)
  return toHex(new Uint8Array(digest))
}
