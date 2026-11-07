import { EMPTY_SEARCH, hasSearch, type SearchParams } from './types'

const inputClass = 'rounded border border-gray-300 bg-white px-2 py-1 text-sm'

export function SearchBar({
  value,
  onChange,
}: {
  value: SearchParams
  onChange: (value: SearchParams) => void
}) {
  const set = (patch: Partial<SearchParams>) => onChange({ ...value, ...patch })
  return (
    <form
      role="search"
      className="mb-6 flex flex-wrap items-end gap-3"
      onSubmit={(e) => e.preventDefault()}
    >
      <label className="flex flex-col text-xs text-gray-600">
        キーワード
        <input
          type="search"
          className={`${inputClass} w-64`}
          placeholder="タイトル・説明"
          value={value.q}
          onChange={(e) => set({ q: e.target.value })}
        />
      </label>
      <label className="flex flex-col text-xs text-gray-600">
        優先度
        <select
          className={inputClass}
          value={value.priority}
          onChange={(e) => set({ priority: e.target.value })}
        >
          <option value="">すべて</option>
          <option value="1">高</option>
          <option value="2">中</option>
          <option value="3">低</option>
        </select>
      </label>
      <label className="flex flex-col text-xs text-gray-600">
        期限（この日まで）
        <input
          type="date"
          className={inputClass}
          value={value.dueBefore}
          onChange={(e) => set({ dueBefore: e.target.value })}
        />
      </label>
      <button
        type="button"
        className="rounded border border-gray-300 bg-white px-3 py-1 text-sm disabled:opacity-40"
        disabled={!hasSearch(value)}
        onClick={() => onChange(EMPTY_SEARCH)}
      >
        クリア
      </button>
    </form>
  )
}
