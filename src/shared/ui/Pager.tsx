export interface PaginationMeta {
  current_page: number
  last_page: number
  total: number
}

/** Prev/next pager + count, styled after the mockup's `.card-foot` + `.pager`. */
export function Pager({
  meta,
  onPrev,
  onNext,
  label = 'ukupno',
}: {
  meta: PaginationMeta
  onPrev: () => void
  onNext: () => void
  label?: string
}) {
  return (
    <>
      <span>
        Strana {meta.current_page} od {meta.last_page} &middot; {label} {meta.total}
      </span>
      <div className="flex gap-1.5">
        <button
          type="button"
          disabled={meta.current_page <= 1}
          onClick={onPrev}
          className="rounded-md border border-border bg-surface px-2.5 py-1 text-[12.5px] font-medium text-ink-muted disabled:cursor-default disabled:opacity-45"
        >
          Prethodna
        </button>
        <button
          type="button"
          disabled={meta.current_page >= meta.last_page}
          onClick={onNext}
          className="rounded-md border border-border bg-surface px-2.5 py-1 text-[12.5px] font-medium text-ink-muted disabled:cursor-default disabled:opacity-45"
        >
          Sledeća
        </button>
      </div>
    </>
  )
}
