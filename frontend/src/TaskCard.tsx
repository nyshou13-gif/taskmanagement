import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Task } from './types'

const PRIORITY: Record<number, { label: string; className: string }> = {
  1: { label: '高', className: 'bg-red-100 text-red-700' },
  2: { label: '中', className: 'bg-yellow-100 text-yellow-700' },
  3: { label: '低', className: 'bg-green-100 text-green-700' },
}

export function TaskCardView({ task, dragging }: { task: Task; dragging?: boolean }) {
  const p = PRIORITY[task.priority]
  return (
    <div className={`rounded-md bg-white p-3 shadow-sm ${dragging ? 'rotate-2 shadow-lg' : ''}`}>
      <p className="break-words text-sm font-medium">{task.title}</p>
      <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
        {p && <span className={`rounded px-1.5 py-0.5 ${p.className}`}>{p.label}</span>}
        <span>{task.dueDate ?? '期限なし'}</span>
      </div>
    </div>
  )
}

export function SortableTaskCard({ task, disabled }: { task: Task; disabled?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled,
  })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`${disabled ? '' : 'cursor-grab touch-none'} ${isDragging ? 'opacity-40' : ''}`}
      {...attributes}
      {...listeners}
    >
      <TaskCardView task={task} />
    </div>
  )
}
