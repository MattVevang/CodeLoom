import { X } from 'lucide-react'
import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

interface ModalProps {
  isOpen: boolean
  title: string
  onClose: () => void
  children: ReactNode
  className?: string
}

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

export const Modal = ({ isOpen, title, onClose, children, className }: ModalProps) => {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const previousActiveElement = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null
    const panelElement = panelRef.current
    const focusableElements = panelElement
      ? Array.from(panelElement.querySelectorAll<HTMLElement>(focusableSelector))
      : []

    ;(focusableElements[0] ?? panelElement)?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab' || !panelElement) {
        return
      }

      const elements = Array.from(panelElement.querySelectorAll<HTMLElement>(focusableSelector))
      if (elements.length === 0) {
        event.preventDefault()
        panelElement.focus()
        return
      }

      const firstElement = elements[0]
      const lastElement = elements[elements.length - 1]
      const activeElement = document.activeElement

      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      } else if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
      previousActiveElement?.focus()
    }
  }, [isOpen, onClose])

  if (!isOpen || typeof document === 'undefined') {
    return null
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 px-4 py-6 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          'panel-surface relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden',
          className,
        )}
      >
        <div className="flex items-center justify-between border-b border-zinc-200/70 px-6 py-4 dark:border-zinc-800/80">
          <h2 id={titleId} className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
            {title}
          </h2>
          <button
            type="button"
            aria-label="Close settings"
            onClick={onClose}
            className="rounded-md p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-950 focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
