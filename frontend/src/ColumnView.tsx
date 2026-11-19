import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { SortableTaskCard } from './TaskCard'
import type { Column, SortKey, Task } from './types'

const sortButtonClass = 'rounded border border-gray-300 bg-white px-2 py-0.5 text-xs disabled:opacity-40'

export function ColumnView({
  column,
  disabled,
  canAdd,
  onAdd,
  onSort,
  onOpen,
}: {
  column: Column
  disabled?: boolean
  /** 「＋タスク追加」を表示するか（「未着手」カラムのみ） */
  canAdd: boolean
  onAdd: () => void
  onSort: (by: SortKey) => void
  onOpen: (task: Task) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `column-${column.id}`, disabled })
  return (
    <section
      aria-label={column.title}
      className={`flex w-80 shrink-0 flex-col rounded-lg bg-gray-100 p-3 ${
        isOver ? 'outline-2 outline-dashed outline-blue-400' : ''
      }`}
    >
      <h2 className="mb-2 text-sm font-semibold text-gray-700">
        {column.title} ({column.tasks.length})
      </h2>
      <div className="mb-3 flex items-center gap-1 text-xs text-gray-600">
        並び替え
        <button type="button" className={sortButtonClass} disabled={disabled} onClick={() => onSort('priority')}>
          優先度順
        </button>
        <button type="button" className={sortButtonClass} disabled={disabled} onClick={() => onSort('due_date')}>
          期限順
        </button>
      </div>
      <SortableContext items={column.tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="flex min-h-16 flex-col gap-2">
          {column.tasks.map((t) => (
            <SortableTaskCard key={t.id} task={t} disabled={disabled} onOpen={onOpen} />
          ))}
        </div>
      </SortableContext>
      {canAdd && (
        <button
          type="button"
          className="mt-3 rounded px-2 py-1 text-left text-sm text-gray-600 hover:bg-gray-200 disabled:opacity-40"
          disabled={disabled}
          onClick={onAdd}
        >
          ＋タスク追加
        </button>
      )}
    </section>
  )
}
