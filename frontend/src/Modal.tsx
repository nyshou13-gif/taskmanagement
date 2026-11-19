import { useEffect, useRef, type ReactNode } from 'react'

/**
 * モーダル共通の枠。背景クリックと Esc キーで onClose を呼ぶ（キャンセル扱い）。
 * data-autofocus を付けた要素があれば、開いたときにそこへフォーカスする。
 */
export function Modal({
  label,
  role = 'dialog',
  onClose,
  closeOnEscape = true,
  children,
}: {
  label: string
  role?: 'dialog' | 'alertdialog'
  onClose: () => void
  closeOnEscape?: boolean
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus()
  }, [])

  useEffect(() => {
    if (!closeOnEscape) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [closeOnEscape, onClose])

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={ref}
        role={role}
        aria-modal="true"
        aria-label={label}
        className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl"
      >
        {children}
      </div>
    </div>
  )
}
