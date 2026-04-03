import { Item, Output } from 'rss-parser'
import { describe, expect, it, vi } from 'vitest'
import { DispatchDecision, evaluateDispatch } from './evaluateDispatch'
import { CustomItem, ItemLink, SettledFeed } from './parseFeeds'

const createLinks = (href: string): ItemLink[] => [
  {
    $: {
      rel: 'alternate',
      href,
    },
  },
]

const createItem = (id: string, pubDate: string): Item & CustomItem => ({
  guid: id,
  id,
  title: `Item ${id}`,
  link: `https://example.com/items/${id}`,
  links: createLinks(`https://example.com/items/${id}`),
  pubDate,
  content: `<p>Summary for ${id}</p>`,
})

const createFeed = (feedId: string, itemDates: string[]): SettledFeed => ({
  status: 'fulfilled',
  value: {
    title: `Feed ${feedId}`,
    link: `https://example.com/feeds/${feedId}`,
    items: itemDates.map((itemDate, index) => createItem(`${feedId}-${index}`, itemDate)),
  } as Output<CustomItem>,
})

const createRejectedFeed = (feedId: string): SettledFeed => ({
  status: 'rejected',
  feed: `https://example.com/feeds/${feedId}`,
  reason: new Error(`Failed to load ${feedId}`),
})

const expectDecisionKind = <TKind extends DispatchDecision['kind']>(decision: DispatchDecision, kind: TKind) => {
  expect(decision.kind).toBe(kind)
  return decision as Extract<DispatchDecision, { kind: TKind }>
}

describe('evaluateDispatch', () => {
  it('returns send when there are new items after the last successful run', async () => {
    const decision = await evaluateDispatch({
      cache: [createFeed('news', ['2026-03-26T08:00:00Z', '2026-03-24T08:00:00Z'])],
      lastSuccess: '2026-03-25T00:00:00Z',
    })

    const sendDecision = expectDecisionKind(decision, 'send')

    expect(sendDecision.itemCount).toBe(1)
    expect(sendDecision.filteredFeeds).toHaveLength(1)
  })

  it('returns skip when fulfilled feeds have no new items', async () => {
    const decision = await evaluateDispatch({
      cache: [createFeed('news', ['2026-03-24T08:00:00Z'])],
      lastSuccess: '2026-03-25T00:00:00Z',
    })

    const skipDecision = expectDecisionKind(decision, 'skip')

    expect(skipDecision.reason).toBe('no-new-items')
    expect(skipDecision.filteredFeeds).toHaveLength(0)
  })

  it('returns skip when there are partial feed failures but no new items', async () => {
    const decision = await evaluateDispatch({
      cache: [createFeed('news', ['2026-03-24T08:00:00Z']), createRejectedFeed('broken')],
      lastSuccess: '2026-03-25T00:00:00Z',
    })

    const skipDecision = expectDecisionKind(decision, 'skip')

    expect(skipDecision.reason).toBe('no-new-items-with-partial-feed-failures')
    expect(skipDecision.filteredFeeds).toHaveLength(1)
    expect(skipDecision.filteredFeeds[0]?.status).toBe('rejected')
  })

  it('returns fail when every configured feed fails to load', async () => {
    const decision = await evaluateDispatch({
      cache: [createRejectedFeed('broken-a'), createRejectedFeed('broken-b')],
      lastSuccess: '2026-03-25T00:00:00Z',
    })

    const failedDecision = expectDecisionKind(decision, 'fail')

    expect(failedDecision.reason).toBe('all-feeds-failed')
    expect(failedDecision.allFeeds).toHaveLength(2)
  })

  it('caps the initial run to three items', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-26T12:00:00Z'))

    const now = Date.now()
    const MS_PER_DAY = 24 * 60 * 60 * 1000
    const recentDates = [1, 2, 3, 4].map((d) => new Date(now - d * MS_PER_DAY).toISOString())
    try {
      const decision = await evaluateDispatch({
        cache: [createFeed('news', recentDates)],
      })

      const sendDecision = expectDecisionKind(decision, 'send')

      expect(sendDecision.itemCount).toBe(3)
      expect(sendDecision.filteredFeeds[0]?.status).toBe('fulfilled')

      if (sendDecision.filteredFeeds[0]?.status === 'fulfilled') {
        expect(sendDecision.filteredFeeds[0].value.items).toHaveLength(3)
      }
    } finally {
      vi.useRealTimers()
    }
  })

  it('excludes items published exactly at the last successful run time', async () => {
    const decision = await evaluateDispatch({
      cache: [createFeed('news', ['2026-03-25T00:00:00Z'])],
      lastSuccess: '2026-03-25T00:00:00Z',
    })

    const skipDecision = expectDecisionKind(decision, 'skip')

    expect(skipDecision.reason).toBe('no-new-items')
  })

  it('returns fail for an invalid lastSuccess value', async () => {
    const decision = await evaluateDispatch({
      cache: [createFeed('news', ['2026-03-26T08:00:00Z'])],
      lastSuccess: 'not-a-date',
    })

    const failedDecision = expectDecisionKind(decision, 'fail')

    expect(failedDecision.reason).toBe('invalid-last-success')
    expect(failedDecision.error?.message).toContain('Unknown lastSuccess value')
  })
})
