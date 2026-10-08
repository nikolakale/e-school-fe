import { useEffect, useRef, useState } from 'react'

import { fieldControlClass } from './Form'

type DateInputProps = {
  id: string
  /** ISO value: `YYYY-MM-DD`, or `YYYY-MM-DDTHH:mm` when `withTime`. Empty while incomplete/invalid. */
  value: string
  onChange: (value: string) => void
  required?: boolean
  withTime?: boolean
}

/**
 * Date input that always shows the Serbian format (`dd.mm.yyyy` / `dd.mm.yyyy HH:mm`)
 * regardless of browser locale - native `<input type="date">` follows the browser
 * language and can't be forced. The value exchanged with callers stays ISO, so it
 * is a drop-in replacement. A hidden native input provides the picker popup.
 */
export function DateInput({ id, value, onChange, required, withTime = false }: DateInputProps) {
  const [text, setText] = useState(() => isoToDisplay(value, withTime))
  const pickerRef = useRef<HTMLInputElement>(null)
  const textRef = useRef<HTMLInputElement>(null)

  // Sync from outside (prefill / reset) only when it disagrees with what's typed.
  if (displayToIso(text, withTime) !== value && isoToDisplay(value, withTime) !== text) {
    setText(isoToDisplay(value, withTime))
  }

  useEffect(() => {
    const complete = displayToIso(text, withTime) !== ''
    textRef.current?.setCustomValidity(
      text === '' || complete ? '' : 'Unesite ispravan datum' + (withTime ? ' i vreme' : ''),
    )
  }, [text, withTime])

  function handleText(raw: string) {
    const masked = mask(raw, withTime)
    setText(masked)
    onChange(displayToIso(masked, withTime))
  }

  function openPicker() {
    const picker = pickerRef.current
    if (!picker) return
    try {
      picker.showPicker()
    } catch {
      picker.focus()
    }
  }

  return (
    <div className="relative flex">
      <input
        ref={textRef}
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        required={required}
        placeholder={withTime ? 'dd.mm.gggg ss:mm' : 'dd.mm.gggg'}
        value={text}
        onChange={(event) => handleText(event.target.value)}
        className={`${fieldControlClass} w-full pr-9`}
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label="Izaberi datum"
        onClick={openPicker}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
      >
        📅
      </button>
      <input
        ref={pickerRef}
        type={withTime ? 'datetime-local' : 'date'}
        tabIndex={-1}
        aria-hidden
        value={value}
        onChange={(event) => {
          onChange(event.target.value)
          setText(isoToDisplay(event.target.value, withTime))
        }}
        className="pointer-events-none absolute right-0 bottom-0 h-0 w-0 opacity-0"
      />
    </div>
  )
}

function mask(raw: string, withTime: boolean): string {
  const digits = raw.replace(/\D/g, '').slice(0, withTime ? 12 : 8)
  let out = digits.slice(0, 2)
  if (digits.length > 2) out += '.' + digits.slice(2, 4)
  if (digits.length > 4) out += '.' + digits.slice(4, 8)
  if (withTime && digits.length > 8) out += ' ' + digits.slice(8, 10)
  if (withTime && digits.length > 10) out += ':' + digits.slice(10, 12)
  return out
}

function isoToDisplay(iso: string, withTime: boolean): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(iso)
  if (!match) return ''
  const date = `${match[3]}.${match[2]}.${match[1]}`
  return withTime && match[4] ? `${date} ${match[4]}:${match[5]}` : date
}

function displayToIso(text: string, withTime: boolean): string {
  const match = withTime
    ? /^(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2})$/.exec(text)
    : /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(text)
  if (!match) return ''
  const [day, month, year] = [Number(match[1]), Number(match[2]), Number(match[3])]
  const probe = new Date(year, month - 1, day)
  if (probe.getFullYear() !== year || probe.getMonth() !== month - 1 || probe.getDate() !== day) {
    return ''
  }
  const iso = `${match[3]}-${match[2]}-${match[1]}`
  if (!withTime) return iso
  if (Number(match[4]) > 23 || Number(match[5]) > 59) return ''
  return `${iso}T${match[4]}:${match[5]}`
}
