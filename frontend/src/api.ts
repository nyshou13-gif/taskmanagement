import type { Column, NewTask, SearchParams, TaskDetail } from './types'

const getJson = async <T>(url: string, signal?: AbortSignal): Promise<T> => {
  const r = await fetch(url, { signal })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.json()
}

export const fetchBoard = (signal?: AbortSignal) => getJson<Column[]>('/api/board', signal)

export const searchTasks = (params: SearchParams, signal?: AbortSignal) => {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value.trim() !== '') query.set(key, value.trim())
  }
  return getJson<TaskDetail[]>(`/api/tasks?${query}`, signal)
}

// 検索結果を columnId で各列へ振り分ける（空の列も残す）
export const groupByColumn = (columns: Column[], tasks: TaskDetail[]): Column[] =>
  columns.map((c) => ({
    ...c,
    tasks: tasks.filter((t) => t.columnId === c.id).sort((a, b) => a.position - b.position),
  }))

export const createTask = async (task: NewTask): Promise<TaskDetail> => {
  const r = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.json()
}

const sendJson = async <T>(url: string, body: unknown): Promise<T> => {
  const r = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.json()
}

// 詳細画面からの更新（columnId を変えるとステータス変更になる）
export const updateTask = (id: number, task: NewTask) => sendJson<TaskDetail>(`/api/tasks/${id}`, task)

// DnD後の列・並び順（position は列内の0始まり）を保存する
export const moveTask = (id: number, columnId: number, position: number) =>
  sendJson<TaskDetail>(`/api/tasks/${id}/move`, { columnId, position })
