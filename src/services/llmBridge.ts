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

interface ModelListResponse {
  data?: Array<{
    id?: string
  }>
}

interface OllamaTagsResponse {
  models?: Array<{
    name?: string
    details?: {
      parameter_size?: string
      quantization_level?: string
    }
  }>
}

interface OllamaPsResponse {
  models?: Array<{
    name?: string
    model?: string
    context_length?: number
  }>
}

export interface ModelInfo {
  name: string
  contextLength?: number
  parameterSize?: string
  quantization?: string
}

interface OllamaShowResponse {
  model_info?: Record<string, unknown>
  parameters?: string
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
  if (endpoint.apiType === 'ollama') {
    const response = await fetch(buildApiUrl(endpoint.url, '/api/generate'), {
      method: 'POST',
      headers: buildHeaders(endpoint),
      body: JSON.stringify({
        model: endpoint.model,
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

  if (endpoint.apiType === 'anthropic') {
    const response = await fetch(buildApiUrl(endpoint.url, '/v1/messages'), {
      method: 'POST',
      headers: buildHeaders(endpoint),
      body: JSON.stringify({
        model: endpoint.model,
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

  if (endpoint.apiType === 'generic') {
    const response = await fetch(endpoint.url, {
      method: 'POST',
      headers: buildHeaders(endpoint),
      body: JSON.stringify({
        model: endpoint.model,
        prompt,
      }),
    })

    const data = await readJson<{ content?: string; response?: string }>(response)

    return {
      content: data.content ?? data.response ?? '',
      raw: data,
    }
  }

  const response = await fetch(buildApiUrl(endpoint.url, '/v1/chat/completions'), {
    method: 'POST',
    headers: buildHeaders(endpoint),
    body: JSON.stringify({
      model: endpoint.model,
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
  if (endpoint.apiType === 'ollama') {
    const response = await fetch(buildApiUrl(endpoint.url, '/api/chat'), {
      method: 'POST',
      headers: buildHeaders(endpoint),
      body: JSON.stringify({
        model: endpoint.model,
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

  if (endpoint.apiType === 'anthropic') {
    const response = await fetch(buildApiUrl(endpoint.url, '/v1/messages'), {
      method: 'POST',
      headers: buildHeaders(endpoint),
      body: JSON.stringify({
        model: endpoint.model,
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

  if (endpoint.apiType === 'generic') {
    const lastMessage = messages[messages.length - 1]
    const response = await fetch(endpoint.url, {
      method: 'POST',
      headers: buildHeaders(endpoint),
      body: JSON.stringify({
        model: endpoint.model,
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
  const response = await fetch(buildApiUrl(endpoint.url, '/v1/chat/completions'), {
    method: 'POST',
    headers: buildHeaders(endpoint),
    body: JSON.stringify({
      model: endpoint.model,
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

export const testConnection = async (endpoint: LLMEndpoint): Promise<boolean> => {
  try {
    await listModels(endpoint)
    return true
  } catch {
    return false
  }
}

export const listModels = async (endpoint: LLMEndpoint): Promise<string[]> => {
  if (endpoint.apiType === 'ollama') {
    const response = await fetch(buildApiUrl(endpoint.url, '/api/tags'))
    const data = await readJson<OllamaTagsResponse>(response)
    return (data.models ?? []).flatMap((model) => (model.name ? [model.name] : []))
  }

  if (endpoint.apiType === 'anthropic') {
    return endpoint.model ? [endpoint.model] : []
  }

  if (endpoint.apiType === 'generic') {
    return endpoint.model ? [endpoint.model] : []
  }

  const response = await fetch(buildApiUrl(endpoint.url, '/v1/models'), {
    headers: endpoint.apiKey ? { Authorization: `Bearer ${endpoint.apiKey}` } : undefined,
  })
  const data = await readJson<ModelListResponse>(response)

  return (data.data ?? []).flatMap((model) => (model.id ? [model.id] : []))
}

export const getModelInfo = async (endpoint: LLMEndpoint, modelName: string): Promise<ModelInfo> => {
  const info: ModelInfo = { name: modelName }

  if (endpoint.apiType === 'ollama') {
    // 1. Check /api/ps for running model — returns the actual runtime context
    try {
      const psResponse = await fetch(buildApiUrl(endpoint.url, '/api/ps'))
      const psData = await readJson<OllamaPsResponse>(psResponse)
      const running = (psData.models ?? []).find(
        (m) => m.name === modelName || m.model === modelName,
      )
      if (running?.context_length) {
        info.contextLength = running.context_length
      }
    } catch {
      // /api/ps is best-effort
    }

    // 2. Query /api/show for metadata and fallback context values
    try {
      const response = await fetch(buildApiUrl(endpoint.url, '/api/show'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName }),
      })
      const data = await readJson<OllamaShowResponse>(response)

      // If we didn't get context from /api/ps, check num_ctx from parameters
      // (the explicitly configured context for this model)
      if (!info.contextLength && typeof data.parameters === 'string') {
        const ctxMatch = data.parameters.match(/num_ctx\s+(\d+)/)
        if (ctxMatch) {
          info.contextLength = parseInt(ctxMatch[1], 10)
        }
      }

      // Last resort: model_info.*.context_length (architectural max — may be
      // much larger than what Ollama actually allocates at runtime)
      if (!info.contextLength) {
        const modelInfo = data.model_info ?? {}
        for (const [key, value] of Object.entries(modelInfo)) {
          if (key.endsWith('.context_length') && typeof value === 'number') {
            info.contextLength = value
            break
          }
        }
      }
    } catch {
      // Model info is best-effort
    }
  }

  return info
}

export const listModelsDetailed = async (endpoint: LLMEndpoint): Promise<ModelInfo[]> => {
  if (endpoint.apiType === 'ollama') {
    try {
      const response = await fetch(buildApiUrl(endpoint.url, '/api/tags'))
      const data = await readJson<OllamaTagsResponse>(response)
      return (data.models ?? []).flatMap((model) => {
        if (!model.name) return []
        return [{
          name: model.name,
          parameterSize: model.details?.parameter_size,
          quantization: model.details?.quantization_level,
        }]
      })
    } catch {
      return []
    }
  }

  const names = await listModels(endpoint)
  return names.map((name) => ({ name }))
}
