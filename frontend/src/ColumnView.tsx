import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { SortableTaskCard } from './TaskCard'
import type { Column } from './types'

export function ColumnView({ column }: { column: Column }) {
  const { setNodeRef } = useDroppable({ id: `column-${column.id}` })
  return (
    <section className="flex w-80 shrink-0 flex-col rounded-lg bg-gray-100 p-3">
      <h2 className="mb-3 text-sm font-semibold text-gray-700">
        {column.title}
        <span className="ml-2 text-gray-400">{column.tasks.length}</span>
      </h2>
      <SortableContext items={column.tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="flex min-h-16 flex-col gap-2">
          {column.tasks.map((t) => (
            <SortableTaskCard key={t.id} task={t} />
          ))}
        </div>
      </SortableContext>
    </section>
  )
}
