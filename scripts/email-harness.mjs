import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

const repoRoot = process.cwd()
const feedsPath = path.join(repoRoot, 'feeds.txt')
const distDir = path.join(repoRoot, 'dist')
const outputPath = path.join(distDir, 'email.html')
const actionUrl = 'https://example.com/actions/runs/harness'

const originalFeeds = existsSync(feedsPath) ? readFileSync(feedsPath, 'utf-8') : undefined
const originalEmail = existsSync(outputPath) ? readFileSync(outputPath, 'utf-8') : undefined

let feedState = {
  statusCode: 200,
  body: '',
}

const feedServer = http.createServer((_, res) => {
  res.statusCode = feedState.statusCode
  res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8')
  res.end(feedState.body)
})

const rssItem = ({ guid, title, link, pubDate, description }) => `
    <item>
      <guid>${guid}</guid>
      <title>${title}</title>
      <link>${link}</link>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${description}]]></description>
    </item>`

const rssFeed = (items) => `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Harness Feed</title>
    <link>https://example.com/feed</link>
    <description>Harness feed</description>
${items.join('\n')}
  </channel>
</rss>
`

const setFeedItems = (items) => {
  feedState = {
    statusCode: 200,
    body: rssFeed(items),
  }
}

const setFeedFailure = () => {
  feedState = {
    statusCode: 500,
    body: 'feed unavailable',
  }
}

const writeFeedList = (feedUrl) => {
  writeFileSync(feedsPath, `${feedUrl}\n`, 'utf-8')
}

const clearOutput = () => {
  if (existsSync(outputPath)) {
    rmSync(outputPath)
  }
}

const restoreWorkspace = () => {
  if (typeof originalFeeds === 'string') {
    writeFileSync(feedsPath, originalFeeds, 'utf-8')
  } else if (existsSync(feedsPath)) {
    rmSync(feedsPath)
  }

  if (typeof originalEmail === 'string') {
    if (!existsSync(distDir)) {
      mkdirSync(distDir, { recursive: true })
    }

    writeFileSync(outputPath, originalEmail, 'utf-8')
  } else if (existsSync(outputPath)) {
    rmSync(outputPath)
  }
}

const runEmail = async (lastSuccess) => {
  try {
    const { stdout, stderr } = await execFileAsync('node', ['email.js', `actionUrl=${actionUrl}`, `lastSuccess=${lastSuccess}`], {
      cwd: repoRoot,
    })

    return {
      code: 0,
      stdout,
      stderr,
    }
  } catch (error) {
    return {
      code: error.code ?? 1,
      stdout: error.stdout ?? '',
      stderr: error.stderr ?? '',
    }
  }
}

try {
  await new Promise((resolve, reject) => {
    feedServer.listen(0, '127.0.0.1', (error) => {
      if (error) {
        reject(error)
        return
      }

      resolve(undefined)
    })
  })

  const address = feedServer.address()

  if (!address || typeof address === 'string') {
    throw new Error('Could not determine harness feed server address')
  }

  const feedUrl = `http://127.0.0.1:${address.port}/feed.xml`

  writeFeedList(feedUrl)

  setFeedItems([
    rssItem({
      guid: 'post-1',
      title: 'Harness Post 1',
      link: 'https://example.com/posts/1',
      pubDate: 'Sun, 30 Mar 2026 12:00:00 GMT',
      description: '<p>Harness summary 1</p>',
    }),
  ])

  clearOutput()
  const firstRun = await runEmail('2026-03-29T00:00:00Z')

  assert.equal(firstRun.code, 0, `expected first run to succeed\nstdout:\n${firstRun.stdout}\nstderr:\n${firstRun.stderr}`)
  assert.equal(existsSync(outputPath), true, 'expected first run to create dist/email.html')
  const firstHtml = readFileSync(outputPath, 'utf-8')

  assert.match(firstHtml, /Harness Post 1/)
  assert.doesNotMatch(firstHtml, /Harness summary 1/)

  clearOutput()
  const secondRun = await runEmail('2026-03-30T13:00:00Z')

  assert.equal(secondRun.code, 0, `expected second run to skip successfully\nstdout:\n${secondRun.stdout}\nstderr:\n${secondRun.stderr}`)
  assert.match(secondRun.stdout, /No new items in feed, skipping email/)
  assert.equal(existsSync(outputPath), false, 'expected second run to leave no email output')

  setFeedItems([
    rssItem({
      guid: 'post-1',
      title: 'Harness Post 1',
      link: 'https://example.com/posts/1',
      pubDate: 'Sun, 30 Mar 2026 12:00:00 GMT',
      description: '<p>Harness summary 1</p>',
    }),
    rssItem({
      guid: 'post-2',
      title: 'Harness Post 2',
      link: 'https://example.com/posts/2',
      pubDate: 'Mon, 30 Mar 2026 15:00:00 GMT',
      description: '<p>Harness summary 2</p>',
    }),
  ])

  const thirdRun = await runEmail('2026-03-30T13:00:00Z')

  assert.equal(thirdRun.code, 0, `expected third run to succeed after a new post\nstdout:\n${thirdRun.stdout}\nstderr:\n${thirdRun.stderr}`)
  assert.equal(existsSync(outputPath), true, 'expected third run to create dist/email.html')
  const thirdHtml = readFileSync(outputPath, 'utf-8')

  assert.match(thirdHtml, /Harness Post 2/)
  assert.doesNotMatch(thirdHtml, /Harness Post 1/)

  setFeedFailure()
  clearOutput()
  const failedRun = await runEmail('2026-03-30T16:00:00Z')

  assert.notEqual(failedRun.code, 0, 'expected failing feed run to exit non-zero')
  assert.match(failedRun.stderr, /All feeds failed to load/)
  assert.equal(existsSync(outputPath), false, 'expected failing run to leave no email output')

  console.log('Harness checks passed:')
  console.log('- send when a new item appears after lastSuccess')
  console.log('- skip when there are no new items')
  console.log('- send only the new incremental item on the next run')
  console.log('- fail and send nothing when the feed is unavailable')
} finally {
  await new Promise((resolve, reject) => {
    feedServer.close((error) => {
      if (error) {
        reject(error)
        return
      }

      resolve(undefined)
    })
  })

  restoreWorkspace()
}
