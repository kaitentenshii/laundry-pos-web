import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'

export function Modal({ title, description, children, onClose, busy = false }: { title: string; description: string; children: ReactNode; onClose: () => void; busy?: boolean }) {
  const titleId = useId()
  const dialog = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    dialog.current?.querySelector<HTMLElement>('input, select, button')?.focus()
    return () => previous?.focus()
  }, [])
  return createPortal(
    <div className="dialog-backdrop" onMouseDown={event => { if (event.target === event.currentTarget && !busy) onClose() }}>
      <div ref={dialog} className="workspace-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-busy={busy} tabIndex={-1} onKeyDown={event => {
        if (event.key === 'Escape' && !busy) onClose()
        if (event.key === 'Tab') {
          const items = Array.from(dialog.current?.querySelectorAll<HTMLElement>('input:not(:disabled), select:not(:disabled), textarea:not(:disabled), button:not(:disabled), a[href]') ?? [])
          const first = items[0], last = items.at(-1)
          if (!first) { event.preventDefault(); dialog.current?.focus() }
          else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
        }
      }}>
        <h2 id={titleId}>{title}</h2><p className="dialog-description">{description}</p>{children}
      </div>
    </div>, document.body,
  )
}
