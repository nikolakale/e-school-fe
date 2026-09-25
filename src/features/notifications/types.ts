import type { PaginationMeta } from '@/shared/ui/Pager'

export interface NotificationItem {
  id: string
  message: string
  url: string | null
  read_at: string | null
  created_at: string
}

export interface NotificationsResponse {
  data: NotificationItem[]
  meta: PaginationMeta
  unread_count: number
}
