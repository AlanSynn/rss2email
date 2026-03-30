import Parser, { Output } from 'rss-parser'
import { loadFeeds } from './loadFeeds'

// rss-parser has this sorta funky parsing when `keepArray: true` is set
export interface ItemLink {
  $: {
    rel: 'alternate' | 'shorturl' | 'related'
    href: string
  }
}

export type CustomItem = {
  id: string // Some feeds use id instead of guid
  link: string
  links: ItemLink[] // Some feeds expose multiple rel-based links
}

export type SettledFeed =
  | {
      status: 'fulfilled'
      value: Output<CustomItem>
    }
  | {
      status: 'rejected'
      feed: string
      reason: unknown
    }

const parser: Parser = new Parser<{}, CustomItem>({
  customFields: {
    item: [
      ['id', 'id'],
      ['link', 'links', { keepArray: true }],
    ],
  },
})

export const parseFeeds = async () => {
  const feeds = loadFeeds()
  const settledFeeds = await Promise.allSettled(feeds.map((feed) => parser.parseURL(feed)))

  return settledFeeds.reduce((acc, current, i) => {
    switch (current.status) {
      case 'fulfilled':
        return [...acc, { ...current, value: current.value as Output<CustomItem> }]
      case 'rejected':
        console.error(`Could not settle feed ${feeds[i]}, reason: ${current.reason}`)

        return [
          ...acc,
          {
            ...current,
            feed: feeds[i],
          },
        ]
    }
  }, [] as SettledFeed[])
}
