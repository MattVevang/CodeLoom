import { useCallback, useEffect, useRef, useState } from 'react'

export const useClipboard = () => {
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => () => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current)
    }
  }, [])

  const copy = useCallback(async (text: string) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
    } else {
      const textArea = document.createElement('textarea')
      textArea.value = text
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
