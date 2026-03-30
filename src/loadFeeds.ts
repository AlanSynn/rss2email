import { readFileSync } from 'node:fs'
import path from 'node:path'

const FEED_LIST_FILE = 'feeds.txt'

const toError = (error: unknown) => (error instanceof Error ? error : new Error(String(error)))

export const loadFeeds = () => {
  const feedListPath = path.resolve(process.cwd(), FEED_LIST_FILE)
  let contents: string

  try {
    contents = readFileSync(feedListPath, 'utf-8')
  } catch (error) {
    throw new Error(`Could not read feed list from ${FEED_LIST_FILE}`, { cause: toError(error) })
  }

  const feeds = contents
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '' && !line.startsWith('#'))

  if (feeds.length === 0) {
    throw new Error(`No feeds configured in ${FEED_LIST_FILE}`)
  }

  return feeds
}
