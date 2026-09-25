import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { apiFetch, ApiError } from '@/shared/api/client'
import { Button } from '@/shared/ui/Button'
import { Card, CardFoot } from '@/shared/ui/Card'
import { FormErrors } from '@/shared/ui/Notice'
import { Pager, type PaginationMeta } from '@/shared/ui/Pager'
import { PageHeader } from '@/shared/ui/PageHeader'
import { EmptyRow, Table, Tbody, Td, Tr } from '@/shared/ui/Table'

import type { NotificationItem, NotificationsResponse } from './types'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('sr-RS', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function NotificationsPage() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<NotificationItem[] | null>(null)
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [page, setPage] = useState(1)
  const [error, setError] = useState<ApiError | null>(null)
  const [markingAll, setMarkingAll] = useState(false)

  useEffect(() => {
    async function load() {
      setError(null)
      try {
        const result = await apiFetch<NotificationsResponse>(`/api/v1/notifications?page=${page}`)
        setNotifications(result.data)
        setMeta(result.meta)
        setUnreadCount(result.unread_count)
      } catch (err) {
        setError(err instanceof ApiError ? err : new ApiError(500, 'Greška pri učitavanju.'))
      }
    }
    void load()
  }, [page])

  async function handleOpen(notification: NotificationItem) {
    if (!notification.read_at) {
      try {
        await apiFetch(`/api/v1/notifications/${notification.id}/read`, { method: 'POST' })
        setNotifications(
          (current) =>
            current?.map((item) =>
              item.id === notification.id ? { ...item, read_at: new Date().toISOString() } : item,
            ) ?? null,
        )
        setUnreadCount((current) => Math.max(0, current - 1))
      } catch {
        // Navigation still proceeds even if marking as read failed.
      }
    }
    if (notification.url) {
      navigate(notification.url)
    }
  }

  async function handleMarkAllRead() {
    setMarkingAll(true)
    try {
      await apiFetch('/api/v1/notifications/read-all', { method: 'POST' })
      setNotifications(
        (current) =>
          current?.map((item) => ({
            ...item,
            read_at: item.read_at ?? new Date().toISOString(),
          })) ?? null,
      )
      setUnreadCount(0)
    } catch {
      // Leave the list as-is; the user can retry.
    } finally {
      setMarkingAll(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <PageHeader
        eyebrow="Obaveštenja"
        title="Notifikacije"
        subtitle={unreadCount > 0 ? `${unreadCount} nepročitano(ih)` : 'Sve je pročitano.'}
        action={
          unreadCount > 0 && (
            <Button
              variant="secondary"
              disabled={markingAll}
              onClick={() => void handleMarkAllRead()}
            >
              Označi sve kao pročitano
            </Button>
          )
        }
      />

      {error && (
        <div className="mb-4">
          <FormErrors error={error} />
        </div>
      )}

      <Card>
        <Table>
          <Tbody>
            {notifications === null && <EmptyRow colSpan={1}>Učitavanje...</EmptyRow>}
            {notifications?.map((notification) => (
              <Tr key={notification.id} className={notification.url ? 'cursor-pointer' : undefined}>
                <Td>
                  <button
                    type="button"
                    onClick={() => void handleOpen(notification)}
                    className="flex w-full items-start gap-2.5 text-left"
                  >
                    <span
                      className={
                        notification.read_at
                          ? 'mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-transparent'
                          : 'mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent'
                      }
                    />
                    <span className="flex-1">
                      <span
                        className={
                          notification.read_at
                            ? 'block text-ink-muted'
                            : 'block font-medium text-ink'
                        }
                      >
                        {notification.message}
                      </span>
                      <span className="mt-0.5 block text-[12px] text-ink-faint">
                        {formatDate(notification.created_at)}
                      </span>
                    </span>
                  </button>
                </Td>
              </Tr>
            ))}
            {notifications?.length === 0 && <EmptyRow colSpan={1}>Nemate obaveštenja.</EmptyRow>}
          </Tbody>
        </Table>
        {meta && meta.last_page > 1 && (
          <CardFoot>
            <Pager
              meta={meta}
              onPrev={() => setPage((p) => p - 1)}
              onNext={() => setPage((p) => p + 1)}
            />
          </CardFoot>
        )}
      </Card>
    </div>
  )
}
