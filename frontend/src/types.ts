export type Task = {
  id: number
  title: string
  description: string | null
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
