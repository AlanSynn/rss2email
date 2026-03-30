import { Item, Output } from 'rss-parser'
import { describe, expect, it } from 'vitest'
import { CustomItem, ItemLink, SettledFeed } from './parseFeeds'
import { renderEmail } from './renderEmail'

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

describe('renderEmail', () => {
  it('renders deterministic html for a cached feed', async () => {
    const result = await renderEmail({
      actionUrl: 'https://example.com/run/123',
      cache: [createFeed('news', ['2026-03-26T08:00:00Z'])],
      lastSuccess: '2026-03-20T00:00:00Z',
      pretty: true,
    })

    expect(result.itemCount).toBe(1)
    expect(result.html).toContain('Feed news')
    expect(result.html).toContain('Item news-0')
    expect(result.html).toContain('https://example.com/run/123')
    expect(result.html).not.toContain('Summary for news-0')
  })
})
