import { Modal } from './Modal'

/** 削除確認ダイアログ（画面設計書 3章）。Esc・ダイアログ外クリックはキャンセル。 */
export function ConfirmDeleteDialog({
  title,
  busy,
  onConfirm,
  onCancel,
}: {
  title: string
  busy: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <Modal label="タスクを削除しますか？" role="alertdialog" onClose={onCancel}>
      <h2 className="text-lg font-semibold">タスクを削除しますか？</h2>
      <p className="mt-3 break-words text-sm">「{title}」</p>
      <p className="mt-1 text-sm text-gray-600">この操作は取り消せません。</p>
      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          data-autofocus
          className="rounded border border-gray-300 px-3 py-1 text-sm"
          onClick={onCancel}
        >
          キャンセル
        </button>
        <button
          type="button"
          className="rounded bg-red-600 px-3 py-1 text-sm text-white disabled:opacity-40"
          disabled={busy}
          onClick={onConfirm}
        >
          削除
        </button>
      </div>
    </Modal>
  )
}
