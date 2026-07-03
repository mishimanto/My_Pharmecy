import { useEffect, useMemo, useState } from 'react'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'

function buildPageItems(currentPage, lastPage) {
  if (lastPage <= 7) {
    return Array.from({ length: lastPage }, (_, index) => index + 1)
  }

  const items = [1]
  const windowStart = Math.max(2, currentPage - 1)
  const windowEnd = Math.min(lastPage - 1, currentPage + 1)

  if (windowStart > 2) {
    items.push('ellipsis-left')
  }

  for (let page = windowStart; page <= windowEnd; page += 1) {
    items.push(page)
  }

  if (windowEnd < lastPage - 1) {
    items.push('ellipsis-right')
  }

  items.push(lastPage)

  return items
}

export default function AdminPagination({
  currentPage = 1,
  lastPage = 1,
  onPageChange,
  className = '',
}) {
  const safeCurrentPage = Math.max(1, Number(currentPage || 1))
  const safeLastPage = Math.max(1, Number(lastPage || 1))
  const [pageInput, setPageInput] = useState(String(safeCurrentPage))

  if (safeLastPage <= 1) {
    return null
  }

  const previousDisabled = safeCurrentPage <= 1
  const nextDisabled = safeCurrentPage >= safeLastPage

  const jumpTo = (page) => {
    if (!onPageChange) return

    const nextPage = Math.min(safeLastPage, Math.max(1, Number(page || 1)))
    if (nextPage === safeCurrentPage) return
    onPageChange(nextPage)
  }

  useEffect(() => {
    setPageInput(String(safeCurrentPage))
  }, [safeCurrentPage])

  const pageItems = useMemo(
    () => buildPageItems(safeCurrentPage, safeLastPage),
    [safeCurrentPage, safeLastPage],
  )

  const submitPageInput = () => {
    const parsedPage = Number.parseInt(pageInput, 10)
    if (Number.isNaN(parsedPage)) {
      setPageInput(String(safeCurrentPage))
      return
    }

    jumpTo(parsedPage)
  }

  return (
    <div className={`mt-4 flex flex-col gap-3 border border-slate-200 bg-white px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between ${className}`.trim()}>
      <div className="flex flex-wrap items-center gap-2 text-slate-600">
        <span className="font-medium">Page</span>
        <input
          inputMode="numeric"
          value={pageInput}
          onChange={(event) => setPageInput(event.target.value.replace(/[^\d]/g, ''))}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              submitPageInput()
            }
          }}
          onBlur={submitPageInput}
          className="h-10 w-18 border border-slate-300 px-3 text-center font-semibold text-slate-900 outline-none transition focus:border-emerald-400"
          aria-label="Go to page"
        />
        <span className="text-slate-400">of</span>
        <span className="inline-flex min-w-[56px] items-center justify-center border border-emerald-100 bg-emerald-50 px-3 py-1.5 font-semibold text-emerald-700">
          {safeLastPage}
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          disabled={previousDisabled}
          onClick={() => jumpTo(safeCurrentPage - 1)}
          className="inline-flex h-10 items-center justify-center gap-2 border border-slate-300 px-4 font-medium text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400"
        >
          <FiChevronLeft className="h-4 w-4" />
          <span>Previous</span>
        </button>

        <div className="flex items-center gap-1">
          {pageItems.map((item) => {
            if (typeof item !== 'number') {
              return (
                <span key={item} className="inline-flex h-10 min-w-10 items-center justify-center px-1 text-slate-400">
                  ...
                </span>
              )
            }

            const active = item === safeCurrentPage

            return (
              <button
                key={item}
                type="button"
                onClick={() => jumpTo(item)}
                className={`inline-flex h-10 min-w-10 items-center justify-center border px-3 font-medium transition ${
                  active
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700'
                }`}
              >
                {item}
              </button>
            )
          })}
        </div>

        <button
          type="button"
          disabled={nextDisabled}
          onClick={() => jumpTo(safeCurrentPage + 1)}
          className="inline-flex h-10 items-center justify-center gap-2 border border-slate-900 bg-slate-900 px-4 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
        >
          <span>Next</span>
          <FiChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
