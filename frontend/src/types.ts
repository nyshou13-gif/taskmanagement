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
