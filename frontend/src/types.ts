export type Task = {
  id: number
  title: string
  description: string
  /** 1:低 / 2:中 / 3:高 */
  priority: number
  dueDate: string | null
  position: number
}

export type Column = {
  id: number
  title: string
  position: number
  tasks: Task[]
}

export type TaskDetail = Task & { columnId: number }

export type SearchParams = {
  q: string
  priority: string
  dueBefore: string
}

export const EMPTY_SEARCH: SearchParams = { q: '', priority: '', dueBefore: '' }

export const hasSearch = (p: SearchParams) => Object.values(p).some((v) => v.trim() !== '')

/** 優先度の値と表示。選択肢は 高 → 中 → 低 の順に並べる。 */
export const PRIORITIES = [
  { value: 3, label: '高', className: 'bg-red-100 text-red-700' },
  { value: 2, label: '中', className: 'bg-yellow-100 text-yellow-700' },
  { value: 1, label: '低', className: 'bg-green-100 text-green-700' },
] as const

export const DEFAULT_PRIORITY = 2

export type NewTask = {
  columnId: number
  title: string
  description: string
  priority: number
  dueDate: string | null
}

/** PATCH /api/tasks/:id。指定した項目だけが更新される（dueDate: null は期限のクリア）。 */
export type TaskPatch = Partial<NewTask> & { position?: number }

export type SortKey = 'priority' | 'due_date'

export const TITLE_MAX_LENGTH = 100
