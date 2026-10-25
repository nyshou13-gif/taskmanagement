import type { Column, SearchParams, TaskDetail } from './types'

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
