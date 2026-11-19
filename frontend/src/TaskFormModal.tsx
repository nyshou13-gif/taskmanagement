import { useState } from 'react'
import { ConfirmDeleteDialog } from './ConfirmDeleteDialog'
import { Modal } from './Modal'
import { createTask, deleteTask, updateTask } from './api'
import {
  DEFAULT_PRIORITY,
  PRIORITIES,
  TITLE_MAX_LENGTH,
  type Column,
  type Task,
  type TaskDetail,
} from './types'

const inputClass = 'w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm'

const validateTitle = (title: string) => {
  if (title.trim() === '') return 'タイトルを入力してください'
  if (title.length > TITLE_MAX_LENGTH) return `${TITLE_MAX_LENGTH}文字以内で入力してください`
  return null
}

/**
 * タスクの作成／編集モーダル（画面設計書 2章）。task を渡すと編集、渡さないと作成。
 * 削除ボタンは編集のときだけ表示し、押すと削除確認ダイアログを開く。
 */
export function TaskFormModal({
  task,
  columnId,
  columns,
  onSaved,
  onDeleted,
  onClose,
  onError,
}: {
  task?: Task
  columnId: number
  columns: Column[]
  onSaved: (task: TaskDetail) => void
  onDeleted: (id: number) => void
  onClose: () => void
  onError: (e: unknown) => void
}) {
  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [priority, setPriority] = useState(task?.priority ?? DEFAULT_PRIORITY)
  const [dueDate, setDueDate] = useState(task?.dueDate ?? '')
  const [status, setStatus] = useState(columnId)
  const [titleError, setTitleError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const submit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    const invalid = validateTitle(title)
    setTitleError(invalid)
    if (invalid) return
    setSaving(true)
    try {
      const input = {
        columnId: status,
        title: title.trim(),
        description,
        priority,
        dueDate: dueDate || null,
      }
      onSaved(task ? await updateTask(task.id, input) : await createTask(input))
    } catch (err) {
      onError(err)
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!task) return
    setSaving(true)
    try {
      await deleteTask(task.id)
      onDeleted(task.id)
    } catch (err) {
      setConfirming(false)
      onError(err)
      setSaving(false)
    }
  }

  return (
    <>
      <Modal label={task ? 'タスクを編集' : 'タスクを作成'} onClose={onClose} closeOnEscape={!confirming}>
        <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
          <h2 className="text-lg font-semibold">{task ? 'タスクを編集' : 'タスクを作成'}</h2>
          <label className="flex flex-col gap-1 text-xs text-gray-600">
            <span>
              タイトル <span className="text-red-600">必須</span>
            </span>
            <input
              data-autofocus
              className={inputClass}
              value={title}
              aria-invalid={titleError !== null}
              onChange={(e) => setTitle(e.target.value)}
            />
            {titleError && <span className="text-xs text-red-600">{titleError}</span>}
          </label>
          <label className="flex flex-col gap-1 text-xs text-gray-600">
            説明
            <textarea
              className={inputClass}
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <fieldset className="flex items-center gap-3 text-sm">
            <legend className="mb-1 text-xs text-gray-600">優先度</legend>
            {PRIORITIES.map((p) => (
              <label key={p.value} className="flex items-center gap-1">
                <input
                  type="radio"
                  name="priority"
                  checked={priority === p.value}
                  onChange={() => setPriority(p.value)}
                />
                {p.label}
              </label>
            ))}
          </fieldset>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1 text-xs text-gray-600">
              期限
              <input
                type="date"
                className={inputClass}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </label>
            {task && (
              <label className="flex flex-col gap-1 text-xs text-gray-600">
                ステータス
                <select
                  className={inputClass}
                  value={status}
                  onChange={(e) => setStatus(Number(e.target.value))}
                >
                  {columns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
          <div className="flex justify-end gap-2">
            {task && (
              <button
                type="button"
                className="mr-auto rounded border border-red-300 px-3 py-1 text-sm text-red-600 disabled:opacity-40"
                disabled={saving}
                onClick={() => setConfirming(true)}
              >
                削除
              </button>
            )}
            <button type="button" className="rounded border border-gray-300 px-3 py-1 text-sm" onClick={onClose}>
              キャンセル
            </button>
            <button
              type="submit"
              className="rounded bg-blue-600 px-3 py-1 text-sm text-white disabled:opacity-40"
              disabled={saving}
            >
              保存
            </button>
          </div>
        </form>
      </Modal>
      {confirming && task && (
        <ConfirmDeleteDialog
          title={task.title}
          busy={saving}
          onConfirm={remove}
          onCancel={() => setConfirming(false)}
        />
      )}
    </>
  )
}
