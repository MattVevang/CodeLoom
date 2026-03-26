import type { ChatMessage, LLMEndpoint, LLMResponse } from '@/types'

interface OllamaGenerateResponse {
  response?: string
  prompt_eval_count?: number
  eval_count?: number
}

interface OpenAIChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
  }
}

const buildApiUrl = (baseUrl: string, apiPath: string): string => {
  const normalizedBase = baseUrl.replace(/\/+$/, '')
  const normalizedPath = apiPath.startsWith('/') ? apiPath : `/${apiPath}`

  if (normalizedBase.endsWith('/v1') && normalizedPath.startsWith('/v1/')) {
    return `${normalizedBase}${normalizedPath.slice(3)}`
  }

  if (normalizedBase.endsWith('/api') && normalizedPath.startsWith('/api/')) {
    return `${normalizedBase}${normalizedPath.slice(4)}`
  }

  return `${normalizedBase}${normalizedPath}`
}

const normalizeHostname = (hostname: string): string => hostname.toLowerCase().replace(/^\[|\]$/g, '')

const isPrivateIPv4 = (hostname: string): boolean => {
  const parts = hostname.split('.')
  if (parts.length !== 4) return false
  if (parts.some((part) => !/^\d+$/.test(part))) return false

  const [a, b] = parts.map((part) => Number(part))

  return (
    a === 10
    || a === 127
    || (a === 192 && b === 168)
    || (a === 172 && b >= 16 && b <= 31)
    || (a === 169 && b === 254)
  )
}

const isPrivateIPv6 = (hostname: string): boolean => (
  hostname === '::1'
  || hostname === '0:0:0:0:0:0:0:1'
  || hostname.startsWith('fc')
  || hostname.startsWith('fd')
  || hostname.startsWith('fe80:')
)

const isLocalHostname = (hostname: string): boolean => (
  hostname === 'localhost'
  || hostname.endsWith('.localhost')
  || hostname === 'host.docker.internal'
)

const isAllowedEndpointHost = (hostname: string): boolean => (
  isLocalHostname(hostname)
  || isPrivateIPv4(hostname)
  || isPrivateIPv6(hostname)
)

export const normalizeAndValidateEndpointUrl = (value: string): string => {
  let parsed: URL

  try {
    parsed = new URL(value)
  } catch {
    throw new Error('Endpoint URL must be a valid absolute URL (for example, http://localhost:11434).')
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Endpoint URL must use http:// or https://.')
  }

  const hostname = normalizeHostname(parsed.hostname)
  if (!isAllowedEndpointHost(hostname)) {
    throw new Error(
      'Endpoint must be local or private-network only (localhost, host.docker.internal, 127.0.0.1, 10.x.x.x, 172.16-31.x.x, 192.168.x.x, fc00::/7, fe80::/10).',
    )
  }

  return parsed.toString()
}

const prepareEndpoint = (endpoint: LLMEndpoint): LLMEndpoint => ({
  ...endpoint,
  url: normalizeAndValidateEndpointUrl(endpoint.url),
})

const buildHeaders = (endpoint: LLMEndpoint): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  if (endpoint.apiKey) {
    headers.Authorization = `Bearer ${endpoint.apiKey}`
  }

  if (endpoint.apiType === 'anthropic' && endpoint.apiKey) {
    headers['x-api-key'] = endpoint.apiKey
    headers['anthropic-version'] = '2023-06-01'
  }

  return headers
}

const readJson = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Request failed with status ${response.status}`)
  }

  return (await response.json()) as T
}

export const sendToLLM = async (endpoint: LLMEndpoint, prompt: string): Promise<LLMResponse> => {
  const safeEndpoint = prepareEndpoint(endpoint)

  if (safeEndpoint.apiType === 'ollama') {
    const response = await fetch(buildApiUrl(safeEndpoint.url, '/api/generate'), {
      method: 'POST',
      headers: buildHeaders(safeEndpoint),
      body: JSON.stringify({
        model: safeEndpoint.model,
        prompt,
        stream: false,
      }),
    })

    const data = await readJson<OllamaGenerateResponse>(response)

    return {
      content: data.response ?? '',
      raw: data,
      usage: {
        promptTokens: data.prompt_eval_count,
        completionTokens: data.eval_count,
        totalTokens:
          typeof data.prompt_eval_count === 'number' || typeof data.eval_count === 'number'
            ? (data.prompt_eval_count ?? 0) + (data.eval_count ?? 0)
            : undefined,
      },
    }
  }

  if (safeEndpoint.apiType === 'anthropic') {
    const response = await fetch(buildApiUrl(safeEndpoint.url, '/v1/messages'), {
      method: 'POST',
      headers: buildHeaders(safeEndpoint),
      body: JSON.stringify({
        model: safeEndpoint.model,
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await readJson<{
      content?: Array<{ text?: string }>
      usage?: { input_tokens?: number; output_tokens?: number }
    }>(response)

    return {
      content: data.content?.map((entry) => entry.text ?? '').join('') ?? '',
      raw: data,
      usage: {
        promptTokens: data.usage?.input_tokens,
        completionTokens: data.usage?.output_tokens,
        totalTokens:
          typeof data.usage?.input_tokens === 'number' || typeof data.usage?.output_tokens === 'number'
            ? (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0)
            : undefined,
      },
    }
  }

  if (safeEndpoint.apiType === 'generic') {
    const response = await fetch(safeEndpoint.url, {
      method: 'POST',
      headers: buildHeaders(safeEndpoint),
      body: JSON.stringify({
        model: safeEndpoint.model,
        prompt,
      }),
    })

    const data = await readJson<{ content?: string; response?: string }>(response)

    return {
      content: data.content ?? data.response ?? '',
      raw: data,
    }
  }

  const response = await fetch(buildApiUrl(safeEndpoint.url, '/v1/chat/completions'), {
    method: 'POST',
    headers: buildHeaders(safeEndpoint),
    body: JSON.stringify({
      model: safeEndpoint.model,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  const data = await readJson<OpenAIChatCompletionResponse>(response)

  return {
    content: data.choices?.[0]?.message?.content ?? '',
    raw: data,
    usage: {
      promptTokens: data.usage?.prompt_tokens,
      completionTokens: data.usage?.completion_tokens,
      totalTokens: data.usage?.total_tokens,
    },
  }
}

interface OllamaChatResponse {
  message?: { role?: string; content?: string }
  prompt_eval_count?: number
  eval_count?: number
}

export const chatWithLLM = async (
  endpoint: LLMEndpoint,
  messages: ChatMessage[],
): Promise<LLMResponse> => {
  const safeEndpoint = prepareEndpoint(endpoint)

  if (safeEndpoint.apiType === 'ollama') {
    const response = await fetch(buildApiUrl(safeEndpoint.url, '/api/chat'), {
      method: 'POST',
      headers: buildHeaders(safeEndpoint),
      body: JSON.stringify({
        model: safeEndpoint.model,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        stream: false,
      }),
    })

    const data = await readJson<OllamaChatResponse>(response)

    return {
      content: data.message?.content ?? '',
      raw: data,
      usage: {
        promptTokens: data.prompt_eval_count,
        completionTokens: data.eval_count,
        totalTokens:
          typeof data.prompt_eval_count === 'number' || typeof data.eval_count === 'number'
            ? (data.prompt_eval_count ?? 0) + (data.eval_count ?? 0)
            : undefined,
      },
    }
  }

  if (safeEndpoint.apiType === 'anthropic') {
    const response = await fetch(buildApiUrl(safeEndpoint.url, '/v1/messages'), {
      method: 'POST',
      headers: buildHeaders(safeEndpoint),
      body: JSON.stringify({
        model: safeEndpoint.model,
        max_tokens: 4096,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    })

    const data = await readJson<{
      content?: Array<{ text?: string }>
      usage?: { input_tokens?: number; output_tokens?: number }
    }>(response)

    return {
      content: data.content?.map((entry) => entry.text ?? '').join('') ?? '',
      raw: data,
      usage: {
        promptTokens: data.usage?.input_tokens,
        completionTokens: data.usage?.output_tokens,
        totalTokens:
          typeof data.usage?.input_tokens === 'number' || typeof data.usage?.output_tokens === 'number'
            ? (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0)
            : undefined,
      },
    }
  }

  if (safeEndpoint.apiType === 'generic') {
    const lastMessage = messages[messages.length - 1]
    const response = await fetch(safeEndpoint.url, {
      method: 'POST',
      headers: buildHeaders(safeEndpoint),
      body: JSON.stringify({
        model: safeEndpoint.model,
        prompt: lastMessage?.content ?? '',
      }),
    })

    const data = await readJson<{ content?: string; response?: string }>(response)

    return {
      content: data.content ?? data.response ?? '',
      raw: data,
    }
  }

  // OpenAI-compatible
  const response = await fetch(buildApiUrl(safeEndpoint.url, '/v1/chat/completions'), {
    method: 'POST',
    headers: buildHeaders(safeEndpoint),
    body: JSON.stringify({
      model: safeEndpoint.model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  })

  const data = await readJson<OpenAIChatCompletionResponse>(response)

  return {
    content: data.choices?.[0]?.message?.content ?? '',
    raw: data,
    usage: {
      promptTokens: data.usage?.prompt_tokens,
      completionTokens: data.usage?.completion_tokens,
      totalTokens: data.usage?.total_tokens,
    },
  }
}
