import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { PRIORITIES, type Task } from './types'

export function TaskCardView({ task, dragging }: { task: Task; dragging?: boolean }) {
  const p = PRIORITIES.find((x) => x.value === task.priority)
  return (
    <div className={`rounded-md bg-white p-3 shadow-sm ${dragging ? 'rotate-2 shadow-lg' : ''}`}>
      <p className="break-words text-sm font-medium">{task.title}</p>
      <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
        {p && (
          <span className={`rounded px-1.5 py-0.5 ${p.className}`}>優先度: {p.label}</span>
        )}
        <span>期限: {task.dueDate ?? 'なし'}</span>
      </div>
    </div>
  )
}

export function SortableTaskCard({
  task,
  disabled,
  onOpen,
}: {
  task: Task
  disabled?: boolean
  onOpen: (task: Task) => void
}) {
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
      role="button"
      tabIndex={0}
      onClick={() => onOpen(task)}
      onKeyDown={(e) => e.key === 'Enter' && onOpen(task)}
    >
      <TaskCardView task={task} />
    </div>
  )
}
