import { useState } from 'react'
import { createTask } from './api'
import type { TaskDetail } from './types'

const inputClass = 'rounded border border-gray-300 bg-white px-2 py-1 text-sm'

export function NewTaskForm({
  columnId,
  onCreated,
  onCancel,
}: {
  columnId: number
  onCreated: (task: TaskDetail) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('2')
  const [dueDate, setDueDate] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (title.trim() === '') {
      setError('タイトルを入力してください')
      return
    }
    setSaving(true)
    try {
      const created = await createTask({
        columnId,
        title: title.trim(),
        description,
        priority: Number(priority),
        dueDate: dueDate || null,
      })
      onCreated(created)
    } catch (err) {
      setError(`登録に失敗しました: ${err instanceof Error ? err.message : String(err)}`)
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="mb-3 flex flex-col gap-2 rounded-md bg-white p-3 shadow-sm">
      <input
        className={inputClass}
        placeholder="タイトル（必須）"
        maxLength={100}
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        className={inputClass}
        placeholder="説明"
        rows={2}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <div className="flex gap-2">
        <label className="flex flex-col text-xs text-gray-600">
          優先度
          <select className={inputClass} value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="1">高</option>
            <option value="2">中</option>
            <option value="3">低</option>
          </select>
        </label>
        <label className="flex flex-col text-xs text-gray-600">
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
        <button type="button" className={inputClass} onClick={onCancel}>
          キャンセル
        </button>
        <button
          type="submit"
          className="rounded bg-blue-600 px-3 py-1 text-sm text-white disabled:opacity-40"
          disabled={saving}
        >
          登録
        </button>
      </div>
    </form>
  )
}
