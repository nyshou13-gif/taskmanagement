import { useEffect, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { ColumnView } from './ColumnView'
import { TaskCardView } from './TaskCard'
import type { Column, Task } from './types'

const columnIdOf = (id: string | number) =>
  typeof id === 'string' && id.startsWith('column-') ? Number(id.slice(7)) : null

const findColumn = (columns: Column[], id: string | number) =>
  columnIdOf(id) !== null
    ? columns.find((c) => c.id === columnIdOf(id))
    : columns.find((c) => c.tasks.some((t) => t.id === id))

export default function App() {
  const [columns, setColumns] = useState<Column[]>([])
  const [error, setError] = useState<string | null>(null)
  const [active, setActive] = useState<Task | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  useEffect(() => {
    fetch('/api/board')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(setColumns)
      .catch((e) => setError(String(e.message ?? e)))
  }, [])

  const onDragStart = (e: DragStartEvent) => {
    setActive(columns.flatMap((c) => c.tasks).find((t) => t.id === e.active.id) ?? null)
  }

  // ドラッグ中に別カラムへ入ったら、タスクをそのカラムへ移す
  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return
    setColumns((prev) => {
      const from = findColumn(prev, active.id)
      const to = findColumn(prev, over.id)
      if (!from || !to || from.id === to.id) return prev
      const task = from.tasks.find((t) => t.id === active.id)!
      const overIndex = to.tasks.findIndex((t) => t.id === over.id)
      const index = overIndex >= 0 ? overIndex : to.tasks.length
      return prev.map((c) => {
        if (c.id === from.id) return { ...c, tasks: c.tasks.filter((t) => t.id !== task.id) }
        if (c.id === to.id) {
          const tasks = [...c.tasks]
          tasks.splice(index, 0, task)
          return { ...c, tasks }
        }
        return c
      })
    })
  }

  // 同一カラム内の並び替えを確定する
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setActive(null)
    if (!over) return
    setColumns((prev) => {
      const col = findColumn(prev, active.id)
      if (!col || col.id !== findColumn(prev, over.id)?.id) return prev
      const oldIndex = col.tasks.findIndex((t) => t.id === active.id)
      const newIndex = col.tasks.findIndex((t) => t.id === over.id)
      if (newIndex < 0 || oldIndex === newIndex) return prev
      return prev.map((c) =>
        c.id === col.id ? { ...c, tasks: arrayMove(c.tasks, oldIndex, newIndex) } : c,
      )
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="mb-6 text-2xl font-bold">TaskBoard</h1>
      {error && <p className="text-red-600">ボードの取得に失敗しました: {error}</p>}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={() => setActive(null)}
      >
        <div className="flex items-start gap-4 overflow-x-auto">
          {columns.map((c) => (
            <ColumnView key={c.id} column={c} />
          ))}
        </div>
        <DragOverlay>{active && <TaskCardView task={active} dragging />}</DragOverlay>
      </DndContext>
    </div>
  )
}
