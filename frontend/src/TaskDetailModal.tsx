import { useEffect, useState } from 'react'
import { updateTask } from './api'
import type { Column, Task, TaskDetail } from './types'

const inputClass = 'w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm'

export function TaskDetailModal({
  task,
  columnId,
  columns,
  onSaved,
  onClose,
}: {
  task: Task
  columnId: number
  columns: Column[]
  onSaved: (task: TaskDetail) => void
  onClose: () => void
}) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description ?? '')
  const [priority, setPriority] = useState(String(task.priority))
  const [dueDate, setDueDate] = useState(task.dueDate ?? '')
  const [status, setStatus] = useState(String(columnId))
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (title.trim() === '') {
      setError('タイトルを入力してください')
      return
    }
    setSaving(true)
    try {
      const saved = await updateTask(task.id, {
        columnId: Number(status),
        title: title.trim(),
        description,
        priority: Number(priority),
        dueDate: dueDate || null,
      })
      onSaved(saved)
    } catch (err) {
      setError(`更新に失敗しました: ${err instanceof Error ? err.message : String(err)}`)
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-label="タスク詳細"
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-md flex-col gap-3 rounded-lg bg-white p-5 shadow-xl"
      >
        <h2 className="text-lg font-semibold">タスク詳細</h2>
        <label className="flex flex-col gap-1 text-xs text-gray-600">
          タイトル
          <input
            className={inputClass}
            maxLength={100}
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
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
        <div className="grid grid-cols-3 gap-2">
          <label className="flex flex-col gap-1 text-xs text-gray-600">
            ステータス
            <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}>
              {columns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-gray-600">
            優先度
            <select className={inputClass} value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="1">高</option>
              <option value="2">中</option>
              <option value="3">低</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-gray-600">
            期限
            <input
              type="date"
              className={inputClass}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </label>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
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
    </div>
  )
}
