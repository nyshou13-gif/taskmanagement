import type { Column, NewTask, SearchParams, SortKey, TaskDetail, TaskPatch } from './types'

/** サーバーが 4xx / 5xx を返したときのエラー。 */
export class ApiError extends Error {
  readonly status: number

  constructor(status: number) {
    super(`HTTP ${status}`)
    this.status = status
  }
}

/** 画面上部のエラーバナーに表示する文言（画面設計書 5章）。 */
export const describeError = (e: unknown): string =>
  e instanceof ApiError
    ? 'データの保存に失敗しました'
    : 'サーバーとの通信に失敗しました。しばらくしてから再度お試しください'

const request = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const r = await fetch(url, init)
  if (!r.ok) throw new ApiError(r.status)
  return r.status === 204 ? (undefined as T) : ((await r.json()) as T)
}

const sendJson = <T>(method: string, url: string, body?: unknown) =>
  request<T>(url, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

export const fetchBoard = (signal?: AbortSignal) => request<Column[]>('/api/board', { signal })

export const searchTasks = (params: SearchParams, signal?: AbortSignal) => {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value.trim() !== '') query.set(key, value.trim())
  }
  return request<TaskDetail[]>(`/api/tasks?${query}`, { signal })
}

// 検索結果を columnId で各列へ振り分ける（空の列も残す）
export const groupByColumn = (columns: Column[], tasks: TaskDetail[]): Column[] =>
  columns.map((c) => ({
    ...c,
    tasks: tasks.filter((t) => t.columnId === c.id).sort((a, b) => a.position - b.position),
  }))

export const createTask = (task: NewTask) => sendJson<TaskDetail>('POST', '/api/tasks', task)

// 項目の更新・カラム移動・並び替え（position は移動先カラム内の0始まり）を同じ PATCH で行う
export const updateTask = (id: number, patch: TaskPatch) =>
  sendJson<TaskDetail>('PATCH', `/api/tasks/${id}`, patch)

export const moveTask = (id: number, columnId: number, position: number) =>
  updateTask(id, { columnId, position })

// タスクを削除する（サーバー側は物理削除）
export const deleteTask = (id: number) => sendJson<void>('DELETE', `/api/tasks/${id}`)

// カラム内のタスクを1回だけ並べ直して保存する
export const sortColumn = (columnId: number, by: SortKey) =>
  sendJson<TaskDetail[]>('POST', `/api/columns/${columnId}/sort?by=${by}`)
