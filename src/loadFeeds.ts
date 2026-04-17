import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const CONFIG_FILE = 'config.yml'
const FALLBACK_FEED_LIST_FILE = 'feeds.txt'

const toError = (error: unknown) => (error instanceof Error ? error : new Error(String(error)))

const stripQuotes = (value: string) => value.replace(/^['"]|['"]$/g, '')

const parseFeedList = (contents: string, fileName: string) => {
  const feeds = contents
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '' && !line.startsWith('#'))

  if (feeds.length === 0) {
    throw new Error(`No feeds configured in ${fileName}`)
  }

  return feeds
}

const readFeedList = (fileName: string) => {
  const feedListPath = path.resolve(process.cwd(), fileName)
  let contents: string

  try {
    contents = readFileSync(feedListPath, 'utf-8')
  } catch (error) {
    throw new Error(`Could not read feed list from ${fileName}`, { cause: toError(error) })
  }

  return parseFeedList(contents, fileName)
}

const readConfigFeeds = () => {
  const configPath = path.resolve(process.cwd(), CONFIG_FILE)
  let configContents: string

  try {
    configContents = readFileSync(configPath, 'utf-8')
  } catch (error) {
    throw new Error(`Could not read config from ${CONFIG_FILE}`, { cause: toError(error) })
  }

  const lines = configContents.split('\n')
  let inRssFeedSection = false
  const feeds: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()

    if (!inRssFeedSection) {
      if (!trimmed.startsWith('rss_feeds:')) {
        continue
      }

      const inlineValue = trimmed.slice('rss_feeds:'.length).trim()

      if (inlineValue === '') {
        inRssFeedSection = true
        continue
      }

      return readFeedList(stripQuotes(inlineValue))
    }

    if (trimmed === '' || trimmed.startsWith('#')) {
      continue
    }

    if (/^[a-z_-]+:/i.test(trimmed)) {
      break
    }

    if (!trimmed.startsWith('-')) {
      continue
    }

    const feed = stripQuotes(trimmed.slice(1).trim())

    if (feed !== '') {
      feeds.push(feed)
    }
  }

  if (feeds.length === 0) {
    throw new Error(`No feeds configured in ${CONFIG_FILE}`)
  }

  return feeds
}

export const loadFeeds = () => {
  const configPath = path.resolve(process.cwd(), CONFIG_FILE)

  if (!existsSync(configPath)) {
    return readFeedList(FALLBACK_FEED_LIST_FILE)
  }

  return readConfigFeeds()
}
