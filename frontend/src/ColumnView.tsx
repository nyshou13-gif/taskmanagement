import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useState } from 'react'
import { NewTaskForm } from './NewTaskForm'
import { SortableTaskCard } from './TaskCard'
import type { Column, TaskDetail } from './types'

export function ColumnView({
  column,
  disabled,
  onCreated,
}: {
  column: Column
  disabled?: boolean
  onCreated: (task: TaskDetail) => void
}) {
  const { setNodeRef } = useDroppable({ id: `column-${column.id}`, disabled })
  const [adding, setAdding] = useState(false)
  return (
    <section className="flex w-80 shrink-0 flex-col rounded-lg bg-gray-100 p-3">
      <h2 className="mb-3 flex items-center text-sm font-semibold text-gray-700">
        {column.title}
        <span className="ml-2 text-gray-400">{column.tasks.length}</span>
        <button
          type="button"
          aria-label={`${column.title}にタスクを追加`}
          className="ml-auto rounded px-2 text-lg leading-none text-gray-600 hover:bg-gray-200 disabled:opacity-40"
          disabled={disabled}
          onClick={() => setAdding(true)}
        >
          ＋
        </button>
      </h2>
      {adding && (
        <NewTaskForm
          columnId={column.id}
          onCancel={() => setAdding(false)}
          onCreated={(t) => {
            onCreated(t)
            setAdding(false)
          }}
        />
      )}
      <SortableContext items={column.tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="flex min-h-16 flex-col gap-2">
          {column.tasks.map((t) => (
            <SortableTaskCard key={t.id} task={t} disabled={disabled} />
          ))}
        </div>
      </SortableContext>
    </section>
  )
}
