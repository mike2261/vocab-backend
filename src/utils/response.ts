export type PaginationMeta = {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export function paginate(total: number, page: number, pageSize: number): PaginationMeta {
  return { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
}

export function parsePagination(query: { page?: unknown; pageSize?: unknown }) {
  const page = Math.max(1, Number(query.page) || 1)
  const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20))
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize }
}
