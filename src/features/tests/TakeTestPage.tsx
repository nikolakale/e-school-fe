import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { SCHEDULED_TEST_TYPE_LABELS } from '@/features/calendar/types'
import { apiFetch, ApiError } from '@/shared/api/client'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { cn } from '@/shared/ui/cn'
import { IconClock } from '@/shared/ui/icons'
import { FormErrors, Notice } from '@/shared/ui/Notice'
import { PageHeader } from '@/shared/ui/PageHeader'

import { formatCountdown, secondsUntil } from './countdown'
import type { ExamAttempt } from './types'

/**
 * Polaganje testa. Starting an attempt is idempotent server-side (a second
 * visit resumes the same attempt instead of drawing a new question pool), so
 * this page always POSTs /attempts on mount and just renders whatever comes
 * back - in progress, already submitted, or not-yet-available.
 */
export function TakeTestPage() {
  const { scheduledTestId } = useParams<{ scheduledTestId: string }>()

  const [attempt, setAttempt] = useState<ExamAttempt | null>(null)
  const [loading, setLoading] = useState(true)
  const [startError, setStartError] = useState<ApiError | null>(null)
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [submitError, setSubmitError] = useState<ApiError | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function start() {
      setLoading(true)
      setStartError(null)
      try {
        const result = await apiFetch<{ data: ExamAttempt }>(
          `/api/v1/scheduled-tests/${scheduledTestId}/attempts`,
          { method: 'POST' },
        )
        setAttempt(result.data)
      } catch (err) {
        if (err instanceof ApiError) {
          setStartError(err)
        } else {
          throw err
        }
      } finally {
        setLoading(false)
      }
    }
    void start()
  }, [scheduledTestId])

  // Ticks the countdown once a second and auto-submits the moment it hits
  // zero - there's no background job for this, expiry is enforced by
  // whoever touches the attempt next, and here that's the student's own tab.
  useEffect(() => {
    if (!attempt || attempt.is_submitted) return
    const currentAttempt = attempt

    function tick() {
      const remaining = secondsUntil(currentAttempt.deadline)
      setRemainingSeconds(remaining)
      if (remaining <= 0) {
        clearInterval(interval)
        apiFetch<{ data: ExamAttempt }>(`/api/v1/attempts/${currentAttempt.id}/submit`, { method: 'POST' })
          .then((result) => setAttempt(result.data))
          .catch(() => {
            // Best-effort - the BE also lazily locks the attempt on the next
            // read/write, so a failed auto-submit here is caught later too.
          })
      }
    }

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [attempt])

  async function handleAnswer(questionId: number, optionId: number) {
    if (!attempt || attempt.is_submitted) return

    setAttempt((current) => {
      if (!current) return current
      return {
        ...current,
        answers: [
          ...current.answers.filter((answer) => answer.question_id !== questionId),
          { question_id: questionId, question_option_id: optionId },
        ],
      }
    })

    try {
      const result = await apiFetch<{ data: ExamAttempt }>(
        `/api/v1/attempts/${attempt.id}/answers`,
        {
          method: 'PUT',
          body: { question_id: questionId, question_option_id: optionId },
        },
      )
      setAttempt(result.data)
    } catch {
      // The optimistic local answer stays selected; it's retried the next
      // time the student changes an answer, or reconciled on page reload.
    }
  }

  async function handleSubmit() {
    if (!attempt || attempt.is_submitted) return
    if (!window.confirm('Da li želiš da predaš test? Ovo se ne može poništiti.')) return

    setSubmitError(null)
    setSubmitting(true)
    try {
      const result = await apiFetch<{ data: ExamAttempt }>(
        `/api/v1/attempts/${attempt.id}/submit`,
        {
          method: 'POST',
        },
      )
      setAttempt(result.data)
    } catch (err) {
      if (err instanceof ApiError) {
        setSubmitError(err)
      } else {
        throw err
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <p className="text-ink-muted">Učitavanje...</p>
  }

  if (startError || !attempt) {
    return (
      <div className="max-w-xl">
        <FormErrors error={startError ?? new ApiError(500, 'Test nije moguće učitati.')} />
        <Link
          to="/scheduled-tests"
          className="mt-4 inline-block text-[13.5px] font-semibold text-accent"
        >
          Nazad na zakazane testove
        </Link>
      </div>
    )
  }

  const answersByQuestion = new Map(
    attempt.answers.map((answer) => [answer.question_id, answer.question_option_id]),
  )
  const answeredCount = attempt.answers.length
  const totalQuestions = attempt.questions.length
  const urgent = remainingSeconds > 0 && remainingSeconds < 60

  return (
    <div className="max-w-2xl">
      <PageHeader
        eyebrow={SCHEDULED_TEST_TYPE_LABELS[attempt.scheduled_test.type]}
        title={attempt.scheduled_test.subject.name}
        subtitle={
          attempt.is_submitted
            ? `Predato ${new Date(attempt.submitted_at ?? attempt.deadline).toLocaleString('sr-RS')}`
            : `Odgovoreno ${answeredCount}/${totalQuestions} pitanja`
        }
        action={
          !attempt.is_submitted && (
            <div
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13.5px] font-semibold',
                urgent ? 'bg-danger-soft text-danger' : 'bg-surface-2 text-ink-muted',
              )}
            >
              <IconClock className="h-4 w-4" />
              {formatCountdown(remainingSeconds)}
            </div>
          )
        }
      />

      {attempt.is_submitted && (
        <div className="mb-4">
          <Notice variant="success">Test je predat. Ocena će biti dostupna nakon pregleda.</Notice>
        </div>
      )}

      {submitError && (
        <div className="mb-4">
          <FormErrors error={submitError} />
        </div>
      )}

      <div className="flex flex-col gap-3.5">
        {attempt.questions.map((question, index) => {
          const selectedOptionId = answersByQuestion.get(question.id)

          return (
            <Card key={question.id} className="p-4">
              <p className="mb-3 text-[13.5px] font-semibold text-ink">
                {index + 1}. {question.text}
              </p>
              <div className="flex flex-col gap-2">
                {question.options.map((option) => {
                  const selected = selectedOptionId === option.id
                  return (
                    <label
                      key={option.id}
                      className={cn(
                        'flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-[13.5px]',
                        selected
                          ? 'border-accent bg-accent-soft text-accent'
                          : 'border-border text-ink',
                        attempt.is_submitted && 'cursor-default',
                      )}
                    >
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        checked={selected}
                        disabled={attempt.is_submitted}
                        onChange={() => void handleAnswer(question.id, option.id)}
                        className="h-3.5 w-3.5 accent-[var(--color-accent)]"
                      />
                      {option.text}
                    </label>
                  )
                })}
              </div>
            </Card>
          )
        })}
      </div>

      {!attempt.is_submitted && (
        <div className="mt-5 flex items-center gap-3">
          <Button onClick={() => void handleSubmit()} disabled={submitting}>
            {submitting ? 'Predaja...' : 'Predaj test'}
          </Button>
          <Link
            to="/scheduled-tests"
            className="text-[12.5px] font-semibold text-ink-muted hover:text-ink"
          >
            Nastavi kasnije
          </Link>
        </div>
      )}

      {attempt.is_submitted && (
        <Link
          to="/scheduled-tests"
          className="mt-5 inline-block text-[13.5px] font-semibold text-accent"
        >
          Nazad na zakazane testove
        </Link>
      )}
    </div>
  )
}
