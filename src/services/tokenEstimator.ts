export type TokenWarningLevel = 'ok' | 'warning' | 'danger'

export const estimateTokens = (text: string): number => {
  const normalized = text.trim()

  if (!normalized) {
    return 0
  }

  return Math.ceil(normalized.length / 4)
}

export const formatTokenCount = (count: number): string => new Intl.NumberFormat().format(count)

export const getTokenWarningLevel = (count: number): TokenWarningLevel => {
  if (count >= 16000) {
    return 'danger'
  }

  if (count >= 8000) {
    return 'warning'
  }

  return 'ok'
}
