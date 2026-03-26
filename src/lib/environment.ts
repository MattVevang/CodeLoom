/**
 * Runtime environment detection.
 *
 * When CodeLoom is served from localhost (Docker, npm dev), LLM features are
 * available because the browser's same-origin policy allows requests to local
 * services like Ollama. When served from a public host (GitHub Pages), those
 * requests are blocked by CORS, so LLM features are hidden.
 */

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '0.0.0.0', '[::1]'])

export const isLocalEnvironment = (): boolean => {
  if (typeof window === 'undefined') return false
  return LOCAL_HOSTNAMES.has(window.location.hostname)
}
