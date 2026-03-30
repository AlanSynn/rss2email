import dayjs from 'dayjs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { parseLastSuccess } from './parseLastSuccess'

describe('parseLastSuccess', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('treats missing values as an initial run', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-26T12:00:00Z'))

    const result = parseLastSuccess()

    expect(result.initialRun).toBe(true)
    expect(result.from.toISOString()).toBe(dayjs('2026-03-19T12:00:00Z').toISOString())
  })

  it.each(['', '   ', 'null', 'undefined'])('treats %p as an initial run sentinel', (lastSuccess) => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-26T12:00:00Z'))

    const result = parseLastSuccess(lastSuccess)

    expect(result.initialRun).toBe(true)
    expect(result.from.toISOString()).toBe(dayjs('2026-03-19T12:00:00Z').toISOString())
  })

  it('parses a valid prior run timestamp', () => {
    const result = parseLastSuccess('2026-03-25T09:15:00Z')

    expect(result.initialRun).toBe(false)
    expect(result.from.toISOString()).toBe(dayjs('2026-03-25T09:15:00Z').toISOString())
  })

  it('throws on an invalid lastSuccess value', () => {
    expect(() => parseLastSuccess('not-a-date')).toThrow('Unknown lastSuccess value: not-a-date')
  })
})
