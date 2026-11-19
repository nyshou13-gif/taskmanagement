import { useCallback, useEffect, useRef, useState } from 'react'
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
import { SearchBar } from './SearchBar'
import { TaskCardView } from './TaskCard'
import { TaskFormModal } from './TaskFormModal'
import { describeError, fetchBoard, groupByColumn, moveTask, searchTasks, sortColumn } from './api'
import {
  EMPTY_SEARCH,
  hasSearch,
  type Column,
  type SearchParams,
  type SortKey,
  type Task,
  type TaskDetail,
} from './types'

const columnIdOf = (id: string | number) =>
  typeof id === 'string' && id.startsWith('column-') ? Number(id.slice(7)) : null

const findColumn = (columns: Column[], id: string | number) =>
  columnIdOf(id) !== null
    ? columns.find((c) => c.id === columnIdOf(id))
    : columns.find((c) => c.tasks.some((t) => t.id === id))

/** 開いているモーダル。作成は「未着手」カラム（先頭）にタスクを追加する。 */
type ModalState = { kind: 'create' } | { kind: 'edit'; taskId: number }

export default function App() {
  const [columns, setColumns] = useState<Column[]>([])
  const [banner, setBanner] = useState<string | null>(null)
  const [dragged, setDragged] = useState<Task | null>(null)
  const [modal, setModal] = useState<ModalState | null>(null)
  const dragOrigin = useRef<{ columnId: number; index: number } | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const [search, setSearch] = useState<SearchParams>(EMPTY_SEARCH)
  const [searchResult, setSearchResult] = useState<{ params: SearchParams; tasks: TaskDetail[] } | null>(null)
  const searching = hasSearch(search)
  // 現在の検索条件に対する結果が届いているか（届くまでは「検索中」）
  const resultReady = searching && searchResult?.params === search
  const loading = searching && !resultReady

  const loadBoard = useCallback(
    (signal?: AbortSignal) =>
      fetchBoard(signal)
        .then(setColumns)
        .catch((e) => {
          if (!signal?.aborted) setBanner(describeError(e))
        }),
    [],
  )

  useEffect(() => {
    const ctrl = new AbortController()
    void loadBoard(ctrl.signal)
    return () => ctrl.abort()
  }, [loadBoard])

  // 検索条件が変わったら300msデバウンスして検索し、古いリクエストは破棄する
  useEffect(() => {
    if (!searching) return
    const ctrl = new AbortController()
    const timer = setTimeout(() => {
      searchTasks(search, ctrl.signal)
        .then((tasks) => setSearchResult({ params: search, tasks }))
        .catch((e) => {
          if (!ctrl.signal.aborted) setBanner(describeError(e))
        })
    }, 300)
    return () => {
      clearTimeout(timer)
      ctrl.abort()
    }
  }, [search, searching])

  const displayed = resultReady && searchResult ? groupByColumn(columns, searchResult.tasks) : columns
  const firstColumnId = columns[0]?.id

  const editing =
    modal?.kind === 'edit'
      ? columns.flatMap((c) => c.tasks.map((task) => ({ task, columnId: c.id }))).find((x) => x.task.id === modal.taskId)
      : undefined

  // 保存・削除の後はサーバー側で position が振り直されるため、ボードを取り直す
  const onSaved = () => {
    setModal(null)
    setSearch((s) => ({ ...s })) // 検索中なら結果も取り直す
    void loadBoard()
  }

  const onDeleted = onSaved

  const onSort = (columnId: number, by: SortKey) => {
    setBanner(null)
    sortColumn(columnId, by)
      .then(() => loadBoard())
      .catch((e) => setBanner(describeError(e)))
  }

  // 操作に失敗したらサーバー上の状態に戻す
  const rollback = (e: unknown) => {
    setBanner(describeError(e))
    void loadBoard()
  }

  const onDragStart = (e: DragStartEvent) => {
    setBanner(null)
    if (searching) return
    const col = findColumn(columns, e.active.id)
    dragOrigin.current = col
      ? { columnId: col.id, index: col.tasks.findIndex((t) => t.id === e.active.id) }
      : null
    setDragged(columns.flatMap((c) => c.tasks).find((t) => t.id === e.active.id) ?? null)
  }

  // ドラッグ中に別カラムへ入ったら、タスクをそのカラムへ移す
  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over || searching) return
    setColumns((prev) => {
      const from = findColumn(prev, active.id)
      const to = findColumn(prev, over.id)
      const task = from?.tasks.find((t) => t.id === active.id)
      if (!from || !to || !task || from.id === to.id) return prev
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

  // ドロップ位置を確定し、列・並び順が変わっていればサーバーへ保存する。不正な位置なら元に戻す
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setDragged(null)
    const origin = dragOrigin.current
    dragOrigin.current = null
    if (searching) return
    if (!over) {
      void loadBoard()
      return
    }
    let next = columns
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
    setColumns(next)
    const dropped = findColumn(next, active.id)
    if (!dropped || !origin) return
    const index = dropped.tasks.findIndex((t) => t.id === active.id)
    if (origin.columnId === dropped.id && origin.index === index) return
    moveTask(Number(active.id), dropped.id, index).catch(rollback)
  }

  const onDragCancel = () => {
    setDragged(null)
    dragOrigin.current = null
    void loadBoard()
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="mb-6 text-2xl font-bold">TaskBoard</h1>
      {banner && (
        <p
          role="alert"
          className="relative z-20 mb-3 flex items-center rounded bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {banner}
          <button type="button" className="ml-auto px-2" aria-label="閉じる" onClick={() => setBanner(null)}>
            ×
          </button>
        </p>
      )}
      <SearchBar value={search} onChange={setSearch} />
      {loading && <p className="mb-3 text-sm text-gray-500">検索中…</p>}
      {resultReady && searchResult?.tasks.length === 0 && (
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
            <ColumnView
              key={c.id}
              column={c}
              disabled={searching}
              canAdd={c.id === firstColumnId}
              onAdd={() => setModal({ kind: 'create' })}
              onSort={(by) => onSort(c.id, by)}
              onOpen={(t) => setModal({ kind: 'edit', taskId: t.id })}
            />
          ))}
        </div>
        <DragOverlay>{dragged && <TaskCardView task={dragged} dragging />}</DragOverlay>
      </DndContext>
      {modal?.kind === 'create' && firstColumnId !== undefined && (
        <TaskFormModal
          columnId={firstColumnId}
          columns={columns}
          onSaved={onSaved}
          onDeleted={onDeleted}
          onClose={() => setModal(null)}
          onError={(e) => setBanner(describeError(e))}
        />
      )}
      {editing && (
        <TaskFormModal
          key={editing.task.id}
          task={editing.task}
          columnId={editing.columnId}
          columns={columns}
          onSaved={onSaved}
          onDeleted={onDeleted}
          onClose={() => setModal(null)}
          onError={(e) => setBanner(describeError(e))}
        />
      )}
    </div>
  )
}
