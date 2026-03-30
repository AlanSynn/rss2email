import dayjs, { Dayjs } from 'dayjs'
import { Item } from 'rss-parser'
import { CustomItem, SettledFeed } from './parseFeeds'

const filterItems = (items: (Item & CustomItem)[], from: Dayjs, limit?: number) =>
  items.filter(({ pubDate }) => pubDate && dayjs(pubDate).isAfter(from)).slice(0, limit)

export const filterItemsFromFeed = (feeds: SettledFeed[], from: Dayjs, limit?: number) =>
  feeds
    .map((feed) => {
      switch (feed.status) {
        case 'fulfilled':
          return { ...feed, value: { ...feed.value, items: filterItems(feed.value.items, from, limit) } }
        case 'rejected':
          return feed
      }
    })
    .filter((feed) => (feed.status === 'fulfilled' ? feed.value.items.length > 0 : true))
