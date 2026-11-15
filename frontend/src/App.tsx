import { useEffect, useMemo, useRef, useState } from 'react'
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
import { SearchBar } from './SearchBar'
import { TaskDetailModal } from './TaskDetailModal'
import { fetchBoard, groupByColumn, moveTask, searchTasks } from './api'
import { EMPTY_SEARCH, hasSearch, type Column, type Task, type TaskDetail } from './types'

const columnIdOf = (id: string | number) =>
  typeof id === 'string' && id.startsWith('column-') ? Number(id.slice(7)) : null

const findColumn = (columns: Column[], id: string | number) =>
  columnIdOf(id) !== null
    ? columns.find((c) => c.id === columnIdOf(id))
    : columns.find((c) => c.tasks.some((t) => t.id === id))

export default function App() {
  const [columns, setColumns] = useState<Column[]>([])
  const [error, setError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [active, setActive] = useState<Task | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const dragOrigin = useRef<{ columnId: number; index: number } | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const [search, setSearch] = useState(EMPTY_SEARCH)
  const [results, setResults] = useState<TaskDetail[] | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const searching = hasSearch(search)

  useEffect(() => {
    const ctrl = new AbortController()
    fetchBoard(ctrl.signal)
      .then(setColumns)
      .catch((e) => !ctrl.signal.aborted && setError(String(e.message ?? e)))
    return () => ctrl.abort()
  }, [])

  // 検索条件が変わったら300msデバウンスして検索し、古いリクエストは破棄する
  useEffect(() => {
    if (!searching) {
      setResults(null)
      setSearchError(null)
      setLoading(false)
      return
    }
    const ctrl = new AbortController()
    setLoading(true)
    const timer = setTimeout(() => {
      searchTasks(search, ctrl.signal)
        .then((tasks) => {
          setResults(tasks)
          setSearchError(null)
          setLoading(false)
        })
        .catch((e) => {
          if (ctrl.signal.aborted) return
          setSearchError(String(e.message ?? e))
          setLoading(false)
        })
    }, 300)
    return () => {
      clearTimeout(timer)
      ctrl.abort()
    }
  }, [search, searching])

  const displayed = useMemo(
    () => (searching && results ? groupByColumn(columns, results) : columns),
    [searching, results, columns],
  )

  // 登録したタスクを該当カラムの末尾に追加する
  const onCreated = ({ columnId, ...task }: TaskDetail) =>
    setColumns((prev) =>
      prev.map((c) => (c.id === columnId ? { ...c, tasks: [...c.tasks, { ...task }] } : c)),
    )

  // 詳細画面で保存したタスクを反映する。カラムが変わった場合は移動先の末尾へ移す
  const onUpdated = ({ columnId, ...task }: TaskDetail) => {
    setColumns((prev) =>
      prev.map((c) => {
        const without = c.tasks.filter((t) => t.id !== task.id)
        if (c.id !== columnId) return { ...c, tasks: without }
        const old = c.tasks.findIndex((t) => t.id === task.id)
        const tasks = [...without]
        tasks.splice(old >= 0 ? old : tasks.length, 0, task)
        return { ...c, tasks }
      }),
    )
    setResults((prev) => prev && prev.map((t) => (t.id === task.id ? { ...task, columnId } : t)))
    setSelectedId(null)
  }

  const selected = useMemo(() => {
    for (const c of columns) {
      const task = c.tasks.find((t) => t.id === selectedId)
      if (task) return { task, columnId: c.id }
    }
    return null
  }, [columns, selectedId])

  // 保存に失敗したらサーバー上の状態に戻す。戻す処理も失敗したら、再読み込みを案内する
  const reload = (message: string) => {
    setSaveError(message)
    fetchBoard()
      .then(setColumns)
      .catch(() =>
        setSaveError(`${message}画面の内容が最新と異なる可能性があるため、ページを再読み込みしてください。`),
      )
  }

  const onDragStart =(e: DragStartEvent) => {
    setSaveError(null)
    if (searching) return
    const col = findColumn(columns, e.active.id)
    dragOrigin.current = col
      ? { columnId: col.id, index: col.tasks.findIndex((t) => t.id === e.active.id) }
      : null
    setActive(columns.flatMap((c) => c.tasks).find((t) => t.id === e.active.id) ?? null)
  }

  // ドラッグ中に別カラムへ入ったら、タスクをそのカラムへ移す
  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over || searching) return
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

  // ドロップ位置を確定し、列・並び順が変わっていればサーバーへ保存する
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setActive(null)
    const origin = dragOrigin.current
    dragOrigin.current = null
    if (searching) return
    let next = columns
    if (over) {
      const col = findColumn(columns, active.id)
      if (col && col.id === findColumn(columns, over.id)?.id) {
        const oldIndex = col.tasks.findIndex((t) => t.id === active.id)
        const newIndex = col.tasks.findIndex((t) => t.id === over.id)
        if (newIndex >= 0 && oldIndex !== newIndex) {
          next = columns.map((c) =>
            c.id === col.id ? { ...c, tasks: arrayMove(c.tasks, oldIndex, newIndex) } : c,
          )
        }
      }
    }
    setColumns(next)
    const col = findColumn(next, active.id)
    if (!col || !origin) return
    const index = col.tasks.findIndex((t) => t.id === active.id)
    if (origin.columnId === col.id && origin.index === index) return
    moveTask(Number(active.id), col.id, index).catch((e) => {
      reload(`カードの移動を保存できませんでした（${String(e.message ?? e)}）。元の位置に戻しました。`)
    })
  }

  const onDragCancel = () => {
    setActive(null)
    dragOrigin.current = null
    reload('')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="mb-6 text-2xl font-bold">TaskBoard</h1>
      <SearchBar value={search} onChange={setSearch} />
      {error && <p className="text-red-600">ボードの取得に失敗しました: {error}</p>}
      {saveError && (
        <p role="alert" className="mb-3 flex items-center rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {saveError}
          <button type="button" className="ml-auto px-2" aria-label="閉じる" onClick={() => setSaveError(null)}>
            ×
          </button>
        </p>
      )}
      {searchError && <p className="text-red-600">検索に失敗しました: {searchError}</p>}
      {searching && loading && <p className="mb-3 text-sm text-gray-500">検索中…</p>}
      {searching && !loading && !searchError && results?.length === 0 && (
        <p className="mb-3 text-sm text-gray-500">条件に一致するタスクはありません</p>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
      >
        <div className="flex items-start gap-4 overflow-x-auto">
          {displayed.map((c) => (
            <ColumnView key={c.id} column={c} disabled={searching} onCreated={onCreated} onOpen={(t) => setSelectedId(t.id)} />
          ))}
        </div>
        <DragOverlay>{active && <TaskCardView task={active} dragging />}</DragOverlay>
      </DndContext>
      {selected && (
        <TaskDetailModal
          key={selected.task.id}
          task={selected.task}
          columnId={selected.columnId}
          columns={columns}
          onSaved={onUpdated}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  )
}
