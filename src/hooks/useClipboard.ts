import { useCallback, useEffect, useRef, useState } from 'react'

// Strip C0 control characters that corrupt clipboard data,
// preserving only tab (0x09), newline (0x0A), and carriage return (0x0D).
const sanitizeForClipboard = (text: string): string =>
  text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')

export const useClipboard = () => {
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => () => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current)
    }
  }, [])

  const copy = useCallback(async (text: string) => {
    const clean = sanitizeForClipboard(text)

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(clean)
    } else {
      const textArea = document.createElement('textarea')
      textArea.value = clean
      textArea.setAttribute('readonly', '')
      textArea.style.position = 'absolute'
      textArea.style.opacity = '0'
      document.body.append(textArea)
      textArea.select()
      document.execCommand('copy')
      textArea.remove()
    }

    setCopied(true)

    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = window.setTimeout(() => setCopied(false), 2000)
  }, [])

  return {
    copy,
    copied,
  }
}
